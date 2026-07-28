import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: 'success' | 'error';
}

interface ToastContextValue {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((variant: Toast['variant'], title: string, description?: string) => {
    const id = Date.now();
    setToasts((current) => [...current, { id, title, description, variant }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  const value = useMemo(
    () => ({
      success: (title: string, description?: string) => push('success', title, description),
      error: (title: string, description?: string) => push('error', title, description),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed inset-x-3 top-3 z-50 flex max-w-sm flex-col gap-3 sm:left-auto sm:right-4 sm:top-4 sm:w-[calc(100%-2rem)]"
      >
        {toasts.map((toast) => (
          <div
            className="flex gap-3 rounded-xl border bg-card p-4 shadow-xl"
            key={toast.id}
            role={toast.variant === 'error' ? 'alert' : 'status'}
          >
            {toast.variant === 'success' ? (
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
              />
            ) : (
              <XCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            )}
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold [overflow-wrap:anywhere]">
                {toast.title}
              </p>
              {toast.description ? (
                <p className="mt-1 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                  {toast.description}
                </p>
              ) : null}
            </div>
            <Button
              aria-label="Dismiss notification"
              className="-mr-2 -mt-2 h-8 w-8"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              size="icon"
              variant="ghost"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider.');
  return context;
}
