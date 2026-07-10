import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FM_TIPO_INMUEBLE, FM_ESTADO_INMUEBLE } from "../lib/constants";
import { fmt, fmtArea, mapInmueble } from "../lib/helpers";
import { Carousel, Spinner, MapEmbed } from "../components/ui";

export const PropertyPublicView = () => {
  const { id } = useParams();
  const [inmueble, setInmueble] = useState(null);
  const [agente, setAgente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("inmuebles").select("*").eq("id", id).maybeSingle();
      if (!data) { setNotFound(true); setLoading(false); return; }
      const inm = mapInmueble(data);
      setInmueble(inm);
      if (inm.agenteId) {
        const { data: ag } = await supabase.from("agentes").select("nombre, telefono").eq("id", inm.agenteId).maybeSingle();
        if (ag) setAgente(ag);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">
      Este inmueble ya no está disponible o el link no es válido.
    </div>
  );

  const whatsappHref = agente?.telefono
    ? `https://wa.me/${agente.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, me interesa el inmueble "${inmueble.titulo}" (${window.location.href})`)}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Carousel imagenes={inmueble.imagenes} className="w-full h-72 sm:h-96" />
      <div className="max-w-2xl mx-auto p-5 sm:p-8 -mt-8 relative">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-xl font-bold text-slate-800">{inmueble.titulo}</h1>
            <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {FM_ESTADO_INMUEBLE[inmueble.estado]?.label}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mb-1">{fmt(inmueble.precio)}</div>
          <div className="text-sm text-slate-400 mb-4">
            {inmueble.operacion === "venta" ? "Venta" : "Arriendo"} · {FM_TIPO_INMUEBLE[inmueble.tipo]?.label} · {inmueble.ciudad}{inmueble.zona ? ` · ${inmueble.zona}` : ""}
          </div>

          <div className="grid grid-cols-3 gap-3 text-center mb-3">
            <div className="bg-slate-50 rounded-lg py-3">
              <div className="text-lg font-bold text-slate-700">{inmueble.habitaciones ?? "—"}</div>
              <div className="text-[11px] text-slate-400 uppercase">Habitaciones</div>
            </div>
            <div className="bg-slate-50 rounded-lg py-3">
              <div className="text-lg font-bold text-slate-700">{inmueble.banos ?? "—"}</div>
              <div className="text-[11px] text-slate-400 uppercase">Baños</div>
            </div>
            <div className="bg-slate-50 rounded-lg py-3">
              <div className="text-lg font-bold text-slate-700">{fmtArea(inmueble.area)}</div>
              <div className="text-[11px] text-slate-400 uppercase">Área</div>
            </div>
          </div>

          {(inmueble.pisos || inmueble.antiguedadAnios || inmueble.materialPiso || inmueble.estrato) && (
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-5">
              {inmueble.pisos && <div><span className="text-slate-400">Pisos:</span> {inmueble.pisos}</div>}
              {inmueble.antiguedadAnios != null && <div><span className="text-slate-400">Antigüedad:</span> {inmueble.antiguedadAnios} años</div>}
              {inmueble.materialPiso && <div><span className="text-slate-400">Piso:</span> {inmueble.materialPiso}</div>}
              {inmueble.estrato && <div><span className="text-slate-400">Estrato:</span> {inmueble.estrato}</div>}
            </div>
          )}

          {inmueble.descripcion && (
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line mb-5">{inmueble.descripcion}</p>
          )}

          {(inmueble.direccion || inmueble.zona) && (
            <div className="mb-5">
              <div className="text-xs text-slate-400 uppercase font-semibold mb-2">Ubicación</div>
              <div className="text-sm text-slate-600 mb-2">{inmueble.direccion}{inmueble.zona ? `, ${inmueble.zona}` : ""}, {inmueble.ciudad}</div>
              <MapEmbed direccion={inmueble.direccion} zona={inmueble.zona} ciudad={inmueble.ciudad} className="w-full h-56 rounded-xl" />
            </div>
          )}

          {agente && (
            <div className="border-t border-slate-100 pt-4">
              <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Contacto</div>
              <div className="font-semibold text-slate-700 mb-3">{agente.nombre}</div>
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl w-full justify-center">
                  Escribir por WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
