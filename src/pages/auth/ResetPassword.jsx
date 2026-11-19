import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { routes } from '../../utils/routes';
import {
  Lock, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, ShieldCheck, ShieldAlert, Loader2, KeyRound, Check, X,
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
  text: 'Elige una que no uses en otros sitios.',
  items: [
    { icon: Lock, title: 'Mínimo 8 caracteres', desc: 'Mezcla letras, números y símbolos' },
    { icon: ShieldAlert, title: 'No la repitas', desc: 'Distinta a la de tus otras cuentas' },
    { icon: ShieldCheck, title: 'Enlace de un solo uso', desc: 'Deja de funcionar al cambiarla' },
  ],
};

const rise = 'opacity-0 animate-slide-up';
const delay = (ms) => ({ animationDelay: `${ms}ms` });
const fieldIcon =
  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-brand-500';
const inputCls = 'h-11 pl-10 pr-11 text-base sm:text-sm';

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
          <div className={`relative mx-auto mb-6 h-16 w-16 ${rise}`}>
            <span className="absolute inset-0 rounded-full bg-green-500/30 animate-pulse-ring" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 ring-8 ring-green-50 animate-float">
              <CheckCircle2 size={28} />
            </span>
          </div>
          <h1 className={`text-3xl font-extrabold text-neutral-900 ${rise}`} style={delay(100)}>
            ¡Contraseña actualizada!
          </h1>
          <p className={`mt-3 text-sm text-text-secondary ${rise}`} style={delay(180)}>
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <Link to={routes.login} className={`btn-primary mt-8 h-12 w-full ${rise}`} style={delay(260)}>
            Iniciar sesión
          </Link>
        </div>
      </AuthShell>
    );
  }

  const renderPasswordField = ({ id, label, value, field, placeholder, delayMs }) => (
    <div className={rise} style={delay(delayMs)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="group relative">
        <Lock size={18} className={fieldIcon} />
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={field === 'password' ? 8 : undefined}
          value={value}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-brand-500"
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <AuthShell aside={ASIDE}>
      <Seo title="Restablecer contraseña" noindex />

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
        <h1 className="text-3xl font-extrabold text-neutral-900">Nueva contraseña</h1>
        <p className="mt-2 text-sm text-text-secondary">Escríbela dos veces para confirmarla.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          {renderPasswordField({
            id: 'password',
            label: 'Contraseña nueva',
            value: form.password,
            field: 'password',
            placeholder: 'Mínimo 8 caracteres',
            delayMs: 160,
          })}
          {form.password && (
            <p
              className={`mt-1.5 flex animate-fade-in items-center gap-1.5 text-xs ${
                longEnough ? 'text-green-700' : 'text-text-secondary'
              }`}
            >
              {longEnough ? <Check size={14} /> : <X size={14} />} Al menos 8 caracteres
            </p>
          )}
        </div>

        <div>
          {renderPasswordField({
            id: 'confirm',
            label: 'Repite la contraseña',
            value: form.confirm,
            field: 'confirm',
            placeholder: 'Escríbela de nuevo',
            delayMs: 220,
          })}
          {matches && (
            <p className="mt-1.5 flex animate-fade-in items-center gap-1.5 text-xs text-green-700">
              <Check size={14} /> Las contraseñas coinciden
            </p>
          )}
          {mismatch && (
            <p className="mt-1.5 flex animate-fade-in items-center gap-1.5 text-xs text-red-600">
              <X size={14} /> Las contraseñas no coinciden
            </p>
          )}
        </div>

        <div className={rise} style={delay(300)}>
          <Button type="submit" variant="primary" disabled={loading} className="group h-12 w-full text-base">
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Guardando...
              </>
            ) : (
              <>
                Guardar contraseña
                <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
};

export default ResetPassword;