-- Copia de rgmotors/supabase/migrations/20260923150000_lock_correct_delivery_plate.sql

revoke execute on function public.correct_delivery_plate(uuid, text, text, uuid, text) from anon, authenticated, public;
grant execute on function public.correct_delivery_plate(uuid, text, text, uuid, text) to service_role;
