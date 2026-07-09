-- ─── Agentes ──────────────────────────────────────────────────────────────
create table agentes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  nombre text not null,
  email text not null unique,
  telefono text,
  rol text not null default 'agente' check (rol in ('agente', 'admin')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── Leads (CRM: gestión y seguimiento de clientes) ─────────────────────────
create table leads (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  email text,
  fuente text default 'otro' check (fuente in ('referido','redes_sociales','llamada_fria','pagina_web','feria','otro')),
  fase text not null default 'nuevo' check (fase in ('nuevo','contactado','calificado','en_negociacion','cerrado_ganado','cerrado_perdido')),
  agente_id uuid references agentes(id) on delete set null,

  -- Perfil de búsqueda (para el match inteligente)
  tipo_operacion text check (tipo_operacion in ('compra','arriendo')),
  tipo_inmueble text[] default '{}',
  presupuesto_min numeric,
  presupuesto_max numeric,
  ciudades_interes text[] default '{}',
  zonas_interes text[] default '{}',
  habitaciones_min int,
  banos_min int,
  area_min numeric,
  area_max numeric,
  urgencia text default 'media' check (urgencia in ('alta','media','baja')),

  proxima_accion text,
  fecha_proxima date,
  notas text,
  historial jsonb not null default '[]',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_fase_idx on leads(fase);
create index leads_agente_idx on leads(agente_id);

-- ─── Inmuebles (inventario) ──────────────────────────────────────────────────
create table inmuebles (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  tipo text not null check (tipo in ('casa','apartamento','lote','local','oficina','bodega','finca')),
  operacion text not null check (operacion in ('venta','arriendo')),
  precio numeric not null,
  area numeric,
  habitaciones int,
  banos int,
  parqueaderos int,
  estrato int,
  ciudad text,
  zona text,
  direccion text,
  imagenes jsonb not null default '[]',
  amenities jsonb not null default '[]',
  estado text not null default 'disponible' check (estado in ('disponible','reservado','vendido','arrendado','inactivo')),
  fuente text not null default 'manual' check (fuente in ('manual','csv','api_habi','otro_api')),
  fuente_id text,
  agente_id uuid references agentes(id) on delete set null,
  destacado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inmuebles_estado_idx on inmuebles(estado);
create index inmuebles_tipo_idx on inmuebles(tipo);
create index inmuebles_ciudad_idx on inmuebles(ciudad);
create unique index inmuebles_fuente_dedup_idx on inmuebles(fuente, fuente_id) where fuente_id is not null;

-- ─── Matches (lead x inmueble) ───────────────────────────────────────────────
create table matches (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  inmueble_id uuid not null references inmuebles(id) on delete cascade,
  score int not null,
  criterios jsonb not null default '{}',
  estado text not null default 'sugerido' check (estado in ('sugerido','enviado','visitado','interesado','descartado')),
  created_at timestamptz not null default now(),
  unique (lead_id, inmueble_id)
);
create index matches_lead_idx on matches(lead_id);
create index matches_inmueble_idx on matches(inmueble_id);

-- ─── Fuentes externas (config de integraciones, ej. Habi) ───────────────────
create table fuentes_externas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  estado text not null default 'pendiente' check (estado in ('pendiente','activa','inactiva')),
  notas text,
  config jsonb not null default '{}',
  created_at timestamptz not null default now()
);
insert into fuentes_externas (nombre, estado, notas) values
  ('Habi', 'pendiente', 'Sin API pública de partners documentada al 2026-07-09. Requiere gestionar acceso con el equipo comercial/partnerships de Habi antes de conectar. Por ahora, cargar su inventario manualmente o vía Excel.');

-- ─── RLS: solo agentes autenticados ──────────────────────────────────────────
alter table agentes enable row level security;
alter table leads enable row level security;
alter table inmuebles enable row level security;
alter table matches enable row level security;
alter table fuentes_externas enable row level security;

create policy "agentes autenticados full access" on agentes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "agentes autenticados full access" on leads
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "agentes autenticados full access" on inmuebles
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "agentes autenticados full access" on matches
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "agentes autenticados full access" on fuentes_externas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ─── updated_at automático ────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_set_updated_at before update on leads
  for each row execute function set_updated_at();
create trigger inmuebles_set_updated_at before update on inmuebles
  for each row execute function set_updated_at();
