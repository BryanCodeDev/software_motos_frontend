import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { Button, Input, Label } from '../../components/ui';
import { LogIn } from 'lucide-react';
import { useToast } from '../../components/useToast';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';
import { AuthLayout, PasswordField } from '../../components/AuthShell';

export const Login = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/login', form);
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
    <>
      <Seo title="Iniciar sesión" noindex />
      <AuthLayout
        icon={LogIn}
        title="Bienvenido de nuevo"
        subtitle="Accede a tu perfil de emergencia"
        footer={
          <p>
            ¿No tienes cuenta?{' '}
            <Link to={routes.register} className="text-brand-accent hover:text-brand-accentHover font-medium">
              Créala gratis
            </Link>
          </p>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="juan@ejemplo.com"
            />
          </div>

          <PasswordField
            id="password"
            label="Contraseña"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            labelAside={
              <Link
                to={routes.forgotPassword}
                className="text-xs text-brand-accent hover:text-brand-accentHover font-medium"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            }
          />

          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
      </AuthLayout>
    </>
  );
};

export default Login;
