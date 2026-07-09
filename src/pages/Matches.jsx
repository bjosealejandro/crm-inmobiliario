import { useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useUI } from "../contexts/UIContext";
import { ESTADOS_MATCH, FM_ESTADO_MATCH } from "../lib/constants";
import { fmt } from "../lib/helpers";
import { Card, Badge, Btn } from "../components/ui";

export const Matches = ({ leads, inmuebles, matches, onChange }) => {
  const { showToast } = useUI();
  const [filtroEstado, setFiltroEstado] = useState("sugerido");

  const enriquecidos = useMemo(() => matches
    .map(m => ({ ...m, lead: leads.find(l => l.id === m.leadId), inmueble: inmuebles.find(i => i.id === m.inmuebleId) }))
    .filter(m => m.lead && m.inmueble)
    .filter(m => filtroEstado === "todos" || m.estado === filtroEstado)
    .sort((a, b) => b.score - a.score),
    [matches, leads, inmuebles, filtroEstado]);

  const cambiarEstado = async (id, estado) => {
    const { error } = await supabase.from("matches").update({ estado }).eq("id", id);
    if (error) return showToast("Error: " + error.message, "error");
    showToast("Match actualizado", "success");
    await onChange?.();
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-bold text-slate-800">Matches</div>
        <div className="text-sm text-slate-400">Cola de trabajo: coincidencias entre leads e inventario</div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFiltroEstado("todos")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${filtroEstado === "todos" ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-slate-600 border-slate-200"}`}>
          Todos ({matches.length})
        </button>
        {ESTADOS_MATCH.map(e => {
          const count = matches.filter(m => m.estado === e.id).length;
          return (
            <button key={e.id} onClick={() => setFiltroEstado(e.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${filtroEstado === e.id ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-slate-600 border-slate-200"}`}>
              {e.label} ({count})
            </button>
          );
        })}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] uppercase text-slate-400 font-semibold">
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Inmueble</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {enriquecidos.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-400">
                Sin matches en este filtro. Ve a un lead y usa "Buscar matches" en su ficha.
              </td></tr>
            ) : enriquecidos.map(m => (
              <tr key={m.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-700">{m.lead.nombre}</div>
                  <div className="text-xs text-slate-400">{m.lead.telefono}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-700">{m.inmueble.titulo}</div>
                  <div className="text-xs text-slate-400">{fmt(m.inmueble.precio)} · {m.inmueble.ciudad}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge color={m.score >= 70 ? "green" : m.score >= 40 ? "amber" : "slate"}>{m.score}%</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge color={FM_ESTADO_MATCH[m.estado]?.color}>{FM_ESTADO_MATCH[m.estado]?.label}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {m.estado !== "visitado" && <Btn size="sm" variant="secondary" onClick={() => cambiarEstado(m.id, "visitado")}>Visitado</Btn>}
                    {m.estado !== "interesado" && <Btn size="sm" variant="success" onClick={() => cambiarEstado(m.id, "interesado")}>Interesado</Btn>}
                    {m.estado !== "descartado" && <Btn size="sm" variant="ghost" onClick={() => cambiarEstado(m.id, "descartado")}>Descartar</Btn>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
