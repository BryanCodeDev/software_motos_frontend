import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { routes } from '../../utils/routes';
import { Button, Input, Label } from '../../components/ui';
import {
  LogIn, Mail, Lock, Eye, EyeOff, Loader2, HeartPulse, ShieldCheck, QrCode, Siren, UserPlus,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/useToast';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';
import AuthShell from '../../components/AuthShell';

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'Escribe tu contraseña'),
});

const ASIDE = {
  badge: 'Acceso seguro',
  line1: 'Qué bueno verte,',
  accent: 'tu perfil te está esperando.',
  text: 'Revisa o actualiza lo que quieres tener a mano si algún día no puedes hablar.',
  items: [
    { icon: QrCode, title: 'Tu QR de emergencia', desc: 'Descárgalo o desactívalo cuando quieras' },
    { icon: HeartPulse, title: 'Tus datos médicos', desc: 'Mantenlos al día' },
    { icon: Siren, title: 'Tus contactos', desc: 'A quién avisar en una emergencia' },
    { icon: ShieldCheck, title: 'Tu privacidad', desc: 'Tú decides qué se muestra' },
  ],
};

const fieldIcon = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary';
const inputCls = 'h-11 pl-10 text-base sm:text-sm';

export const Login = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data);
      toast.success('Sesión iniciada');
      navigate(routes.dashboard);
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'Correo o contraseña incorrectos');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell aside={ASIDE}>
      <Seo title="Iniciar sesión" noindex />

      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
          <LogIn size={22} />
        </span>
        <h1 className="text-2xl font-bold text-neutral-900">Inicia sesión</h1>
        <p className="mt-2 text-sm text-text-secondary">Entra para gestionar tu perfil y tu QR</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail size={18} className={fieldIcon} />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              className={inputCls}
              error={!!errors.email}
              {...register('email', {
                validate: (v) => loginSchema.shape.email.safeParse(v).success || 'Ingresa un correo electrónico válido',
              })}
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-rose-600">{errors.email.message}</p>}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <Label htmlFor="password" className="!mb-0">Contraseña</Label>
            <Link to={routes.forgotPassword} className="text-sm font-medium text-brand-500 hover:underline">
              ¿La olvidaste?
            </Link>
          </div>
          <div className="relative">
            <Lock size={18} className={fieldIcon} />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              className={`${inputCls} pr-11`}
              error={!!errors.password}
              {...register('password', { required: 'Escribe tu contraseña' })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-neutral-900"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-rose-600">{errors.password.message}</p>}
        </div>

        <Button type="submit" variant="primary" disabled={loading} className="h-11 w-full">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Ingresando...
            </>
          ) : (
            'Ingresar'
          )}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-text-secondary">
        <span className="h-px flex-1 bg-border" />
        ¿Aún no tienes cuenta?
        <span className="h-px flex-1 bg-border" />
      </div>

      <Link to={routes.register} className="btn-outline w-full">
        <UserPlus size={18} className="text-brand-500" />
        Crear cuenta gratis
      </Link>
    </AuthShell>
  );
};

export default Login;