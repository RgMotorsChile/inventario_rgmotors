-- Datos iniciales de bodega RG Motors
-- Ejecutar después de schema.sql

insert into public.items (sku, name, category, brand, stock, min_stock, location, unit_cost, compatible) values
  ('BAR-MIT-L200', 'Barra antivuelco L200 / Katana', 'Barras', 'Mitsubishi', 8, 4, 'Pasillo B · Estante A3', 189000, 'L200, Katana 4x2/4x4'),
  ('PIS-MIT-L200', 'Pisadera aluminio L200 / Katana', 'Pisaderas', 'Mitsubishi', 12, 4, 'Pasillo B · Estante A1', 145000, 'L200, Katana'),
  ('LON-MIT-L200', 'Lona marítima Mitsubishi', 'Lonas', 'Mitsubishi', 3, 4, 'Pasillo C · Rack 2', 98000, 'L200, Katana'),
  ('CAP-MIT-L200', 'Capota rígida L200', 'Capotas', 'Mitsubishi', 2, 2, 'Zona patio · Cubierta', 420000, 'L200 Katana'),
  ('LED-BAR-12', 'Barra LED techo 12.000 lm', 'Iluminación', 'Universal', 15, 6, 'Pasillo A · Cajón 4', 79000, 'Camionetas 4x2/4x4'),
  ('ENG-2P', 'Enganche remolque 2 pulgadas', 'Enganches', 'Universal', 6, 3, 'Pasillo D · Estante B2', 65000, 'L200, Hilux, Navara'),
  ('FIL-OIL-24', 'Filtro de aceite 2.4 Diésel', 'Mantención', 'Mitsubishi', 24, 10, 'Pasillo A · Cajón 1', 12900, 'L200 / Katana 2.4'),
  ('NEU-265-17', 'Neumático 265/65 R17', 'Neumáticos', 'Universal', 8, 8, 'Bodega neumáticos', 135000, 'L200, Hilux, Navara'),
  ('BAR-TOY-HIL', 'Barra antivuelco Hilux', 'Barras', 'Toyota', 5, 3, 'Pasillo B · Estante B3', 195000, 'Hilux 4x2/4x4'),
  ('ALF-TOY-HIL', 'Alfombra goma Hilux', 'Interior', 'Toyota', 10, 4, 'Pasillo C · Estante C1', 28000, 'Hilux'),
  ('PIS-PEU-PAR', 'Pisadera Peugeot Partner', 'Pisaderas', 'Peugeot', 4, 2, 'Pasillo B · Estante C2', 89000, 'Partner / Expert'),
  ('RAD-AND-9', 'Radio Android 9 pulgadas', 'Electrónica', 'Universal', 7, 3, 'Pasillo A · Caja fuerte', 159000, 'Universal DIN 2')
on conflict (sku) do nothing;

insert into public.vehicles (plate, brand, model, year, color, status) values
  ('THZF 75', 'Mitsubishi', 'KATANA 4X2', 2024, 'Rojo', 'En preparación'),
  ('RGGZ 96', 'Mitsubishi', 'KATANA WORK 4X2', 2022, 'Blanco', 'En preparación'),
  ('PGBV 10', 'Mitsubishi', 'L200 KATANA 4X4', 2020, 'Rojo', 'Disponible'),
  ('RBFK 40', 'Mitsubishi', 'L200 KATANA 4X2', 2021, 'Rojo', 'Disponible'),
  ('PXSV 97', 'Mitsubishi', 'L200 WORK 4X2', 2021, 'Rojo', 'Disponible'),
  ('SWDV 33', 'Toyota', 'HILUX 4X2', 2023, 'Blanco', 'En preparación'),
  ('RWYR 12', 'Toyota', 'HILUX SR 4X4', 2022, 'Gris', 'Disponible'),
  ('TCGB 98', 'Nissan', 'NAVARA XE 4X2', 2024, 'Blanco', 'Disponible'),
  ('SBZC 70', 'Peugeot', 'PARTNER HDI 92', 2022, 'Blanco', 'Disponible'),
  ('SCDW 37', 'Peugeot', 'EXPERT', 2022, 'Gris', 'Disponible')
on conflict (plate) do nothing;

insert into public.boxes (code, barcode, supplier, guide, received_at)
values
  ('RG-CAJA-00482', '7804629004821', 'Offroad Puerto Montt', '00482', null),
  ('RG-CAJA-00481', '7804629004814', 'Autopartes Sur', '00481', now())
on conflict (code) do nothing;

insert into public.workers (full_name, job_title) values
  ('Diego Muñoz', 'Preparación'),
  ('Luis Contreras', 'Taller'),
  ('Andrea Rivas', 'Patio'),
  ('Pedro Saldivia', 'Mecánico')
on conflict do nothing;

insert into public.box_lines (box_id, item_sku, qty)
select b.id, x.sku, x.qty
from public.boxes b
join (values
  ('RG-CAJA-00482', 'BAR-MIT-L200', 4),
  ('RG-CAJA-00482', 'PIS-MIT-L200', 2),
  ('RG-CAJA-00482', 'LON-MIT-L200', 3),
  ('RG-CAJA-00482', 'LED-BAR-12', 6),
  ('RG-CAJA-00481', 'FIL-OIL-24', 12)
) as x(code, sku, qty) on x.code = b.code
where not exists (
  select 1 from public.box_lines l where l.box_id = b.id and l.item_sku = x.sku
);
