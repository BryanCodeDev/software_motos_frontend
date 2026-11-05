import { useContext } from 'react';
import { ToastContext } from './ToastContext';

// Objeto estable: si se creara uno nuevo en cada render, romperia los
// arreglos de dependencias de useEffect/useCallback en quien lo consuma.
const noop = () => {};
const FALLBACK = {
  success: noop,
  error: noop,
  warning: noop,
  info: noop,
  dismiss: noop,
  clear: noop,
};

/** Devuelve { success, error, warning, info, dismiss, clear }. Sin provider, no hace nada. */
export const useToast = () => useContext(ToastContext) ?? FALLBACK;