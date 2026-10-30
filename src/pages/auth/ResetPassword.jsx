import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui';
import { useToast } from '../../components/useToast';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';
import { AuthLayout, AuthSuccess, PasswordField, StrengthMeter } from '../../components/AuthShell';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ password: '', confirm: '' });

  useEffect(() => {
    if (!token) {
      toast.error('Falta el token de restablecimiento');
      navigate(routes.forgotPassword);
    }
  }, [token, navigate, toast]);

  const mismatch = form.confirm.length > 0 && form.password !== form.confirm;

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

  if (!token) return null;

  if (done) {
    return (
      <>
        <Seo title="Contraseña restablecida" noindex />
        <AuthSuccess
          icon={CheckCircle2}
          title="Contraseña actualizada"
          text="Ya puedes iniciar sesión con tu nueva contraseña."
        >
          <Link to={routes.login} className="btn-primary">
            Iniciar sesión
          </Link>
        </AuthSuccess>
      </>
    );
  }

  return (
    <>
      <Seo title="Restablecer contraseña" noindex />
      <AuthLayout
        icon={Lock}
        title="Nueva contraseña"
        subtitle="Crea una contraseña nueva (mínimo 8 caracteres)."
        back={{ to: routes.login, label: 'Volver al inicio de sesión' }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordField
            id="password"
            label="Contraseña nueva"
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          >
            <StrengthMeter password={form.password} />
          </PasswordField>

          <PasswordField
            id="confirm"
            label="Confirmar contraseña"
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          >
            {mismatch && (
              <p className="text-xs text-rose-400" role="alert">
                Las contraseñas no coinciden.
              </p>
            )}
          </PasswordField>

          <Button type="submit" variant="primary" disabled={loading || mismatch} className="w-full">
            {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
          </Button>
        </form>
      </AuthLayout>
    </>
  );
};

export default ResetPassword;
