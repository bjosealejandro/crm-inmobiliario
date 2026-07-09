// Multi-select por pills, para arrays como tipo_inmueble / ciudades_interes
export const PillSelect = ({ options, selected = [], onChange }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map(o => {
      const id = typeof o === "string" ? o : o.id;
      const label = typeof o === "string" ? o : o.label;
      const active = selected.includes(id);
      return (
        <button
          type="button"
          key={id}
          onClick={() => onChange(active ? selected.filter(s => s !== id) : [...selected, id])}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            active ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
          }`}
        >
          {label}
        </button>
      );
    })}
  </div>
);

// Input de texto libre que arma un array de tags (ej. zonas/ciudades escritas a mano)
export const TagInput = ({ value = [], onChange, placeholder }) => {
  const addTag = (raw) => {
    const v = raw.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus-within:ring-2 focus-within:ring-emerald-400">
      {value.map(v => (
        <span key={v} className="flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full">
          {v}
          <button type="button" onClick={() => onChange(value.filter(x => x !== v))} className="text-emerald-500 hover:text-emerald-800">×</button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[80px] text-sm outline-none px-1 py-0.5"
        placeholder={value.length ? "" : placeholder}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(e.target.value); e.target.value = ""; }
          if (e.key === "Backspace" && !e.target.value && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={e => { if (e.target.value) { addTag(e.target.value); e.target.value = ""; } }}
      />
    </div>
  );
};
