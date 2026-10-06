-- Trazabilidad por patente: un repuesto "instalado" siempre queda amarrado a una patente.
-- "Entregado" (usado) sigue aceptando una observación cuando no es un vehículo (limpieza, taller…),
-- y dañado/extraviado no piden patente. No toca datos existentes.
do $$
declare
  v_def text;
  v_old text := $q$elsif p_outcome in ('instalado', 'usado') and coalesce(trim(p_note), '') = '' then$q$;
  v_new text := $q$elsif p_outcome = 'instalado' then
    raise exception 'Indica la patente del vehículo donde se instaló el repuesto';
  elsif p_outcome = 'usado' and coalesce(trim(p_note), '') = '' then$q$;
begin
  select pg_get_functiondef('public.deliver_item(text,integer,uuid,text,text,text)'::regprocedure) into v_def;
  if (length(v_def) - length(replace(v_def, v_old, ''))) / length(v_old) <> 1 then
    raise exception 'deliver_item no tiene la forma esperada';
  end if;
  execute replace(v_def, v_old, v_new);
end $$;

revoke all on function public.deliver_item(text, integer, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.deliver_item(text, integer, uuid, text, text, text) to service_role;
