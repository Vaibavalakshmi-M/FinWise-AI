import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  const bgStyles = {
    success: 'bg-emerald-900/90 border-emerald-600 text-emerald-100',
    error: 'bg-rose-900/90 border-rose-600 text-rose-100',
    info: 'bg-slate-900/90 border-slate-700 text-slate-100',
  }[type] || 'bg-slate-900/90 border-slate-700 text-slate-100';

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[type] || Info;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-md">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${bgStyles}`}>
        <Icon className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-auto p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
