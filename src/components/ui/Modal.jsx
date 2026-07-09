export const Modal = ({ open, onClose, title, subtitle, maxWidth = "max-w-2xl", children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl w-full ${maxWidth} max-h-[92vh] overflow-y-auto shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between px-6 pt-5 pb-3">
            <div>
              {title && <div className="font-bold text-lg text-slate-800">{title}</div>}
              {subtitle && <div className="text-sm text-slate-400 mt-0.5">{subtitle}</div>}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none px-1">×</button>
          </div>
        )}
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
};
