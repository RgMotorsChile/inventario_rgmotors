-- Datos iniciales de bodega RG Motors
-- Ejecutar después de schema.sql

-- Catálogo real: pestaña INVENTARIO de la planilla (ver inventario_sheet.sql).

-- Solo pestaña RG MOTORS (ver vehicles_stock.sql). No mezclar otras hojas.
insert into public.vehicles (plate, brand, model, year, color, status) values
  ('KWRC 91', 'Mitsubishi', 'NEW KATANA CRT 4X2', 2019, 'Rojo', 'Reservada'),
  ('RBFK 40', 'Mitsubishi', 'L200 KATANA 4X2', 2021, 'Rojo', 'Disponible'),
  ('PGBV 10', 'Mitsubishi', 'L200 KATANA 4X4', 2020, 'Rojo', 'Disponible'),
  ('PKGF 78', 'Mitsubishi', 'NEW KATANA 4X4', 2021, 'Rojo', 'Disponible'),
  ('SGVC 26', 'Mitsubishi', 'KATANA 4X4', 2023, 'Rojo', 'Disponible'),
  ('THZF 75', 'Mitsubishi', 'KATANA 4X2', 2024, 'Rojo', 'Disponible'),
  ('THLV 62', 'Mitsubishi', 'L200 KATANA 4X2', 2024, 'Rojo', 'Disponible'),
  ('PPTB 70', 'Mitsubishi', 'L200 KATANA 4X4', 2021, 'Rojo', 'Disponible'),
  ('PHYG 44', 'Mitsubishi', 'KATANA CR 4X2', 2021, 'Rojo', 'En preparación'),
  ('RHKD 26', 'Mitsubishi', 'L200 KATANA 4X2', 2022, 'Rojo', 'Disponible'),
  ('SGVH 42', 'Mitsubishi', 'KATANA CRT 4X4', 2023, 'Rojo', 'Disponible'),
  ('PSKJ 78', 'Toyota', 'HILUX DX 4X4', 2021, 'Rojo', 'Disponible'),
  ('SWDV 33', 'Toyota', 'HILUX 4X2', 2023, 'Rojo', 'Disponible'),
  ('RZVL 18', 'Toyota', 'HILUX 4X4', 2022, 'Rojo', 'Disponible'),
  ('RWYR 12', 'Toyota', 'HILUX SR 4X4', 2022, 'Rojo', 'Disponible'),
  ('SWZJ 94', 'Toyota', 'HILUX SR', 2023, 'Rojo', 'Disponible'),
  ('THSR 65', 'Toyota', 'HILUX SR 4X4', 2024, 'Rojo', 'Disponible'),
  ('PLLD 15', 'Toyota', 'HILUX DX 4X4', 2021, 'Rojo', 'Disponible'),
  ('TSGL 82', 'Toyota', 'RAIZE 4X2 1.2', 2025, 'Gris', 'Disponible'),
  ('RLVR 63', 'Peugeot', 'PARTNER', 2022, 'Blanco', 'Disponible'),
  ('SBZC 70', 'Peugeot', 'PARTNER HDI 92 L1 1.6', 2022, 'Blanco', 'Disponible'),
  ('PSJJ 97', 'Peugeot', 'PARTNER', 2021, 'Blanco', 'Disponible'),
  ('SSDD 57', 'Peugeot', 'PARTNER', 2023, 'Blanco', 'Disponible'),
  ('SVFB 26', 'Peugeot', 'PARTNER 1.5', 2023, 'Blanco', 'Disponible'),
  ('SCDW 37', 'Peugeot', 'EXPERT', 2022, 'Blanco', 'Disponible'),
  ('RLVR 75', 'Peugeot', 'PARTNER', 2022, 'Blanco', 'En taller'),
  ('TCGB 98', 'Nissan', 'NAVARA XE 4X2', 2024, 'Rojo', 'Disponible'),
  ('LRJY 32', 'Ford', 'RAPTOR F150', 2020, 'Rojo', 'Disponible'),
  ('SLGD 85', 'Volkswagen', 'SAVEIRO CD 1.6', 2022, 'Blanco', 'Disponible'),
  ('RRKB 78', 'Volkswagen', 'AMAROK 4X4 MT', 2022, 'Blanco', 'Disponible'),
  ('SKLF 13', 'Hino', 'XZU 617 DC', 2023, 'Blanco', 'Disponible'),
  ('SGYL 33', 'Maxus', 'T60 4X4', 2023, 'Blanco', 'En taller'),
  ('SDDS 52', 'Maxus', 'T60 4X4 GLX', 2022, 'Blanco', 'Disponible'),
  ('SFWD 31', 'Maxus', 'T60 4X2', 2022, 'Blanco', 'Disponible'),
  ('STPZ 87', 'Maxus', 'T60 4X2 AT', 2023, 'Gris', 'Disponible'),
  ('SFYB 29', 'Chevrolet', 'COLORADO 4X4 AUT.', 2022, 'Blanco', 'Disponible'),
  ('SFBL 43', 'Chevrolet', 'COLORADO 4X4 AUT.', 2022, 'Blanco', 'Disponible'),
  ('RPFS 85', 'Chevrolet', 'DMAX 4X4', 2022, 'Rojo', 'Disponible'),
  ('SDJT 43', 'Chevrolet', 'COLORADO 4X4 AUT.', 2022, 'Blanco', 'Disponible'),
  ('DDLJ 95', 'Mercedes', 'ML300 CDI', 2011, 'Blanco', 'Disponible'),
  ('RKRG 58', 'Subaru', 'WRX STI 4X4 2.5', 2022, 'Azul', 'Disponible'),
  ('RZWV 49', 'JAC', 'X200', 2022, 'Blanco', 'En preparación'),
  ('PHZD 48', 'Citroen', 'BERLINGO', 2021, 'Blanco', 'Disponible'),
  ('SHYL 53', 'Ford', 'RANGER 4X4', 2023, 'Rojo', 'Disponible'),
  ('RZJR 40', 'JAC', 'X200', 2022, 'Blanco', 'En preparación'),
  ('RZTG 13', 'JAC', 'X200', 2022, 'Blanco', 'En preparación'),
  ('RYY 68', 'JAC', 'X200', 2022, 'Blanco', 'En preparación'),
  ('RTZH 73', 'MG', 'ZS 1.5', 2022, 'Rojo', 'En taller'),
  ('SVFD 42', 'Peugeot', 'PARTNER', 2023, 'Blanco', 'En taller'),
  ('SRCP 17', 'Mitsubishi', 'NEW KATANA 4X2', 2023, 'Rojo', 'En taller'),
  ('CRBW 65', 'Mitsubishi', 'MONTERO SPORT MT', 2010, 'Blanco', 'En taller'),
  ('JYFW 75', 'Chevrolet', 'TAHOE LT 4WD 5.3', 2017, 'Celeste', 'En poder de Don Rudy'),
  ('TSKL 58', 'Ford', 'RAPTOR F150', 2025, 'Negro', 'En poder de Don Rudy'),
  ('RXZT 82', 'Ford', 'RAPTOR F150', 2022, 'Blanco', 'En poder de Don Rudy'),
  ('RGGZ 96', 'Mitsubishi', 'KATANA WORK 4X2', 2022, 'Blanco', 'Consignado'),
  ('PLXC 89', 'Maxus', 'T60 4X4', 2021, 'Blanco', 'Consignado'),
  ('PJBL 79', 'Mitsubishi', 'L200 KATANA CRT 4X4', 2021, 'Rojo', 'En tránsito'),
  ('HYGH 38', 'Mitsubishi', 'L200 KATANA CRT 4X4 2.5', 2016, 'Rojo', 'En tránsito'),
  ('SXDW 38', 'Nissan', 'NAVARA XE 4X4', 2023, 'Blanco', 'En tránsito'),
  ('HVHS 94', 'Mitsubishi', 'L200 KATANA CRT 4X4 2.5', 2016, 'Rojo', 'En tránsito'),
  ('RTXJ 21', 'Mitsubishi', 'L200 KATANA CRT 4X4', 2022, 'Rojo', 'En tránsito'),
  ('PSFK 52', 'Ford', 'RANGER XLT 4X4 3.2', 2021, 'Gris', 'En tránsito'),
  ('PRKK 70', 'Ford', 'RANGER XLT 4X4 3.2', 2021, 'Gris', 'En tránsito')
on conflict (plate) do update set
  brand = excluded.brand,
  model = excluded.model,
  year = excluded.year,
  color = excluded.color,
  status = excluded.status;

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
