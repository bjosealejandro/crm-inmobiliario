export const Card = ({ children, className = "", ...rest }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`} {...rest}>
    {children}
  </div>
);
