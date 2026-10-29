import { Loader2 } from 'lucide-react';

/** Encabezado estándar de cada página del panel. */
export const PageTitle = ({ title, description, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold text-brand-text tracking-tight">{title}</h1>
      {description && (
        <p className="mt-2 text-brand-textMuted text-sm leading-relaxed max-w-2xl">{description}</p>
      )}
    </div>
    {actions && <div className="flex-shrink-0">{actions}</div>}
  </div>
);

/** Indicador de carga a pantalla de contenido. */
export const PageLoader = () => (
  <div className="flex h-64 items-center justify-center" role="status" aria-live="polite">
    <Loader2 className="w-7 h-7 animate-spin text-brand-accent" aria-hidden="true" />
    <span className="sr-only">Cargando...</span>
  </div>
);

/** Estado vacío con ícono, texto y acción opcional. */
export const EmptyState = ({ icon: Icon, title, text, children }) => (
  <div className="text-center py-12 px-4">
    {Icon && (
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
    )}
    <h3 className="font-semibold text-brand-text mb-1">{title}</h3>
    {text && <p className="text-brand-textMuted text-sm max-w-sm mx-auto leading-relaxed">{text}</p>}
    {children && <div className="mt-6">{children}</div>}
  </div>
);

/** Casilla de verificación con la apariencia del sistema de diseño. */
export const CheckField = ({ id, checked, onChange, label, hint }) => (
  <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 rounded border-brand-border bg-brand-dark text-brand-accent focus:ring-brand-accent focus:ring-offset-0"
    />
    <span>
      <span className="block text-sm text-brand-text">{label}</span>
      {hint && <span className="block text-xs text-brand-textMuted mt-0.5">{hint}</span>}
    </span>
  </label>
);
