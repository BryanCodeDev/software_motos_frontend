import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MotionConfig, animate, motion, useReducedMotion } from 'framer-motion';
import {
  Users, QrCode, ShoppingBag, HeartPulse, RefreshCw, AlertTriangle, ArrowUpRight, CheckCircle2,
  PackageCheck, Unlink, Printer, ScrollText, Link2,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../contexts/useAuth';
import { useAdminSync } from '../../contexts/useAdminSync';

const EASE = [0.22, 1, 0.36, 1];
const panel = 'rounded-2xl border border-border bg-white';
const nf = new Intl.NumberFormat('es-CO');
const num = (v) => Number(v) || 0;

/* Una sola entrada orquestada al cargar */
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };

const PIPELINE = [
  { key: 'pending', label: 'Pago pendiente', status: 'pending_payment', bar: 'bg-amber-500' },
  { key: 'paid', label: 'Por preparar', status: 'paid', bar: 'bg-emerald-500' },
  { key: 'delivering', label: 'En entrega', status: 'shipped', bar: 'bg-sky-500' },
];

const PRINT_STEPS = [
  ['pending_print', 'Por imprimir'],
  ['sent_to_print', 'En impresión'],
  ['printed', 'Impresos'],
  ['dispatched', 'Despachados'],
  ['delivered', 'Entregados'],
];

const toneDot = (action = '') => {
  const a = action.toLowerCase();
  if (/(delete|remove|deactivat|cancel|revoke|unlink)/.test(a)) return 'bg-rose-500';
  if (/(create|register|activat|link)/.test(a)) return 'bg-emerald-500';
  if (/(update|role|change|patch)/.test(a)) return 'bg-amber-500';
  return 'bg-neutral-400';
};

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
const ago = (d) => {
  const s = Math.round((new Date(d).getTime() - Date.now()) / 1000);
  const a = Math.abs(s);
  if (a < 60) return rtf.format(s, 'second');
  if (a < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  return rtf.format(Math.round(s / 86400), 'day');
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

/* ───────── Piezas ───────── */
const AnimatedNumber = ({ value, reduce }) => {
  const target = num(value);
  const [n, setN] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (reduce) return undefined;
    const controls = animate(from.current, target, {
      duration: 1,
      delay: 0.25,
      ease: EASE,
      onUpdate: (v) => { from.current = v; setN(Math.round(v)); },
    });
    return () => controls.stop();
  }, [target, reduce]);

  return <>{nf.format(reduce ? target : n)}</>;
};

const Ring = ({ pct, reduce }) => {
  const size = 128;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = size / 2;
  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(159,18,57,0.12)" strokeWidth={stroke} />
        <motion.circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="#9F1239"
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: reduce ? pct / 100 : 0 }}
          animate={{ pathLength: pct / 100 }}
          transition={{ duration: reduce ? 0 : 1.2, delay: 0.4, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center" role="img" aria-label={`${pct}% de usuarios con perfil completo`}>
        <span className="text-3xl font-extrabold tracking-tight text-neutral-900">
          <AnimatedNumber value={pct} reduce={reduce} />
          <span className="text-base font-bold text-text-secondary">%</span>
        </span>
      </div>
    </div>
  );
};

const Card = ({ title, action, children, className = '' }) => (
  <motion.section variants={item} className={`${panel} p-4 sm:p-5 ${className}`}>
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      {action}
    </div>
    {children}
  </motion.section>
);

const SeeAll = ({ to, children }) => (
  <Link to={to} className="focus-ring inline-flex items-center gap-1 rounded text-xs font-semibold text-brand-600 hover:text-brand-700">
    {children} <ArrowUpRight size={14} aria-hidden="true" />
  </Link>
);

const Skeleton = () => (
  <div className="animate-pulse space-y-4" aria-busy="true">
    <div className="h-9 w-64 rounded-lg bg-border/60" />
    <div className="h-40 rounded-2xl bg-border/60" />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-border/60" />)}
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="h-56 rounded-2xl bg-border/60 lg:col-span-2" />
      <div className="h-56 rounded-2xl bg-border/60" />
    </div>
  </div>
);

/* ───────── Página ───────── */
export const AdminHome = () => {
  const reduce = !!useReducedMotion();
  const { user } = useAuth();
  const { refreshKey } = useAdminSync();
  const [stats, setStats] = useState(null);
  const [qr, setQr] = useState(null);
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [dash, qrStats, audit] = await Promise.allSettled([
      api.get('/admin/dashboard'),
      api.get('/admin/qrs/stats'),
      api.get('/admin/audit'),
    ]);
    if (dash.status === 'rejected') {
      setError(dash.reason?.response?.data?.error || 'No se pudieron cargar las estadísticas');
    } else {
      setStats(dash.value.data);
      setQr(qrStats.status === 'fulfilled' ? qrStats.value.data : null);
      setLogs(audit.status === 'fulfilled' ? audit.value.data?.logs || [] : null);
      setUpdatedAt(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load, refreshKey]);

  if (loading && !stats) return <Skeleton />;

  if (error && !stats) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center" role="alert">
        <AlertTriangle size={24} className="mx-auto mb-3 text-rose-600" aria-hidden="true" />
        <p className="text-sm font-semibold text-neutral-900">{error}</p>
        <button type="button" onClick={load} className="btn-primary mt-5 px-5 py-2.5 text-sm">
          <RefreshCw size={16} aria-hidden="true" /> Reintentar
        </button>
      </div>
    );
  }

  const users = num(stats?.users);
  const profiles = num(stats?.profiles);
  const coverage = users > 0 ? Math.min(100, Math.round((profiles / users) * 100)) : 0;
  const pipelineTotal = PIPELINE.reduce((a, p) => a + num(stats?.orders?.[p.key]), 0);

  const firstName = (user?.name || user?.email || 'admin').split(/[\s@]/)[0];
  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

  const attention = [
    { key: 'prep', label: 'Pedidos por preparar', value: num(stats?.orders?.paid), to: '/admin/pedidos?estado=paid', icon: PackageCheck },
    ...(qr
      ? [
          { key: 'unlinked', label: 'QR sin vincular', value: num(qr.unlinked), to: '/admin/qrs', icon: Unlink },
          { key: 'print', label: 'QR por imprimir', value: num(qr.by_print_status?.pending_print), to: '/admin/qrs', icon: Printer },
        ]
      : []),
  ];
  const attentionTotal = attention.reduce((a, x) => a + x.value, 0);

  const kpis = [
    { label: 'Usuarios', value: stats?.users, icon: Users, to: '/admin/usuarios', hint: 'Cuentas registradas' },
    { label: 'QR activos', value: stats?.identifiers?.active, icon: QrCode, to: '/admin/qrs', hint: 'En uso ahora' },
    { label: 'Pedidos en 7 días', value: stats?.orders?.recent, icon: ShoppingBag, to: '/admin/pedidos', hint: 'Actividad reciente' },
    ...(qr ? [{ label: 'QR vinculados', value: qr.linked, icon: Link2, to: '/admin/qrs', hint: `${num(qr.total)} en total` }] : []),
  ];

  const printCounts = qr?.by_print_status || {};
  const printMax = Math.max(1, ...PRINT_STEPS.map(([k]) => num(printCounts[k])));
  const recent = logs
    ? [...logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6)
    : null;

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 lg:space-y-5">
        {/* Encabezado */}
        <motion.div variants={item} className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm capitalize text-text-secondary">{today}</p>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{greeting()}, {firstName}</h1>
          </div>
          <div className="flex items-center gap-3">
            {updatedAt && (
              <span className="hidden text-xs text-text-secondary sm:inline">
                Actualizado {updatedAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button type="button" onClick={load} disabled={loading} className="btn-outline px-3.5 py-2 text-sm" aria-label="Actualizar">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </motion.div>

        {/* Lo que necesita atención: el único bloque protagonista */}
        <motion.section
          variants={item}
          aria-labelledby="attention-h"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-5 text-white shadow-glow lg:p-6"
        >
          <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-25" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-400/30 blur-3xl" />
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,15rem)_1fr] lg:items-center">
            <div>
              <h2 id="attention-h" className="text-lg font-semibold">
                {attentionTotal > 0 ? 'Requiere tu atención' : 'Todo al día'}
              </h2>
              <p className="mt-1 text-sm text-white/75">
                {attentionTotal > 0
                  ? `${nf.format(attentionTotal)} ${attentionTotal === 1 ? 'tarea pendiente' : 'tareas pendientes'}`
                  : 'No hay pedidos ni QR esperando acción.'}
              </p>
            </div>
            <div className={`grid gap-3 ${attention.length > 1 ? 'sm:grid-cols-3' : ''}`}>
              {attention.map(({ key, label, value, to, icon: Icon }) => (
                <Link
                  key={key}
                  to={to}
                  className="focus-ring group rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm transition-colors hover:bg-white/15"
                >
                  <div className="flex items-center justify-between">
                    <Icon size={18} className="text-white/80" aria-hidden="true" />
                    {value === 0
                      ? <CheckCircle2 size={16} className="text-emerald-300" aria-label="Sin pendientes" />
                      : <ArrowUpRight size={16} className="text-white/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />}
                  </div>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight">
                    <AnimatedNumber value={value} reduce={reduce} />
                  </p>
                  <p className="mt-0.5 text-xs text-white/75">{label}</p>
                </Link>
              ))}
            </div>
          </div>
        </motion.section>

        {/* KPIs */}
        <div className={`grid gap-3 sm:grid-cols-2 ${kpis.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {kpis.map(({ label, value, icon: Icon, to, hint }) => (
            <motion.div key={label} variants={item}>
              <Link
                to={to}
                className={`${panel} focus-ring group flex h-full items-center gap-4 p-4 transition-all duration-200 hover:border-brand-500/40 hover:shadow-soft`}
              >
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-text-secondary">{label}</p>
                  <p className="text-2xl font-bold tracking-tight text-neutral-900"><AnimatedNumber value={value} reduce={reduce} /></p>
                  <p className="truncate text-xs text-text-secondary">{hint}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Pedidos + cobertura */}
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <Card title="Estado de los pedidos" action={<SeeAll to="/admin/pedidos">Ver pedidos</SeeAll>} className="lg:col-span-2">
            <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-border/70" role="img" aria-label="Distribución de pedidos por estado">
              {pipelineTotal > 0 && PIPELINE.map((p) => (
                <motion.span
                  key={p.key}
                  className={`${p.bar} h-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(num(stats?.orders?.[p.key]) / pipelineTotal) * 100}%` }}
                  transition={{ duration: reduce ? 0 : 0.9, delay: 0.35, ease: EASE }}
                />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {PIPELINE.map((p) => {
                const v = num(stats?.orders?.[p.key]);
                const share = pipelineTotal > 0 ? Math.round((v / pipelineTotal) * 100) : 0;
                return (
                  <Link
                    key={p.key}
                    to={`/admin/pedidos?estado=${p.status}`}
                    className="focus-ring group rounded-xl border border-border bg-brand-50/40 p-3 transition-colors hover:border-brand-500/40 hover:bg-brand-50"
                  >
                    <p className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className={`h-2.5 w-2.5 rounded-full ${p.bar}`} aria-hidden="true" /> {p.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-neutral-900">{nf.format(v)}</p>
                    <p className="text-xs text-text-secondary">{share}% del total</p>
                  </Link>
                );
              })}
            </div>
            {pipelineTotal === 0 && <p className="mt-3 text-center text-xs text-text-secondary">Aún no hay pedidos en seguimiento.</p>}
          </Card>

          <Card title="Perfiles completos">
            <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
              <Ring pct={coverage} reduce={reduce} />
              <p className="text-sm text-text-secondary">
                <span className="flex items-center gap-1.5 text-lg font-bold text-neutral-900">
                  <HeartPulse size={18} className="text-brand-500" aria-hidden="true" /> {nf.format(profiles)}
                </span>
                de {nf.format(users)} usuarios completaron su perfil de emergencia.
              </p>
            </div>
          </Card>
        </div>

        {/* Producción + actividad */}
        {(qr || recent) && (
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
            {qr && (
              <Card title="Producción de stickers" action={<SeeAll to="/admin/qrs">Ver QR</SeeAll>}>
                <ul className="space-y-3">
                  {PRINT_STEPS.map(([k, label]) => {
                    const v = num(printCounts[k]);
                    return (
                      <li key={k}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-text-secondary">{label}</span>
                          <span className="font-semibold text-neutral-900">{nf.format(v)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-border/70">
                          <motion.div
                            className="h-full rounded-full bg-brand-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(v / printMax) * 100}%` }}
                            transition={{ duration: reduce ? 0 : 0.8, delay: 0.45, ease: EASE }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

            {recent && (
              <Card title="Actividad reciente" action={<SeeAll to="/admin/auditoria">Ver auditoría</SeeAll>}>
                {recent.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <ScrollText size={20} className="mb-2 text-text-secondary" aria-hidden="true" />
                    <p className="text-xs text-text-secondary">Aún no hay eventos registrados.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {recent.map((l) => (
                      <li key={l.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                        <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${toneDot(l.action)}`} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-neutral-900">
                            <span className="font-medium">{l.action}</span>
                            <span className="text-text-secondary"> · {l.entity_type}{l.entity_id != null ? ` #${l.entity_id}` : ''}</span>
                          </p>
                          <p className="truncate text-xs text-text-secondary">{l.actor_email || 'Sistema'}</p>
                        </div>
                        <span className="flex-none whitespace-nowrap text-xs text-text-secondary">{ago(l.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>
        )}
      </motion.div>
    </MotionConfig>
  );
};

export default AdminHome;