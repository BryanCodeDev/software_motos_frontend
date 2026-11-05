import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../utils/routes';
import { Button, Input, Label } from '../../components/ui';
import {
  UserPlus, User, Mail, Lock, Eye, EyeOff, Loader2, QrCode, ClipboardList, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/useToast';
import { showApiError } from '../../utils/errors';
import Seo from '../../components/Seo';
import AuthShell from '../../components/AuthShell';

const ASIDE = {
  badge: 'Gratis y en minutos',
  line1: 'Crea tu cuenta y',
  accent: 'prepárate para lo inesperado.',
  text: 'Configura tu perfil una sola vez y tenlo disponible en cualquier emergencia.',
  items: [
    { icon: UserPlus, title: '1. Crea tu cuenta', desc: 'Solo necesitas tu correo' },
    { icon: ClipboardList, title: '2. Completa tu perfil', desc: 'Contactos y datos médicos, si quieres' },
    { icon: QrCode, title: '3. Descarga tu QR', desc: 'Ponlo a la vista y listo' },
  ],
};

const STRENGTH = [
  null,
  { label: 'Débil', bar: 'bg-orange-500', text: 'text-orange-600' },
  { label: 'Aceptable', bar: 'bg-amber-500', text: 'text-amber-600' },
  { label: 'Buena', bar: 'bg-lime-500', text: 'text-lime-600' },
  { label: 'Excelente', bar: 'bg-green-600', text: 'text-green-700' },
];

const getStrength = (p) => {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.max(s, 1);
};

const fieldIcon = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary';
const inputCls = 'h-11 pl-10 text-base sm:text-sm';

export const Register = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const strength = getStrength(form.password);
  const level = STRENGTH[strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ ...form, role: 'user' });
      toast.success('¡Cuenta creada! Ahora completa tu perfil');
      navigate(routes.home);
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'No pudimos crear tu cuenta. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell aside={ASIDE}>
      <Seo title="Crear cuenta" noindex />

      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
          <UserPlus size={22} />
        </span>
        <h1 className="text-2xl font-bold text-neutral-900">Crea tu cuenta gratis</h1>
        <p className="mt-2 text-sm text-text-secondary">Tu perfil de emergencia empieza aquí. Toma menos de dos minutos.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="name">Nombre completo</Label>
          <div className="relative">
            <User size={18} className={fieldIcon} />
            <Input
              id="name"
              autoComplete="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tu nombre"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail size={18} className={fieldIcon} />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tucorreo@ejemplo.com"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password">Contraseña</Label>
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
              className={`${inputCls} pr-11`}
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

          <div className="mt-2.5" aria-live="polite">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                    level && i <= strength ? level.bar : 'bg-border'
                  }`}
                />
              ))}
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
              <span className="text-text-secondary">Usa mayúsculas, números y símbolos para reforzarla.</span>
              {level && <span className={`flex-shrink-0 font-semibold ${level.text}`}>{level.label}</span>}
            </div>
          </div>
        </div>

        <Button type="submit" variant="primary" disabled={loading} className="h-11 w-full">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Creando tu cuenta...
            </>
          ) : (
            'Crear mi cuenta'
          )}
        </Button>

        <p className="flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-text-secondary">
          <ShieldCheck size={14} className="mt-0.5 flex-shrink-0 text-brand-500" />
          <span>
            Tú decides qué datos se muestran.{' '}
            <Link to={routes.privacy} className="font-medium text-brand-500 hover:underline">
              Cómo protegemos tu información
            </Link>
          </span>
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        ¿Ya tienes cuenta?{' '}
        <Link to={routes.login} className="font-semibold text-brand-500 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
};

export default Register;