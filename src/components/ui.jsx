import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';

export const Loader = ({ className = '', size = 'medium' }) => {
  const sizes = { small: 'w-4 h-4', medium: 'w-6 h-6', large: 'w-10 h-10' };
  return (
    <Loader2
      className={`animate-spin text-brand-accent ${sizes[size]} ${className}`}
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
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none';
  const variants = {
    primary:
      'bg-brand-accent text-brand-dark shadow-soft hover:bg-brand-accentHover hover:-translate-y-0.5 hover:shadow-glow active:scale-[0.98]',
    outline:
      'border border-brand-border bg-transparent text-brand-text hover:border-brand-accent/60 hover:bg-brand-panel active:scale-[0.98]',
    ghost:
      'text-brand-textMuted hover:text-brand-text hover:bg-black/5 px-4 py-2 text-sm active:scale-[0.98]',
    secondary:
      'bg-brand-panel text-brand-text border border-brand-border hover:bg-brand-panelHover hover:border-brand-accent/40',
    danger: 'bg-rose-700 text-white hover:bg-rose-600 active:scale-[0.98]',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.primary} px-6 py-3 text-sm lg:text-base ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  type: PropTypes.string,
  variant: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

const fieldClasses =
  'block w-full rounded-lg border border-brand-border bg-brand-dark text-brand-text placeholder-brand-textMuted/60 px-4 py-2.5 text-sm focus:border-brand-accent focus:ring-1 focus:ring-brand-accent focus:outline-none disabled:opacity-60 transition-colors';

export const Input = ({ className = '', ...props }) => {
  return <input {...props} className={`${fieldClasses} ${className}`} />;
};

Input.propTypes = {
  className: PropTypes.string,
};

export const Textarea = ({ className = '', rows = 4, ...props }) => {
  return <textarea rows={rows} {...props} className={`${fieldClasses} resize-y ${className}`} />;
};

Textarea.propTypes = {
  className: PropTypes.string,
  rows: PropTypes.number,
};

export const Label = ({ children, className = '', ...props }) => (
  <label className={`block text-sm font-medium text-brand-textMuted mb-1.5 ${className}`} {...props}>
    {children}
  </label>
);

Label.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export const Card = ({ children, className = '', ...props }) => (
  <div
    className={`bg-brand-panel/80 border border-brand-border rounded-xl shadow-card backdrop-blur-sm transition-all duration-300 hover:border-brand-accent/40 hover:shadow-glow hover:-translate-y-0.5 ${className}`}
    {...props}
  >
    {children}
  </div>
);

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

