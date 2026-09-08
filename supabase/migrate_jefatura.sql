-- Correr en proyectos que ya tenían schema.sql de bodega
-- Agrega trabajadores, asignaciones, rol jefatura y tipos de movimiento

create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  job_title text not null default 'Taller',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.movements drop constraint if exists movements_type_check;
alter table public.movements add constraint movements_type_check
  check (type in ('uso', 'ingreso', 'asignacion', 'devolucion'));

alter table public.movements add column if not exists worker_id uuid references public.workers (id);
alter table public.movements add column if not exists worker_name text;

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  item_sku text not null references public.items (sku),
  qty integer not null check (qty > 0),
  worker_id uuid not null references public.workers (id),
  status text not null default 'abierta' check (status in ('abierta', 'devuelta')),
  note text,
  assigned_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  returned_at timestamptz
);

create index if not exists assignments_open_idx on public.assignments (status, worker_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data ->> 'role' in ('jefatura', 'bodega')
        then new.raw_user_meta_data ->> 'role'
      else 'bodega'
    end
  );
  return new;
end;
$$;

create or replace function public.assign_item(
  p_sku text,
  p_qty integer,
  p_worker_id uuid,
  p_note text default null
)
returns public.assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.items;
  v_worker public.workers;
  v_asg public.assignments;
begin
  if p_qty is null or p_qty < 1 then
    raise exception 'La cantidad debe ser al menos 1';
  end if;

  select * into v_worker from public.workers where id = p_worker_id and active;
  if not found then
    raise exception 'El trabajador no existe o está inactivo';
  end if;

  select * into v_item from public.items where sku = p_sku for update;
  if not found then
    raise exception 'El SKU no existe';
  end if;
  if v_item.stock < p_qty then
    raise exception 'Stock insuficiente: hay % y pediste %', v_item.stock, p_qty;
  end if;

  update public.items set stock = stock - p_qty where sku = p_sku;

  insert into public.assignments (item_sku, qty, worker_id, note, assigned_by)
  values (p_sku, p_qty, v_worker.id, p_note, auth.uid())
  returning * into v_asg;

  insert into public.movements (type, item_sku, qty, worker_id, worker_name, note, user_id, user_name)
  values (
    'asignacion',
    p_sku,
    p_qty,
    v_worker.id,
    v_worker.full_name,
    coalesce(p_note, format('Asignado a %s', v_worker.full_name)),
    auth.uid(),
    coalesce((select full_name from public.profiles where id = auth.uid()), 'Bodega')
  );

  return v_asg;
end;
$$;

create or replace function public.return_assignment(
  p_assignment_id uuid,
  p_note text default null
)
returns public.assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asg public.assignments;
  v_worker public.workers;
begin
  select * into v_asg from public.assignments where id = p_assignment_id for update;
  if not found then
    raise exception 'La asignación no existe';
  end if;
  if v_asg.status <> 'abierta' then
    raise exception 'Esta asignación ya fue cerrada';
  end if;

  select * into v_worker from public.workers where id = v_asg.worker_id;
  update public.items set stock = stock + v_asg.qty where sku = v_asg.item_sku;
  update public.assignments
    set status = 'devuelta', returned_at = now(), note = coalesce(p_note, note)
    where id = v_asg.id
    returning * into v_asg;

  insert into public.movements (type, item_sku, qty, worker_id, worker_name, note, user_id, user_name)
  values (
    'devolucion',
    v_asg.item_sku,
    v_asg.qty,
    v_asg.worker_id,
    v_worker.full_name,
    coalesce(p_note, format('Devolución de %s', v_worker.full_name)),
    auth.uid(),
    coalesce((select full_name from public.profiles where id = auth.uid()), 'Bodega')
  );

  return v_asg;
end;
$$;

alter table public.workers enable row level security;
alter table public.assignments enable row level security;
drop policy if exists workers_read on public.workers;
create policy workers_read on public.workers for select to authenticated using (true);
drop policy if exists assignments_read on public.assignments;
create policy assignments_read on public.assignments for select to authenticated using (true);

grant execute on function public.assign_item(text, integer, uuid, text) to authenticated;
grant execute on function public.return_assignment(uuid, text) to authenticated;

insert into public.workers (full_name, job_title)
select * from (values
  ('Diego Muñoz', 'Preparación'),
  ('Luis Contreras', 'Taller'),
  ('Andrea Rivas', 'Patio'),
  ('Pedro Saldivia', 'Mecánico')
) as w(full_name, job_title)
where not exists (select 1 from public.workers x where x.full_name = w.full_name);

do $$
begin
  begin
    alter publication supabase_realtime add table public.assignments;
  exception when duplicate_object then null;
  end;
end $$;
