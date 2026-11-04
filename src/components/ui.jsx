import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';

export const Loader = ({ className = '', size = 'medium' }) => {
  const sizes = { small: 'w-4 h-4', medium: 'w-6 h-6', large: 'w-10 h-10' };
  return (
    <Loader2
      className={`animate-spin text-brand-500 ${sizes[size]} ${className}`}
      aria-label="Cargando"
    />
  );
};

Loader.propTypes = {
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
};

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold will-change-transform transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none';

  const variants = {
    primary:
      'bg-brand-500 text-white shadow-soft hover:bg-brand-600 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_rgba(159,18,57,0.55)] active:scale-[0.98]',
    outline:
      'border border-border bg-white text-neutral-900 hover:border-brand-500/50 hover:bg-brand-50 active:scale-[0.98]',
    ghost:
      'text-text-secondary hover:text-neutral-900 hover:bg-brand-500/5 active:scale-[0.98]',
    secondary:
      'border border-border bg-neutral-100/60 text-neutral-900 hover:bg-neutral-100 hover:border-brand-500/40 active:scale-[0.98]',
    danger: 'bg-rose-700 text-white shadow-soft hover:bg-rose-600 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-6 py-3 text-sm lg:text-base',
    lg: 'px-8 py-3.5 text-base',
  };

  // El botón fantasma es más compacto por defecto.
  const sizeCls = variant === 'ghost' && size === 'md' ? 'px-4 py-2.5 text-sm' : sizes[size] || sizes.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.primary} ${sizeCls} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
};

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

// text-base en móvil evita el zoom automático de iOS al enfocar un campo.
const fieldClasses =
  'block w-full rounded-lg border bg-brand-50 text-neutral-900 placeholder-text-text-secondary/60 px-4 py-2.5 text-base sm:text-sm transition-colors hover:border-brand-500/40 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed';

const fieldBorder = (error) => (error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-border');

export const Input = forwardRef(({ className = '', error = false, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={error || undefined}
    {...props}
    className={`${fieldClasses} ${fieldBorder(error)} ${className}`}
  />
));

Input.displayName = 'Input';
Input.propTypes = {
  className: PropTypes.string,
  error: PropTypes.bool,
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

export const Label = ({ children, className = '', ...props }) => (
  <label className={`mb-1.5 block text-sm font-medium text-neutral-900/80 ${className}`} {...props}>
    {children}
  </label>
);

Label.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

/**
 * Tarjeta. Por defecto conserva el efecto hover de siempre;
 * usa hoverable={false} en formularios para que no "salte".
 */
export const Card = ({ children, className = '', hoverable = true, ...props }) => (
  <div
    className={`rounded-2xl border border-border bg-white will-change-transform shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] transition-all duration-300 ${
      hoverable ? 'hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-[0_20px_50px_-20px_rgba(159,18,57,0.35)]' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </div>
);

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  hoverable: PropTypes.bool,
};
