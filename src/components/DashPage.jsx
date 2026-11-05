import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

/** Encabezado estándar de cada página del panel. */
export const PageTitle = ({ title, description, actions }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 [text-wrap:balance] lg:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">{description}</p>
        )}
      </div>
      {actions && <div className="w-full flex-shrink-0 sm:w-auto">{actions}</div>}
    </motion.div>
  );
};

/** Indicador de carga a pantalla de contenido. */
export const PageLoader = () => (
  <div className="flex h-64 flex-col items-center justify-center gap-4" role="status" aria-live="polite">
    <span className="relative flex h-14 w-14 items-center justify-center">
      <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand-500/20 animate-pulse-ring" />
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-soft ring-1 ring-border">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" aria-hidden="true" />
      </span>
    </span>
    <span className="text-xs font-medium text-text-secondary">Cargando…</span>
  </div>
);

/** Estado vacío con ícono, texto y acción opcional. */
export const EmptyState = ({ icon: Icon, title, text, children }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="px-4 py-12 text-center"
    >
      {Icon && (
        <div className="relative mx-auto mb-5 h-14 w-14">
          <span aria-hidden="true" className="absolute inset-0 rounded-2xl bg-brand-500/15 animate-pulse-ring" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
        </div>
      )}
      <h3 className="mb-1 text-base font-semibold text-neutral-900">{title}</h3>
      {text && <p className="mx-auto max-w-sm text-sm leading-relaxed text-text-secondary">{text}</p>}
      {children && <div className="mt-6 flex justify-center">{children}</div>}
    </motion.div>
  );
};

/** Casilla de verificación con la apariencia del sistema de diseño. */
export const CheckField = ({ id, checked, onChange, label, hint, disabled = false }) => (
  <label
    htmlFor={id}
    className={`group flex select-none items-start gap-3 rounded-lg py-1 ${
      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
    }`}
  >
    <input
      id={id}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="peer sr-only"
    />
    <span
      aria-hidden="true"
      className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border border-border bg-white text-white transition-all duration-200 group-hover:border-brand-500/60 peer-checked:border-brand-500 peer-checked:bg-brand-500 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100"
    >
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5 scale-50 opacity-0 transition-all duration-200"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
    </span>
    <span>
      <span className="block text-sm font-medium text-neutral-900">{label}</span>
      {hint && <span className="mt-0.5 block text-xs leading-relaxed text-text-secondary">{hint}</span>}
    </span>
  </label>
);