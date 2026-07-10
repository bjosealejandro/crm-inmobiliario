# CRM Inmobiliario

CRM para gestión de leads, inventario de inmuebles y match inteligente entre ambos.

## Stack

React 19 + Vite + Tailwind CSS v4 + Supabase (Postgres + Auth).

## Módulos

- **Leads**: seguimiento y perfil de búsqueda de clientes (presupuesto, tipo de inmueble, zonas de interés, historial de contacto).
- **Inmuebles**: inventario con buscador por filtros y carga masiva vía Excel/CSV.
- **Matches**: cálculo de coincidencias entre el perfil de un lead y el inventario disponible.
- **Agentes**: administración de usuarios (solo admin).
- **Configuración**: estado de integraciones con fuentes externas de inventario (Habi, Fincaraíz — ver notas en la app, ninguna tiene API pública de autoservicio todavía).

## Desarrollo

```bash
npm install
npm run dev
```

## Base de datos

El esquema vive en `supabase/migrations/`. Aplicar con:

```bash
supabase db push
```

Última verificación de despliegue automático: 2026-07-10T14:25:28Z
