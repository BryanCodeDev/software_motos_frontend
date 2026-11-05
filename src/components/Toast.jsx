import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { ToastContext } from './ToastContext';

const EASE = [0.22, 1, 0.36, 1];
const MAX_TOASTS = 4;

const TYPES = {
  success: { icon: CheckCircle2, iconBox: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500', duration: 4500 },
  error: { icon: AlertCircle, iconBox: 'bg-rose-50 text-rose-600', bar: 'bg-rose-500', duration: 8000 },
  warning: { icon: AlertTriangle, iconBox: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500', duration: 6000 },
  info: { icon: Info, iconBox: 'bg-brand-500/10 text-brand-500', bar: 'bg-brand-500', duration: 5000 },
};

/**
 * Una notificación. La barra de progreso es la propia temporizadora:
 * al pausarla (hover o foco) el cierre automático también se pausa.
 */
const ToastItem = ({ toast, onRemove, reduce }) => {
  const barRef = useRef(null);
  const animRef = useRef(null);
  const style = TYPES[toast.type] || TYPES.info;
  const Icon = style.icon;
  const duration = toast.duration ?? style.duration;
  const persistent = !Number.isFinite(duration) || duration <= 0;

  useEffect(() => {
    if (persistent) return undefined;
    const el = barRef.current;
    if (!el || typeof el.animate !== 'function') {
      const t = setTimeout(() => onRemove(toast.id), duration);
      return () => clearTimeout(t);
    }
    const anim = el.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], {
      duration,
      easing: 'linear',
      fill: 'forwards',
    });
    animRef.current = anim;
    anim.onfinish = () => onRemove(toast.id);
    return () => anim.cancel();
  }, [toast.id, duration, persistent, onRemove]);

  const pause = () => animRef.current?.pause();
  const resume = () => animRef.current?.play();

  return (
    <motion.div
      layout={reduce ? false : 'position'}
      role={toast.type === 'error' ? 'alert' : 'status'}
      initial={reduce ? false : { x: 48, opacity: 0, scale: 0.96 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { x: 48, opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: EASE }}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className="pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border border-border bg-white px-4 py-3.5 text-sm shadow-[0_20px_50px_-20px_rgba(41,32,36,0.35)] sm:w-96 sm:max-w-[calc(100vw-2rem)]"
    >
      <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${style.iconBox}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5 leading-snug text-neutral-900">
        {toast.title && <p className="font-semibold">{toast.title}</p>}
        <div className={toast.title ? 'mt-0.5 text-text-secondary' : 'pt-0.5'}>{toast.message}</div>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action.onClick?.();
              onRemove(toast.id);
            }}
            className="mt-2 rounded-md text-sm font-semibold text-brand-500 transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 rounded-md p-1 text-text-secondary transition-colors hover:bg-brand-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label="Cerrar notificación"
      >
        <X size={16} />
      </button>
      {!persistent && (
        <span
          ref={barRef}
          aria-hidden="true"
          className={`absolute inset-x-0 bottom-0 h-0.5 origin-left ${style.bar} ${reduce ? 'opacity-0' : ''}`}
        />
      )}
    </motion.div>
  );
};

/**
 * Uso: toast.success('Guardado'), toast.error('No se pudo guardar', { title, duration, action }).
 * `duration: Infinity` deja la notificación fija hasta que se cierre.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const reduce = useReducedMotion();

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((type, message, options = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => {
      // Un mensaje repetido reemplaza al anterior en lugar de apilarse.
      const unique = prev.filter((t) => !(t.type === type && t.message === message));
      return [...unique, { ...options, type, message, id }].slice(-MAX_TOASTS);
    });
    return id;
  }, []);

  const toast = useMemo(
    () => ({
      success: (message, options) => add('success', message, options),
      error: (message, options) => add('error', message, options),
      warning: (message, options) => add('warning', message, options),
      info: (message, options) => add('info', message, options),
      dismiss: remove,
      clear: () => setToasts([]),
    }),
    [add, remove]
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
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={remove} reduce={reduce} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};