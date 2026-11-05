import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { routes } from '../../utils/routes';
import {
  Lock, ArrowLeft, CheckCircle2, Eye, EyeOff, ShieldCheck, ShieldAlert, Loader2,
  HeartPulse, KeyRound, Check, X,
} from 'lucide-react';
import { Button, Input, Label } from '../../components/ui';
import { useToast } from '../../components/useToast';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';

const ASIDE = {
  badge: 'Último paso',
  line1: 'Crea una contraseña',
  accent: 'nueva y segura.',
  text: 'Elige una contraseña que no uses en otros sitios para mantener tu perfil protegido.',
  items: [
    { icon: Lock, title: 'Mínimo 8 caracteres', desc: 'Mezcla letras, números y símbolos' },
    { icon: ShieldAlert, title: 'No la repitas', desc: 'Usa una distinta a las de otras cuentas' },
    { icon: ShieldCheck, title: 'Enlace de un solo uso', desc: 'Se invalida al cambiar la contraseña' },
  ],
};

const Shell = ({ aside, children }) => (
  <main className="grid min-h-screen bg-brand-dark lg:grid-cols-[1.05fr_1fr]">
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-accent via-[#7d0f2e] to-[#3f0617] p-12 text-white lg:flex xl:p-16">
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
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-accent text-white">
            <HeartPulse size={18} />
          </span>
          <span className="text-base font-bold tracking-tight text-brand-text">Perfil de emergencia</span>
        </div>
        <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-[0_24px_60px_-24px_rgba(159,18,57,0.28)] sm:p-10">
          {children}
        </div>
      </div>
    </section>
  </main>
);

const fieldIcon = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-textMuted';
const inputCls = 'h-11 pl-10 pr-11 text-base sm:text-sm';
const eyeBtn =
  'absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-brand-textMuted transition-colors hover:text-brand-text';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Falta el token de restablecimiento');
      navigate(routes.forgotPassword);
    }
  }, [token, navigate, toast]);

  const longEnough = form.password.length >= 8;
  const matches = form.confirm.length > 0 && form.password === form.confirm;
  const mismatch = form.confirm.length > 0 && form.password !== form.confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      setDone(true);
      toast.success('Contraseña restablecida');
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'Token inválido o expirado');
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Shell aside={ASIDE}>
        <Seo title="Contraseña restablecida" noindex />
        <div className="text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 ring-8 ring-green-50">
            <CheckCircle2 size={26} />
          </span>
          <h1 className="text-2xl font-bold text-brand-text">Contraseña actualizada</h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-textMuted">
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <Link to={routes.login} className="btn-primary mt-8 w-full">
            Iniciar sesión
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell aside={ASIDE}>
      <Seo title="Restablecer contraseña" noindex />

      <Link
        to={routes.login}
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-textMuted transition-colors hover:text-brand-text"
      >
        <ArrowLeft size={16} /> Volver al inicio de sesión
      </Link>

      <div className="mb-8 mt-6 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/15">
          <KeyRound size={22} />
        </span>
        <h1 className="text-2xl font-bold text-brand-text">Nueva contraseña</h1>
        <p className="mt-2 text-sm text-brand-textMuted">Crea una contraseña nueva (mínimo 8 caracteres).</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="password">Contraseña nueva</Label>
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
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={eyeBtn}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {form.password && (
            <p className={`mt-1.5 flex items-center gap-1.5 text-xs ${longEnough ? 'text-green-700' : 'text-brand-textMuted'}`}>
              {longEnough ? <Check size={14} /> : <X size={14} />} Al menos 8 caracteres
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirm">Confirmar contraseña</Label>
          <div className="relative">
            <Lock size={18} className={fieldIcon} />
            <Input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="••••••••"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={eyeBtn}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {matches && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-green-700">
              <Check size={14} /> Las contraseñas coinciden
            </p>
          )}
          {mismatch && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
              <X size={14} /> Las contraseñas no coinciden
            </p>
          )}
        </div>

        <Button type="submit" variant="primary" disabled={loading} className="h-11 w-full">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Restableciendo...
            </>
          ) : (
            'Restablecer contraseña'
          )}
        </Button>
      </form>
    </Shell>
  );
};

export default ResetPassword;