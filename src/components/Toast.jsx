import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { ToastContext } from './ToastContext';

const TOAST_DURATION = 5000;

const styles = {
  success: { icon: CheckCircle2, color: 'text-emerald-400', bar: 'border-l-emerald-400' },
  error: { icon: AlertCircle, color: 'text-rose-400', bar: 'border-l-rose-400' },
  info: { icon: Info, color: 'text-brand-accent', bar: 'border-l-brand-accent' },
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
      setToasts((prev) => [...prev, { ...toast, id }]);
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
        className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none"
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
                initial={reduce ? false : { x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-lg border border-brand-border border-l-4 ${s.bar} bg-brand-panel/95 px-4 py-3 shadow-card backdrop-blur-md text-sm`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 mt-px ${s.color}`} aria-hidden="true" />
                <div className="flex-1 text-brand-text leading-snug">{t.message}</div>
                <button
                  onClick={() => remove(t.id)}
                  className="flex-shrink-0 rounded p-0.5 text-brand-textMuted hover:text-brand-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                  aria-label="Cerrar notificación"
                >
                  <X size={16} />
                </button>
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
