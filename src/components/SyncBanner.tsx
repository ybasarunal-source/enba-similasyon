import React from 'react';
import { CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import type { SyncStatus } from '../hooks/usePlanSync';

interface Props {
  status: SyncStatus;
  error: string;
  onRetry?: () => void;
}

export const SyncBanner: React.FC<Props> = ({ status, error, onRetry }) => {
  if (status === 'idle') return null;

  const configs = {
    syncing: {
      bg: 'bg-blue-50 border-blue-100',
      text: 'text-blue-600',
      icon: <Loader2 size={14} className="animate-spin" />,
      msg: 'Supabase\'e kaydediliyor...',
    },
    synced: {
      bg: 'bg-emerald-50 border-emerald-100',
      text: 'text-emerald-600',
      icon: <CheckCircle size={14} />,
      msg: 'Buluta kaydedildi',
    },
    error: {
      bg: 'bg-red-50 border-red-100',
      text: 'text-red-600',
      icon: <AlertCircle size={14} />,
      msg: error || 'Supabase bağlantısı başarısız — veriler tarayıcıda saklandı',
    },
  };

  const c = configs[status];

  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-[11px] font-semibold ${c.bg} ${c.text} mb-4`}>
      {c.icon}
      <span className="flex-1">{c.msg}</span>
      {status === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 underline underline-offset-2 hover:opacity-70 transition-opacity"
        >
          <RefreshCw size={11} /> Tekrar dene
        </button>
      )}
    </div>
  );
};
