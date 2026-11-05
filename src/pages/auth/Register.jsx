import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { Button, Input, Label } from '../../components/ui';
import {
  UserPlus, User, Mail, Lock, Eye, EyeOff, Loader2, HeartPulse, ShieldCheck, QrCode, ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/useToast';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';

const ASIDE = {
  badge: 'Gratis y en minutos',
  line1: 'Crea tu cuenta y',
  accent: 'protege lo que más importa.',
  text: 'Configura tu perfil una sola vez y tenlo disponible en cualquier emergencia.',
  items: [
    { icon: UserPlus, title: '1. Crea tu cuenta', desc: 'Solo necesitas tu correo' },
    { icon: ClipboardList, title: '2. Completa tu perfil', desc: 'Datos médicos y contactos clave' },
    { icon: QrCode, title: '3. Comparte tu QR', desc: 'Listo para usarse al instante' },
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

const Shell = ({ aside, children }) => (
  <main className="grid min-h-screen bg-brand-50 lg:grid-cols-[1.05fr_1fr]">
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-500 via-[#7d0f2e] to-[#3f0617] p-12 text-white lg:flex xl:p-16">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-black/25 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
          <HeartPulse size={20} />
        </span>
        <span className="text-lg font-bold tracking-tight">Perfil de emergencia</span>
      </div>

      <div className="relative max-w-md">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ring-white/20">
          <ShieldCheck size={14} /> {aside.badge}
        </span>
        <p className="mt-6 text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
          {aside.line1} <span className="text-white/65">{aside.accent}</span>
        </p>
        <p className="mt-5 text-base leading-relaxed text-white/75">{aside.text}</p>
        <ul className="mt-10 grid gap-3">
          {aside.items.map(({ icon: Icon, title, desc }) => (
            <li key={title} className="flex items-center gap-4 rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white/15">
                <Icon size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-white/70">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-white/55">
        © {new Date().getFullYear()} Perfil de emergencia. Todos los derechos reservados.
      </p>
    </aside>

    <section className="flex items-center justify-center px-4 py-10 sm:px-8">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
            <HeartPulse size={18} />
          </span>
          <span className="text-base font-bold tracking-tight text-neutral-900">Perfil de emergencia</span>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6 shadow-[0_24px_60px_-24px_rgba(159,18,57,0.28)] sm:p-10">
          {children}
        </div>
      </div>
    </section>
  </main>
);

const fieldIcon = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary';
const inputCls = 'h-11 pl-10 text-base sm:text-sm';

export const Register = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const strength = getStrength(form.password);
  const level = STRENGTH[strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ ...form, role: 'user' });
      toast.success('Cuenta creada');
      navigate(routes.home);
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'No se pudo crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell aside={ASIDE}>
      <Seo title="Crear cuenta" noindex />

      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
          <UserPlus size={22} />
        </span>
        <h1 className="text-2xl font-bold text-neutral-900">Crear cuenta gratuita</h1>
        <p className="mt-2 text-sm text-text-secondary">Tu perfil de emergencia empieza aquí</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="name">Nombre completo</Label>
          <div className="relative">
            <User size={18} className={fieldIcon} />
            <Input
              id="name"
              autoComplete="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Juan Pérez"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail size={18} className={fieldIcon} />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="juan@example.com"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock size={18} className={fieldIcon} />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className={`${inputCls} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-neutral-900"
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
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-text-secondary">Mínimo 8 caracteres.</span>
              {level && <span className={`font-semibold ${level.text}`}>{level.label}</span>}
            </div>
          </div>
        </div>

        <Button type="submit" variant="primary" disabled={loading} className="h-11 w-full">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Creando cuenta...
            </>
          ) : (
            'Crear cuenta'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        ¿Ya tienes cuenta?{' '}
        <Link to={routes.login} className="font-semibold text-brand-500 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </Shell>
  );
};

export default Register;

