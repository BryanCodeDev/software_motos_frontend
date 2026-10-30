import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { Button, Input, Label } from '../../components/ui';
import { UserPlus } from 'lucide-react';
import { useToast } from '../../components/useToast';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';
import { AuthLayout, PasswordField, StrengthMeter } from '../../components/AuthShell';

export const Register = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', { ...form, role: 'user' });
      toast.success('Cuenta creada correctamente');
      navigate(routes.dashboard);
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'No se pudo crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Crear cuenta" noindex />
      <AuthLayout
        icon={UserPlus}
        title="Crea tu cuenta gratuita"
        subtitle="Tu perfil de emergencia empieza aquí"
        footer={
          <>
            <p>
              ¿Ya tienes cuenta?{' '}
              <Link to={routes.login} className="text-brand-accent hover:text-brand-accentHover font-medium">
                Inicia sesión
              </Link>
            </p>
            <p className="text-xs">
              Conoce cómo protegemos tu información en nuestra{' '}
              <Link to={routes.privacy} className="underline hover:text-brand-text">
                política de privacidad
              </Link>
              .
            </p>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Juan Pérez"
            />
          </div>

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
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            hint="Mínimo 8 caracteres."
          >
            <StrengthMeter password={form.password} />
          </PasswordField>

          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>
      </AuthLayout>
    </>
  );
};

export default Register;
