import { useState } from "react";

export const Carousel = ({ imagenes = [], className = "" }) => {
  const [idx, setIdx] = useState(0);
  if (!imagenes.length) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center text-slate-300 text-5xl ${className}`}>
        🏠
      </div>
    );
  }
  const prev = () => setIdx(i => (i - 1 + imagenes.length) % imagenes.length);
  const next = () => setIdx(i => (i + 1) % imagenes.length);
  return (
    <div className={`relative bg-slate-100 ${className}`}>
      <img src={imagenes[idx]} alt="" className="w-full h-full object-cover" />
      {imagenes.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60">‹</button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60">›</button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imagenes.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
