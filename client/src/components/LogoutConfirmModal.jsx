import { LogOut, X } from 'lucide-react';
import { playClick } from '../lib/sounds';

export default function LogoutConfirmModal({ open, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in p-6" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut size={24} className="text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Log Out</h3>
          <p className="text-sm text-slate-500 mt-2">Are you sure you want to log out?</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => { playClick(); onClose(); }}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => { playClick(); onConfirm(); }}
            className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 transition-colors flex items-center justify-center gap-2">
            <LogOut size={15} /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
