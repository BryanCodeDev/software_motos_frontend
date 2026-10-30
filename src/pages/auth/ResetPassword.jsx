import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { Mail, Lock, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Label, Card } from '../../components/ui';
import { useToast } from '../../components/useToast';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Falta el token de restablecimiento');
      navigate(routes.forgotPassword);
    }
  }, [token, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      setDone(true);
      toast.success('Contraseña restablecida');
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'Token inválido o expirado');
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center py-20 px-4">
        <Seo title="Contraseña restablecida" noindex />
        <Card className="w-full max-w-md p-8 md:p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-green-600">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-2xl font-bold text-brand-text mb-3">Contraseña actualizada</h2>
          <p className="text-brand-textMuted mb-8">
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <Link to={routes.login} className="btn-primary">
            Iniciar sesión
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-20 px-4">
      <Seo title="Restablecer contraseña" noindex />
      <Card className="w-full max-w-md p-8 md:p-12">
        <div className="flex items-center gap-2 mb-6">
          <ArrowLeft size={16} className="text-brand-textMuted" />
          <Link to={routes.login} className="text-sm text-brand-textMuted hover:text-brand-text">
            Volver al inicio de sesión
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-brand-text mb-2">Nueva contraseña</h2>
        <p className="text-brand-textMuted mb-8">
          Crea una contraseña nueva (mínimo 8 caracteres).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Contraseña nueva</Label>
            <div className="relative">
              <Input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textMuted hover:text-brand-text"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Confirmar contraseña</Label>
            <Input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
          </Button>
        </form>
      </Card>
    </main>
  );
};

export default ResetPassword;


