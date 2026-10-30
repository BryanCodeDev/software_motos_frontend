import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { Button, Input, Label, Card } from '../../components/ui';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/useToast';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';

export const Register = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ ...form, role: 'user' });
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
    <main className="min-h-screen flex items-center justify-center py-20 px-4">
      <Seo title="Crear cuenta" noindex />
      <Card className="w-full max-w-md p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-brand-accent flex items-center justify-center mx-auto mb-3 text-brand-dark font-bold">
            <UserPlus size={20} />
          </div>
          <h2 className="text-2xl font-bold text-brand-text">Crear cuenta gratuita</h2>
          <p className="text-brand-textMuted text-sm mt-2">
            Tu perfil de emergencia empieza aquí
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre completo</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Juan Pérez"
            />
          </div>
          <div className="space-y-2">
            <Label>Correo electrónico</Label>
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="juan@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Contraseña</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textMuted hover:text-brand-text"
                aria-label="Mostrar contraseña"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-[11px] text-brand-textMuted mt-1">
              Mínimo 8 caracteres.
            </p>
          </div>
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-textMuted">
          ¿Ya tienes cuenta?{' '}
          <Link to={routes.login} className="text-brand-accent hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </main>
  );
};

export default Register;


