-- Bucket público para fotos de inmuebles
insert into storage.buckets (id, name, public)
values ('inmuebles-fotos', 'inmuebles-fotos', true)
on conflict (id) do nothing;

create policy "agentes autenticados suben fotos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'inmuebles-fotos');

create policy "agentes autenticados borran fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'inmuebles-fotos');

create policy "agentes autenticados actualizan fotos" on storage.objects
  for update to authenticated
  using (bucket_id = 'inmuebles-fotos');

-- Lectura pública de inmuebles (para el visor compartible sin login).
-- Se excluyen los inactivos de la vista pública.
create policy "lectura publica de inmuebles activos" on inmuebles
  for select to anon
  using (estado <> 'inactivo');
