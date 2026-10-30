import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Input, Label } from './ui';

/** Estructura común de las pantallas de autenticación. */
export const AuthLayout = ({ icon: Icon, title, subtitle, children, footer, back }) => {
  const reduce = useReducedMotion();
  return (
    <main className="relative min-h-screen flex items-center justify-center py-16 px-4 overflow-hidden">
      <div className="bg-grid absolute inset-0 pointer-events-none" aria-hidden="true" />
      <motion.div
        className="relative w-full max-w-md"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {back && (
          <Link
            to={back.to}
            className="inline-flex items-center gap-2 mb-5 text-sm text-brand-textMuted hover:text-brand-text transition-colors"
          >
            <ArrowLeft size={16} aria-hidden="true" /> {back.label}
          </Link>
        )}

        <div className="card-static p-8 md:p-10 shadow-glow">
          <div className="text-center mb-8">
            {Icon && (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-accent to-brand-deep flex items-center justify-center mx-auto mb-4 text-brand-dark shadow-soft">
                <Icon size={22} aria-hidden="true" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-brand-text">{title}</h1>
            {subtitle && <p className="text-brand-textMuted text-sm mt-2 leading-relaxed">{subtitle}</p>}
          </div>
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-brand-textMuted space-y-2">{footer}</div>}
      </motion.div>
    </main>
  );
};

/** Pantalla de confirmación (correo enviado, contraseña actualizada, etc.). */
export const AuthSuccess = ({ icon: Icon, title, text, children }) => {
  const reduce = useReducedMotion();
  return (
    <main className="relative min-h-screen flex items-center justify-center py-16 px-4 overflow-hidden">
      <div className="bg-grid absolute inset-0 pointer-events-none" aria-hidden="true" />
      <motion.div
        className="relative w-full max-w-md card-static p-8 md:p-10 text-center shadow-glow"
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        role="status"
      >
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 text-emerald-400">
          <Icon size={26} aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-brand-text mb-3">{title}</h1>
        <p className="text-brand-textMuted mb-8 leading-relaxed">{text}</p>
        {children}
      </motion.div>
    </main>
  );
};

/** Campo de contraseña con botón para mostrar u ocultar. */
export const PasswordField = ({
  id,
  label,
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete,
  minLength,
  hint,
  labelAside,
  children,
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="mb-0">
          {label}
        </Label>
        {labelAside}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          required
          minLength={minLength}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textMuted hover:text-brand-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded"
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={show}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint && <p className="text-xs text-brand-textMuted">{hint}</p>}
      {children}
    </div>
  );
};

const strengthLevels = [
  { label: 'Muy débil', bar: 'bg-rose-500', text: 'text-rose-400' },
  { label: 'Débil', bar: 'bg-orange-400', text: 'text-orange-300' },
  { label: 'Aceptable', bar: 'bg-amber-400', text: 'text-amber-300' },
  { label: 'Buena', bar: 'bg-brand-accent', text: 'text-brand-accent' },
  { label: 'Fuerte', bar: 'bg-emerald-400', text: 'text-emerald-300' },
];

const scorePassword = (p) => {
  if (p.length < 8) return 0;
  let s = 1;
  if (p.length >= 12) s += 1;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p)) s += 1;
  if (/[^A-Za-z0-9]/.test(p)) s += 1;
  return Math.min(s, 4);
};

/** Indicador orientativo de fortaleza. No sustituye las reglas del servidor. */
export const StrengthMeter = ({ password }) => {
  if (!password) return null;
  const score = scorePassword(password);
  const level = strengthLevels[score];
  return (
    <div className="pt-1" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              n <= score ? level.bar : 'bg-brand-border'
            }`}
          />
        ))}
      </div>
      <p className={`mt-1.5 text-xs ${level.text}`}>Fortaleza: {level.label}</p>
    </div>
  );
};
