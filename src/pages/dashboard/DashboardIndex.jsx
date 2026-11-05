import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  User, Users, ShieldCheck, QrCode, Package, ArrowRight, CheckCircle2, ChevronRight,
  AlertTriangle, Loader2, Clock, CreditCard,
} from 'lucide-react';
import { routes } from '../../utils/routes';
import { useAuth } from '../../contexts/useAuth';
import { PageTitle } from '../../components/DashPage';
import api from '../../api/client';
import {
  StatCard, Badge, StepIndicator, EmptyState, LoadingCard,
} from '../../components/ui-kit';

const nf = new Intl.NumberFormat('es-CO');
const fmt = (n) => (n === undefined || n === null ? '—' : nf.format(Number(n)));

const getNested = (obj, path) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);

const STEPS = [
  { label: 'Perfil', to: routes.dashboardProfile, icon: User, key: 'profile' },
  { label: 'Contactos', to: routes.dashboardContacts, icon: Users, key: 'contacts' },
  { label: 'Privacidad', to: routes.dashboardPrivacy, icon: ShieldCheck, key: 'privacy' },
  { label: 'Mi QR', to: routes.dashboardQr, icon: QrCode, key: 'qr' },
];

const QUICK_ACTIONS = [
  { to: routes.dashboardProfile, label: 'Perfil', desc: 'Datos personales y médicos', icon: User, tone: 'bg-brand-500/10 text-brand-500' },
  { to: routes.dashboardContacts, label: 'Contactos', desc: 'Personas de confianza', icon: Users, tone: 'bg-emerald-50 text-emerald-700' },
  { to: routes.dashboardPrivacy, label: 'Privacidad', desc: 'Visibilidad de campos', icon: ShieldCheck, tone: 'bg-sky-50 text-sky-700' },
  { to: routes.dashboardQr, label: 'Mi QR', desc: 'Código y enlace público', icon: QrCode, tone: 'bg-amber-50 text-amber-700' },
  { to: routes.dashboardOrders, label: 'Pedidos', desc: 'Estado y pagos', icon: Package, tone: 'bg-slate-100 text-slate-700' },
];

const Skeleton = () => (
  <div className="space-y-6 animate-pulse" aria-busy="true">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-48 rounded-2xl bg-border/60" />
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="h-64 rounded-2xl bg-border/60 lg:col-span-2" />
      <div className="h-64 rounded-2xl bg-border/60" />
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-52 rounded-2xl bg-border/60" />
      ))}
    </div>
  </div>
);

export const DashboardIndex = () => {
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const name = user?.name || user?.email?.split('@')[0];

  const [stepsState, setStepsState] = useState({
    profile: null,
    contacts: null,
    privacy: null,
    qr: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const results = { profile: null, contacts: null, privacy: null, qr: null };
    try {
      const [profRes, contactsRes, identifiersRes] = await Promise.allSettled([
        api.get('/profiles/me'),
        api.get('/contacts'),
        api.get('/identifiers/my'),
      ]);

      if (profRes.status === 'fulfilled') {
        const p = profRes.value.data.profile || profRes.value.data;
        results.profile = !!(p.display_name && p.display_name.trim());
      }
      if (contactsRes.status === 'fulfilled') {
        results.contacts = ((contactsRes.value.data.contacts || contactsRes.value.data || []).length) > 0;
      }
      if (identifiersRes.status === 'fulfilled') {
        const id = identifiersRes.value.data.identifier || identifiersRes.value.data;
        results.qr = id?.status === 'active';
      }
      results.privacy = results.profile === true;

      setStepsState(results);
    } catch {
      setError('No se pudo cargar el estado de tu panel');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const ready = Object.values(stepsState).every((v) => v !== null);
  const doneCount = Object.values(stepsState).filter(Boolean).length;
  const pct = ready ? Math.round((doneCount / STEPS.length) * 100) : 0;
  const next = ready ? STEPS.find((s, i) => !Object.values(stepsState)[i]) : null;

  if (loading && !ready) return <Skeleton />;

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-5/50 p-8 text-center shadow-soft">
        <AlertTriangle size={24} className="mx-auto mb-4 text-rose-500" aria-hidden="true" />
        <p className="mb-4 text-sm font-medium text-neutral-900">{error}</p>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-brand-600 active:scale-[0.98]"
        >
          <RefreshCwIcon size={16} /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle
        title={name ? `Hola, ${name}` : 'Mi panel'}
        description="Administra tu perfil de emergencia, contactos, privacidad y código QR desde un solo lugar."
      />

      {/* Progreso de activación */}
      <section
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-[#7d0f2e] to-[#3f0617] p-6 text-white shadow-[0_24px_60px_-24px_rgba(159,18,57,0.55)] sm:p-8"
        aria-labelledby="progress-title"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Estado de activación</p>
            <h2 id="progress-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {!ready ? 'Cargando tu progreso…' : doneCount === STEPS.length ? 'Tu perfil está listo' : 'Termina de configurar tu perfil'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              {!ready
                ? 'Estamos revisando el estado de tu cuenta.'
                : next
                  ? `Siguiente paso: ${next.label.toLowerCase()}.`
                  : 'Todo completado. Tu página pública de emergencia está habilitada.'}
            </p>
            {ready && next && (
              <Link
                to={next.to}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-500 transition-transform hover:-translate-y-0.5"
              >
                Continuar con {next.label} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
          <div className="w-full md:w-64">
            <div className="flex items-end justify-between">
              <span className="text-4xl font-extrabold tracking-tight">{ready ? `${pct}%` : '—'}</span>
              <span className="pb-1 text-xs text-white/70">{ready ? `${doneCount} de ${STEPS.length} pasos` : ''}</span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={ready ? pct : 0} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${ready ? pct : 0}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Pasos */}
      <section className="rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] p-5 sm:p-6" aria-labelledby="steps-title">
        <div className="flex items-center justify-between mb-4">
          <h2 id="steps-title" className="text-base font-semibold text-neutral-900">Pasos para activar tu QR</h2>
        </div>
        <StepIndicator steps={STEPS.map((s) => ({ label: s.label }))} current={doneCount} />
        <ol className="mt-6 space-y-2">
          {STEPS.map((step, i) => {
            const done = Object.values(stepsState)[i] === true;
            return (
              <Link
                key={step.key}
                to={step.to}
                className="group flex items-center gap-3 rounded-xl border p-3 transition-colors sm:p-4 ${
                  done
                    ? 'border-emerald-100 bg-emerald-5/50'
                    : 'border-border hover:border-brand-500/30 hover:bg-brand-50/60'
                }"
              >
                <span
                  className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold ${
                    done
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                      : 'bg-brand-50 text-text-secondary ring-1 ring-border'
                  }`}
                >
                  {done ? <CheckCircle2 size={18} aria-hidden="true" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900">{step.label}</p>
                  <p className="truncate text-xs text-text-secondary">
                    {done ? 'Completado' : 'Pendiente'}
                  </p>
                </div>
                <ChevronRight size={16} className="flex-none text-text-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden="true" />
              </Link>
            );
          })}
        </ol>

        {stepsState.qr === false && (
          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-text-secondary">
              Tu página pública de emergencia solo se habilita tras activar el QR con el pago único de{' '}
              <span className="font-bold text-neutral-900">$30.000 COP</span>. Sin suscripción.
            </p>
            <Link to={routes.dashboardQr} className="btn-primary flex-none !px-5 !py-2.5 text-sm">
              Ir a Mi QR <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      {/* Accesos rápidos */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-neutral-900">Accesos rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action, idx) => {
            const { to, label, desc, icon: Icon, tone } = action;
            return (
              <motion.div
                key={to}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to={to}
                  className="group relative rounded-2xl border border-border/50 bg-white/90 backdrop-blur-sm p-5 transition-all duration-300 hover:border-brand-500/50 hover:shadow-[0_20px_40px_-10px_rgba(159,18,57,0.15)] hover:-translate-y-1"
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone} shadow-lg`}>
                    <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-neutral-900">{label}</p>
                    <p className="mt-1 text-xs text-text-secondary">{desc}</p>
                  </div>
                  <ArrowRight size={14} className="absolute right-5 top-5 text-text-secondary transition-transform group-hover:translate-x-1 group-hover:text-brand-500" aria-hidden="true" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {ready && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Resumen de tu cuenta</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Perfil de emergencia" value={fmt(stepsState.profile ? 1 : 0)} icon={User} tone="bg-brand-500/10 text-brand-500" hint="Datos personales y médicos" />
            <StatCard label="Contactos" value={fmt(stepsState.contacts ? 1 : 0)} icon={Users} tone="bg-emerald-50 text-emerald-700" hint="Personas de confianza" />
            <StatCard label="Privacidad" value={fmt(stepsState.privacy ? 1 : 0)} icon={ShieldCheck} tone="bg-sky-50 text-sky-700" hint="Campos configurados" />
            <StatCard label="QR" value={fmt(stepsState.qr ? 1 : 0)} icon={QrCode} tone="bg-amber-50 text-amber-700" hint="Código de activación" />
          </div>
        </section>
      )}
    </div>
  );
};

function RefreshCwIcon({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 4v6a9 9 0 0 0 9 9" />
      <path d="M23 4v6a9 9 0 0 1-9-9" />
      <polyline points="17 24 23 4 17 4" />
    </svg>
  );
}

export default DashboardIndex;



