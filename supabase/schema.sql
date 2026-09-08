-- RG Motors · Esquema de producción
-- SQL Editor de Supabase → Run
-- Luego: Authentication → Users → crea el primer usuario de jefatura
-- y ejecuta:  update public.profiles set role = 'jefatura', active = true where id = '<uuid>';
-- Dashboard: Authentication → Providers → Email → Confirm email OFF en pruebas, ON en producción.
-- Desactiva "Allow new users to sign up" si quieres solo cuentas creadas a mano;
-- si dejas el registro, la app exige código de invitación.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers de rol (seguridad en servidor)
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), '');
$$;

create or replace function public.is_management()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('jefatura', 'admin');
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and active
      and role in ('bodega', 'jefatura', 'admin')
  );
$$;

create or replace function public.require_staff()
returns void
language plpgsql
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión';
  end if;
  if not public.is_staff() then
    raise exception 'Tu cuenta no está activa. Pide un código a jefatura.';
  end if;
end;
$$;

create or replace function public.require_management()
returns void
language plpgsql
as $$
begin
  perform public.require_staff();
  if not public.is_management() then
    raise exception 'Solo jefatura puede hacer esta acción';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Encargado bodega',
  role text not null default 'bodega' check (role in ('bodega', 'jefatura', 'admin')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  email text,
  role text not null default 'bodega' check (role in ('bodega', 'jefatura')),
  created_by uuid references auth.users (id),
  used_at timestamptz,
  used_by uuid references auth.users (id),
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  sku text primary key,
  name text not null,
  category text not null,
  brand text not null,
  stock integer not null default 0 check (stock >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  location text not null,
  unit_cost numeric(12, 0) not null default 0,
  compatible text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate text not null unique,
  plate_norm text generated always as (upper(regexp_replace(plate, '[^A-Za-z0-9]', '', 'g'))) stored,
  brand text not null,
  model text not null,
  year integer not null,
  color text not null,
  status text not null default 'Disponible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.boxes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  barcode text not null unique,
  supplier text not null,
  guide text not null,
  received_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.box_lines (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes (id) on delete cascade,
  item_sku text not null references public.items (sku),
  qty integer not null check (qty > 0)
);

create table if not exists public.box_evidence (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes (id) on delete cascade,
  storage_path text not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  job_title text not null default 'Taller',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists workers_name_uidx on public.workers (lower(full_name));

create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('uso', 'ingreso', 'asignacion', 'devolucion', 'ajuste')),
  item_sku text not null references public.items (sku),
  qty integer not null check (qty > 0),
  vehicle_id uuid references public.vehicles (id),
  plate text,
  worker_id uuid references public.workers (id),
  worker_name text,
  box_id uuid references public.boxes (id),
  note text,
  user_id uuid references auth.users (id),
  user_name text not null default 'Bodega',
  created_at timestamptz not null default now()
);

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

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  action text not null,
  entity text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vehicles_plate_norm_idx on public.vehicles (plate_norm);
create index if not exists movements_created_at_idx on public.movements (created_at desc);
create index if not exists movements_plate_idx on public.movements (plate);
create index if not exists movements_item_sku_idx on public.movements (item_sku);
create index if not exists movements_worker_id_idx on public.movements (worker_id);
create index if not exists assignments_open_idx on public.assignments (status, worker_id);
create index if not exists invites_code_idx on public.invites (code);
create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);

-- Compatibilidad si el proyecto ya existía
alter table public.profiles add column if not exists active boolean not null default false;
alter table public.boxes add column if not exists created_by uuid references auth.users (id);
alter table public.workers add column if not exists updated_at timestamptz not null default now();

do $$
begin
  alter table public.movements drop constraint if exists movements_type_check;
  alter table public.movements add constraint movements_type_check
    check (type in ('uso', 'ingreso', 'asignacion', 'devolucion', 'ajuste'));
exception when others then null;
end $$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists items_updated_at on public.items;
create trigger items_updated_at before update on public.items
for each row execute procedure public.set_updated_at();

drop trigger if exists vehicles_updated_at on public.vehicles;
create trigger vehicles_updated_at before update on public.vehicles
for each row execute procedure public.set_updated_at();

drop trigger if exists boxes_updated_at on public.boxes;
create trigger boxes_updated_at before update on public.boxes
for each row execute procedure public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

create or replace function public.write_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, actor_name, action, entity, payload)
  values (
    auth.uid(),
    coalesce((select full_name from public.profiles where id = auth.uid()), 'sistema'),
    tg_op,
    tg_table_name,
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists movements_audit on public.movements;
create trigger movements_audit after insert on public.movements
for each row execute procedure public.write_audit();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
  v_code text;
  v_role text := 'bodega';
  v_active boolean := false;
begin
  v_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'invite_code', '')));

  if v_code <> '' then
    select * into v_invite
    from public.invites
    where code = v_code
      and used_at is null
      and expires_at > now()
    for update;

    if found then
      if v_invite.email is not null
         and lower(v_invite.email) <> lower(coalesce(new.email, '')) then
        v_active := false;
      else
        v_role := v_invite.role;
        v_active := true;
        update public.invites
          set used_at = now(), used_by = new.id
          where id = v_invite.id;
      end if;
    end if;
  end if;

  insert into public.profiles (id, full_name, role, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    v_role,
    v_active
  )
  on conflict (id) do update
    set full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RPCs bodega
-- ---------------------------------------------------------------------------
create or replace function public.use_item(
  p_sku text,
  p_qty integer,
  p_plate text,
  p_note text default null
)
returns public.movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.items;
  v_vehicle public.vehicles;
  v_move public.movements;
  v_plate_norm text;
begin
  perform public.require_staff();
  if p_qty is null or p_qty < 1 then
    raise exception 'La cantidad debe ser al menos 1';
  end if;

  v_plate_norm := upper(regexp_replace(coalesce(p_plate, ''), '[^A-Za-z0-9]', '', 'g'));
  if v_plate_norm = '' then
    raise exception 'Debes indicar la patente de la unidad';
  end if;

  select * into v_vehicle from public.vehicles where plate_norm = v_plate_norm;
  if not found then
    raise exception 'No hay una unidad con esa patente en el patio';
  end if;

  select * into v_item from public.items where sku = p_sku for update;
  if not found then
    raise exception 'El SKU no existe';
  end if;
  if v_item.stock < p_qty then
    raise exception 'Stock insuficiente: hay % y pediste %', v_item.stock, p_qty;
  end if;

  update public.items set stock = stock - p_qty where sku = p_sku;

  insert into public.movements (type, item_sku, qty, vehicle_id, plate, note, user_id, user_name)
  values (
    'uso', p_sku, p_qty, v_vehicle.id, v_vehicle.plate, p_note, auth.uid(),
    coalesce((select full_name from public.profiles where id = auth.uid()), 'Bodega')
  )
  returning * into v_move;

  return v_move;
end;
$$;

create or replace function public.receive_item(
  p_sku text,
  p_qty integer,
  p_note text default null
)
returns public.movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_move public.movements;
begin
  perform public.require_staff();
  if p_qty is null or p_qty < 1 then
    raise exception 'La cantidad debe ser al menos 1';
  end if;

  update public.items set stock = stock + p_qty where sku = p_sku;
  if not found then
    raise exception 'El SKU no existe';
  end if;

  insert into public.movements (type, item_sku, qty, note, user_id, user_name)
  values (
    'ingreso', p_sku, p_qty, p_note, auth.uid(),
    coalesce((select full_name from public.profiles where id = auth.uid()), 'Bodega')
  )
  returning * into v_move;

  return v_move;
end;
$$;

create or replace function public.receive_box(
  p_code text,
  p_skipped text[] default '{}'
)
returns public.boxes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_box public.boxes;
  v_line public.box_lines;
begin
  perform public.require_staff();

  select * into v_box
  from public.boxes
  where code = p_code or barcode = p_code
  for update;

  if not found then
    raise exception 'No existe una caja con ese código';
  end if;
  if v_box.received_at is not null then
    raise exception 'Esta caja ya fue ingresada';
  end if;

  for v_line in
    select * from public.box_lines where box_id = v_box.id
  loop
    if p_skipped is not null and v_line.item_sku = any (p_skipped) then
      continue;
    end if;

    update public.items set stock = stock + v_line.qty where sku = v_line.item_sku;

    insert into public.movements (type, item_sku, qty, box_id, note, user_id, user_name)
    values (
      'ingreso', v_line.item_sku, v_line.qty, v_box.id,
      format('Caja %s · %s', v_box.code, v_box.supplier),
      auth.uid(),
      coalesce((select full_name from public.profiles where id = auth.uid()), 'Bodega')
    );
  end loop;

  update public.boxes set received_at = now() where id = v_box.id returning * into v_box;
  return v_box;
end;
$$;

create or replace function public.attach_box_evidence(
  p_box_id uuid,
  p_storage_path text
)
returns public.box_evidence
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.box_evidence;
begin
  perform public.require_staff();
  insert into public.box_evidence (box_id, storage_path, created_by)
  values (p_box_id, p_storage_path, auth.uid())
  returning * into v_row;
  return v_row;
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
  perform public.require_staff();
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
    'asignacion', p_sku, p_qty, v_worker.id, v_worker.full_name,
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
  perform public.require_staff();

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
    'devolucion', v_asg.item_sku, v_asg.qty, v_asg.worker_id, v_worker.full_name,
    coalesce(p_note, format('Devolución de %s', v_worker.full_name)),
    auth.uid(),
    coalesce((select full_name from public.profiles where id = auth.uid()), 'Bodega')
  );

  return v_asg;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPCs jefatura
-- ---------------------------------------------------------------------------
create or replace function public.create_invite(
  p_email text default null,
  p_role text default 'bodega'
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  perform public.require_management();
  if p_role not in ('bodega', 'jefatura') then
    raise exception 'Rol inválido';
  end if;
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.invites (code, email, role, created_by)
  values (v_code, nullif(lower(trim(coalesce(p_email, ''))), ''), p_role, auth.uid());
  return v_code;
end;
$$;

create or replace function public.upsert_item(
  p_sku text,
  p_name text,
  p_category text,
  p_brand text,
  p_min_stock integer,
  p_location text,
  p_unit_cost numeric,
  p_compatible text default ''
)
returns public.items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.items;
begin
  perform public.require_management();
  insert into public.items (sku, name, category, brand, min_stock, location, unit_cost, compatible)
  values (upper(trim(p_sku)), p_name, p_category, p_brand, coalesce(p_min_stock, 0), p_location, coalesce(p_unit_cost, 0), coalesce(p_compatible, ''))
  on conflict (sku) do update set
    name = excluded.name,
    category = excluded.category,
    brand = excluded.brand,
    min_stock = excluded.min_stock,
    location = excluded.location,
    unit_cost = excluded.unit_cost,
    compatible = excluded.compatible
  returning * into v_item;
  return v_item;
end;
$$;

create or replace function public.adjust_stock(
  p_sku text,
  p_qty integer,
  p_note text
)
returns public.movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.items;
  v_move public.movements;
  v_qty integer;
begin
  perform public.require_management();
  if p_qty is null or p_qty = 0 then
    raise exception 'La cantidad no puede ser 0';
  end if;

  select * into v_item from public.items where sku = p_sku for update;
  if not found then
    raise exception 'El SKU no existe';
  end if;
  if v_item.stock + p_qty < 0 then
    raise exception 'El ajuste dejaría stock negativo';
  end if;

  update public.items set stock = stock + p_qty where sku = p_sku;
  v_qty := abs(p_qty);

  insert into public.movements (type, item_sku, qty, note, user_id, user_name)
  values (
    'ajuste', p_sku, v_qty,
    coalesce(p_note, format('Ajuste %s', p_qty)),
    auth.uid(),
    coalesce((select full_name from public.profiles where id = auth.uid()), 'Jefatura')
  )
  returning * into v_move;
  return v_move;
end;
$$;

create or replace function public.upsert_vehicle(
  p_plate text,
  p_brand text,
  p_model text,
  p_year integer,
  p_color text,
  p_status text default 'Disponible'
)
returns public.vehicles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.vehicles;
begin
  perform public.require_management();
  insert into public.vehicles (plate, brand, model, year, color, status)
  values (trim(p_plate), p_brand, p_model, p_year, p_color, coalesce(p_status, 'Disponible'))
  on conflict (plate) do update set
    brand = excluded.brand,
    model = excluded.model,
    year = excluded.year,
    color = excluded.color,
    status = excluded.status
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.upsert_worker(
  p_id uuid default null,
  p_full_name text default '',
  p_job_title text default 'Taller',
  p_active boolean default true
)
returns public.workers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.workers;
begin
  perform public.require_management();
  if p_id is not null then
    update public.workers
      set full_name = p_full_name, job_title = p_job_title, active = p_active
      where id = p_id
      returning * into v_row;
    if not found then
      raise exception 'El trabajador no existe';
    end if;
    return v_row;
  end if;

  insert into public.workers (full_name, job_title, active)
  values (trim(p_full_name), coalesce(p_job_title, 'Taller'), coalesce(p_active, true))
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.create_box(
  p_code text,
  p_barcode text,
  p_supplier text,
  p_guide text,
  p_lines jsonb
)
returns public.boxes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_box public.boxes;
  v_line jsonb;
begin
  perform public.require_management();
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 1 then
    raise exception 'La caja debe tener al menos una línea';
  end if;

  insert into public.boxes (code, barcode, supplier, guide, created_by)
  values (trim(p_code), trim(p_barcode), trim(p_supplier), trim(p_guide), auth.uid())
  returning * into v_box;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    if not exists (select 1 from public.items where sku = v_line ->> 'sku') then
      raise exception 'SKU % no existe', v_line ->> 'sku';
    end if;
    insert into public.box_lines (box_id, item_sku, qty)
    values (v_box.id, v_line ->> 'sku', greatest(1, coalesce((v_line ->> 'qty')::int, 1)));
  end loop;

  return v_box;
end;
$$;

create or replace function public.set_profile_active(
  p_user_id uuid,
  p_active boolean,
  p_role text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles;
begin
  perform public.require_management();
  if p_user_id = auth.uid() and p_active = false then
    raise exception 'No puedes desactivar tu propia cuenta';
  end if;
  update public.profiles
    set active = p_active,
        role = coalesce(p_role, role)
    where id = p_user_id
    returning * into v_row;
  if not found then
    raise exception 'El usuario no existe';
  end if;
  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.items enable row level security;
alter table public.vehicles enable row level security;
alter table public.boxes enable row level security;
alter table public.box_lines enable row level security;
alter table public.box_evidence enable row level security;
alter table public.workers enable row level security;
alter table public.movements enable row level security;
alter table public.assignments enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists profiles_own on public.profiles;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_management());

drop policy if exists invites_mgmt on public.invites;
create policy invites_mgmt on public.invites
  for select to authenticated
  using (public.is_management());

drop policy if exists items_read on public.items;
create policy items_read on public.items
  for select to authenticated
  using (public.is_staff());

drop policy if exists vehicles_read on public.vehicles;
create policy vehicles_read on public.vehicles
  for select to authenticated
  using (public.is_staff());

drop policy if exists boxes_read on public.boxes;
create policy boxes_read on public.boxes
  for select to authenticated
  using (public.is_staff());

drop policy if exists box_lines_read on public.box_lines;
create policy box_lines_read on public.box_lines
  for select to authenticated
  using (public.is_staff());

drop policy if exists box_evidence_read on public.box_evidence;
create policy box_evidence_read on public.box_evidence
  for select to authenticated
  using (public.is_staff());

drop policy if exists workers_read on public.workers;
create policy workers_read on public.workers
  for select to authenticated
  using (public.is_staff());

drop policy if exists movements_read on public.movements;
create policy movements_read on public.movements
  for select to authenticated
  using (public.is_staff());

drop policy if exists assignments_read on public.assignments;
create policy assignments_read on public.assignments
  for select to authenticated
  using (public.is_staff());

drop policy if exists audit_mgmt on public.audit_log;
create policy audit_mgmt on public.audit_log
  for select to authenticated
  using (public.is_management());

-- ---------------------------------------------------------------------------
-- Storage evidencia de cajas
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('box-evidence', 'box-evidence', false)
on conflict (id) do nothing;

drop policy if exists evidence_read on storage.objects;
create policy evidence_read on storage.objects
  for select to authenticated
  using (bucket_id = 'box-evidence' and public.is_staff());

drop policy if exists evidence_write on storage.objects;
create policy evidence_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'box-evidence' and public.is_staff());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_management() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.use_item(text, integer, text, text) to authenticated;
grant execute on function public.receive_item(text, integer, text) to authenticated;
grant execute on function public.receive_box(text, text[]) to authenticated;
grant execute on function public.attach_box_evidence(uuid, text) to authenticated;
grant execute on function public.assign_item(text, integer, uuid, text) to authenticated;
grant execute on function public.return_assignment(uuid, text) to authenticated;
grant execute on function public.create_invite(text, text) to authenticated;
grant execute on function public.upsert_item(text, text, text, text, integer, text, numeric, text) to authenticated;
grant execute on function public.adjust_stock(text, integer, text) to authenticated;
grant execute on function public.upsert_vehicle(text, text, text, integer, text, text) to authenticated;
grant execute on function public.upsert_worker(uuid, text, text, boolean) to authenticated;
grant execute on function public.create_box(text, text, text, text, jsonb) to authenticated;
grant execute on function public.set_profile_active(uuid, boolean, text) to authenticated;

revoke execute on function public.require_staff() from public, anon, authenticated;
revoke execute on function public.require_management() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.items; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.movements; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.boxes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.assignments; exception when duplicate_object then null; end;
end $$;
