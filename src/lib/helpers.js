// ─── Formatters ──────────────────────────────────────────────────────────────
export const fmt = (n) =>
  n == null || n === "" ? "—" : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export const fmtArea = (n) => (n == null || n === "" ? "—" : `${n} m²`);

export const fmtDate = (s) => {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

export const today = () => new Date().toISOString().split("T")[0];

// ─── Mappers: snake_case (DB) <-> camelCase (JS) ─────────────────────────────
export const mapAgente = (a) => ({
  id: a.id, userId: a.user_id, nombre: a.nombre, email: a.email,
  telefono: a.telefono, rol: a.rol, activo: a.activo,
});

export const mapLead = (l) => ({
  id: l.id, nombre: l.nombre, telefono: l.telefono, email: l.email,
  fuente: l.fuente, fase: l.fase, agenteId: l.agente_id,
  tipoOperacion: l.tipo_operacion, tipoInmueble: l.tipo_inmueble || [],
  presupuestoMin: l.presupuesto_min, presupuestoMax: l.presupuesto_max,
  ciudadesInteres: l.ciudades_interes || [], zonasInteres: l.zonas_interes || [],
  habitacionesMin: l.habitaciones_min, banosMin: l.banos_min,
  areaMin: l.area_min, areaMax: l.area_max, urgencia: l.urgencia || "media",
  proximaAccion: l.proxima_accion, fechaProxima: l.fecha_proxima,
  notas: l.notas, historial: l.historial || [],
  createdAt: l.created_at,
});

export const toLeadRow = (l) => ({
  nombre: l.nombre, telefono: l.telefono, email: l.email,
  fuente: l.fuente, fase: l.fase, agente_id: l.agenteId || null,
  tipo_operacion: l.tipoOperacion || null, tipo_inmueble: l.tipoInmueble || [],
  presupuesto_min: l.presupuestoMin || null, presupuesto_max: l.presupuestoMax || null,
  ciudades_interes: l.ciudadesInteres || [], zonas_interes: l.zonasInteres || [],
  habitaciones_min: l.habitacionesMin || null, banos_min: l.banosMin || null,
  area_min: l.areaMin || null, area_max: l.areaMax || null, urgencia: l.urgencia || "media",
  proxima_accion: l.proximaAccion || "", fecha_proxima: l.fechaProxima || null,
  notas: l.notas || "", historial: l.historial || [],
});

export const mapInmueble = (i) => ({
  id: i.id, titulo: i.titulo, descripcion: i.descripcion, tipo: i.tipo,
  operacion: i.operacion, precio: i.precio, area: i.area,
  habitaciones: i.habitaciones, banos: i.banos, parqueaderos: i.parqueaderos,
  estrato: i.estrato, ciudad: i.ciudad, zona: i.zona, direccion: i.direccion,
  pisos: i.pisos, antiguedadAnios: i.antiguedad_anios, materialPiso: i.material_piso,
  imagenes: i.imagenes || [], amenities: i.amenities || [],
  estado: i.estado, fuente: i.fuente, fuenteId: i.fuente_id,
  agenteId: i.agente_id, destacado: i.destacado, createdAt: i.created_at,
});

export const toInmuebleRow = (i) => ({
  titulo: i.titulo, descripcion: i.descripcion || "", tipo: i.tipo,
  operacion: i.operacion, precio: i.precio || 0, area: i.area || null,
  habitaciones: i.habitaciones || null, banos: i.banos || null, parqueaderos: i.parqueaderos || null,
  estrato: i.estrato || null, ciudad: i.ciudad || "", zona: i.zona || "", direccion: i.direccion || "",
  pisos: i.pisos || null, antiguedad_anios: i.antiguedadAnios || null, material_piso: i.materialPiso || "",
  imagenes: i.imagenes || [], amenities: i.amenities || [],
  estado: i.estado || "disponible", fuente: i.fuente || "manual", fuente_id: i.fuenteId || null,
  agente_id: i.agenteId || null, destacado: i.destacado || false,
});

export const mapMatch = (m) => ({
  id: m.id, leadId: m.lead_id, inmuebleId: m.inmueble_id,
  score: m.score, criterios: m.criterios || {}, estado: m.estado,
  createdAt: m.created_at,
});

// ─── Match inteligente: lead x inmueble ──────────────────────────────────────
// Filtros duros (tipo de operación y tipo de inmueble): si no calzan, no es match.
// El resto de criterios ponderan un score 0-100; si el lead no definió un criterio,
// se le da un puntaje neutral parcial en vez de penalizarlo por falta de datos.
export const calcularMatch = (lead, inmueble) => {
  if (inmueble.estado !== "disponible") return null;
  // lead.tipoOperacion es "compra"/"arriendo" (lo que busca); inmueble.operacion es "venta"/"arriendo" (lo que se ofrece)
  const operacionEsperada = lead.tipoOperacion === "compra" ? "venta" : lead.tipoOperacion;
  if (operacionEsperada && inmueble.operacion !== operacionEsperada) return null;
  if (lead.tipoInmueble?.length && !lead.tipoInmueble.includes(inmueble.tipo)) return null;

  let score = 0, max = 0;
  const criterios = {};

  max += 35;
  if (lead.presupuestoMin != null || lead.presupuestoMax != null) {
    const min = lead.presupuestoMin ?? 0;
    const maxP = lead.presupuestoMax ?? Infinity;
    const tolerancia = (maxP === Infinity ? min : maxP) * 0.1;
    const ok = inmueble.precio >= (min - tolerancia) && inmueble.precio <= (maxP + tolerancia);
    score += ok ? 35 : 0;
    criterios.precio = ok;
  } else score += 20;

  max += 25;
  if (lead.ciudadesInteres?.length) {
    const ok = !!inmueble.ciudad && lead.ciudadesInteres.some(c => c.toLowerCase() === inmueble.ciudad.toLowerCase());
    score += ok ? 25 : 0;
    criterios.ciudad = ok;
  } else score += 15;

  max += 15;
  if (lead.zonasInteres?.length) {
    const ok = !!inmueble.zona && lead.zonasInteres.some(z => z.toLowerCase() === inmueble.zona.toLowerCase());
    score += ok ? 15 : 0;
    criterios.zona = ok;
  } else score += 8;

  max += 15;
  if (lead.habitacionesMin != null) {
    const ok = (inmueble.habitaciones || 0) >= lead.habitacionesMin;
    score += ok ? 15 : 0;
    criterios.habitaciones = ok;
  } else score += 8;

  max += 10;
  if (lead.areaMin != null || lead.areaMax != null) {
    const aMin = lead.areaMin ?? 0, aMax = lead.areaMax ?? Infinity;
    const ok = (inmueble.area || 0) >= aMin && (inmueble.area || 0) <= aMax;
    score += ok ? 10 : 0;
    criterios.area = ok;
  } else score += 5;

  return { score: Math.round((score / max) * 100), criterios };
};
