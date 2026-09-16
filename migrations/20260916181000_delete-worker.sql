create or replace function public.delete_worker(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_open integer;
  v_hist integer;
begin
  perform public.require_management();

  select full_name into v_name from public.workers where id = p_id;
  if not found then
    raise exception 'El trabajador no existe';
  end if;

  select count(*) into v_open
  from public.assignments
  where worker_id = p_id and status = 'abierta';
  if v_open > 0 then
    raise exception 'No se puede eliminar: tiene entregas abiertas.';
  end if;

  select count(*) into v_hist
  from (
    select 1 from public.movements where worker_id = p_id
    union all
    select 1 from public.assignments where worker_id = p_id
  ) refs;
  if v_hist > 0 then
    update public.workers set active = false where id = p_id;
    return jsonb_build_object('deleted', false, 'deactivated', true, 'name', v_name);
  end if;

  delete from public.workers where id = p_id;
  return jsonb_build_object('deleted', true, 'deactivated', false, 'name', v_name);
end;
$$;

grant execute on function public.delete_worker(uuid) to authenticated;
