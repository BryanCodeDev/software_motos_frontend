import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { Button, Input, Label } from '../../components/ui';
import {
  Mail, Lock, ArrowRight, CheckCircle2, AlertTriangle, Loader2, RefreshCw,
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
        <span className="text-lg font-bold tracking-tight">Verificar tu correo</span>
      </div>

      <div className="relative max-w-md">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ring-white/20">
          <CheckCircle2 size={14} /> Paso 2 de 2
        </span>
        <p className="mt-6 text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
          Casi listo
        </p>
        <p className="mt-5 text-base leading-relaxed text-white/75">
          Te enviamos un código de 5 dígitos a tu correo. Ingrésalo aquí para activar tu cuenta.
        </p>
        <ul className="mt-10 grid gap-3">
          <li className="flex items-center gap-4 rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white/15">
              <Lock size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold">Código de verificación</p>
              <p className="text-sm text-white/70">5 dígitos enviados a tu correo</p>
            </div>
          </li>
          <li className="flex items-center gap-4 rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white/15">
              <Mail size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold">Reenvío de código</p>
              <p className="text-sm text-white/70">¿No llegó el código? Solicita otro</p>
            </div>
          </li>
        </ul>
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
          <span className="text-base font-bold tracking-tight text-neutral-900">Verificar tu correo</span>
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

export const VerifyEmail = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, verifyEmail, resendVerification } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState(user?.email || '');

  const isCodeValid = /^\d{5}$/.test(code);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isCodeValid) return;
    setLoading(true);
    try {
      await verifyEmail({ email, code });
      toast.success('Cuenta verificada correctamente');
      navigate(routes.dashboard);
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'Código inválido o expirado');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification({ email });
      toast.success('Código reenviado a tu correo');
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'No se pudo reenviar el código');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <Shell aside={null}>
      <Seo title="Verificar tu correo" noindex />

      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
          <Mail size={22} />
        </span>
        <h1 className="text-2xl font-bold text-neutral-900">Verifica tu correo</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Ingresa el código de 5 dígitos que te enviamos a <span className="font-semibold text-neutral-900">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="code">Código de verificación</Label>
          <div className="relative">
            <Mail size={18} className={fieldIcon} />
            <Input
              id="code"
              maxLength={5}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="12345"
              className={`${inputCls} text-center tracking-widest font-mono`}
              inputMode="numeric"
            />
          </div>
          <p className="mt-1.5 text-xs text-text-secondary">
            Código de 5 dígitos. Expira en 15 minutos.
          </p>
        </div>

        <Button type="submit" variant="primary" disabled={loading || !isCodeValid} className="h-11 w-full">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Verificando...
            </>
          ) : (
            <>
              <ArrowRight size={16} /> Verificar y activar cuenta
            </>
          )}
        </Button>

        <div className="mt-4 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={resending}
            onClick={handleResend}
            className="w-full h-11 text-sm"
          >
            {resending ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Reenviando...
              </>
            ) : (
              <>
                <RefreshCw size={16} /> Reenviar código
              </>
            )}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        ¿No tienes cuenta?{' '}
        <Link to={routes.register} className="font-semibold text-brand-500 hover:underline">
          Crear cuenta
        </Link>
      </p>
    </Shell>
  );
};

export default VerifyEmail;


