import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { Button, Input, Label } from '../../components/ui';
import {
  Mail, MailCheck, ArrowLeft, KeyRound, Loader2, HeartPulse, ShieldCheck, Clock, Send,
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../components/useToast';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';

const ASIDE = {
  badge: 'Recuperación de acceso',
  line1: 'Recupera el acceso a',
  accent: 'tu cuenta en un momento.',
  text: 'Te enviaremos un enlace seguro para que crees una contraseña nueva.',
  items: [
    { icon: Send, title: 'Enlace por correo', desc: 'Llega directo a tu bandeja de entrada' },
    { icon: Clock, title: 'Válido por 1 hora', desc: 'Caduca por tu seguridad' },
    { icon: ShieldCheck, title: 'Proceso protegido', desc: 'Nunca revelamos si un correo existe' },
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

const backLink =
  'inline-flex items-center gap-2 text-sm font-medium text-brand-textMuted transition-colors hover:text-brand-text';

export const ForgotPassword = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Si el correo está registrado, recibirás el enlace');
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'No se pudo procesar la solicitud');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Shell aside={ASIDE}>
        <Seo title="Restablecer contraseña" noindex />
        <div className="text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 ring-8 ring-green-50">
            <MailCheck size={26} />
          </span>
          <h1 className="text-2xl font-bold text-brand-text">Revisa tu correo</h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-textMuted">
            Si <span className="break-all font-semibold text-brand-text">{email}</span> está registrado,
            recibirás un enlace para restablecer tu contraseña. Expira en 1 hora.
          </p>
          <p className="mt-2 text-xs text-brand-textMuted">¿No llega? Revisa tu carpeta de spam.</p>

          <div className="mt-8 grid gap-3">
            <Link to={routes.login} className="btn-primary w-full">
              Volver al inicio de sesión
            </Link>
            <button type="button" onClick={() => setSent(false)} className="btn-ghost w-full">
              Usar otro correo
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell aside={ASIDE}>
      <Seo title="Olvidé mi contraseña" noindex />

      <Link to={routes.login} className={backLink}>
        <ArrowLeft size={16} /> Volver al inicio de sesión
      </Link>

      <div className="mb-8 mt-6 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/15">
          <KeyRound size={22} />
        </span>
        <h1 className="text-2xl font-bold text-brand-text">Restablecer contraseña</h1>
        <p className="mt-2 text-sm text-brand-textMuted">
          Ingresa tu correo y te enviaremos un enlace seguro para crear una nueva contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-textMuted" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@example.com"
              className="h-11 pl-10 text-base sm:text-sm"
            />
          </div>
        </div>

        <Button type="submit" variant="primary" disabled={loading} className="h-11 w-full">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Enviando...
            </>
          ) : (
            'Enviar enlace de restablecimiento'
          )}
        </Button>
      </form>
    </Shell>
  );
};

export default ForgotPassword;