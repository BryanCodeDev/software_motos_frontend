import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { Button, Input, Label } from '../../components/ui';
import { Mail, MailCheck, ArrowLeft, ArrowRight, KeyRound, Loader2, ShieldCheck, Clock, Send } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../components/useToast';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';
import AuthShell from '../../components/AuthShell';

const ASIDE = {
  badge: 'Recuperar acceso',
  line1: 'Recupera tu cuenta',
  accent: 'en un par de minutos.',
  text: 'Te enviaremos un enlace seguro para crear una contraseña nueva.',
  items: [
    { icon: Send, title: 'Enlace por correo', desc: 'Directo a tu bandeja de entrada' },
    { icon: Clock, title: 'Válido por 1 hora', desc: 'Caduca por tu seguridad' },
    { icon: ShieldCheck, title: 'Proceso protegido', desc: 'No revelamos si un correo está registrado' },
  ],
};

const rise = 'opacity-0 animate-slide-up';
const delay = (ms) => ({ animationDelay: `${ms}ms` });

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
        <Seo title="Revisa tu correo" noindex />
        <div className="text-center">
          <div className={`relative mx-auto mb-6 h-16 w-16 ${rise}`}>
            <span className="absolute inset-0 rounded-full bg-green-500/30 animate-pulse-ring" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 ring-8 ring-green-50 animate-float">
              <MailCheck size={28} />
            </span>
          </div>
          <h1 className={`text-3xl font-extrabold text-neutral-900 ${rise}`} style={delay(100)}>
            Revisa tu correo
          </h1>
          <p className={`mt-3 text-sm leading-relaxed text-text-secondary ${rise}`} style={delay(180)}>
            Si <span className="break-all font-semibold text-neutral-900">{email}</span> está registrado,
            recibirás un enlace válido por 1 hora. ¿No llega? Revisa spam.
          </p>

          <div className={`mt-8 grid gap-3 ${rise}`} style={delay(260)}>
            <Link to={routes.login} className="btn-primary h-12 w-full">
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

      <Link
        to={routes.login}
        className={`group inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-brand-500 ${rise}`}
      >
        <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
        Volver
      </Link>

      <div className={`mb-8 mt-6 text-center ${rise}`} style={delay(80)}>
        <div className="relative mx-auto mb-5 h-14 w-14">
          <span className="absolute inset-0 rounded-2xl bg-brand-500/40 animate-pulse-ring" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow animate-float">
            <KeyRound size={24} />
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-neutral-900">¿Olvidaste tu contraseña?</h1>
        <p className="mt-2 text-sm text-text-secondary">Te enviamos un enlace para crear una nueva.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className={rise} style={delay(160)}>
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="group relative">
            <Mail
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-brand-500"
            />
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

        <div className={rise} style={delay(240)}>
          <Button type="submit" variant="primary" disabled={loading} className="group h-12 w-full text-base">
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Enviando...
              </>
            ) : (
              <>
                Enviarme el enlace
                <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
};

export default ForgotPassword;