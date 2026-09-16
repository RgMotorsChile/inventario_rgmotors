-- Catálogo y stock desde la pestaña INVENTARIO
-- https://docs.google.com/spreadsheets/d/1BG2uR6APbXEMvVvRmdR-Nn0Vko6eobJ6Xam0XX41Ldc/edit?gid=1329668533
-- Solo filas con cantidad explícita. Nombres corregidos (Mitsubishi).

insert into public.categories (name) values
  ('Parachoques'),
  ('Bigotes'),
  ('Pisaderas'),
  ('Barras'),
  ('Lonas'),
  ('Kit de levante'),
  ('Guardafangos'),
  ('Pernos'),
  ('Cubre pickup'),
  ('Botaguas'),
  ('Polarizado'),
  ('Kit cromados'),
  ('Llantas'),
  ('Neumáticos'),
  ('Amortiguadores'),
  ('Focos'),
  ('Radios'),
  ('Máquinas'),
  ('Insumos')
on conflict (name) do nothing;

insert into public.items (sku, name, category, brand, stock, min_stock, location, unit_cost, compatible) values
  ('PARA-NIS-NAV', 'Parachoques Nissan NP/Navara', 'Parachoques', 'Nissan', 5, 2, 'En caja', 0, 'NP300, Navara'),
  ('PARA-MIT-L20024', 'Parachoques Mitsubishi L200 2024+', 'Parachoques', 'Mitsubishi', 3, 1, 'En caja', 0, 'L200 2024+'),
  ('BIG-TOY-HIL', 'Bigote / deflector Toyota Hilux', 'Bigotes', 'Toyota', 1, 1, 'Bodega', 0, 'Hilux'),
  ('BIG-VW-AMA', 'Bigote / deflector Volkswagen Amarok', 'Bigotes', 'Volkswagen', 1, 1, 'Bodega', 0, 'Amarok'),
  ('PIS-VW-AMA', 'Pisadera Volkswagen Amarok', 'Pisaderas', 'Volkswagen', 1, 1, 'Bodega', 0, 'Amarok'),
  ('BAR-NIS-NP', 'Barra antivuelco Nissan NP300', 'Barras', 'Nissan', 3, 1, 'En caja', 0, 'NP300'),
  ('BAR-TOY-HIL', 'Barra antivuelco Toyota Hilux', 'Barras', 'Toyota', 3, 1, 'En caja', 0, 'Hilux'),
  ('BAR-MIT-L20024', 'Barra antivuelco Mitsubishi L200 2024+', 'Barras', 'Mitsubishi', 1, 1, 'Salgado', 0, 'L200 2024+'),
  ('LON-TOY-HIL', 'Lona marítima Toyota Hilux', 'Lonas', 'Toyota', 1, 1, 'Bodega', 0, 'Hilux universal'),
  ('LEV-NIS-NAV', 'Kit de levante Nissan NP/Navara', 'Kit de levante', 'Nissan', 2, 1, 'Bodega', 0, 'NP300, Navara'),
  ('LEV-TOY-HIL', 'Kit de levante Toyota Hilux', 'Kit de levante', 'Toyota', 2, 1, 'Bodega', 0, 'Hilux'),
  ('GF-TOY-HIL', 'Guardafango Toyota Hilux', 'Guardafangos', 'Toyota', 1, 1, 'Bodega', 0, 'Hilux'),
  ('GF-MAX-T60', 'Guardafango Maxus T60', 'Guardafangos', 'Maxus', 2, 1, 'Bodega', 0, 'T60'),
  ('GF-UNI', 'Guardafango universal', 'Guardafangos', 'Universal', 2, 1, 'Bodega', 0, 'Universal'),
  ('PER-BAR-L200HIL', 'Pernos para barra L200 y Hilux', 'Pernos', 'Universal', 30, 10, 'Bodega', 0, 'L200, Hilux'),
  ('CUB-TOY-HIL', 'Cubre pickup Toyota Hilux', 'Cubre pickup', 'Toyota', 3, 1, 'Bodega', 0, 'Hilux'),
  ('CUB-MIT-L20016', 'Cubre pickup Mitsubishi L200 2016+', 'Cubre pickup', 'Mitsubishi', 3, 1, 'Bodega', 0, 'L200 2016+'),
  ('CUB-CHE-DMAX', 'Cubre pickup Chevrolet Colorado/D-Max', 'Cubre pickup', 'Chevrolet', 1, 1, 'Bodega', 0, 'Colorado, D-Max'),
  ('BOT-VW-AMA', 'Botagua Volkswagen Amarok', 'Botaguas', 'Volkswagen', 1, 1, 'Bodega', 0, 'Amarok'),
  ('BOT-FOR-RAN', 'Botagua Ford Ranger', 'Botaguas', 'Ford', 1, 1, 'Bodega', 0, 'Ranger'),
  ('POL-ABIERTO', 'Polarizado abierto', 'Polarizado', 'Universal', 1, 1, 'Bodega', 0, 'Universal'),
  ('CRO-TOY-HIL', 'Kit cromado Toyota Hilux', 'Kit cromados', 'Toyota', 6, 2, 'Bodega', 0, 'Hilux'),
  ('LLA-NIS-NP', 'Juego de llantas Nissan NP300', 'Llantas', 'Nissan', 1, 1, 'Bodega', 0, 'NP300'),
  ('NEU-265-17', 'Neumático 265/65 R17 all-terrain', 'Neumáticos', 'Universal', 4, 2, 'Bodega', 0, 'Camionetas 4x4'),
  ('NEU-RAP-LUIS', 'Neumático Raptor', 'Neumáticos', 'Ford', 1, 1, 'En Luis', 0, 'Raptor F150'),
  ('AMO-MIT-L200', 'Amortiguador de portalón L200', 'Amortiguadores', 'Mitsubishi', 3, 1, 'Bodega', 0, 'L200'),
  ('BIS-MIT-L200', 'Bisel L200', 'Radios', 'Mitsubishi', 1, 1, 'Bodega', 0, 'L200'),
  ('FOC-MIT-L200-D', 'Foco trasero L200 derecho', 'Focos', 'Mitsubishi', 1, 1, 'Bodega', 0, 'L200 usado'),
  ('FOC-TOY-HIL-I', 'Foco trasero Hilux 2016-2022 izquierdo', 'Focos', 'Toyota', 2, 1, 'Bodega', 0, 'Hilux 2016-2022'),
  ('FOC-TOY-HIL-D', 'Foco trasero Hilux 2016-2022 derecho', 'Focos', 'Toyota', 2, 1, 'Bodega', 0, 'Hilux 2016-2022'),
  ('FOC-NIS-15-I', 'Foco trasero Navara 2015-2020 izquierdo', 'Focos', 'Nissan', 2, 1, 'Bodega', 0, 'Navara 2015-2020'),
  ('FOC-NIS-15-D', 'Foco trasero Navara 2015-2020 derecho', 'Focos', 'Nissan', 1, 1, 'Bodega', 0, 'Navara 2015-2020'),
  ('FOC-NIS-07-D', 'Foco trasero Navara 2007-2016 derecho', 'Focos', 'Nissan', 1, 1, 'Bodega', 0, 'Navara 2007-2016'),
  ('FOC-CIT-BER', 'Foco Berlingo', 'Focos', 'Citroen', 1, 1, 'Bodega', 0, 'Berlingo'),
  ('FOC-CHE-DMAX', 'Foco Chevrolet D-Max', 'Focos', 'Chevrolet', 1, 1, 'Bodega', 0, 'D-Max'),
  ('FOC-TOY-NEB', 'Neblinero Toyota', 'Focos', 'Toyota', 2, 1, 'Bodega', 0, 'Hilux'),
  ('FOC-MIT-SAL-I', 'Foco L200 izquierdo usado', 'Focos', 'Mitsubishi', 1, 1, 'Salgado', 0, 'L200'),
  ('FOC-MIT-SAL-D', 'Foco L200 derecho usado', 'Focos', 'Mitsubishi', 1, 1, 'Salgado', 0, 'L200'),
  ('FOC-TOY-SAL', 'Foco Hilux 2016-2022 usado', 'Focos', 'Toyota', 2, 1, 'Salgado', 0, 'Hilux 2016-2022'),
  ('FOC-NIS-SAL-D', 'Foco Nissan derecho usado', 'Focos', 'Nissan', 1, 1, 'Salgado', 0, 'Navara'),
  ('MAQ-VAPOR', 'Máquina a vapor', 'Máquinas', 'Universal', 1, 1, 'Bodega', 0, ''),
  ('MAQ-SOLD', 'Soldadora', 'Máquinas', 'Universal', 1, 1, 'Bodega', 0, ''),
  ('MAQ-ASPI', 'Aspiradora', 'Máquinas', 'Universal', 1, 1, 'Bodega', 0, ''),
  ('MAQ-HIDRO', 'Hidrolavadora', 'Máquinas', 'Universal', 1, 1, 'Bodega', 0, ''),
  ('MAQ-PART', 'Partidor eléctrico', 'Máquinas', 'Universal', 1, 1, 'Bodega', 0, ''),
  ('MAQ-COMP', 'Compresor', 'Máquinas', 'Universal', 2, 1, 'Bodega', 0, ''),
  ('MAQ-ABRE', 'Kit abre puertas', 'Máquinas', 'Universal', 1, 1, 'Bodega', 0, ''),
  ('MAQ-BAUK', 'Pistola Bauker', 'Máquinas', 'Universal', 1, 1, 'Bodega', 0, ''),
  ('MAQ-TEST', 'Tester eléctrico de batería', 'Máquinas', 'Universal', 1, 1, 'Bodega', 0, ''),
  ('PRE-LIMPIA', 'Limpia tapiz verde 5 L', 'Insumos', 'Universal', 3, 1, 'Bodega', 0, ''),
  ('PRE-MOTUL', 'Aceite Motul 10-40 1 L', 'Insumos', 'Motul', 2, 1, 'Bodega', 0, ''),
  ('PRE-ESTUCHE', 'Estuche Peugeot Partner', 'Insumos', 'Peugeot', 2, 1, 'Bodega', 0, 'Partner'),
  ('PRE-BOLSO', 'Bolso', 'Insumos', 'Universal', 1, 1, 'Bodega', 0, ''),
  ('PRE-LENTES', 'Lentes de trabajo', 'Insumos', 'Universal', 2, 1, 'Bodega', 0, ''),
  ('PRE-PISOS', 'Pisos usados', 'Insumos', 'Universal', 8, 2, 'Bodega', 0, ''),
  ('PRE-HUINCHA', 'Huincha de embalaje', 'Insumos', 'Universal', 2, 1, 'Bodega', 0, ''),
  ('PRE-ANCLAJE', 'Anclaje pisadera Shark NP300 2016', 'Insumos', 'Nissan', 1, 1, 'Bodega', 0, 'NP300 2016'),
  ('PRE-AMBIENT', 'Ambientadores americanos', 'Insumos', 'Universal', 6, 2, 'Bodega', 0, ''),
  ('PRE-TAPAS', 'Tapas cubre pickup', 'Insumos', 'Universal', 20, 5, 'Bodega', 0, ''),
  ('PRE-GATAS', 'Gatas', 'Insumos', 'Universal', 4, 1, 'Bodega', 0, ''),
  ('PRE-STICKER', 'Stickers L200', 'Insumos', 'Mitsubishi', 8, 2, 'Bodega', 0, 'L200'),
  ('PRE-MANGUERA', 'Juego mangueras lavado exterior', 'Insumos', 'Universal', 2, 1, 'Bodega', 0, ''),
  ('PRE-RADIOMAL', 'Radios en mal estado', 'Radios', 'Universal', 4, 1, 'Bodega', 0, ''),
  ('PRE-ESPAC', 'Espaciadores L200 25 mm', 'Insumos', 'Mitsubishi', 4, 1, 'Bodega', 0, 'L200'),
  ('PRE-ZAPA', 'Zapatillas', 'Insumos', 'Universal', 5, 1, 'Bodega', 0, ''),
  ('PRE-BANDERA', 'Banderas', 'Insumos', 'Universal', 2, 1, 'Bodega', 0, '')
on conflict (sku) do update set
  name = excluded.name,
  category = excluded.category,
  brand = excluded.brand,
  stock = excluded.stock,
  min_stock = excluded.min_stock,
  location = excluded.location,
  compatible = excluded.compatible;

-- Quita cajas y catálogo de prueba. No hay movimientos reales.
delete from public.receive_photos;
delete from public.assignments;
delete from public.movements;
delete from public.box_evidence;
delete from public.box_lines;
delete from public.boxes;
delete from public.items
where sku not in (
  'PARA-NIS-NAV','PARA-MIT-L20024','BIG-TOY-HIL','BIG-VW-AMA','PIS-VW-AMA',
  'BAR-NIS-NP','BAR-TOY-HIL','BAR-MIT-L20024','LON-TOY-HIL','LEV-NIS-NAV','LEV-TOY-HIL',
  'GF-TOY-HIL','GF-MAX-T60','GF-UNI','PER-BAR-L200HIL','CUB-TOY-HIL','CUB-MIT-L20016','CUB-CHE-DMAX',
  'BOT-VW-AMA','BOT-FOR-RAN','POL-ABIERTO','CRO-TOY-HIL','LLA-NIS-NP','NEU-265-17','NEU-RAP-LUIS',
  'AMO-MIT-L200','BIS-MIT-L200','FOC-MIT-L200-D','FOC-TOY-HIL-I','FOC-TOY-HIL-D','FOC-NIS-15-I',
  'FOC-NIS-15-D','FOC-NIS-07-D','FOC-CIT-BER','FOC-CHE-DMAX','FOC-TOY-NEB','FOC-MIT-SAL-I',
  'FOC-MIT-SAL-D','FOC-TOY-SAL','FOC-NIS-SAL-D','MAQ-VAPOR','MAQ-SOLD','MAQ-ASPI','MAQ-HIDRO',
  'MAQ-PART','MAQ-COMP','MAQ-ABRE','MAQ-BAUK','MAQ-TEST','PRE-LIMPIA','PRE-MOTUL','PRE-ESTUCHE',
  'PRE-BOLSO','PRE-LENTES','PRE-PISOS','PRE-HUINCHA','PRE-ANCLAJE','PRE-AMBIENT','PRE-TAPAS',
  'PRE-GATAS','PRE-STICKER','PRE-MANGUERA','PRE-RADIOMAL','PRE-ESPAC','PRE-ZAPA','PRE-BANDERA'
);

insert into public.categories (name)
select distinct trim(category) from public.items
on conflict (name) do nothing;
