import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import { COMPANY, ROL_ADMIN, ROL_AGENTE } from "./lib/constants";
import { mapAgente, mapLead, mapInmueble, mapMatch } from "./lib/helpers";
import { UIProvider } from "./contexts/UIContext";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Leads } from "./pages/Leads";
import { Inmuebles } from "./pages/Inmuebles";
import { Matches } from "./pages/Matches";
import { Agentes } from "./pages/Agentes";
import { Configuracion } from "./pages/Configuracion";
import { Spinner, Icon } from "./components/ui";

const NAV = [
  { id: "dashboard",  label: "Dashboard",     icon: "dashboard", roles: [ROL_ADMIN, ROL_AGENTE] },
  { id: "leads",      label: "Leads",         icon: "user",      roles: [ROL_ADMIN, ROL_AGENTE] },
  { id: "inmuebles",  label: "Inmuebles",     icon: "home",      roles: [ROL_ADMIN, ROL_AGENTE] },
  { id: "matches",    label: "Matches",       icon: "link",      roles: [ROL_ADMIN, ROL_AGENTE] },
  { id: "agentes",    label: "Agentes",       icon: "users",     roles: [ROL_ADMIN] },
  { id: "config",     label: "Configuración", icon: "settings",  roles: [ROL_ADMIN] },
];

function AppShell() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRol, setUserRol] = useState(ROL_AGENTE);
  const [agenteActualId, setAgenteActualId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const [agentes, setAgentes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [inmuebles, setInmuebles] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const resolverRol = async (email) => {
    const { data } = await supabase.from("agentes").select("id, nombre, rol").eq("email", email).maybeSingle();
    if (data) {
      setUserName(data.nombre); setUserRol(data.rol || ROL_AGENTE); setAgenteActualId(data.id);
    } else {
      setUserName(email); setUserRol(ROL_AGENTE); setAgenteActualId(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) { await resolverRol(session.user.email); setLoggedIn(true); }
      setCheckingSession(false);
    });
  }, []);

  // Refresco directo tras cada mutación (create/update/delete) en vez de depender
  // de Realtime — más simple y confiable; cada página llama a la sección que le
  // interesa refrescar después de escribir en Supabase.
  const refrescarAgentes = useCallback(async () => {
    const { data } = await supabase.from("agentes").select("*").order("nombre");
    if (data) setAgentes(data.map(mapAgente));
  }, []);
  const refrescarLeads = useCallback(async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (data) setLeads(data.map(mapLead));
  }, []);
  const refrescarInmuebles = useCallback(async () => {
    const { data } = await supabase.from("inmuebles").select("*").order("created_at", { ascending: false });
    if (data) setInmuebles(data.map(mapInmueble));
  }, []);
  const refrescarMatches = useCallback(async () => {
    const { data } = await supabase.from("matches").select("*").order("score", { ascending: false });
    if (data) setMatches(data.map(mapMatch));
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    (async () => {
      setLoading(true);
      await Promise.all([refrescarAgentes(), refrescarLeads(), refrescarInmuebles(), refrescarMatches()]);
      setLoading(false);
    })();
  }, [loggedIn, refrescarAgentes, refrescarLeads, refrescarInmuebles, refrescarMatches]);

  const handleLogin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await resolverRol(session.user.email);
    setLoggedIn(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setAgentes([]); setLeads([]); setInmuebles([]); setMatches([]);
    setUserRol(ROL_AGENTE); setAgenteActualId(null); setPage("dashboard");
  };

  if (checkingSession) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!loggedIn) return <Login onLogin={handleLogin} />;

  const navVisible = NAV.filter(n => n.roles.includes(userRol));

  const renderPage = () => {
    if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
    switch (page) {
      case "dashboard":  return <Dashboard leads={leads} inmuebles={inmuebles} matches={matches} userName={userName} onNav={setPage} />;
      case "leads":      return <Leads leads={leads} inmuebles={inmuebles} matches={matches} agentes={agentes} agenteActualId={agenteActualId} onChange={refrescarLeads} onMatchChange={refrescarMatches} />;
      case "inmuebles":  return <Inmuebles inmuebles={inmuebles} agentes={agentes} agenteActualId={agenteActualId} onChange={refrescarInmuebles} />;
      case "matches":    return <Matches leads={leads} inmuebles={inmuebles} matches={matches} onChange={refrescarMatches} />;
      case "agentes":    return userRol === ROL_ADMIN ? <Agentes agentes={agentes} onChange={refrescarAgentes} /> : null;
      case "config":     return userRol === ROL_ADMIN ? <Configuracion /> : null;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-[299]" />
      )}
      <div className={`bg-emerald-950 text-white flex flex-col ${isMobile ? "fixed top-0 left-0 h-screen z-[300] w-60 transition-transform duration-200" : "w-60 shrink-0"} ${isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"}`}>
        <div className="px-5 py-5 border-b border-emerald-900/60">
          <div className="font-bold text-base">{COMPANY.name}</div>
        </div>
        <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navVisible.map(n => (
            <button key={n.id} onClick={() => { setPage(n.id); if (isMobile) setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${page === n.id ? "bg-emerald-800 text-white" : "text-emerald-100/80 hover:bg-emerald-900"}`}>
              <Icon name={n.icon} size={16} />{n.label}
            </button>
          ))}
        </div>
        <div className="px-3 py-3 border-t border-emerald-900/60">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
              {(userName || "U").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate">{userName}</div>
              <div className="text-[10px] text-emerald-300 uppercase">{userRol}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-emerald-200 hover:bg-emerald-900">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0">
          {isMobile && (
            <button onClick={() => setSidebarOpen(o => !o)} className="text-emerald-800 p-1"><Icon name="menu" size={20} /></button>
          )}
          <div className="font-semibold text-slate-700 text-sm capitalize">{NAV.find(n => n.id === page)?.label}</div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{renderPage()}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <UIProvider>
      <AppShell />
    </UIProvider>
  );
}
