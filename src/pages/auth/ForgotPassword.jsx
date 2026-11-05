import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { Button, Input, Label } from '../../components/ui';
import { Mail, MailCheck, ArrowLeft, KeyRound, Loader2, ShieldCheck, Clock, Send } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../components/useToast';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';
import AuthShell from '../../components/AuthShell';

const ASIDE = {
  badge: 'Recuperación de acceso',
  line1: 'Recupera tu cuenta',
  accent: 'en un par de minutos.',
  text: 'Te enviaremos un enlace seguro para que crees una contraseña nueva.',
  items: [
    { icon: Send, title: 'Enlace por correo', desc: 'Llega directo a tu bandeja de entrada' },
    { icon: Clock, title: 'Válido por 1 hora', desc: 'Caduca por tu seguridad' },
    { icon: ShieldCheck, title: 'Proceso protegido', desc: 'Nunca revelamos si un correo está registrado' },
  ],
};

const backLink =
  'inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-neutral-900';

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
        toast.error(err.message || 'No pudimos procesar la solicitud. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell aside={ASIDE}>
        <Seo title="Restablecer contraseña" noindex />
        <div className="text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 ring-8 ring-green-50">
            <MailCheck size={26} />
          </span>
          <h1 className="text-2xl font-bold text-neutral-900">Revisa tu correo</h1>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Si <span className="break-all font-semibold text-neutral-900">{email}</span> está registrado,
            te enviamos un enlace para crear una contraseña nueva. Es válido por 1 hora.
          </p>
          <p className="mt-2 text-xs text-text-secondary">¿No llega? Revisa tu carpeta de spam.</p>

          <div className="mt-8 grid gap-3">
            <Link to={routes.login} className="btn-primary w-full">
              Volver a iniciar sesión
            </Link>
            <button type="button" onClick={() => setSent(false)} className="btn-ghost w-full">
              Usar otro correo
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell aside={ASIDE}>
      <Seo title="Olvidé mi contraseña" noindex />

      <Link to={routes.login} className={backLink}>
        <ArrowLeft size={16} /> Volver a iniciar sesión
      </Link>

      <div className="mb-8 mt-6 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
          <KeyRound size={22} />
        </span>
        <h1 className="text-2xl font-bold text-neutral-900">¿Olvidaste tu contraseña?</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Escribe tu correo y te enviaremos un enlace para crear una nueva.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
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
            'Enviarme el enlace'
          )}
        </Button>
      </form>
    </AuthShell>
  );
};

export default ForgotPassword;