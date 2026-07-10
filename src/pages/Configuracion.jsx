import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useUI } from "../contexts/UIContext";
import { Card, Badge, Textarea, Btn, Toggle } from "../components/ui";

const ESTADO_COLOR = { pendiente: "amber", activa: "green", inactiva: "slate" };

export const Configuracion = () => {
  const { showToast } = useUI();
  const [fuentes, setFuentes] = useState([]);
  const [editando, setEditando] = useState(null);
  const [notaTmp, setNotaTmp] = useState("");
  const [inmuebles, setInmuebles] = useState([]);

  const cargarInmuebles = () =>
    supabase.from("inmuebles").select("*").order("titulo").then(({ data }) => { if (data) setInmuebles(data); });

  useEffect(() => {
    supabase.from("fuentes_externas").select("*").order("nombre").then(({ data }) => { if (data) setFuentes(data); });
    cargarInmuebles();
  }, []);

  const cambiarEstado = async (f, estado) => {
    await supabase.from("fuentes_externas").update({ estado }).eq("id", f.id);
    setFuentes(prev => prev.map(x => x.id === f.id ? { ...x, estado } : x));
  };

  const guardarNota = async (f) => {
    await supabase.from("fuentes_externas").update({ notas: notaTmp }).eq("id", f.id);
    setFuentes(prev => prev.map(x => x.id === f.id ? { ...x, notas: notaTmp } : x));
    setEditando(null);
    showToast("Nota guardada", "success");
  };

  const toggleActivo = async (inm) => {
    const activo = inm.estado !== "inactivo";
    const nuevoEstado = activo ? "inactivo" : "disponible";
    await supabase.from("inmuebles").update({ estado: nuevoEstado }).eq("id", inm.id);
    setInmuebles(prev => prev.map(x => x.id === inm.id ? { ...x, estado: nuevoEstado } : x));
  };

  const redesDe = (inm) => [
    inm.instagram_url && "Instagram",
    inm.facebook_url && "Facebook",
    inm.fincaraiz_url && "Fincaraíz",
    inm.metrocuadrado_url && "Metrocuadrado",
    (inm.habi_url || inm.habi_id) && "Habi",
  ].filter(Boolean);

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <div className="text-xl font-bold text-slate-800">Configuración</div>
        <div className="text-sm text-slate-400">Fuentes externas de inventario (APIs de portales inmobiliarios)</div>
      </div>

      {fuentes.map(f => (
        <Card key={f.id} className="p-4">
          <div className="flex justify-between items-start gap-3 mb-2">
            <div className="font-bold text-slate-800">{f.nombre}</div>
            <select value={f.estado} onChange={e => cambiarEstado(f, e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1 text-xs">
              <option value="pendiente">Pendiente</option>
              <option value="activa">Activa</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </div>
          <Badge color={ESTADO_COLOR[f.estado]}>{f.estado}</Badge>
          {editando === f.id ? (
            <div className="mt-3 space-y-2">
              <Textarea rows={3} value={notaTmp} onChange={e => setNotaTmp(e.target.value)} />
              <div className="flex gap-2">
                <Btn size="sm" onClick={() => guardarNota(f)}>Guardar</Btn>
                <Btn size="sm" variant="secondary" onClick={() => setEditando(null)}>Cancelar</Btn>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-600 leading-relaxed">
              {f.notas}
              <button onClick={() => { setEditando(f.id); setNotaTmp(f.notas || ""); }} className="block text-emerald-700 text-xs font-semibold mt-1">
                Editar nota
              </button>
            </div>
          )}
        </Card>
      ))}

      <Card className="p-4 bg-slate-50">
        <div className="font-semibold text-slate-700 text-sm mb-1">¿Cómo cargar inventario mientras no hay API?</div>
        <div className="text-sm text-slate-500">Usa el botón "Importar" en la página de Inmuebles para cargar un Excel/CSV con el inventario. Cuando tengas acceso de partner/API de una fuente, avísame para construir el conector automático.</div>
      </Card>

      <div className="pt-4">
        <div className="text-lg font-bold text-slate-800">Inmuebles publicados</div>
        <div className="text-sm text-slate-400 mb-3">Apaga un inmueble para que deje de verse en el visor público, sin borrarlo.</div>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[11px] uppercase text-slate-400 font-semibold">
                <th className="px-4 py-3">Inmueble</th>
                <th className="px-4 py-3">Redes/portales</th>
                <th className="px-4 py-3">Activo</th>
              </tr>
            </thead>
            <tbody>
              {inmuebles.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-8 text-slate-400">Sin inmuebles todavía.</td></tr>
              ) : inmuebles.map(inm => (
                <tr key={inm.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-700">{inm.titulo}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {redesDe(inm).length === 0 ? <span className="text-slate-300 text-xs">—</span> :
                        redesDe(inm).map(r => <Badge key={r} color="slate">{r}</Badge>)}
                    </div>
                  </td>
                  <td className="px-4 py-3"><Toggle activo={inm.estado !== "inactivo"} onChange={() => toggleActivo(inm)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};
