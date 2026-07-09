import { FASES_LEAD, ESTADOS_INMUEBLE } from "../lib/constants";
import { Card, Badge } from "../components/ui";

const TEXT_COLOR = {
  emerald: "text-emerald-700", blue: "text-blue-700", violet: "text-violet-700", green: "text-green-700",
};
const BAR_COLOR = {
  blue: "bg-blue-500", amber: "bg-amber-500", violet: "bg-violet-500", orange: "bg-orange-500",
  green: "bg-green-500", red: "bg-red-500",
};

const StatCard = ({ label, value, sub, color = "emerald", onClick }) => (
  <Card className={`p-4 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}>
    <div onClick={onClick}>
      <div className={`text-3xl font-extrabold ${TEXT_COLOR[color] || TEXT_COLOR.emerald}`}>{value}</div>
      <div className="text-xs font-semibold text-slate-500 mt-1">{label}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  </Card>
);

export const Dashboard = ({ leads, inmuebles, matches, userName, onNav }) => {
  const leadsActivos = leads.filter(l => !["cerrado_ganado", "cerrado_perdido"].includes(l.fase));
  const inmueblesDisponibles = inmuebles.filter(i => i.estado === "disponible");
  const matchesPendientes = matches.filter(m => m.estado === "sugerido");
  const cerradosGanados = leads.filter(l => l.fase === "cerrado_ganado");

  const porFase = FASES_LEAD.map(f => ({ ...f, count: leads.filter(l => l.fase === f.id).length }));

  const alertasHoy = leads.filter(l => {
    if (!l.fechaProxima) return false;
    return new Date(l.fechaProxima) <= new Date();
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xl font-bold text-slate-800">Hola, {userName?.split(" ")[0] || "agente"} 👋</div>
        <div className="text-sm text-slate-400">Resumen general del CRM inmobiliario</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Leads activos" value={leadsActivos.length} onClick={() => onNav("leads")} />
        <StatCard label="Inmuebles disponibles" value={inmueblesDisponibles.length} color="blue" onClick={() => onNav("inmuebles")} />
        <StatCard label="Matches por revisar" value={matchesPendientes.length} color="violet" onClick={() => onNav("matches")} />
        <StatCard label="Cerrados ganados" value={cerradosGanados.length} color="green" />
      </div>

      {alertasHoy.length > 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="font-semibold text-amber-800 text-sm">
            🔔 {alertasHoy.length} lead{alertasHoy.length !== 1 ? "s" : ""} con seguimiento pendiente para hoy o antes
          </div>
          <button onClick={() => onNav("leads")} className="text-amber-700 text-xs font-semibold underline mt-1">Ver leads</button>
        </Card>
      )}

      <Card className="p-5">
        <div className="font-bold text-slate-700 mb-4">Leads por fase</div>
        <div className="space-y-3">
          {porFase.map(f => {
            const pct = leads.length > 0 ? Math.round((f.count / leads.length) * 100) : 0;
            return (
              <div key={f.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600">{f.label}</span>
                  <span className="text-slate-400">{f.count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${BAR_COLOR[f.color] || BAR_COLOR.blue}`} style={{ width: `${Math.max(pct, f.count > 0 ? 2 : 0)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <div className="font-bold text-slate-700 mb-3">Inventario por estado</div>
        <div className="flex flex-wrap gap-2">
          {ESTADOS_INMUEBLE.map(e => {
            const count = inmuebles.filter(i => i.estado === e.id).length;
            return <Badge key={e.id} color={e.color}>{e.label}: {count}</Badge>;
          })}
        </div>
      </Card>
    </div>
  );
};
