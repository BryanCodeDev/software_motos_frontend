import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { routes } from '../../utils/routes';
import {
  Lock, ArrowLeft, CheckCircle2, Eye, EyeOff, ShieldCheck, ShieldAlert, Loader2, KeyRound, Check, X,
} from 'lucide-react';
import { Button, Input, Label } from '../../components/ui';
import { useToast } from '../../components/useToast';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';
import AuthShell from '../../components/AuthShell';

const ASIDE = {
  badge: 'Último paso',
  line1: 'Crea una contraseña',
  accent: 'nueva y segura.',
  text: 'Elige una que no uses en otros sitios para mantener tu perfil protegido.',
  items: [
    { icon: Lock, title: 'Mínimo 8 caracteres', desc: 'Mezcla letras, números y símbolos' },
    { icon: ShieldAlert, title: 'No la repitas', desc: 'Usa una distinta a las de tus otras cuentas' },
    { icon: ShieldCheck, title: 'Enlace de un solo uso', desc: 'Deja de funcionar al cambiar la contraseña' },
  ],
};

const fieldIcon = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary';
const inputCls = 'h-11 pl-10 pr-11 text-base sm:text-sm';
const eyeBtn =
  'absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-neutral-900';

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
      toast.error('El enlace no es válido. Solicita uno nuevo.');
      navigate(routes.forgotPassword);
    }
  }, [token, navigate, toast]);

  const longEnough = form.password.length >= 8;
  const matches = form.confirm.length > 0 && form.password === form.confirm;
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
      toast.success('Contraseña actualizada');
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'El enlace expiró o ya fue usado. Solicita uno nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell aside={ASIDE}>
        <Seo title="Contraseña actualizada" noindex />
        <div className="text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 ring-8 ring-green-50">
            <CheckCircle2 size={26} />
          </span>
          <h1 className="text-2xl font-bold text-neutral-900">¡Contraseña actualizada!</h1>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <Link to={routes.login} className="btn-primary mt-8 w-full">
            Iniciar sesión
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell aside={ASIDE}>
      <Seo title="Restablecer contraseña" noindex />

      <Link
        to={routes.login}
        className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-neutral-900"
      >
        <ArrowLeft size={16} /> Volver a iniciar sesión
      </Link>

      <div className="mb-8 mt-6 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
          <KeyRound size={22} />
        </span>
        <h1 className="text-2xl font-bold text-neutral-900">Crea tu nueva contraseña</h1>
        <p className="mt-2 text-sm text-text-secondary">Escríbela dos veces para confirmar que es la correcta.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="password">Contraseña nueva</Label>
          <div className="relative">
            <Lock size={18} className={fieldIcon} />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={eyeBtn}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {form.password && (
            <p className={`mt-1.5 flex items-center gap-1.5 text-xs ${longEnough ? 'text-green-700' : 'text-text-secondary'}`}>
              {longEnough ? <Check size={14} /> : <X size={14} />} Al menos 8 caracteres
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirm">Repite la contraseña</Label>
          <div className="relative">
            <Lock size={18} className={fieldIcon} />
            <Input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Escríbela de nuevo"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={eyeBtn}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {matches && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-green-700">
              <Check size={14} /> Las contraseñas coinciden
            </p>
          )}
          {mismatch && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
              <X size={14} /> Las contraseñas no coinciden
            </p>
          )}
        </div>

        <Button type="submit" variant="primary" disabled={loading} className="h-11 w-full">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Guardando...
            </>
          ) : (
            'Guardar contraseña nueva'
          )}
        </Button>
      </form>
    </AuthShell>
  );
};

export default ResetPassword;