import { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export const Loader = ({ className = '', size = 'medium' }) => {
  const sizes = { small: 'w-4 h-4', medium: 'w-6 h-6', large: 'w-10 h-10' };
  return (
    <Loader2
      role="status"
      className={`animate-spin text-brand-500 ${sizes[size] || sizes.medium} ${className}`}
      aria-label="Cargando"
    />
  );
};

Loader.propTypes = {
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
};

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

const BUTTON_BASE =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg font-semibold will-change-transform transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none';

const BUTTON_VARIANTS = {
  primary:
    'bg-brand-500 text-white shadow-soft hover:bg-brand-600 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_rgba(159,18,57,0.55)] active:translate-y-0 active:scale-[0.98]',
  outline:
    'border border-border bg-white text-neutral-900 hover:border-brand-500/50 hover:bg-brand-50 active:scale-[0.98]',
  ghost: 'text-text-secondary hover:bg-brand-500/5 hover:text-neutral-900 active:scale-[0.98]',
  secondary:
    'border border-border bg-neutral-100/60 text-neutral-900 hover:border-brand-500/40 hover:bg-neutral-100 active:scale-[0.98]',
  danger: 'bg-rose-700 text-white shadow-soft hover:bg-rose-600 active:scale-[0.98]',
};

const BUTTON_SIZES = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-6 py-3 text-sm lg:text-base',
  lg: 'px-8 py-3.5 text-base',
};

export const Button = forwardRef(
  (
    {
      children,
      type = 'button',
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      onClick,
      className = '',
      ...props
    },
    ref
  ) => {
    // El botón fantasma es más compacto por defecto.
    const sizeCls = variant === 'ghost' && size === 'md' ? 'px-4 py-2.5 text-sm' : BUTTON_SIZES[size] || BUTTON_SIZES.md;
    const shine = variant === 'primary' || variant === 'danger';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        onClick={onClick}
        className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary} ${sizeCls} ${className}`}
        {...props}
      >
        {shine && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full group-disabled:hidden motion-reduce:hidden"
          />
        )}
        {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
Button.propTypes = {
  children: PropTypes.node,
  type: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'outline', 'ghost', 'secondary', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

/* ------------------------------------------------------------------ */
/* Campos de formulario                                                */
/* ------------------------------------------------------------------ */

// text-base en móvil evita el zoom automático de iOS al enfocar un campo.
const fieldClasses =
  'block w-full rounded-lg border bg-brand-50 px-4 py-2.5 text-base text-neutral-900 placeholder:text-text-secondary/60 transition-all duration-200 hover:border-brand-500/40 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:shadow-[0_0_0_4px_rgba(159,18,57,0.08)] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm';

const fieldBorder = (error) =>
  error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-border';

/**
 * Input. Con `icon` muestra un ícono a la izquierda; los campos
 * type="password" incluyen un botón para mostrar u ocultar el texto.
 */
export const Input = forwardRef(({ className = '', error = false, icon: Icon, type = 'text', ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  const field = (
    <input
      ref={ref}
      type={isPassword && visible ? 'text' : type}
      aria-invalid={error || undefined}
      {...props}
      className={`${fieldClasses} ${fieldBorder(error)} ${Icon ? 'pl-10' : ''} ${isPassword ? 'pr-11' : ''} ${className}`}
    />
  );

  if (!Icon && !isPassword) return field;

  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/70"
          aria-hidden="true"
        />
      )}
      {field}
      {isPassword && (
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-brand-500/10 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      )}
    </div>
  );
});

Input.displayName = 'Input';
Input.propTypes = {
  className: PropTypes.string,
  error: PropTypes.bool,
  icon: PropTypes.elementType,
  type: PropTypes.string,
};

export const Textarea = forwardRef(({ className = '', rows = 4, error = false, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    aria-invalid={error || undefined}
    {...props}
    className={`${fieldClasses} ${fieldBorder(error)} resize-y ${className}`}
  />
));

Textarea.displayName = 'Textarea';
Textarea.propTypes = {
  className: PropTypes.string,
  rows: PropTypes.number,
  error: PropTypes.bool,
};

export const Label = ({ children, className = '', required = false, ...props }) => (
  <label className={`mb-1.5 block text-sm font-medium text-neutral-900/80 ${className}`} {...props}>
    {children}
    {required && (
      <span className="ml-0.5 text-rose-600" aria-hidden="true">
        *
      </span>
    )}
  </label>
);

Label.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  required: PropTypes.bool,
};

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

/**
 * Tarjeta. Por defecto conserva el efecto hover de siempre;
 * usa hoverable={false} en formularios para que no "salte".
 * `as` permite renderizarla como <article>, <li>, <section>…
 */
export const Card = ({ as: Tag = 'div', children, className = '', hoverable = true, ...props }) => (
  <Tag
    className={`rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] transition-all duration-300 ${
      hoverable
        ? 'will-change-transform hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-[0_20px_50px_-20px_rgba(159,18,57,0.35)]'
        : ''
    } ${className}`}
    {...props}
  >
    {children}
  </Tag>
);

Card.propTypes = {
  as: PropTypes.elementType,
  children: PropTypes.node,
  className: PropTypes.string,
  hoverable: PropTypes.bool,
};