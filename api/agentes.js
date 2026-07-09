import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wfcxeudmruyxirooqwsh.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "POST") {
    const { nombre, email, password, rol, telefono } = req.body;
    if (!nombre || !email || !password) return res.status(400).json({ error: "nombre, email y password son requeridos" });

    const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (userErr) return res.status(500).json({ error: userErr.message });

    const { data, error } = await supabase.from("agentes").insert({
      user_id: userData.user.id, nombre, email, telefono: telefono || null, rol: rol || "agente", activo: true,
    }).select().single();
    if (error) {
      await supabase.auth.admin.deleteUser(userData.user.id);
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id requerido" });
    const { data: agente } = await supabase.from("agentes").select("user_id").eq("id", id).maybeSingle();
    const { error } = await supabase.from("agentes").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    if (agente?.user_id) await supabase.auth.admin.deleteUser(agente.user_id);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Método no permitido" });
}
