export const Input = ({ label, className = "", ...props }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && (
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
    )}
    <input
      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white disabled:bg-slate-50 disabled:text-slate-400"
      {...props}
    />
  </div>
);
