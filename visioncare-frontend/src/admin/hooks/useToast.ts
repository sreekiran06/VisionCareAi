import { useState, useCallback, useRef } from 'react';
import type { ToastMessage } from '../types/admin.types';

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timerMap = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timerMap.current[id]);
    delete timerMap.current[id];
  }, []);

  const show = useCallback(
    (type: ToastMessage['type'], title: string, message?: string, duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      timerMap.current[id] = setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  return {
    toasts,
    dismiss,
    success: (title: string, message?: string) => show('success', title, message),
    error:   (title: string, message?: string) => show('error',   title, message),
    warning: (title: string, message?: string) => show('warning', title, message),
    info:    (title: string, message?: string) => show('info',    title, message),
  };
}
