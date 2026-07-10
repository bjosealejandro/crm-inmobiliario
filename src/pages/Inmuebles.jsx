import { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";
import { useUI } from "../contexts/UIContext";
import { TIPOS_INMUEBLE, FM_TIPO_INMUEBLE, OPERACIONES, ESTADOS_INMUEBLE, FM_ESTADO_INMUEBLE, FUENTES_INMUEBLE } from "../lib/constants";
import { fmt, fmtArea, toInmuebleRow } from "../lib/helpers";
import { Card, Badge, Btn, Input, Select, Textarea, Modal, ImageUploader } from "../components/ui";

const emptyInmueble = () => ({
  titulo: "", descripcion: "", tipo: "apartamento", operacion: "venta", precio: "",
  area: "", habitaciones: "", banos: "", parqueaderos: "", estrato: "",
  ciudad: "", zona: "", direccion: "", estado: "disponible", destacado: false, imagenes: [],
});

export const Inmuebles = ({ inmuebles, agentes, agenteActualId, onChange }) => {
  const { showToast, showConfirm } = useUI();
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroOperacion, setFiltroOperacion] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("disponible");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [habitacionesMin, setHabitacionesMin] = useState("");
  const [showNuevo, setShowNuevo] = useState(false);
  const [nuevo, setNuevo] = useState(emptyInmueble());
  const [detalle, setDetalle] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef();

  const filtrados = useMemo(() => inmuebles.filter(i => {
    const mTipo = filtroTipo === "todos" || i.tipo === filtroTipo;
    const mOp = filtroOperacion === "todos" || i.operacion === filtroOperacion;
    const mEstado = filtroEstado === "todos" || i.estado === filtroEstado;
    const mPMin = !precioMin || i.precio >= Number(precioMin);
    const mPMax = !precioMax || i.precio <= Number(precioMax);
    const mHab = !habitacionesMin || (i.habitaciones || 0) >= Number(habitacionesMin);
    const q = busqueda.trim().toLowerCase();
    const mB = !q || i.titulo.toLowerCase().includes(q) || (i.ciudad || "").toLowerCase().includes(q) || (i.zona || "").toLowerCase().includes(q);
    return mTipo && mOp && mEstado && mPMin && mPMax && mHab && mB;
  }), [inmuebles, filtroTipo, filtroOperacion, filtroEstado, precioMin, precioMax, habitacionesMin, busqueda]);

  const crearInmueble = async () => {
    if (!nuevo.titulo.trim() || !nuevo.precio) return showToast("Título y precio son obligatorios", "error");
    setSaving(true);
    const row = toInmuebleRow({ ...nuevo, agenteId: agenteActualId, fuente: "manual" });
    const { error } = await supabase.from("inmuebles").insert(row);
    setSaving(false);
    if (error) return showToast("Error creando inmueble: " + error.message, "error");
    showToast("Inmueble creado", "success");
    setShowNuevo(false); setNuevo(emptyInmueble());
    await onChange?.();
  };

  const actualizarCampo = async (id, field, value) => {
    const dbField = { titulo: "titulo", descripcion: "descripcion", tipo: "tipo", operacion: "operacion",
      precio: "precio", area: "area", habitaciones: "habitaciones", banos: "banos", parqueaderos: "parqueaderos",
      estrato: "estrato", ciudad: "ciudad", zona: "zona", direccion: "direccion", estado: "estado",
      destacado: "destacado" }[field] || field;
    await supabase.from("inmuebles").update({ [dbField]: value }).eq("id", id);
    await onChange?.();
  };

  const eliminarInmueble = async () => {
    const ok = await showConfirm(`¿Eliminar "${detalle.titulo}"?`, "Esta acción no se puede deshacer.");
    if (!ok) return;
    await supabase.from("inmuebles").delete().eq("id", detalle.id);
    await onChange?.();
    setDetalle(null);
  };

  // ─── Import Excel/CSV ───────────────────────────────────────────────────
  const descargarTemplate = () => {
    const cols = ["Titulo *", "Tipo * (casa/apartamento/lote/local/oficina/bodega/finca)", "Operacion * (venta/arriendo)", "Precio *", "Area (m2)", "Habitaciones", "Banos", "Parqueaderos", "Ciudad", "Zona", "Direccion"];
    const ejemplo = ["Apartamento en El Poblado", "apartamento", "venta", "450000000", "85", "3", "2", "1", "Medellin", "El Poblado", "Cra 43 #10-20"];
    const ws = XLSX.utils.aoa_to_sheet([cols, ejemplo]);
    ws["!cols"] = cols.map(c => ({ wch: Math.max(18, c.length) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inmuebles");
    XLSX.writeFile(wb, "template_inmuebles.xlsx");
  };

  const importarArchivo = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImportMsg("Leyendo archivo...");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (!rows.length) { setImportMsg("El archivo está vacío"); return; }
      const keys = Object.keys(rows[0]);
      const col = (...names) => { for (const n of names) { const k = keys.find(k => k.toLowerCase().includes(n)); if (k) return k; } return null; };
      const kTit = col("titulo"), kTipo = col("tipo"), kOp = col("operacion"), kPrecio = col("precio"),
        kArea = col("area"), kHab = col("habitacion"), kBan = col("bano"), kParq = col("parqueadero"),
        kCiu = col("ciudad"), kZona = col("zona"), kDir = col("direccion");
      if (!kTit || !kPrecio) { setImportMsg("Faltan columnas obligatorias (Titulo, Precio)"); return; }
      const nuevos = rows.map(r => ({
        titulo: String(r[kTit] || "").trim(),
        tipo: TIPOS_INMUEBLE.some(t => t.id === String(r[kTipo] || "").toLowerCase()) ? String(r[kTipo]).toLowerCase() : "apartamento",
        operacion: String(r[kOp] || "").toLowerCase() === "arriendo" ? "arriendo" : "venta",
        precio: Number(r[kPrecio]) || 0,
        area: Number(r[kArea]) || null, habitaciones: Number(r[kHab]) || null, banos: Number(r[kBan]) || null,
        parqueaderos: Number(r[kParq]) || null, ciudad: kCiu ? String(r[kCiu] || "").trim() : "",
        zona: kZona ? String(r[kZona] || "").trim() : "", direccion: kDir ? String(r[kDir] || "").trim() : "",
        estado: "disponible", fuente: "csv", agenteId: agenteActualId,
      })).filter(i => i.titulo && i.precio);
      if (!nuevos.length) { setImportMsg("No se encontraron filas válidas"); return; }
      const BATCH = 50;
      for (let i = 0; i < nuevos.length; i += BATCH) {
        const { error } = await supabase.from("inmuebles").insert(nuevos.slice(i, i + BATCH).map(toInmuebleRow));
        if (error) throw error;
      }
      setImportMsg(`${nuevos.length} inmuebles importados correctamente`);
      showToast(`${nuevos.length} inmuebles importados`, "success");
      await onChange?.();
    } catch (err) {
      setImportMsg("Error: " + err.message);
    }
    e.target.value = "";
  };

  const exportar = () => {
    const cols = ["Titulo", "Tipo", "Operacion", "Precio", "Area", "Habitaciones", "Banos", "Estado", "Ciudad", "Zona", "Fuente"];
    const rows = filtrados.map(i => [i.titulo, i.tipo, i.operacion, i.precio, i.area, i.habitaciones, i.banos, i.estado, i.ciudad, i.zona, i.fuente]);
    const ws = XLSX.utils.aoa_to_sheet([cols, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inmuebles");
    XLSX.writeFile(wb, "inmuebles.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xl font-bold text-slate-800">Inmuebles</div>
          <div className="text-sm text-slate-400">{inmuebles.length} en total · {filtrados.length} visibles</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Btn variant="ghost" onClick={descargarTemplate}>Plantilla</Btn>
          <Btn variant="secondary" onClick={() => fileRef.current.click()}>Importar</Btn>
          <Btn variant="success" onClick={exportar}>Exportar</Btn>
          <Btn onClick={() => { setNuevo(emptyInmueble()); setShowNuevo(true); }}>+ Nuevo</Btn>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={importarArchivo} className="hidden" />
        </div>
      </div>

      {importMsg && <Card className="p-3 text-sm text-emerald-700 bg-emerald-50 border-emerald-200">{importMsg}</Card>}

      {/* Buscador inteligente */}
      <Card className="p-4 space-y-3">
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por título, ciudad o zona..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
            <option value="todos">Todos los tipos</option>
            {TIPOS_INMUEBLE.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <select value={filtroOperacion} onChange={e => setFiltroOperacion(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
            <option value="todos">Venta/Arriendo</option>
            {OPERACIONES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
            <option value="todos">Todos los estados</option>
            {ESTADOS_INMUEBLE.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
          <input value={precioMin} onChange={e => setPrecioMin(e.target.value)} type="number" placeholder="Precio mín."
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
          <input value={precioMax} onChange={e => setPrecioMax(e.target.value)} type="number" placeholder="Precio máx."
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
          <input value={habitacionesMin} onChange={e => setHabitacionesMin(e.target.value)} type="number" placeholder="Hab. mín."
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-400">Sin inmuebles. Importa un archivo o ajusta los filtros.</div>
        ) : filtrados.map(i => {
          const estado = FM_ESTADO_INMUEBLE[i.estado];
          return (
            <Card key={i.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetalle(i)}>
              <div className="aspect-video bg-slate-100 flex items-center justify-center text-slate-300 text-4xl overflow-hidden">
                {i.imagenes?.[0] ? <img src={i.imagenes[0]} alt="" className="w-full h-full object-cover" /> : "🏠"}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="font-semibold text-slate-800 text-sm leading-snug">{i.titulo}</div>
                  <Badge color={estado?.color}>{estado?.label}</Badge>
                </div>
                <div className="text-lg font-bold text-emerald-700">{fmt(i.precio)}</div>
                <div className="text-xs text-slate-400 mb-2">{i.operacion === "venta" ? "Venta" : "Arriendo"} · {FM_TIPO_INMUEBLE[i.tipo]?.label}</div>
                <div className="text-xs text-slate-500">{i.ciudad}{i.zona ? ` · ${i.zona}` : ""}</div>
                <div className="flex gap-3 text-xs text-slate-400 mt-2">
                  {i.habitaciones != null && <span>{i.habitaciones} hab</span>}
                  {i.banos != null && <span>{i.banos} baños</span>}
                  {i.area != null && <span>{fmtArea(i.area)}</span>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal nuevo inmueble */}
      <Modal open={showNuevo} onClose={() => setShowNuevo(false)} title="Nuevo inmueble">
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Fotos</label>
          <ImageUploader imagenes={nuevo.imagenes} onChange={v => setNuevo(p => ({ ...p, imagenes: v }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Título *" className="col-span-2" value={nuevo.titulo} onChange={e => setNuevo(p => ({ ...p, titulo: e.target.value }))} />
          <Select label="Tipo" options={TIPOS_INMUEBLE} value={nuevo.tipo} onChange={e => setNuevo(p => ({ ...p, tipo: e.target.value }))} />
          <Select label="Operación" options={OPERACIONES} value={nuevo.operacion} onChange={e => setNuevo(p => ({ ...p, operacion: e.target.value }))} />
          <Input label="Precio *" type="number" value={nuevo.precio} onChange={e => setNuevo(p => ({ ...p, precio: e.target.value }))} />
          <Input label="Área (m²)" type="number" value={nuevo.area} onChange={e => setNuevo(p => ({ ...p, area: e.target.value }))} />
          <Input label="Habitaciones" type="number" value={nuevo.habitaciones} onChange={e => setNuevo(p => ({ ...p, habitaciones: e.target.value }))} />
          <Input label="Baños" type="number" value={nuevo.banos} onChange={e => setNuevo(p => ({ ...p, banos: e.target.value }))} />
          <Input label="Parqueaderos" type="number" value={nuevo.parqueaderos} onChange={e => setNuevo(p => ({ ...p, parqueaderos: e.target.value }))} />
          <Input label="Estrato" type="number" value={nuevo.estrato} onChange={e => setNuevo(p => ({ ...p, estrato: e.target.value }))} />
          <Input label="Ciudad" value={nuevo.ciudad} onChange={e => setNuevo(p => ({ ...p, ciudad: e.target.value }))} />
          <Input label="Zona/Barrio" value={nuevo.zona} onChange={e => setNuevo(p => ({ ...p, zona: e.target.value }))} />
          <Input label="Dirección" className="col-span-2" value={nuevo.direccion} onChange={e => setNuevo(p => ({ ...p, direccion: e.target.value }))} />
          <Textarea label="Descripción" className="col-span-2" rows={3} value={nuevo.descripcion} onChange={e => setNuevo(p => ({ ...p, descripcion: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="secondary" onClick={() => setShowNuevo(false)}>Cancelar</Btn>
          <Btn onClick={crearInmueble} disabled={saving}>{saving ? "Guardando..." : "Crear inmueble"}</Btn>
        </div>
      </Modal>

      {/* Modal detalle/edición */}
      <Modal open={!!detalle} onClose={() => setDetalle(null)} title={detalle?.titulo}
        subtitle={detalle && `Fuente: ${FUENTES_INMUEBLE.find(f => f.id === detalle.fuente)?.label || detalle.fuente}`}>
        {detalle && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Fotos</label>
              <ImageUploader imagenes={detalle.imagenes || []} onChange={v => { actualizarCampo(detalle.id, "imagenes", v); setDetalle(d => ({ ...d, imagenes: v })); }} />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-500 flex-1 truncate">{window.location.origin}/inmueble/{detalle.id}</span>
              <Btn size="sm" variant="secondary" onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/inmueble/${detalle.id}`);
                showToast("Link copiado", "success");
              }}>Copiar link</Btn>
              <a href={`/inmueble/${detalle.id}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-emerald-700 whitespace-nowrap">Ver visor ↗</a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Título" defaultValue={detalle.titulo} onBlur={e => actualizarCampo(detalle.id, "titulo", e.target.value)} />
              <Select label="Estado" options={ESTADOS_INMUEBLE} value={detalle.estado} onChange={e => { actualizarCampo(detalle.id, "estado", e.target.value); setDetalle(d => ({ ...d, estado: e.target.value })); }} />
              <Select label="Tipo" options={TIPOS_INMUEBLE} value={detalle.tipo} onChange={e => { actualizarCampo(detalle.id, "tipo", e.target.value); setDetalle(d => ({ ...d, tipo: e.target.value })); }} />
              <Select label="Operación" options={OPERACIONES} value={detalle.operacion} onChange={e => { actualizarCampo(detalle.id, "operacion", e.target.value); setDetalle(d => ({ ...d, operacion: e.target.value })); }} />
              <Input label="Precio" type="number" defaultValue={detalle.precio} onBlur={e => actualizarCampo(detalle.id, "precio", Number(e.target.value) || 0)} />
              <Input label="Área (m²)" type="number" defaultValue={detalle.area} onBlur={e => actualizarCampo(detalle.id, "area", Number(e.target.value) || null)} />
              <Input label="Habitaciones" type="number" defaultValue={detalle.habitaciones} onBlur={e => actualizarCampo(detalle.id, "habitaciones", Number(e.target.value) || null)} />
              <Input label="Baños" type="number" defaultValue={detalle.banos} onBlur={e => actualizarCampo(detalle.id, "banos", Number(e.target.value) || null)} />
              <Input label="Ciudad" defaultValue={detalle.ciudad} onBlur={e => actualizarCampo(detalle.id, "ciudad", e.target.value)} />
              <Input label="Zona" defaultValue={detalle.zona} onBlur={e => actualizarCampo(detalle.id, "zona", e.target.value)} />
            </div>
            <Textarea label="Descripción" rows={3} defaultValue={detalle.descripcion} onBlur={e => actualizarCampo(detalle.id, "descripcion", e.target.value)} />
            <Btn variant="danger" size="sm" onClick={eliminarInmueble}>Eliminar inmueble</Btn>
          </div>
        )}
      </Modal>
    </div>
  );
};
