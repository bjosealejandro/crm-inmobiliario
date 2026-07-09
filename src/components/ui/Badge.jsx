const COLORS = {
  blue:   "bg-blue-100 text-blue-800",
  green:  "bg-green-100 text-green-800",
  red:    "bg-red-100 text-red-800",
  amber:  "bg-amber-100 text-amber-800",
  violet: "bg-violet-100 text-violet-800",
  orange: "bg-orange-100 text-orange-800",
  slate:  "bg-slate-100 text-slate-700",
  emerald:"bg-emerald-100 text-emerald-800",
};

export const Badge = ({ children, color = "blue" }) => (
  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${COLORS[color] || COLORS.blue}`}>
    {children}
  </span>
);
