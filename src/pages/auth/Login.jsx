import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { routes } from '../../utils/routes';
import { Button, Input, Label } from '../../components/ui';
import {
  LogIn, Mail, Lock, Eye, EyeOff, Loader2, HeartPulse, QrCode, Siren, ArrowRight, UserPlus,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/useToast';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';
import AuthShell from '../../components/AuthShell';

const emailSchema = z.string().email('Ingresa un correo válido');

const ASIDE = {
  badge: 'Tu QR te cuida',
  line1: 'Bienvenido de vuelta,',
  accent: 'tu perfil te espera.',
  text: 'Mantén al día lo que importa en una emergencia.',
  items: [
    { icon: QrCode, title: 'Tu QR', desc: 'Descárgalo o desactívalo cuando quieras' },
    { icon: HeartPulse, title: 'Tus datos médicos', desc: 'Siempre actualizados' },
    { icon: Siren, title: 'Tus contactos', desc: 'A quién avisar' },
  ],
};

const rise = 'opacity-0 animate-slide-up';
const delay = (ms) => ({ animationDelay: `${ms}ms` });
const fieldIcon =
  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-brand-500';
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
    <AuthShell aside={ASIDE} bgImage="/herosection-login.webp" showFooter={false}>
      <Seo title="Iniciar sesión" noindex />

      <div className={`mb-8 text-center ${rise}`}>
        <div className="relative mx-auto mb-5 h-14 w-14">
          <span className="absolute inset-0 rounded-2xl bg-brand-500/40 animate-pulse-ring" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow animate-float">
            <LogIn size={24} />
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-neutral-900">Inicia sesión</h1>
        <p className="mt-2 text-sm text-text-secondary">Gestiona tu perfil y tu QR</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className={rise} style={delay(100)}>
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="group relative">
            <Mail size={18} className={fieldIcon} />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              className={inputCls}
              error={!!errors.email}
              {...register('email', {
                validate: (v) => emailSchema.safeParse(v).success || 'Ingresa un correo válido',
              })}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 animate-fade-in text-xs text-rose-600">{errors.email.message}</p>
          )}
        </div>

        <div className={rise} style={delay(180)}>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <Label htmlFor="password" className="!mb-0">Contraseña</Label>
            <Link to={routes.forgotPassword} className="text-sm font-medium text-brand-500 hover:underline">
              ¿La olvidaste?
            </Link>
          </div>
          <div className="group relative">
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
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-brand-500"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 animate-fade-in text-xs text-rose-600">{errors.password.message}</p>
          )}
        </div>

        <div className={rise} style={delay(260)}>
          <Button type="submit" variant="primary" disabled={loading} className="group h-12 w-full text-base">
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Ingresando...
              </>
            ) : (
              <>
                Ingresar
                <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>
      </form>

      <div className={`mt-6 text-center text-sm text-text-secondary ${rise}`} style={delay(340)}>
        ¿Aún no tienes cuenta?
        <Link to={routes.register} className="btn-outline mt-3 w-full">
          <UserPlus size={18} className="text-brand-500" />
          Crear cuenta gratis
        </Link>
      </div>
    </AuthShell>
  );
};

export default Login;