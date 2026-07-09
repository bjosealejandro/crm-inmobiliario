export const Select = ({ label, options = [], value, onChange, placeholder, className = "" }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && (
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
    )}
    <select
      value={value ?? ""}
      onChange={onChange}
      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
    >
      <option value="">{placeholder || "— Seleccionar —"}</option>
      {options.map(o => {
        const id = typeof o === "string" ? o : o.id;
        const lbl = typeof o === "string" ? o : o.label;
        return <option key={id} value={id}>{lbl}</option>;
      })}
    </select>
  </div>
);
