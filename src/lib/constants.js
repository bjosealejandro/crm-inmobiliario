export const COMPANY = {
  name: "CRM Inmobiliario",
};

export const ROL_ADMIN = "admin";
export const ROL_AGENTE = "agente";

export const FASES_LEAD = [
  { id: "nuevo",            label: "Nuevo",            color: "blue"   },
  { id: "contactado",       label: "Contactado",       color: "amber"  },
  { id: "calificado",       label: "Calificado",       color: "violet" },
  { id: "en_negociacion",   label: "En negociación",   color: "orange" },
  { id: "cerrado_ganado",   label: "Cerrado ganado",   color: "green"  },
  { id: "cerrado_perdido",  label: "Cerrado perdido",  color: "red"    },
];
export const FM_FASE = Object.fromEntries(FASES_LEAD.map(f => [f.id, f]));

export const FUENTES_LEAD = [
  { id: "referido",       label: "Referido" },
  { id: "redes_sociales", label: "Redes sociales" },
  { id: "llamada_fria",   label: "Llamada fría" },
  { id: "pagina_web",     label: "Página web" },
  { id: "feria",          label: "Feria/evento" },
  { id: "otro",           label: "Otro" },
];

export const URGENCIAS = [
  { id: "alta",  label: "Alta",  color: "red"   },
  { id: "media", label: "Media", color: "amber" },
  { id: "baja",  label: "Baja",  color: "slate" },
];
export const FM_URGENCIA = Object.fromEntries(URGENCIAS.map(u => [u.id, u]));

export const TIPOS_INMUEBLE = [
  { id: "casa",        label: "Casa" },
  { id: "apartamento", label: "Apartamento" },
  { id: "lote",        label: "Lote" },
  { id: "local",       label: "Local comercial" },
  { id: "oficina",     label: "Oficina" },
  { id: "bodega",      label: "Bodega" },
  { id: "finca",       label: "Finca" },
];
export const FM_TIPO_INMUEBLE = Object.fromEntries(TIPOS_INMUEBLE.map(t => [t.id, t]));

// Operación del lado del inmueble (lo que se ofrece)
export const OPERACIONES = [
  { id: "venta",    label: "Venta" },
  { id: "arriendo", label: "Arriendo" },
];

// Operación del lado del lead (lo que busca) — "compra" matchea con inmuebles en "venta"
export const OPERACIONES_LEAD = [
  { id: "compra",   label: "Comprar" },
  { id: "arriendo", label: "Arrendar" },
];

export const ESTADOS_INMUEBLE = [
  { id: "disponible", label: "Disponible", color: "green" },
  { id: "reservado",  label: "Reservado",  color: "amber" },
  { id: "vendido",    label: "Vendido",    color: "violet" },
  { id: "arrendado",  label: "Arrendado",  color: "blue"  },
  { id: "inactivo",   label: "Inactivo",   color: "slate" },
];
export const FM_ESTADO_INMUEBLE = Object.fromEntries(ESTADOS_INMUEBLE.map(e => [e.id, e]));

export const FUENTES_INMUEBLE = [
  { id: "manual",   label: "Manual" },
  { id: "csv",      label: "Carga Excel/CSV" },
  { id: "api_habi", label: "API Habi" },
  { id: "otro_api", label: "Otra API" },
];

export const ESTADOS_MATCH = [
  { id: "sugerido",   label: "Sugerido",   color: "blue"  },
  { id: "enviado",    label: "Enviado",    color: "amber" },
  { id: "visitado",   label: "Visitado",   color: "violet"},
  { id: "interesado", label: "Interesado", color: "green" },
  { id: "descartado", label: "Descartado", color: "red"   },
];
export const FM_ESTADO_MATCH = Object.fromEntries(ESTADOS_MATCH.map(e => [e.id, e]));

export const ACCIONES_SEGUIMIENTO = ["Volver a llamar", "Enviar WhatsApp", "Agendar visita", "Enviar propuesta", "Enviar más opciones"];
