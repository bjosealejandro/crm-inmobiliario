import { useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

export const VideoUploader = ({ videos = [], onChange }) => {
  const [subiendo, setSubiendo] = useState(false);
  const fileRef = useRef();

  const subirArchivos = async (files) => {
    setSubiendo(true);
    const nuevos = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("inmuebles-fotos").upload(path, file);
      if (error) { console.error("Error subiendo video:", error.message); continue; }
      const { data } = supabase.storage.from("inmuebles-fotos").getPublicUrl(path);
      nuevos.push(data.publicUrl);
    }
    onChange([...videos, ...nuevos]);
    setSubiendo(false);
  };

  const eliminar = (url) => onChange(videos.filter(u => u !== url));

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
        {videos.map(url => (
          <div key={url} className="relative rounded-lg overflow-hidden border border-slate-200 group">
            <video src={url} className="w-full h-24 object-cover" muted />
            <button type="button" onClick={() => eliminar(url)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              ×
            </button>
          </div>
        ))}
        <button type="button" onClick={() => fileRef.current.click()} disabled={subiendo}
          className="h-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-emerald-400 hover:text-emerald-600 text-xs font-semibold">
          {subiendo ? "Subiendo..." : "+ Video"}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="video/*" multiple className="hidden"
        onChange={e => { if (e.target.files.length) subirArchivos([...e.target.files]); e.target.value = ""; }} />
    </div>
  );
};
