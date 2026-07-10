import { useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

export const ImageUploader = ({ imagenes = [], onChange }) => {
  const [subiendo, setSubiendo] = useState(false);
  const fileRef = useRef();

  const subirArchivos = async (files) => {
    setSubiendo(true);
    const nuevas = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("inmuebles-fotos").upload(path, file);
      if (error) { console.error("Error subiendo foto:", error.message); continue; }
      const { data } = supabase.storage.from("inmuebles-fotos").getPublicUrl(path);
      nuevas.push(data.publicUrl);
    }
    onChange([...imagenes, ...nuevas]);
    setSubiendo(false);
  };

  const eliminar = (url) => onChange(imagenes.filter(u => u !== url));

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
        {imagenes.map(url => (
          <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => eliminar(url)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              ×
            </button>
          </div>
        ))}
        <button type="button" onClick={() => fileRef.current.click()} disabled={subiendo}
          className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-emerald-400 hover:text-emerald-600 text-xs font-semibold">
          {subiendo ? "Subiendo..." : "+ Foto"}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { if (e.target.files.length) subirArchivos([...e.target.files]); e.target.value = ""; }} />
    </div>
  );
};
