import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Users, ShieldCheck, QrCode, Package, ArrowRight, Check, ChevronRight, AlertTriangle, RefreshCw, Lock,
} from 'lucide-react';
import { routes } from '../../utils/routes';
import { useAuth } from '../../contexts/useAuth';
import { PageTitle } from '../../components/DashPage';
import api from '../../api/client';

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const STEPS = [
  { key: 'profile', label: 'Perfil', desc: 'Tu nombre y datos médicos', to: routes.dashboardProfile, icon: User },
  { key: 'contacts', label: 'Contactos', desc: 'Al menos una persona de confianza', to: routes.dashboardContacts, icon: Users },
  { key: 'privacy', label: 'Privacidad', desc: 'Qué ve quien escanea tu QR', to: routes.dashboardPrivacy, icon: ShieldCheck },
  { key: 'qr', label: 'Mi QR', desc: 'Actívalo y descárgalo', to: routes.dashboardQr, icon: QrCode },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const Skeleton = () => (
  <div className="animate-pulse space-y-6" aria-busy="true" aria-live="polite">
    <div className="h-8 w-64 rounded-lg bg-border/60" />
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="h-80 rounded-2xl bg-border/60 lg:col-span-2" />
      <div className="h-56 rounded-2xl bg-border/60" />
    </div>
  </div>
);

export const DashboardIndex = () => {
  const { user } = useAuth();
  const fullName = user?.name || user?.email?.split('@')[0];
  const firstName = fullName ? fullName.trim().split(' ')[0] : null;

  const [steps, setSteps] = useState({ profile: false, contacts: false, privacy: false, qr: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        api.get('/profiles/me'),
        api.get('/contacts'),
        api.get('/identifiers/my'),
      ]);
      const [profRes, contactsRes, identifiersRes] = results;

      // Si todo falló es un problema real de red o servidor (un 404 del QR es normal).
      if (results.every((r) => r.status === 'rejected')) {
        setError('No se pudo cargar tu panel');
        return;
      }

      const next = { profile: false, contacts: false, privacy: false, qr: false };

      if (profRes.status === 'fulfilled') {
        const p = profRes.value.data.profile || profRes.value.data;
        next.profile = !!(p?.display_name && p.display_name.trim());
      }
      if (contactsRes.status === 'fulfilled') {
        const list = contactsRes.value.data.contacts || contactsRes.value.data || [];
        next.contacts = list.length > 0;
      }
      if (identifiersRes.status === 'fulfilled') {
        const id = identifiersRes.value.data.identifier || identifiersRes.value.data;
        next.qr = id?.status === 'active';
      }
      next.privacy = next.profile;

      setSteps(next);
    } catch {
      setError('No se pudo cargar tu panel');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const doneCount = STEPS.filter((s) => steps[s.key]).length;
  const pct = Math.round((doneCount / STEPS.length) * 100);
  const next = STEPS.find((s) => !steps[s.key]) || null;

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <AlertTriangle size={22} aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-neutral-900">{error}</h2>
        <p className="mt-1 text-sm text-text-secondary">Revisa tu conexión e inténtalo de nuevo.</p>
        <button type="button" onClick={load} className="btn-primary mt-6 px-5 py-2.5 text-sm">
          <RefreshCw size={16} aria-hidden="true" /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5 lg:space-y-6">
      <PageTitle
        title={firstName ? `${greeting()}, ${firstName}` : 'Mi panel'}
        description={next ? 'Completa los pasos para activar tu QR.' : 'Tu QR está listo para usarse.'}
      />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* Pasos: es la única lista de navegación del panel */}
        <section className={`${panel} p-5 sm:p-6 lg:col-span-2`} aria-labelledby="steps-title">
          <div className="mb-5">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 id="steps-title" className="text-base font-semibold text-neutral-900">Tu progreso</h2>
              <p className="text-sm text-text-secondary">{doneCount} de {STEPS.length} pasos</p>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-border/70"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso de activación"
            >
              <div className="h-full rounded-full bg-brand-500 transition-[width] duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <ol className="space-y-2">
            {STEPS.map((step) => {
              const done = steps[step.key];
              const isNext = next?.key === step.key;
              const Icon = step.icon;
              return (
                <li key={step.key}>
                  <Link
                    to={step.to}
                    className={`group flex items-center gap-3 rounded-xl border p-3.5 transition-colors focus-ring ${
                      isNext
                        ? 'border-brand-500/40 bg-brand-50 hover:border-brand-500/60'
                        : 'border-border bg-white hover:border-brand-500/30 hover:bg-brand-50/50'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${
                        done
                          ? 'bg-emerald-100 text-emerald-700'
                          : isNext
                            ? 'bg-brand-500 text-white'
                            : 'bg-brand-50 text-text-secondary'
                      }`}
                    >
                      {done ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : <Icon size={17} aria-hidden="true" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-neutral-900">
                        {step.label}
                        {done && <span className="sr-only"> (completado)</span>}
                      </span>
                      <span className="block truncate text-xs text-text-secondary">{step.desc}</span>
                    </span>
                    {isNext && <span className="hidden text-sm font-semibold text-brand-500 sm:inline">Continuar</span>}
                    <ChevronRight
                      size={16}
                      className="flex-none text-text-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Estado del QR y pedidos */}
        <aside className="space-y-3" aria-label="Estado del QR">
          <div className={`${panel} p-5 sm:p-6`}>
            <span
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                steps.qr ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-500/10 text-brand-500'
              }`}
            >
              {steps.qr ? <QrCode size={22} aria-hidden="true" /> : <Lock size={22} aria-hidden="true" />}
            </span>
            <h2 className="text-base font-semibold text-neutral-900">
              {steps.qr ? 'Tu QR está activo' : 'Tu QR aún no está activo'}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
              {steps.qr ? (
                'Descárgalo y ponlo a la vista.'
              ) : (
                <>
                  Se activa con un pago único de <span className="font-bold text-neutral-900">$30.000 COP</span>, sin suscripción.
                </>
              )}
            </p>
            <Link to={routes.dashboardQr} className="btn-primary mt-5 w-full px-5 py-2.5 text-sm">
              {steps.qr ? 'Descargar mi QR' : 'Activar mi QR'} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <Link
            to={routes.dashboardOrders}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-500/30 hover:bg-brand-50/50 focus-ring"
          >
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
              <Package size={17} aria-hidden="true" />
            </span>
            <span className="flex-1 text-sm font-semibold text-neutral-900">Mis pedidos</span>
            <ChevronRight size={16} className="text-text-secondary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  );
};

export default DashboardIndex;