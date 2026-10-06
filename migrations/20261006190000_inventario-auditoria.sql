-- Auditoría inventario (2026-10-06)
-- 1) adjust_stock: normaliza el SKU igual que upsert_item (antes "qa-1" → "El SKU no existe").
-- 2) delete_worker: devuelve {deleted, deactivated, name}; si tiene historial lo da de baja
--    en vez de fallar por FK (el panel mostraba "quedó de baja" aunque se hubiera borrado).
-- 3) Rastro: las RPC de movimientos registran el nombre real de quien opera
--    (cabecera x-inv-actor-id que pone /api/rpc con el usuario autenticado) en vez de
--    'Bodega'/'Jefatura' fijo. Sin cabecera se mantiene el texto anterior.
--    Estas RPC solo las ejecuta service_role (el servidor), así que la cabecera no es
--    falsificable desde la app.

create or replace function public.inv_actor_name(p_default text)
returns text
language sql
stable
set search_path = public
as $$
  with h as (
    select nullif(current_setting('request.headers', true), '')::json ->> 'x-inv-actor-id' as id
  )
  select coalesce(
    (
      select nullif(trim(p.full_name), '')
      from public.profiles p, h
      where p.id = case
        when h.id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then h.id::uuid
      end
    ),
    p_default
  );
$$;

revoke all on function public.inv_actor_name(text) from public, anon, authenticated;
grant execute on function public.inv_actor_name(text) to service_role;

create or replace function public.adjust_stock(p_sku text, p_qty integer, p_note text)
returns public.movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.items;
  v_move public.movements;
  v_qty integer;
  v_sku text := upper(trim(coalesce(p_sku, '')));
  v_tenant uuid := public.inv_tenant_rg();
begin
  if p_qty is null or p_qty = 0 then
    raise exception 'La cantidad no puede ser 0';
  end if;

  select * into v_item from public.items
  where tenant_id = v_tenant and sku = v_sku
  for update;
  if not found then
    raise exception 'El SKU no existe';
  end if;
  if v_item.stock + p_qty < 0 then
    raise exception 'El ajuste dejaría stock negativo';
  end if;

  update public.items
  set stock = stock + p_qty, updated_at = now()
  where tenant_id = v_tenant and sku = v_sku;
  v_qty := abs(p_qty);

  insert into public.movements (tenant_id, type, item_sku, qty, note, user_name)
  values (
    v_tenant,
    'ajuste',
    v_sku,
    v_qty,
    coalesce(nullif(trim(p_note), ''), format('Ajuste %s', p_qty)),
    public.inv_actor_name('Jefatura')
  )
  returning * into v_move;
  return v_move;
end;
$$;

drop function if exists public.delete_worker(uuid);
create function public.delete_worker(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_worker public.workers;
  v_tenant uuid := public.inv_tenant_rg();
begin
  select * into v_worker from public.workers
  where id = p_id and tenant_id = v_tenant
  for update;
  if not found then
    raise exception 'Trabajador no encontrado';
  end if;

  if exists (select 1 from public.movements where worker_id = p_id)
     or exists (select 1 from public.assignments where worker_id = p_id) then
    update public.workers set active = false, updated_at = now() where id = p_id;
    return jsonb_build_object('deleted', false, 'deactivated', true, 'name', v_worker.full_name);
  end if;

  delete from public.workers where id = p_id and tenant_id = v_tenant;
  return jsonb_build_object('deleted', true, 'deactivated', false, 'name', v_worker.full_name);
end;
$$;

revoke all on function public.delete_worker(uuid) from public, anon, authenticated;
grant execute on function public.delete_worker(uuid) to service_role;

-- 3) user_name real en las RPC de bodega. Reescribe solo el literal de user_name
--    (seguido de ")"), con verificación de que haya exactamente una coincidencia.
do $$
declare
  fn text;
  def text;
  n int;
begin
  foreach fn in array array[
    'assign_item', 'deliver_item', 'receive_box', 'receive_item',
    'receive_stock', 'return_assignment', 'use_item'
  ] loop
    select pg_get_functiondef(p.oid) into def
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname = 'public' and p.proname = fn;
    if def is null then
      raise exception 'No existe public.%', fn;
    end if;
    if position('inv_actor_name' in def) > 0 then
      continue; -- ya aplicada
    end if;
    select count(*) into n from regexp_matches(def, '''Bodega''(\s*\))', 'g');
    if n <> 1 then
      raise exception 'public.% tiene % literales user_name, se esperaba 1', fn, n;
    end if;
    def := regexp_replace(def, '''Bodega''(\s*\))', 'public.inv_actor_name(''Bodega'')\1');
    execute def;
  end loop;
end;
$$;
