import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MotionConfig, animate, motion, useReducedMotion } from 'framer-motion';
import {
  Users, HeartPulse, QrCode, ShoppingBag, RefreshCw, AlertTriangle, ArrowRight,
  Package, ScrollText, HelpCircle,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';

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

const nf = new Intl.NumberFormat('es-CO');
const fmt = (n) => (n === undefined || n === null ? '—' : nf.format(Number(n)));
const getNested = (obj, path) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);

const KPI_CARDS = [
  { key: 'users', label: 'Usuarios', valueKey: 'users', icon: Users, tile: 'bg-sky-50 text-sky-700 ring-sky-600/15', hint: 'Cuentas registradas' },
  { key: 'profiles', label: 'Perfiles de emergencia', valueKey: 'profiles', icon: HeartPulse, tile: 'bg-brand-500/10 text-brand-500 ring-brand-500/15', hint: 'Completaron su perfil' },
  { key: 'qr', label: 'QR activos', valueKey: 'identifiers.active', icon: QrCode, tile: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', hint: 'Identificadores en uso' },
  { key: 'orders', label: 'Pedidos (7 días)', valueKey: 'orders.recent', icon: ShoppingBag, tile: 'bg-amber-50 text-amber-700 ring-amber-600/15', hint: 'Actividad reciente' },
];

const PIPELINE = [
  { key: 'pending', label: 'Pendientes', valueKey: 'orders.pending', color: 'bg-amber-500' },
  { key: 'paid', label: 'Pagados', valueKey: 'orders.paid', color: 'bg-emerald-500' },
  { key: 'delivering', label: 'En entrega', valueKey: 'orders.delivering', color: 'bg-sky-500' },
];

const QUICK_ACTIONS = [
  { to: '/admin/usuarios', label: 'Gestionar usuarios', desc: 'Cuentas y roles', icon: Users, tone: 'bg-brand-500/10 text-brand-500' },
  { to: '/admin/pedidos', label: 'Revisar pedidos', desc: 'Estados y pagos', icon: Package, tone: 'bg-emerald-50 text-emerald-700' },
  { to: '/admin/auditoria', label: 'Ver auditoría', desc: 'Eventos administrativos', icon: ScrollText, tone: 'bg-sky-50 text-sky-700' },
  { to: '/admin/ayuda', label: 'Documentación', desc: 'Arquitectura y guía', icon: HelpCircle, tone: 'bg-amber-50 text-amber-700' },
];

/* ───────── Piezas ───────── */
const AnimatedNumber = ({ value, reduce, format = fmt }) => {
  const target = Number(value) || 0;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduce) return undefined;
    const controls = animate(0, target, {
      duration: 1.1,
      delay: 0.3,
      ease: EASE,
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [target, reduce]);
  return <>{format(reduce ? target : n)}</>;
};

const KpiCard = ({ card, value, reduce }) => (
  <motion.div
    variants={item}
    className={`${panel} group p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-[0_20px_40px_-12px_rgba(159,18,57,0.2)] sm:p-5`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-secondary">{card.label}</p>
        <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-neutral-900">
          {value === undefined || value === null ? '—' : <AnimatedNumber value={value} reduce={reduce} />}
        </p>
        <p className="mt-1.5 text-xs text-text-secondary">{card.hint}</p>
      </div>
      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-105 ${card.tile}`}>
        <card.icon size={18} strokeWidth={2.2} aria-hidden="true" />
      </span>
    </div>
  </motion.div>
);

const CoverageRing = ({ pct, reduce }) => {
  const size = 132;
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
      <div className="absolute inset-0 flex items-center justify-center" role="img" aria-label={`Cobertura de perfiles: ${pct}%`}>
        <span className="text-3xl font-extrabold tracking-tight">
          <AnimatedNumber value={pct} reduce={reduce} format={(v) => String(v)} />
          <span className="text-lg font-bold text-white/70">%</span>
        </span>
      </div>
    </div>
  );
};

const Skeleton = () => (
  <div className="animate-pulse space-y-8" aria-busy="true" aria-live="polite">
    <div className="space-y-2">
      <div className="h-8 w-72 rounded-lg bg-border/60" />
      <div className="h-4 w-56 rounded-lg bg-border/50" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-36 rounded-2xl bg-border/60" />)}
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="h-64 rounded-2xl bg-border/60 lg:col-span-2" />
      <div className="h-64 rounded-2xl bg-border/60" />
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 rounded-2xl bg-border/60" />)}
    </div>
  </div>
);

/* ───────── Página ───────── */
export const AdminHome = () => {
  const reduce = !!useReducedMotion();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data);
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  if (loading && !stats) return <Skeleton />;

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

  const users = Number(getNested(stats, 'users')) || 0;
  const profiles = Number(getNested(stats, 'profiles')) || 0;
  const coverage = users > 0 ? Math.min(100, Math.round((profiles / users) * 100)) : 0;
  const pipelineTotal = PIPELINE.reduce((a, p) => a + (Number(getNested(stats, p.valueKey)) || 0), 0);

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 lg:space-y-5">
        <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageTitle title="Resumen administrativo" description="Métricas operativas de la plataforma." />
          <div className="flex flex-none items-center gap-3">
            {updatedAt && (
              <span className="hidden text-xs text-text-secondary sm:inline">
                Actualizado {updatedAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button type="button" onClick={load} disabled={loading} className="btn-outline px-4 py-2.5 text-sm">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              Actualizar
            </button>
          </div>
        </motion.div>

        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {KPI_CARDS.map((card) => (
            <KpiCard key={card.key} card={card} value={getNested(stats, card.valueKey)} reduce={reduce} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          {/* Pipeline de pedidos */}
          <motion.section variants={item} className={`${panel} p-4 sm:p-5 lg:col-span-2 lg:p-6`} aria-labelledby="pipeline-title">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 id="pipeline-title" className="text-base font-semibold text-neutral-900">Estado de los pedidos</h2>
              <p className="text-xs text-text-secondary">{fmt(pipelineTotal)} en seguimiento</p>
            </div>

            <div
              className="mb-6 flex h-3 w-full overflow-hidden rounded-full bg-border/70"
              role="img"
              aria-label="Distribución de pedidos por estado"
            >
              {pipelineTotal > 0 && PIPELINE.map((p) => {
                const v = Number(getNested(stats, p.valueKey)) || 0;
                return (
                  <motion.span
                    key={p.key}
                    className={`${p.color} h-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(v / pipelineTotal) * 100}%` }}
                    transition={{ duration: reduce ? 0 : 0.9, ease: EASE, delay: 0.3 }}
                  />
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:gap-4">
              {PIPELINE.map((p) => {
                const v = Number(getNested(stats, p.valueKey)) || 0;
                const share = pipelineTotal > 0 ? Math.round((v / pipelineTotal) * 100) : 0;
                return (
                  <div key={p.key} className="rounded-xl border border-border bg-brand-50/40 p-3 lg:p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                      <span className={`h-2.5 w-2.5 rounded-full ${p.color}`} aria-hidden="true" /> {p.label}
                    </div>
                    <p className="mt-1.5 text-xl font-bold text-neutral-900">{fmt(v)}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{share}% del total</p>
                  </div>
                );
              })}
            </div>
            {pipelineTotal === 0 && (
              <p className="mt-3 text-center text-xs text-text-secondary">Aún no hay pedidos en seguimiento.</p>
            )}
          </motion.section>

          {/* Cobertura */}
          <motion.section
            variants={item}
            aria-labelledby="coverage-title"
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-4 text-white shadow-glow sm:p-5 lg:p-6"
          >
            <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-400/30 blur-3xl" />
            <div className="relative flex h-full flex-col">
              <h2 id="coverage-title" className="text-base font-semibold">Cobertura de perfiles</h2>
              <p className="mt-1 text-xs leading-relaxed text-white/70">
                Usuarios que ya completaron su perfil de emergencia.
              </p>
              <div className="my-5 flex items-center gap-4 lg:my-6">
                <CoverageRing pct={coverage} reduce={reduce} />
                <p className="text-sm text-white/75">
                  <span className="block text-lg font-bold text-white">{fmt(profiles)}</span>
                  de {fmt(users)} usuarios
                </p>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Accesos rápidos */}
        <motion.section variants={item} aria-labelledby="quick-title">
          <h2 id="quick-title" className="mb-3 text-base font-semibold text-neutral-900 lg:mb-4">Accesos rápidos</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {QUICK_ACTIONS.map(({ to, label, desc, icon: Icon, tone }) => (
              <Link
                key={to}
                to={to}
                className="group relative block h-full rounded-2xl border border-border/60 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-[0_20px_40px_-12px_rgba(159,18,57,0.2)] lg:p-5"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone} transition-transform duration-300 group-hover:scale-105 lg:h-12 lg:w-12`}>
                  <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-semibold text-neutral-900 lg:mt-4">{label}</p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{desc}</p>
                <ArrowRight
                  size={14}
                  className="absolute right-4 top-4 text-text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-500 lg:right-5 lg:top-5"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </MotionConfig>
  );
};

export default AdminHome;