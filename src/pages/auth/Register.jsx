import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { Button, Input, Label } from '../../components/ui';
import { CheckField } from '../../components/DashPage';
import {
  UserPlus, User, Users, Dog, Mail, Lock, Eye, EyeOff, Loader2, ClipboardList, ShieldCheck,
  ArrowRight, ArrowLeft, Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/useToast';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';
import AuthShell from '../../components/AuthShell';

const ASIDE = {
  badge: 'Gratis y en minutos',
  line1: 'Crea tu cuenta y',
  accent: 'prepárate para lo inesperado.',
  text: 'Configura tu perfil una vez y tenlo listo en cualquier emergencia.',
  items: [
    { icon: UserPlus, title: 'Crea tu cuenta', desc: 'Solo necesitas tu correo' },
    { icon: ClipboardList, title: 'Completa tu perfil', desc: 'Contactos y datos médicos, si quieres' },
    { icon: ShieldCheck, title: 'Compra tus stickers', desc: 'El QR definitivo se asigna al comprar' },
  ],
};

const STRENGTH = [
  null,
  { label: 'Débil', bar: 'bg-orange-500', text: 'text-orange-600' },
  { label: 'Aceptable', bar: 'bg-amber-500', text: 'text-amber-600' },
  { label: 'Buena', bar: 'bg-lime-500', text: 'text-lime-600' },
  { label: 'Excelente', bar: 'bg-green-600', text: 'text-green-700' },
];

const getStrength = (p) => {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.max(s, 1);
};

const CONSENTS = [
  {
    key: 'terms',
    label: 'Acepto los Términos y Condiciones de Uso',
    hint: 'Reglas de uso, compras, pagos y responsabilidad.',
    required: true,
    link: routes.terms,
    linkText: 'Leer Términos y Condiciones',
  },
  {
    key: 'privacy',
    label: 'Conozco la Política de Privacidad y Tratamiento de Datos',
    hint: 'Cómo se recopilan, usan y protegen tus datos.',
    required: true,
    link: routes.privacyPolicy,
    linkText: 'Leer Política de Privacidad',
  },
  {
    key: 'data_processing',
    label: 'Autorizo el tratamiento de mis datos personales',
    hint: 'Datos necesarios para operar el servicio: cuenta, perfil, contactos y pagos.',
    required: true,
  },
  {
    key: 'sensitive_data',
    label: 'Autorizo el tratamiento de mis datos de salud (opcional)',
    hint: 'Alergias, condiciones y medicamentos. Es voluntario y no condiciona el uso básico del servicio.',
    required: false,
  },
  {
    key: 'notifications',
    label: 'Autorizo notificaciones de emergencia (opcional)',
    hint: 'Usar tus contactos de emergencia para avisarles cuando esté habilitado.',
    required: false,
  },
];

const STEPS = ['Tu cuenta', 'Autorizaciones'];

const rise = 'opacity-0 animate-slide-up';
const delay = (ms) => ({ animationDelay: `${ms}ms` });
const fieldIcon =
  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-brand-500';
const inputCls = 'h-11 pl-10 text-base sm:text-sm';

export const Register = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', profile_type: 'person', profile_name: '' });
  const [consents, setConsents] = useState(() => Object.fromEntries(CONSENTS.map((c) => [c.key, false])));

  const strength = getStrength(form.password);
  const level = STRENGTH[strength];
  const allRequiredConsents = CONSENTS.filter((c) => c.required).every((c) => consents[c.key] === true);

  const toggleConsent = (key) => setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    if (!allRequiredConsents) {
      toast.error('Debes aceptar las autorizaciones obligatorias para continuar.');
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, role: 'user', consents, display_name: form.profile_name || form.name, profile_name: undefined });
      toast.success('¡Cuenta creada! Ahora completa tu perfil');
      navigate(routes.home);
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'No pudimos crear tu cuenta. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell aside={ASIDE} bgImage="/herosection-login.webp" showFooter={false}>
      <Seo title="Crear cuenta" noindex />

      <div className={`mb-6 text-center ${rise}`}>
        <div className="relative mx-auto mb-5 h-14 w-14">
          <span className="absolute inset-0 rounded-2xl bg-brand-500/40 animate-pulse-ring" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow animate-float">
            <UserPlus size={24} />
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-neutral-900">Crea tu cuenta gratis</h1>
        <p className="mt-2 text-sm text-text-secondary">Menos de dos minutos.</p>
      </div>

      {/* Progreso */}
      <div className={`mb-7 ${rise}`} style={delay(80)} aria-label={`Paso ${step} de 2`}>
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500 ease-out"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>
        <ol className="mt-2.5 flex justify-between text-xs font-semibold">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <li
                key={label}
                className={`flex items-center gap-2 transition-colors ${
                  active || done ? 'text-brand-500' : 'text-text-secondary'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] transition-colors ${
                    active || done ? 'bg-brand-500 text-white' : 'bg-border text-text-secondary'
                  }`}
                >
                  {done ? <Check size={12} /> : n}
                </span>
                {label}
              </li>
            );
          })}
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 && (
          <div key="step-1" className="space-y-5">
            <div className={rise} style={delay(0)}>
              <Label htmlFor="name">Nombre completo</Label>
              <div className="group relative">
                <User size={18} className={fieldIcon} />
                <Input
                  id="name"
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={setField('name')}
                  placeholder="Tu nombre"
                  className={inputCls}
                />
              </div>
            </div>

            <div className={rise} style={delay(70)}>
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="group relative">
                <Mail size={18} className={fieldIcon} />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={setField('email')}
                  placeholder="tucorreo@ejemplo.com"
                  className={inputCls}
                />
              </div>
            </div>

            <div className={rise} style={delay(140)}>
              <Label htmlFor="password">Contraseña</Label>
              <div className="group relative">
                <Lock size={18} className={fieldIcon} />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={setField('password')}
                  placeholder="Mínimo 8 caracteres"
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-brand-500"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="mt-2.5" aria-live="polite">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                        level && i <= strength ? level.bar : 'bg-border'
                      }`}
                    />
                  ))}
                </div>
                {level && (
                  <p className={`mt-1.5 animate-fade-in text-right text-xs font-semibold ${level.text}`}>
                    {level.label}
                  </p>
                )}
              </div>
            </div>

            <div className={rise} style={delay(210)}>
              <div className="space-y-3 rounded-2xl border border-border bg-white p-5">
                <p className="text-sm font-semibold text-neutral-900">Tu primer perfil de emergencia</p>
                <p className="text-xs text-text-secondary">Elige qué tipo de perfil crear con esta cuenta. Se asocia al mismo correo y se activa al comprar tus stickers.</p>
                <div role="radiogroup" aria-label="Tipo de perfil inicial" className="grid gap-2 sm:grid-cols-3">
                  {[
                    { value: 'person', label: 'Persona', icon: <User size={16} />, desc: 'Para ti o un adulto.' },
                    { value: 'pet', label: 'Mascota', icon: <Dog size={16} />, desc: 'Para tu perro o gato.' },
                    { value: 'managed_person', label: 'A mi cargo', icon: <Users size={16} />, desc: 'Un hijo o adulto mayor.' },
                  ].map((t) => {
                    const active = form.profile_type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setForm({ ...form, profile_type: t.value })}
                        className={`focus-ring flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors ${active ? 'border-brand-500 bg-brand-50' : 'border-border bg-white hover:border-brand-500/40'}`}
                      >
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-500'}`}>
                          {t.icon}
                        </span>
                        <span className="font-semibold text-neutral-900 text-xs">{t.label}</span>
                        <span className="text-[10px] leading-relaxed text-text-secondary">{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    id="profile-name"
                    type="text"
                    value={form.profile_name}
                    onChange={(e) => setForm({ ...form, profile_name: e.target.value })}
                    placeholder="Nombre para mostrar (ej. Firulais)"
                    className="input flex-1 !text-base"
                  />
                </div>
              </div>
            </div>

            <div className={rise} style={delay(210)}>
              <Button type="submit" variant="primary" className="group h-12 w-full text-base">
                Continuar
                <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div key="step-2" className="space-y-5">
            <div className={`space-y-4 rounded-2xl border border-border bg-white p-5 shadow-soft ${rise}`}>
              {CONSENTS.map((c, i) => (
                <div key={c.key} className={`space-y-1 ${rise}`} style={delay(60 + i * 60)}>
                  <CheckField
                    id={`consent-${c.key}`}
                    checked={consents[c.key] === true}
                    onChange={() => toggleConsent(c.key)}
                    label={c.label}
                    hint={c.hint}
                    required={c.required}
                  />
                  {c.link && (
                    <p className="ml-8 text-xs">
                      <Link to={c.link} className="font-medium text-brand-500 hover:underline">
                        {c.linkText}
                      </Link>
                    </p>
                  )}
                </div>
              ))}
              <p className="border-t border-border pt-3 text-xs text-text-secondary">
                Ninguna casilla viene premarcada. Cada autorización se registra con fecha, hora y versión del documento.
              </p>
            </div>

            <div className={`grid grid-cols-[auto_1fr] gap-3 ${rise}`} style={delay(380)}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={loading}
                className="h-12 px-4"
                aria-label="Volver al paso anterior"
              >
                <ArrowLeft size={18} />
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !allRequiredConsents}
                className="h-12 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Creando tu cuenta...
                  </>
                ) : (
                  'Crear mi cuenta'
                )}
              </Button>
            </div>

            <p className="flex items-center justify-center gap-2 text-xs text-text-secondary">
              <ShieldCheck size={14} className="flex-shrink-0 text-brand-500" />
              Tú decides qué datos se muestran.{' '}
              <Link to={routes.privacy} className="font-medium text-brand-500 hover:underline">
                Cómo los protegemos
              </Link>
            </p>
          </div>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        ¿Ya tienes cuenta?{' '}
        <Link to={routes.login} className="font-semibold text-brand-500 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
};

export default Register;