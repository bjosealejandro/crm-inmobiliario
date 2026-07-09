import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useUI } from "../contexts/UIContext";
import { Card, Badge, Textarea, Btn } from "../components/ui";

const ESTADO_COLOR = { pendiente: "amber", activa: "green", inactiva: "slate" };

export const Configuracion = () => {
  const { showToast } = useUI();
  const [fuentes, setFuentes] = useState([]);
  const [editando, setEditando] = useState(null);
  const [notaTmp, setNotaTmp] = useState("");

  useEffect(() => {
    supabase.from("fuentes_externas").select("*").order("nombre").then(({ data }) => { if (data) setFuentes(data); });
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
    </div>
  );
};
