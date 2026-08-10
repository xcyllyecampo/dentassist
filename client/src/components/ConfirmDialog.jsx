import { AlertTriangle, X } from 'lucide-react';
import { playClick } from '../lib/sounds';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, loading = false, icon: Icon = AlertTriangle }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4" onClick={() => { if (!loading) { playClick(); onClose(); } }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-end -mb-2">
          <button onClick={() => { playClick(); onClose(); }} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="text-center -mt-2">
          <div className={`w-14 h-14 ${danger ? 'bg-rose-100' : 'bg-teal-50'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon size={24} className={danger ? 'text-rose-500' : 'text-[#0F766E]'} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          {message && <p className="text-sm text-slate-500 mt-2 leading-relaxed">{message}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => { playClick(); onClose(); }} disabled={loading}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
            {cancelLabel}
          </button>
          <button onClick={() => { playClick(); onConfirm(); }} disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
              danger ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-[#0F766E] text-white hover:bg-[#0D6D65]'
            }`}>
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
