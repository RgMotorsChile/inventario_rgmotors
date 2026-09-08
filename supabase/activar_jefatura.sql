-- Después de crear el primer usuario en Authentication → Users,
-- pega su UUID aquí y corre este script.

update public.profiles
set role = 'jefatura',
    active = true
where id = 'PEGA-AQUI-EL-UUID';
