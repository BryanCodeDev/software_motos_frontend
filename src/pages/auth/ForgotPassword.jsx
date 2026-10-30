import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { Button, Input, Label, Card } from '../../components/ui';
import { Mail, ArrowLeft } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../components/useToast';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';

export const ForgotPassword = () => {
  const navigate = useNavigate();
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
      <main className="min-h-screen flex items-center justify-center py-20 px-4">
        <Seo title="Restablecer contraseña" noindex />
        <Card className="w-full max-w-md p-8 md:p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-green-600">
            <Mail size={24} />
          </div>
          <h2 className="text-2xl font-bold text-brand-text mb-3">Revisa tu correo</h2>
          <p className="text-brand-textMuted mb-8">
            Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Expira en 1 hora.
          </p>
          <Link to={routes.login} className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-black/10 text-brand-text hover:bg-black/5">
            Volver al inicio de sesión
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-20 px-4">
      <Seo title="Olvidé mi contraseña" noindex />
      <Card className="w-full max-w-md p-8 md:p-12">
        <div className="flex items-center gap-2 mb-6">
          <ArrowLeft size={16} className="text-brand-textMuted" />
          <Link to={routes.login} className="text-sm text-brand-textMuted hover:text-brand-text">
            Volver al inicio de sesión
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-brand-text mb-2">Restablecer contraseña</h2>
        <p className="text-brand-textMuted mb-8">
          Ingresa tu correo y te enviaremos un enlace seguro para crear una nueva contraseña.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Correo electrónico</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@example.com"
            />
          </div>
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? 'Enviando...' : 'Enviar enlace de restablecimiento'}
          </Button>
        </form>
      </Card>
    </main>
  );
};

export default ForgotPassword;