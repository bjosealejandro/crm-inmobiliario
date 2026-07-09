import { useState } from "react";
import { supabase } from "../lib/supabase";
import { COMPANY } from "../lib/constants";
import { Card, Input, Btn } from "../components/ui";

export const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !clave) return setError("Ingresa tu correo y contraseña");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password: clave });
    if (err) { setError("Correo o contraseña incorrectos"); setLoading(false); return; }
    onLogin();
  };

  return (
    <div className="min-h-screen bg-emerald-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-emerald-800 text-2xl font-black mb-4">
            🏠
          </div>
          <h1 className="text-white text-xl font-bold text-center">{COMPANY.name}</h1>
        </div>
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 text-center">Iniciar sesión</h2>
          <Input label="Correo" type="email" value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            autoCapitalize="none" autoFocus />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white pr-10"
                value={clave}
                onChange={e => { setClave(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()} />
              <button type="button" className="absolute right-3 top-2.5 text-slate-400 text-xs"
                onClick={() => setShowPass(!showPass)}>
                {showPass ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <Btn onClick={handleLogin} className="w-full" size="lg" disabled={loading}>
            {loading ? "Verificando..." : "Entrar"}
          </Btn>
        </Card>
      </div>
    </div>
  );
};
