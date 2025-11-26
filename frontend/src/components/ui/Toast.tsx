import { useEffect } from 'react';
import { useToastStore } from '../../store/toast';

const colors: Record<string, string> = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-slate-800',
};

export function ToastContainer() {
  const { toasts, remove } = useToastStore();

  useEffect(() => {
    toasts.forEach((t) => {
      const timer = setTimeout(() => remove(t.id), 3500);
      return () => clearTimeout(timer);
    });
  }, [toasts, remove]);

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`relative flex min-w-[260px] items-center gap-2 rounded-xl px-4 py-3 text-sm text-white shadow-lg ${colors[toast.type] ?? colors.info}`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => remove(toast.id)}
            className="text-white/80 transition hover:text-white focus:outline-none"
            aria-label="Fechar aviso"
          >
            x
          </button>
          <span className="absolute inset-x-0 bottom-0 h-1 bg-white/40 animate-[shrink_3.5s_linear_forwards]" />
        </div>
      ))}
      <style>
        {`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        `}
      </style>
    </div>
  );
}
