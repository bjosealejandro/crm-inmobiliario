export const Btn = ({ children, onClick, variant = "primary", size = "md", disabled = false, className = "", type = "button" }) => {
  const v = {
    primary:   "bg-emerald-700 hover:bg-emerald-800 text-white",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700",
    danger:    "bg-red-500 hover:bg-red-600 text-white",
    ghost:     "hover:bg-slate-100 text-slate-600",
    success:   "bg-green-600 hover:bg-green-700 text-white",
  };
  const s = { md: "px-4 py-2 text-sm", sm: "px-3 py-1.5 text-xs", lg: "px-6 py-3 text-base" };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-all ${v[variant]} ${s[size]} disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};
