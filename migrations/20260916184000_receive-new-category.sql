create or replace function public.receive_stock(
  p_qty integer,
  p_sku text default null,
  p_name text default null,
  p_category text default 'General',
  p_note text default null
)
returns public.movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.items;
  v_move public.movements;
  v_sku text;
  v_name text;
  v_cat text;
  v_base text;
  v_n integer := 1;
begin
  perform public.require_staff();
  if p_qty is null or p_qty < 1 then
    raise exception 'La cantidad debe ser al menos 1';
  end if;

  v_sku := upper(trim(coalesce(p_sku, '')));
  v_name := trim(coalesce(p_name, ''));

  if v_sku <> '' then
    select * into v_item from public.items where sku = v_sku for update;
  elsif v_name <> '' then
    select * into v_item
    from public.items
    where lower(name) = lower(v_name)
    order by created_at
    limit 1
    for update;
  else
    raise exception 'Elige un elemento o escribe el nombre de lo que llegó';
  end if;

  if not found then
    if v_name = '' then
      raise exception 'El SKU no existe';
    end if;
    v_base := upper(left(regexp_replace(v_name, '[^A-Za-z0-9]+', '-', 'g'), 20));
    v_base := trim(both '-' from v_base);
    if v_base = '' then
      v_base := 'ITEM';
    end if;
    v_sku := v_base;
    while exists (select 1 from public.items where sku = v_sku) loop
      v_n := v_n + 1;
      v_sku := v_base || '-' || v_n;
    end loop;

    v_cat := coalesce(nullif(trim(coalesce(p_category, '')), ''), 'General');
    insert into public.categories (name)
    values (v_cat)
    on conflict (name) do nothing;

    insert into public.items (sku, name, category, brand, stock, min_stock, location, unit_cost, compatible)
    values (
      v_sku,
      v_name,
      v_cat,
      '',
      0,
      0,
      'Bodega',
      0,
      ''
    )
    returning * into v_item;
  end if;

  update public.items set stock = stock + p_qty where sku = v_item.sku;

  insert into public.movements (type, item_sku, qty, note, user_id, user_name)
  values (
    'ingreso',
    v_item.sku,
    p_qty,
    coalesce(p_note, format('Ingreso %s', v_item.name)),
    auth.uid(),
    coalesce((select full_name from public.profiles where id = auth.uid()), 'Bodega')
  )
  returning * into v_move;

  return v_move;
end;
$$;
