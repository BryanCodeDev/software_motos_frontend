import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { Button, Input, Label } from '../../components/ui';
import {
  Mail, Lock, ArrowRight, CheckCircle2, Loader2, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/useToast';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';

const Shell = ({ aside, children }) => (
  <main className="grid min-h-screen bg-brand-50 lg:grid-cols-[1.05fr_1fr]">
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-500 via-[#7d0f2e] to-[#3f0617] p-12 text-white lg:flex xl:p-16">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-black/25 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
          <Mail size={20} />
        </span>
          <span className="text-lg font-bold tracking-tight">Reenviar código</span>
      </div>

      <div className="relative max-w-md">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ring-white/20">
          <CheckCircle2 size={14} /> Paso 2 de 2
        </span>
        <p className="mt-6 text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
          Reenviar código
        </p>
        <p className="mt-5 text-base leading-relaxed text-white/75">
          ¿No recibiste el código? Solicítalo nuevamente y revisa tu bandeja de entrada y spam.
        </p>
      </div>

      <p className="relative text-xs text-white/55">
        © {new Date().getFullYear()} Tu QR te Cuida. Todos los derechos reservados.
      </p>
    </aside>

    <section className="flex items-center justify-center px-4 py-10 sm:px-8">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Mail size={18} />
          </span>
          <span className="text-base font-bold tracking-tight text-neutral-900">Reenviar código</span>
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

export const ResendVerification = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { resendVerification } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resendVerification({ email });
      toast.success('Código reenviado a ' + email);
      navigate(routes.verifyEmail);
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'No se pudo reenviar el código');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell aside={null}>
      <Seo title="Reenviar código de verificación" noindex />

      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
          <Mail size={22} />
        </span>
        <h1 className="text-2xl font-bold text-neutral-900">Reenviar código</h1>
        <p className="mt-2 text-sm text-text-secondary">Ingresa tu correo para recibir un nuevo código de verificación</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail size={18} className={fieldIcon} />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@example.com"
              className={inputCls}
            />
          </div>
        </div>

        <Button type="submit" variant="primary" disabled={loading} className="h-11 w-full">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Enviando...
            </>
          ) : (
            <>
              <ArrowRight size={16} /> Enviar código
            </>
          )}
        </Button>
      </form>

      <div className="mt-8 flex items-center gap-3 text-xs uppercase tracking-wider text-text-secondary">
        <span className="h-px flex-1 bg-border" />
        Ya tienes el código?
        <span className="h-px flex-1 bg-border" />
      </div>

      <Link to={routes.verifyEmail} className="btn-outline w-full">
        <Mail size={18} className="text-brand-500" />
        Verificar código
      </Link>
    </Shell>
  );
};

export default ResendVerification;



