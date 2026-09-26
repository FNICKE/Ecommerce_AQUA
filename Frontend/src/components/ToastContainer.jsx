import { useToastStore } from '../store/toastStore';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let colorClasses = 'bg-blue-50 border-blue-200 text-blue-800';
        let iconColor = 'text-blue-500';

        if (toast.type === 'success') {
          Icon = CheckCircle;
          colorClasses = 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-md shadow-emerald-50/50';
          iconColor = 'text-emerald-500';
        } else if (toast.type === 'error') {
          Icon = XCircle;
          colorClasses = 'bg-rose-50 border-rose-200 text-rose-900 shadow-md shadow-rose-50/50';
          iconColor = 'text-rose-500';
        } else if (toast.type === 'warning') {
          Icon = AlertCircle;
          colorClasses = 'bg-amber-50 border-amber-200 text-amber-900 shadow-md shadow-amber-50/50';
          iconColor = 'text-amber-500';
        } else if (toast.type === 'info') {
          Icon = Info;
          colorClasses = 'bg-purple-50 border-purple-200 text-purple-900 shadow-md shadow-purple-50/50';
          iconColor = 'text-purple-600';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 animate-slide-in-right ${colorClasses}`}
            role="alert"
          >
            <Icon size={20} className={`flex-shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-sm font-semibold leading-snug">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-0.5 rounded-full hover:bg-black/5 transition text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
