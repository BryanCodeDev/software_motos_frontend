import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { Button, Input, Label } from '../../components/ui';
import { Mail, KeyRound } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../components/useToast';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';
import { AuthLayout, AuthSuccess } from '../../components/AuthShell';

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
      <>
        <Seo title="Restablecer contraseña" noindex />
        <AuthSuccess
          icon={Mail}
          title="Revisa tu correo"
          text="Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Expira en 1 hora."
        >
          <Link to={routes.login} className="btn-outline">
            Volver al inicio de sesión
          </Link>
        </AuthSuccess>
      </>
    );
  }

  return (
    <>
      <Seo title="Olvidé mi contraseña" noindex />
      <AuthLayout
        icon={KeyRound}
        title="Restablecer contraseña"
        subtitle="Ingresa tu correo y te enviaremos un enlace seguro para crear una nueva contraseña."
        back={{ to: routes.login, label: 'Volver al inicio de sesión' }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@ejemplo.com"
            />
          </div>
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? 'Enviando...' : 'Enviar enlace de restablecimiento'}
          </Button>
        </form>
      </AuthLayout>
    </>
  );
};

export default ForgotPassword;
