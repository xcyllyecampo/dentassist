import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { playSuccess, playError, playNotification } from '../lib/sounds';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    if (type === 'success') playSuccess();
    else if (type === 'error') playError();
    else playNotification();
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration || 6000),
    info: (msg, duration) => addToast(msg, 'info', duration),
  };

  const icons = {
    success: <CheckCircle size={18} className="text-emerald-500 shrink-0" />,
    error: <AlertTriangle size={18} className="text-rose-500 shrink-0" />,
    info: <Info size={18} className="text-[#1a5fb4] shrink-0" />,
  };

  const styles = {
    success: 'bg-emerald-50 border-emerald-200/60 text-emerald-800',
    error: 'bg-rose-50 border-rose-200/60 text-rose-800',
    info: 'bg-[#f0f5ff] border-[#c2d5f7]/60 text-[#002d6b]',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto animate-slide-in backdrop-blur-sm ${styles[t.type]}`}>
            {icons[t.type]}
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="p-0.5 hover:opacity-70 shrink-0">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
