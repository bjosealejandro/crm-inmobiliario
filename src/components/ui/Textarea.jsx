export const Textarea = ({ label, className = "", ...props }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && (
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
    )}
    <textarea
      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white resize-y"
      {...props}
    />
  </div>
);
