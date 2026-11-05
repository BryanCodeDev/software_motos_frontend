import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { routes } from '../../utils/routes';
import { Button, Input, Label } from '../../components/ui';
import {
  LogIn, Mail, Lock, Eye, EyeOff, Loader2, HeartPulse, ShieldCheck, QrCode, Siren, UserPlus,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/useToast';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const ASIDE = {
  badge: 'Acceso seguro',
  line1: 'Bienvenido de vuelta a',
  accent: 'tu perfil de emergencia.',
  text: 'Tu información vital, lista para cuando más importa.',
  items: [
    { icon: QrCode, title: 'QR de emergencia', desc: 'Acceso inmediato a tu información' },
    { icon: HeartPulse, title: 'Datos médicos esenciales', desc: 'Siempre actualizados y a la mano' },
    { icon: Siren, title: 'Contactos de emergencia', desc: 'Avisa a quien más importa en segundos' },
    { icon: ShieldCheck, title: 'Privado y seguro', desc: 'Tú controlas qué se muestra' },
  ],
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

export const Login = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await login(data);
      toast.success('Sesión iniciada');
      navigate(routes.dashboard);
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'Credenciales inválidas');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell aside={ASIDE}>
      <Seo title="Iniciar sesión" noindex />

      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
          <LogIn size={22} />
        </span>
        <h1 className="text-2xl font-bold text-neutral-900">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-text-secondary">Accede a tu perfil de emergencia</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail size={18} className={fieldIcon} />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="juan@example.com"
              className={inputCls}
              error={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <Label htmlFor="password" className="!mb-0">Contraseña</Label>
            <Link to={routes.forgotPassword} className="text-sm font-medium text-brand-500 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Lock size={18} className={fieldIcon} />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`${inputCls} pr-11`}
              error={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
            )}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-neutral-900"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button type="submit" variant="primary" disabled={loading} className="h-11 w-full">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Ingresando...
            </>
          ) : (
            'Ingresar'
          )}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-text-secondary">
        <span className="h-px flex-1 bg-border" />
        ¿Aún no tienes cuenta?
        <span className="h-px flex-1 bg-border" />
      </div>

      <Link to={routes.register} className="btn-outline w-full">
        <UserPlus size={18} className="text-brand-500" />
        Crear cuenta gratis
      </Link>
    </Shell>
  );
};

export default Login;

