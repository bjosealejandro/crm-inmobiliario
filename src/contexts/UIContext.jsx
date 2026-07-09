import { createContext, useContext, useState, useCallback } from "react";

const UIContext = createContext();
export const useUI = () => useContext(UIContext);

const TOAST_COLORS = {
  success: "bg-green-600",
  error:   "bg-red-600",
  info:    "bg-emerald-700",
  warning: "bg-amber-500",
};

const ToastItem = ({ toast, onClose }) => (
  <div className={`flex items-start gap-3 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-lg pointer-events-auto max-w-sm ${TOAST_COLORS[toast.type] || TOAST_COLORS.info}`}>
    <span className="flex-1 leading-snug">{toast.message}</span>
    <button onClick={onClose} className="text-white/70 hover:text-white shrink-0 ml-2">✕</button>
  </div>
);

const ConfirmDialog = ({ message, detail, onResult }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4">
    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="p-5">
        <h3 className="font-bold text-slate-800 text-base leading-snug">{message}</h3>
        {detail && <p className="text-slate-500 text-sm mt-1.5">{detail}</p>}
      </div>
      <div className="px-5 pb-5 flex gap-3">
        <button
          onClick={() => onResult(false)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all">
          Cancelar
        </button>
        <button
          onClick={() => onResult(true)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all">
          Confirmar
        </button>
      </div>
    </div>
  </div>
);

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const showToast = useCallback((message, type = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const showConfirm = useCallback((message, detail) => {
    return new Promise(resolve => setConfirmState({ message, detail, resolve }));
  }, []);

  const handleConfirmResult = (result) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <UIContext.Provider value={{ showToast, showConfirm }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </div>
      {confirmState && (
        <ConfirmDialog message={confirmState.message} detail={confirmState.detail} onResult={handleConfirmResult} />
      )}
    </UIContext.Provider>
  );
}
