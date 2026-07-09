import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useUI } from "../contexts/UIContext";
import { ROL_ADMIN, ROL_AGENTE } from "../lib/constants";
import { Card, Badge, Btn, Input, Select, Modal, Toggle } from "../components/ui";

const emptyAgente = () => ({ nombre: "", email: "", password: "", telefono: "", rol: ROL_AGENTE });

export const Agentes = ({ agentes, onChange }) => {
  const { showToast, showConfirm } = useUI();
  const [showNuevo, setShowNuevo] = useState(false);
  const [nuevo, setNuevo] = useState(emptyAgente());
  const [saving, setSaving] = useState(false);

  const crearAgente = async () => {
    if (!nuevo.nombre.trim() || !nuevo.email.trim() || nuevo.password.length < 6) {
      return showToast("Nombre, email y una contraseña de al menos 6 caracteres son obligatorios", "error");
    }
    setSaving(true);
    try {
      const res = await fetch("/api/agentes", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nuevo),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error desconocido");
      showToast(`Agente ${nuevo.nombre} creado`, "success");
      setShowNuevo(false); setNuevo(emptyAgente());
      await onChange?.();
    } catch (err) {
      showToast("Error creando agente: " + err.message, "error");
    }
    setSaving(false);
  };

  const toggleActivo = async (a) => {
    await supabase.from("agentes").update({ activo: !a.activo }).eq("id", a.id);
    await onChange?.();
  };

  const cambiarRol = async (a, rol) => {
    await supabase.from("agentes").update({ rol }).eq("id", a.id);
    await onChange?.();
  };

  const eliminarAgente = async (a) => {
    const ok = await showConfirm(`¿Eliminar a ${a.nombre}?`, "Se eliminará también su acceso al sistema.");
    if (!ok) return;
    try {
      const res = await fetch(`/api/agentes?id=${a.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast("Agente eliminado", "success");
      await onChange?.();
    } catch (err) {
      showToast("Error eliminando: " + err.message, "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xl font-bold text-slate-800">Agentes</div>
          <div className="text-sm text-slate-400">{agentes.length} cuentas registradas</div>
        </div>
        <Btn onClick={() => { setNuevo(emptyAgente()); setShowNuevo(true); }}>+ Nuevo agente</Btn>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] uppercase text-slate-400 font-semibold">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Activo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {agentes.map(a => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold text-slate-700">{a.nombre}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{a.email}</td>
                <td className="px-4 py-3">
                  <select value={a.rol} onChange={e => cambiarRol(a, e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1 text-xs">
                    <option value={ROL_AGENTE}>Agente</option>
                    <option value={ROL_ADMIN}>Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3"><Toggle activo={a.activo} onChange={() => toggleActivo(a)} /></td>
                <td className="px-4 py-3 text-right">
                  <Btn size="sm" variant="danger" onClick={() => eliminarAgente(a)}>Eliminar</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={showNuevo} onClose={() => setShowNuevo(false)} title="Nuevo agente">
        <div className="space-y-3">
          <Input label="Nombre *" value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))} />
          <Input label="Correo *" type="email" value={nuevo.email} onChange={e => setNuevo(p => ({ ...p, email: e.target.value }))} />
          <Input label="Contraseña temporal *" type="text" value={nuevo.password} onChange={e => setNuevo(p => ({ ...p, password: e.target.value }))} placeholder="mín. 6 caracteres" />
          <Input label="Teléfono" value={nuevo.telefono} onChange={e => setNuevo(p => ({ ...p, telefono: e.target.value }))} />
          <Select label="Rol" options={[{ id: ROL_AGENTE, label: "Agente" }, { id: ROL_ADMIN, label: "Admin" }]} value={nuevo.rol} onChange={e => setNuevo(p => ({ ...p, rol: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="secondary" onClick={() => setShowNuevo(false)}>Cancelar</Btn>
          <Btn onClick={crearAgente} disabled={saving}>{saving ? "Creando..." : "Crear agente"}</Btn>
        </div>
      </Modal>
    </div>
  );
};
