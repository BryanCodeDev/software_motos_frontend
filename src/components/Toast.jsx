import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { ToastContext } from './ToastContext';

const TOAST_DURATION = 5000;
const MAX_TOASTS = 4;

const styles = {
  success: { icon: CheckCircle2, iconBox: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' },
  error: { icon: AlertCircle, iconBox: 'bg-rose-50 text-rose-600', bar: 'bg-rose-500' },
  info: { icon: Info, iconBox: 'bg-brand-accent/10 text-brand-accent', bar: 'bg-brand-accent' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const reduce = useReducedMotion();

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (toast) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...toast, id }].slice(-MAX_TOASTS));
      setTimeout(() => remove(id), TOAST_DURATION);
    },
    [remove]
  );

  const toast = useMemo(
    () => ({
      success: (message) => add({ type: 'success', message }),
      error: (message) => add({ type: 'error', message }),
      info: (message) => add({ type: 'info', message }),
    }),
    [add]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-20 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end sm:px-0"
        role="region"
        aria-live="polite"
        aria-label="Notificaciones"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const s = styles[t.type] || styles.info;
            const Icon = s.icon;
            return (
              <motion.div
                key={t.id}
                layout={!reduce}
                role={t.type === 'error' ? 'alert' : 'status'}
                initial={reduce ? false : { x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border border-brand-border bg-white px-4 py-3.5 text-sm shadow-[0_20px_50px_-20px_rgba(41,32,36,0.35)] sm:w-96 sm:max-w-[calc(100vw-2rem)]"
              >
                <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${s.iconBox}`}>
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 pt-1 leading-snug text-brand-text">{t.message}</div>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  className="flex-shrink-0 rounded-md p-1 text-brand-textMuted transition-colors hover:bg-brand-dark hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                  aria-label="Cerrar notificación"
                >
                  <X size={16} />
                </button>
                {!reduce && (
                  <motion.span
                    className={`absolute inset-x-0 bottom-0 h-0.5 origin-left ${s.bar}`}
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: TOAST_DURATION / 1000, ease: 'linear' }}
                    aria-hidden="true"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};