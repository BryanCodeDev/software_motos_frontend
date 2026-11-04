import { Loader2 } from 'lucide-react';

/** Encabezado estándar de cada página del panel. */
export const PageTitle = ({ title, description, actions }) => (
  <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 lg:text-3xl">{title}</h1>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">{description}</p>
      )}
    </div>
    {actions && <div className="w-full flex-shrink-0 sm:w-auto">{actions}</div>}
  </div>
);

/** Indicador de carga a pantalla de contenido. */
export const PageLoader = () => (
  <div className="flex h-64 flex-col items-center justify-center gap-3" role="status" aria-live="polite">
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-border shadow-soft">
      <Loader2 className="h-6 w-6 animate-spin text-brand-500" aria-hidden="true" />
    </span>
    <span className="text-xs font-medium text-text-secondary">Cargando…</span>
  </div>
);

/** Estado vacío con ícono, texto y acción opcional. */
export const EmptyState = ({ icon: Icon, title, text, children }) => (
  <div className="px-4 py-12 text-center">
    {Icon && (
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
    )}
    <h3 className="mb-1 font-semibold text-neutral-900">{title}</h3>
    {text && <p className="mx-auto max-w-sm text-sm leading-relaxed text-text-secondary">{text}</p>}
    {children && <div className="mt-6 flex justify-center">{children}</div>}
  </div>
);

/** Casilla de verificación con la apariencia del sistema de diseño. */
export const CheckField = ({ id, checked, onChange, label, hint }) => (
  <label htmlFor={id} className="flex cursor-pointer select-none items-start gap-3 py-0.5">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-5 w-5 flex-none cursor-pointer rounded border-border bg-white text-brand-500 accent-brand-500 focus:ring-brand-500 focus:ring-offset-0"
    />
    <span>
      <span className="block text-sm font-medium text-neutral-900">{label}</span>
      {hint && <span className="mt-0.5 block text-xs leading-relaxed text-text-secondary">{hint}</span>}
    </span>
  </label>
);

