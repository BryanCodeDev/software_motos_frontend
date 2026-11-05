import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MotionConfig, animate, motion, useReducedMotion } from 'framer-motion';
import {
  User, Users, ShieldCheck, QrCode, Package, ArrowRight, CheckCircle2, ChevronRight,
  AlertTriangle, RefreshCw, Lock, Sparkles,
} from 'lucide-react';
import { routes } from '../../utils/routes';
import { useAuth } from '../../contexts/useAuth';
import { PageTitle } from '../../components/DashPage';
import api from '../../api/client';
import { StatCard, Badge } from '../../components/ui-kit';

/* ───────── Constantes de diseño (alineadas con Home) ───────── */
const EASE = [0.22, 1, 0.36, 1];
const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/* ───────── Datos ───────── */
const STEPS = [
  { key: 'profile', label: 'Perfil', desc: 'Tu nombre y los datos médicos clave', to: routes.dashboardProfile, icon: User },
  { key: 'contacts', label: 'Contactos', desc: 'Al menos una persona de confianza', to: routes.dashboardContacts, icon: Users },
  { key: 'privacy', label: 'Privacidad', desc: 'Qué ve quien escanea tu QR', to: routes.dashboardPrivacy, icon: ShieldCheck },
  { key: 'qr', label: 'Mi QR', desc: 'Activa tu código y descárgalo', to: routes.dashboardQr, icon: QrCode },
];

const QUICK_ACTIONS = [
  { to: routes.dashboardProfile, label: 'Perfil', desc: 'Datos personales y médicos', icon: User, tone: 'bg-brand-500/10 text-brand-500' },
  { to: routes.dashboardContacts, label: 'Contactos', desc: 'Personas de confianza', icon: Users, tone: 'bg-emerald-50 text-emerald-700' },
  { to: routes.dashboardPrivacy, label: 'Privacidad', desc: 'Visibilidad de campos', icon: ShieldCheck, tone: 'bg-sky-50 text-sky-700' },
  { to: routes.dashboardQr, label: 'Mi QR', desc: 'Código y enlace público', icon: QrCode, tone: 'bg-amber-50 text-amber-700' },
  { to: routes.dashboardOrders, label: 'Pedidos', desc: 'Estado y pagos', icon: Package, tone: 'bg-slate-100 text-slate-700' },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

/* ───────── Piezas ───────── */
const AnimatedNumber = ({ value, reduce }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduce) return undefined;
    const controls = animate(0, value, {
      duration: 1.2,
      delay: 0.35,
      ease: EASE,
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, reduce]);
  return <>{reduce ? value : n}</>;
};

const ProgressRing = ({ pct, reduce }) => {
  const size = 152;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = size / 2;
  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={stroke} />
        {pct > 0 && (
          <motion.circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke="#ffffff"
            strokeWidth={stroke}
            strokeLinecap="round"
            initial={{ pathLength: reduce ? pct / 100 : 0 }}
            animate={{ pathLength: pct / 100 }}
            transition={{ duration: reduce ? 0 : 1.2, delay: 0.35, ease: EASE }}
          />
        )}
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso de activación"
      >
        <span className="text-4xl font-extrabold tracking-tight">
          <AnimatedNumber value={pct} reduce={reduce} />
          <span className="text-xl font-bold text-white/70">%</span>
        </span>
      </div>
    </div>
  );
};

const Skeleton = () => (
  <div className="space-y-8 animate-pulse" aria-busy="true" aria-live="polite">
    <div className="space-y-2">
      <div className="h-8 w-64 rounded-lg bg-border/60" />
      <div className="h-4 w-96 max-w-full rounded-lg bg-border/50" />
    </div>
    <div className="h-56 rounded-2xl bg-border/60" />
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="h-80 rounded-2xl bg-border/60 lg:col-span-2" />
      <div className="h-80 rounded-2xl bg-border/60" />
    </div>
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-36 rounded-2xl bg-border/60" />
      ))}
    </div>
  </div>
);

/* ───────── Página ───────── */
export const DashboardIndex = () => {
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const fullName = user?.name || user?.email?.split('@')[0];
  const firstName = fullName ? fullName.trim().split(' ')[0] : null;

  const [steps, setSteps] = useState({ profile: false, contacts: false, privacy: false, qr: false });
  const [contactCount, setContactCount] = useState(0);
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

      // Si todo falló, es un problema real de red/servidor (un 404 del QR es normal).
      if (results.every((r) => r.status === 'rejected')) {
        setError('No se pudo cargar el estado de tu panel');
        return;
      }

      const next = { profile: false, contacts: false, privacy: false, qr: false };
      let count = 0;

      if (profRes.status === 'fulfilled') {
        const p = profRes.value.data.profile || profRes.value.data;
        next.profile = !!(p?.display_name && p.display_name.trim());
      }
      if (contactsRes.status === 'fulfilled') {
        const list = contactsRes.value.data.contacts || contactsRes.value.data || [];
        count = list.length;
        next.contacts = count > 0;
      }
      if (identifiersRes.status === 'fulfilled') {
        const id = identifiersRes.value.data.identifier || identifiersRes.value.data;
        next.qr = id?.status === 'active';
      }
      next.privacy = next.profile;

      setSteps(next);
      setContactCount(count);
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

  const doneCount = STEPS.filter((s) => steps[s.key]).length;
  const pct = Math.round((doneCount / STEPS.length) * 100);
  const next = STEPS.find((s) => !steps[s.key]) || null;
  const missing = STEPS.length - doneCount;
  const allDone = doneCount === STEPS.length;

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center shadow-soft">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 ring-1 ring-rose-600/15">
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
    <MotionConfig reducedMotion="user">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 lg:space-y-6">
        <motion.div variants={item}>
          <PageTitle
            title={firstName ? `${greeting()}, ${firstName}` : 'Mi panel'}
            description="Administra tu perfil de emergencia, contactos, privacidad y código QR desde un solo lugar."
          />
        </motion.div>

        {/* ───── Progreso de activación ───── */}
        <motion.section
          variants={item}
          aria-labelledby="progress-title"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-6 text-white shadow-glow sm:p-8"
        >
          <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-lg">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                {allDone ? <CheckCircle2 size={13} aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />}
                {allDone ? 'Activación completa' : 'Estado de activación'}
              </span>
              <h2 id="progress-title" className="mt-4 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                {allDone ? 'Tu perfil está listo para protegerte' : 'Termina de configurar tu perfil'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                {allDone
                  ? 'Todo completado. Tu página pública de emergencia está habilitada.'
                  : `Te ${missing === 1 ? 'falta 1 paso' : `faltan ${missing} pasos`}. Sigue con ${next.label.toLowerCase()}: ${next.desc.toLowerCase()}.`}
              </p>
              <Link
                to={allDone ? routes.dashboardQr : next.to}
                className="btn mt-6 bg-white px-5 py-2.5 text-sm text-brand-500 shadow-soft hover:-translate-y-0.5 hover:bg-brand-50"
              >
                {allDone ? 'Ver mi QR' : `Continuar con ${next.label}`}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className="flex items-center gap-5 md:flex-col md:items-center md:gap-3">
              <ProgressRing pct={pct} reduce={!!reduce} />
              <p className="text-sm text-white/75">
                <span className="font-semibold text-white">{doneCount} de {STEPS.length}</span> pasos
              </p>
            </div>
          </div>
        </motion.section>

        {/* ───── Pasos + estado del QR ───── */}
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <motion.section variants={item} className={`${panel} p-5 sm:p-6 lg:col-span-2`} aria-labelledby="steps-title">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 id="steps-title" className="text-base font-semibold text-neutral-900">Pasos para activar tu QR</h2>
              <Badge tone={allDone ? 'success' : 'neutral'} size="md">{doneCount}/{STEPS.length}</Badge>
            </div>

            <ol className="space-y-2.5">
              {STEPS.map((step, i) => {
                const done = steps[step.key];
                const isNext = !done && next?.key === step.key;
                const Icon = step.icon;
                return (
                  <li key={step.key} className="relative">
                    {i < STEPS.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={`absolute left-[33px] top-[54px] -bottom-[10px] w-px ${done ? 'bg-emerald-300' : 'bg-border'}`}
                      />
                    )}
                    <Link
                      to={step.to}
                      className={`group relative flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 sm:p-3.5 ${
                        done
                          ? 'border-emerald-100 bg-emerald-50/40 hover:border-emerald-200'
                          : isNext
                            ? 'border-brand-500/40 bg-brand-50/70 shadow-soft hover:border-brand-500/60'
                            : 'border-border bg-white hover:border-brand-500/30 hover:bg-brand-50/50'
                      }`}
                    >
                      <span className="relative flex h-10 w-10 flex-none items-center justify-center">
                        {isNext && (
                          <span aria-hidden="true" className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500/30" />
                        )}
                        <span
                          className={`relative flex h-10 w-10 items-center justify-center rounded-full ring-1 ${
                            done
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                              : isNext
                                ? 'bg-brand-500 text-white ring-brand-500'
                                : 'bg-brand-50 text-text-secondary ring-border'
                          }`}
                        >
                          {done ? <CheckCircle2 size={18} aria-hidden="true" /> : <Icon size={17} aria-hidden="true" />}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neutral-900">{step.label}</p>
                        <p className="truncate text-xs text-text-secondary">{step.desc}</p>
                      </div>
                      <Badge tone={done ? 'success' : isNext ? 'brand' : 'neutral'} size="sm" className="hidden sm:inline-flex">
                        {done ? 'Completado' : isNext ? 'Siguiente' : 'Pendiente'}
                      </Badge>
                      <ChevronRight
                        size={16}
                        className="flex-none text-text-secondary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-500"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </motion.section>

          <motion.aside variants={item} aria-label="Estado de tu QR">
            {steps.qr ? (
              <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-soft">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/15">
                  <QrCode size={22} aria-hidden="true" />
                </span>
                <h2 className="text-base font-semibold text-neutral-900">Tu QR está activo</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                  Quien lo escanee verá solo lo que marcaste como público. Descárgalo y ponlo a la vista.
                </p>
                <Link to={routes.dashboardQr} className="btn-primary mt-5 w-full px-5 py-2.5 text-sm">
                  Descargar mi QR <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-50 to-white p-6 shadow-soft">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
                  <Lock size={22} aria-hidden="true" />
                </span>
                <h2 className="text-base font-semibold text-neutral-900">Tu QR aún no está activo</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                  Tu página pública de emergencia se habilita con un pago único de{' '}
                  <span className="font-bold text-neutral-900">$30.000 COP</span>. Sin suscripción.
                </p>
                <Link to={routes.dashboardQr} className="btn-primary mt-5 w-full px-5 py-2.5 text-sm">
                  Activar mi QR <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            )}
          </motion.aside>
        </div>

        {/* ───── Accesos rápidos ───── */}
        <motion.section variants={item} aria-labelledby="quick-title">
          <h2 id="quick-title" className="mb-4 text-base font-semibold text-neutral-900">Accesos rápidos</h2>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {QUICK_ACTIONS.map(({ to, label, desc, icon: Icon, tone }) => (
              <Link
                key={to}
                to={to}
                className="group relative block h-full rounded-2xl border border-border/60 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-[0_20px_40px_-12px_rgba(159,18,57,0.2)]"
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone} transition-transform duration-300 group-hover:scale-105`}>
                  <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-semibold text-neutral-900">{label}</p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{desc}</p>
                <ArrowRight
                  size={14}
                  className="absolute right-5 top-5 text-text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-500"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </motion.section>

        {/* ───── Resumen ───── */}
        <motion.section variants={item} aria-labelledby="summary-title">
          <h2 id="summary-title" className="mb-4 text-base font-semibold text-neutral-900">Resumen de tu cuenta</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Perfil de emergencia"
              value={steps.profile ? 'Completo' : 'Pendiente'}
              icon={User}
              tone="bg-brand-500/10 text-brand-500"
              hint="Datos personales y médicos"
            />
            <StatCard
              label="Contactos"
              value={String(contactCount)}
              icon={Users}
              tone="bg-emerald-50 text-emerald-700"
              hint={contactCount === 1 ? 'Persona de confianza' : 'Personas de confianza'}
            />
            <StatCard
              label="Privacidad"
              value={steps.privacy ? 'Configurada' : 'Pendiente'}
              icon={ShieldCheck}
              tone="bg-sky-50 text-sky-700"
              hint="Campos visibles al escanear"
            />
            <StatCard
              label="QR"
              value={steps.qr ? 'Activo' : 'Inactivo'}
              icon={QrCode}
              tone="bg-amber-50 text-amber-700"
              hint="Código de emergencia"
            />
          </div>
        </motion.section>
      </motion.div>
    </MotionConfig>
  );
};

export default DashboardIndex;