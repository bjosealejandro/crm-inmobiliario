import { useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useUI } from "../contexts/UIContext";
import { FASES_LEAD, FM_FASE, FUENTES_LEAD, URGENCIAS, TIPOS_INMUEBLE, OPERACIONES_LEAD, ACCIONES_SEGUIMIENTO } from "../lib/constants";
import { fmt, fmtDate, toLeadRow, calcularMatch } from "../lib/helpers";
import { Card, Badge, Btn, Input, Select, Textarea, Modal, PillSelect, TagInput, Spinner, Icon } from "../components/ui";

const emptyLead = () => ({
  nombre: "", telefono: "", email: "", fuente: "otro", fase: "nuevo",
  tipoOperacion: "", tipoInmueble: [], presupuestoMin: "", presupuestoMax: "",
  ciudadesInteres: [], zonasInteres: [], habitacionesMin: "", banosMin: "",
  areaMin: "", areaMax: "", urgencia: "media", notas: "",
});

export const Leads = ({ leads, inmuebles, agentes, agenteActualId, onChange, onMatchChange }) => {
  const { showToast, showConfirm } = useUI();
  const [filtroFase, setFiltroFase] = useState("todos");
  const [filtroAgente, setFiltroAgente] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [showNuevo, setShowNuevo] = useState(false);
  const [nuevo, setNuevo] = useState(emptyLead());
  const [detalle, setDetalle] = useState(null);
  const [activeTab, setActiveTab] = useState("perfil");
  const [callLog, setCallLog] = useState({ resultado: "", nota: "", proximaAccion: "", fechaProxima: "" });
  const [saving, setSaving] = useState(false);
  const [matchResults, setMatchResults] = useState(null);

  const filtrados = useMemo(() => leads.filter(l => {
    const mF = filtroFase === "todos" || l.fase === filtroFase;
    const mA = filtroAgente === "todos" || l.agenteId === filtroAgente;
    const q = busqueda.trim().toLowerCase();
    const mB = !q || l.nombre.toLowerCase().includes(q) || (l.telefono || "").includes(busqueda.trim());
    return mF && mA && mB;
  }), [leads, filtroFase, filtroAgente, busqueda]);

  const agenteNombre = (id) => agentes.find(a => a.id === id)?.nombre || "Sin asignar";

  const crearLead = async () => {
    if (!nuevo.nombre.trim()) return showToast("El nombre es obligatorio", "error");
    setSaving(true);
    const row = toLeadRow({ ...nuevo, agenteId: agenteActualId, historial: [] });
    const { error } = await supabase.from("leads").insert(row);
    setSaving(false);
    if (error) return showToast("Error creando lead: " + error.message, "error");
    showToast("Lead creado", "success");
    setShowNuevo(false); setNuevo(emptyLead());
    await onChange?.();
  };

  const abrirDetalle = (lead) => {
    setDetalle(lead); setActiveTab("perfil"); setMatchResults(null);
    setCallLog({ resultado: "", nota: "", proximaAccion: "", fechaProxima: "" });
  };

  const actualizarCampo = async (id, field, value) => {
    const dbField = {
      fase: "fase", agenteId: "agente_id", tipoOperacion: "tipo_operacion", tipoInmueble: "tipo_inmueble",
      presupuestoMin: "presupuesto_min", presupuestoMax: "presupuesto_max",
      ciudadesInteres: "ciudades_interes", zonasInteres: "zonas_interes",
      habitacionesMin: "habitaciones_min", banosMin: "banos_min",
      areaMin: "area_min", areaMax: "area_max", urgencia: "urgencia",
      notas: "notas", nombre: "nombre", telefono: "telefono", email: "email", fuente: "fuente",
    }[field] || field;
    await supabase.from("leads").update({ [dbField]: value }).eq("id", id);
    await onChange?.();
  };

  const registrarSeguimiento = async () => {
    if (!callLog.resultado) return showToast("Selecciona la fase resultante", "error");
    const entry = { fecha: new Date().toLocaleDateString("es-CO"), ...callLog, agente: agenteNombre(detalle.agenteId) };
    const nuevoHistorial = [entry, ...(detalle.historial || [])];
    const { error } = await supabase.from("leads").update({
      historial: nuevoHistorial, fase: callLog.resultado,
      proxima_accion: callLog.proximaAccion || "", fecha_proxima: callLog.fechaProxima || null,
    }).eq("id", detalle.id);
    if (error) return showToast("Error registrando seguimiento: " + error.message, "error");
    setDetalle(d => ({ ...d, historial: nuevoHistorial, fase: callLog.resultado, proximaAccion: callLog.proximaAccion, fechaProxima: callLog.fechaProxima }));
    setCallLog({ resultado: "", nota: "", proximaAccion: "", fechaProxima: "" });
    setActiveTab("historial");
    showToast("Seguimiento registrado", "success");
    await onChange?.();
  };

  const buscarMatches = () => {
    const resultados = inmuebles
      .map(inm => {
        const r = calcularMatch(detalle, inm);
        return r ? { inmueble: inm, ...r } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    setMatchResults(resultados);
  };

  const guardarComoMatch = async (inmuebleId, score, criterios, estado) => {
    const { error } = await supabase.from("matches").upsert(
      { lead_id: detalle.id, inmueble_id: inmuebleId, score, criterios, estado },
      { onConflict: "lead_id,inmueble_id" }
    );
    if (error) return showToast("Error guardando match: " + error.message, "error");
    showToast("Match actualizado", "success");
    await onMatchChange?.();
  };

  const eliminarLead = async () => {
    const ok = await showConfirm(`¿Eliminar a ${detalle.nombre}?`, "Esta acción no se puede deshacer.");
    if (!ok) return;
    await supabase.from("leads").delete().eq("id", detalle.id);
    setDetalle(null);
    await onChange?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xl font-bold text-slate-800">Leads</div>
          <div className="text-sm text-slate-400">{leads.length} en total · {filtrados.length} visibles</div>
        </div>
        <Btn onClick={() => { setNuevo(emptyLead()); setShowNuevo(true); }}>+ Nuevo lead</Btn>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <button onClick={() => setFiltroFase("todos")}
          className={`p-3 rounded-xl border text-left ${filtroFase === "todos" ? "border-emerald-600 bg-emerald-50" : "border-slate-100 bg-white"}`}>
          <div className="text-xl font-bold text-slate-700">{leads.length}</div>
          <div className="text-[11px] text-slate-500">Todos</div>
        </button>
        {FASES_LEAD.map(f => {
          const count = leads.filter(l => l.fase === f.id).length;
          return (
            <button key={f.id} onClick={() => setFiltroFase(f.id === filtroFase ? "todos" : f.id)}
              className={`p-3 rounded-xl border text-left ${filtroFase === f.id ? "border-emerald-600 bg-emerald-50" : "border-slate-100 bg-white"}`}>
              <div className="text-xl font-bold text-slate-700">{count}</div>
              <div className="text-[11px] text-slate-500">{f.label}</div>
            </button>
          );
        })}
      </div>

      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o teléfono..."
          className="flex-1 min-w-[200px] border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        <select value={filtroAgente} onChange={e => setFiltroAgente(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
          <option value="todos">Todos los agentes</option>
          {agentes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] uppercase text-slate-400 font-semibold">
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Fase</th>
              <th className="px-4 py-3">Busca</th>
              <th className="px-4 py-3">Presupuesto</th>
              <th className="px-4 py-3">Agente</th>
              <th className="px-4 py-3">Próxima acción</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">Sin leads. Crea uno nuevo o ajusta los filtros.</td></tr>
            ) : filtrados.map(l => {
              const fase = FM_FASE[l.fase];
              const urgente = l.fechaProxima && new Date(l.fechaProxima) <= new Date();
              return (
                <tr key={l.id} onClick={() => abrirDetalle(l)} className="border-t border-slate-100 hover:bg-emerald-50/50 cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-700">{l.nombre}</div>
                    <div className="text-xs text-slate-400">{l.telefono}</div>
                  </td>
                  <td className="px-4 py-3"><Badge color={fase?.color}>{fase?.label}</Badge></td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {l.tipoOperacion || "—"}{l.tipoInmueble?.length ? ` · ${l.tipoInmueble.join(", ")}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {l.presupuestoMin || l.presupuestoMax ? `${fmt(l.presupuestoMin)} – ${fmt(l.presupuestoMax)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{agenteNombre(l.agenteId)}</td>
                  <td className="px-4 py-3">
                    {l.proximaAccion ? (
                      <div>
                        <div className="text-xs text-slate-600">{l.proximaAccion}</div>
                        {l.fechaProxima && <div className={`text-[11px] ${urgente ? "text-red-600 font-semibold" : "text-slate-400"}`}>{fmtDate(l.fechaProxima)}</div>}
                      </div>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Modal nuevo lead */}
      <Modal open={showNuevo} onClose={() => setShowNuevo(false)} title="Nuevo lead">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre *" className="col-span-2" value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))} />
          <Input label="Teléfono" value={nuevo.telefono} onChange={e => setNuevo(p => ({ ...p, telefono: e.target.value }))} />
          <Input label="Email" value={nuevo.email} onChange={e => setNuevo(p => ({ ...p, email: e.target.value }))} />
          <Select label="Fuente" options={FUENTES_LEAD} value={nuevo.fuente} onChange={e => setNuevo(p => ({ ...p, fuente: e.target.value }))} />
          <Select label="Urgencia" options={URGENCIAS} value={nuevo.urgencia} onChange={e => setNuevo(p => ({ ...p, urgencia: e.target.value }))} />
          <Select label="Busca (operación)" options={OPERACIONES_LEAD} value={nuevo.tipoOperacion} onChange={e => setNuevo(p => ({ ...p, tipoOperacion: e.target.value }))} />
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Tipo de inmueble</label>
            <PillSelect options={TIPOS_INMUEBLE} selected={nuevo.tipoInmueble} onChange={v => setNuevo(p => ({ ...p, tipoInmueble: v }))} />
          </div>
          <Input label="Presupuesto mín." type="number" value={nuevo.presupuestoMin} onChange={e => setNuevo(p => ({ ...p, presupuestoMin: e.target.value }))} />
          <Input label="Presupuesto máx." type="number" value={nuevo.presupuestoMax} onChange={e => setNuevo(p => ({ ...p, presupuestoMax: e.target.value }))} />
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Ciudades de interés</label>
            <TagInput value={nuevo.ciudadesInteres} onChange={v => setNuevo(p => ({ ...p, ciudadesInteres: v }))} placeholder="Escribe y presiona Enter..." />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Zonas/barrios de interés</label>
            <TagInput value={nuevo.zonasInteres} onChange={v => setNuevo(p => ({ ...p, zonasInteres: v }))} placeholder="Escribe y presiona Enter..." />
          </div>
          <Input label="Habitaciones mín." type="number" value={nuevo.habitacionesMin} onChange={e => setNuevo(p => ({ ...p, habitacionesMin: e.target.value }))} />
          <Input label="Baños mín." type="number" value={nuevo.banosMin} onChange={e => setNuevo(p => ({ ...p, banosMin: e.target.value }))} />
          <Input label="Área mín. (m²)" type="number" value={nuevo.areaMin} onChange={e => setNuevo(p => ({ ...p, areaMin: e.target.value }))} />
          <Input label="Área máx. (m²)" type="number" value={nuevo.areaMax} onChange={e => setNuevo(p => ({ ...p, areaMax: e.target.value }))} />
          <Textarea label="Notas" className="col-span-2" rows={3} value={nuevo.notas} onChange={e => setNuevo(p => ({ ...p, notas: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="secondary" onClick={() => setShowNuevo(false)}>Cancelar</Btn>
          <Btn onClick={crearLead} disabled={saving}>{saving ? "Guardando..." : "Crear lead"}</Btn>
        </div>
      </Modal>

      {/* Modal detalle */}
      <Modal open={!!detalle} onClose={() => setDetalle(null)} maxWidth="max-w-3xl"
        title={detalle?.nombre} subtitle={detalle && `${detalle.telefono || ""} · ${FM_FASE[detalle.fase]?.label}`}>
        {detalle && (
          <div>
            <div className="flex gap-1 border-b border-slate-100 mb-4">
              {[["perfil", "Perfil"], ["seguimiento", "Registrar seguimiento"], ["historial", `Historial (${detalle.historial?.length || 0})`], ["matches", "Matches"]].map(([t, l]) => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-3 py-2 text-sm font-semibold border-b-2 ${activeTab === t ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-400"}`}>
                  {l}
                </button>
              ))}
            </div>

            {activeTab === "perfil" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Nombre" defaultValue={detalle.nombre} onBlur={e => actualizarCampo(detalle.id, "nombre", e.target.value)} />
                  <Input label="Teléfono" defaultValue={detalle.telefono} onBlur={e => actualizarCampo(detalle.id, "telefono", e.target.value)} />
                  <Select label="Fase" options={FASES_LEAD} value={detalle.fase} onChange={e => { actualizarCampo(detalle.id, "fase", e.target.value); setDetalle(d => ({ ...d, fase: e.target.value })); }} />
                  <Select label="Agente" options={agentes.map(a => ({ id: a.id, label: a.nombre }))} value={detalle.agenteId || ""} onChange={e => { actualizarCampo(detalle.id, "agenteId", e.target.value); setDetalle(d => ({ ...d, agenteId: e.target.value })); }} />
                  <Select label="Urgencia" options={URGENCIAS} value={detalle.urgencia} onChange={e => { actualizarCampo(detalle.id, "urgencia", e.target.value); setDetalle(d => ({ ...d, urgencia: e.target.value })); }} />
                  <Select label="Operación buscada" options={OPERACIONES_LEAD} value={detalle.tipoOperacion || ""} onChange={e => { actualizarCampo(detalle.id, "tipoOperacion", e.target.value); setDetalle(d => ({ ...d, tipoOperacion: e.target.value })); }} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Tipo de inmueble buscado</label>
                  <PillSelect options={TIPOS_INMUEBLE} selected={detalle.tipoInmueble || []} onChange={v => { actualizarCampo(detalle.id, "tipoInmueble", v); setDetalle(d => ({ ...d, tipoInmueble: v })); }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Presupuesto mín." type="number" defaultValue={detalle.presupuestoMin} onBlur={e => actualizarCampo(detalle.id, "presupuestoMin", Number(e.target.value) || null)} />
                  <Input label="Presupuesto máx." type="number" defaultValue={detalle.presupuestoMax} onBlur={e => actualizarCampo(detalle.id, "presupuestoMax", Number(e.target.value) || null)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Ciudades de interés</label>
                  <TagInput value={detalle.ciudadesInteres || []} onChange={v => { actualizarCampo(detalle.id, "ciudadesInteres", v); setDetalle(d => ({ ...d, ciudadesInteres: v })); }} placeholder="Escribe y presiona Enter..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Zonas de interés</label>
                  <TagInput value={detalle.zonasInteres || []} onChange={v => { actualizarCampo(detalle.id, "zonasInteres", v); setDetalle(d => ({ ...d, zonasInteres: v })); }} placeholder="Escribe y presiona Enter..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Habitaciones mín." type="number" defaultValue={detalle.habitacionesMin} onBlur={e => actualizarCampo(detalle.id, "habitacionesMin", Number(e.target.value) || null)} />
                  <Input label="Área mín./máx. (m²)" type="text" placeholder="ej: 60-120" onBlur={e => {
                    const [min, max] = e.target.value.split("-").map(v => Number(v.trim()) || null);
                    actualizarCampo(detalle.id, "areaMin", min); actualizarCampo(detalle.id, "areaMax", max);
                  }} />
                </div>
                <Textarea label="Notas" rows={3} defaultValue={detalle.notas} onBlur={e => actualizarCampo(detalle.id, "notas", e.target.value)} />
                <Btn variant="danger" size="sm" onClick={eliminarLead}>Eliminar lead</Btn>
              </div>
            )}

            {activeTab === "seguimiento" && (
              <div className="space-y-3">
                <Select label="Resultado / nueva fase *" options={FASES_LEAD} value={callLog.resultado} onChange={e => setCallLog(p => ({ ...p, resultado: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Próxima acción" options={ACCIONES_SEGUIMIENTO} value={callLog.proximaAccion} onChange={e => setCallLog(p => ({ ...p, proximaAccion: e.target.value }))} />
                  <Input label="Fecha próximo contacto" type="date" value={callLog.fechaProxima} onChange={e => setCallLog(p => ({ ...p, fechaProxima: e.target.value }))} />
                </div>
                <Textarea label="Nota" rows={3} value={callLog.nota} onChange={e => setCallLog(p => ({ ...p, nota: e.target.value }))} placeholder="Qué se habló, qué pidió el cliente..." />
                <Btn onClick={registrarSeguimiento} disabled={!callLog.resultado} className="w-full justify-center">Guardar seguimiento</Btn>
              </div>
            )}

            {activeTab === "historial" && (
              <div className="space-y-2">
                {(!detalle.historial || detalle.historial.length === 0) && (
                  <div className="text-center text-slate-400 py-10 text-sm">Sin seguimientos registrados aún.</div>
                )}
                {(detalle.historial || []).map((h, i) => {
                  const f = FM_FASE[h.resultado];
                  return (
                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <Badge color={f?.color}>{f?.label || h.resultado}</Badge>
                        <span className="text-xs text-slate-400">{h.fecha} · {h.agente}</span>
                      </div>
                      {h.proximaAccion && <div className="text-xs text-slate-500">Acción: {h.proximaAccion}{h.fechaProxima ? ` · ${h.fechaProxima}` : ""}</div>}
                      {h.nota && <div className="text-sm text-slate-600 italic mt-1 border-l-2 border-slate-200 pl-2">"{h.nota}"</div>}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "matches" && (
              <div className="space-y-3">
                <Btn onClick={buscarMatches} size="sm"><Icon name="search" size={14} /> Buscar inmuebles que hagan match</Btn>
                {matchResults === null ? (
                  <div className="text-center text-slate-400 py-8 text-sm">Presiona el botón para calcular matches contra el inventario disponible.</div>
                ) : matchResults.length === 0 ? (
                  <div className="text-center text-slate-400 py-8 text-sm">No hay inmuebles disponibles que cumplan los filtros duros (operación/tipo) de este lead.</div>
                ) : (
                  <div className="space-y-2">
                    {matchResults.map(({ inmueble, score, criterios }) => (
                      <div key={inmueble.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex justify-between items-center gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-700 text-sm truncate">{inmueble.titulo}</div>
                          <div className="text-xs text-slate-400">{inmueble.ciudad}{inmueble.zona ? ` · ${inmueble.zona}` : ""} · {fmt(inmueble.precio)}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge color={score >= 70 ? "green" : score >= 40 ? "amber" : "slate"}>{score}%</Badge>
                          <Btn size="sm" variant="secondary" onClick={() => guardarComoMatch(inmueble.id, score, criterios, "enviado")}>Enviar</Btn>
                          <Btn size="sm" variant="ghost" onClick={() => guardarComoMatch(inmueble.id, score, criterios, "descartado")}>Descartar</Btn>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
