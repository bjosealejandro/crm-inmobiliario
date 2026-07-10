alter table inmuebles
  add column if not exists videos jsonb not null default '[]',
  add column if not exists instagram_url text,
  add column if not exists facebook_url text,
  add column if not exists fincaraiz_url text,
  add column if not exists metrocuadrado_url text,
  add column if not exists habi_id text,
  add column if not exists habi_url text;
