import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, HeartPulse, QrCode, ShoppingBag, RefreshCw, AlertTriangle, ArrowRight,
  Package, ScrollText, Loader2,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';

const nf = new Intl.NumberFormat('es-CO');
const fmt = (n) => (n === undefined || n === null ? '—' : nf.format(Number(n)));

const getNested = (obj, path) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);

const KPI_CARDS = [
  { key: 'users', label: 'Usuarios', valueKey: 'users', icon: Users, tone: 'bg-sky-500/20 text-sky-600 ring-sky-600/20', text: 'text-sky-700', hint: 'Cuentas registradas' },
  { key: 'profiles', label: 'Perfiles de emergencia', valueKey: 'profiles', icon: HeartPulse, tone: 'bg-brand-accent/20 text-brand-accent ring-brand-accent/20', text: 'text-brand-accent', hint: 'Completaron su perfil' },
  { key: 'qr', label: 'QR activos', valueKey: 'identifiers.active', icon: QrCode, tone: 'bg-emerald-500/20 text-emerald-600 ring-emerald-600/20', text: 'text-emerald-700', hint: 'Identificadores en uso' },
  { key: 'orders', label: 'Pedidos (7 días)', valueKey: 'orders.recent', icon: ShoppingBag, tone: 'bg-amber-500/20 text-amber-600 ring-amber-600/20', text: 'text-amber-700', hint: 'Actividad reciente' },
];

const PIPELINE = [
  { key: 'pending', label: 'Pendientes', valueKey: 'orders.pending', color: 'bg-amber-500' },
  { key: 'paid', label: 'Pagados', valueKey: 'orders.paid', color: 'bg-emerald-500' },
  { key: 'delivering', label: 'En entrega', valueKey: 'orders.delivering', color: 'bg-sky-500' },
];

const QUICK_ACTIONS = [
  { to: '/admin/usuarios', label: 'Gestionar usuarios', desc: 'Cuentas y roles', icon: Users, tone: 'bg-brand-accent/10 text-brand-accent' },
  { to: '/admin/pedidos', label: 'Revisar pedidos', desc: 'Estados y pagos', icon: Package, tone: 'bg-emerald-50 text-emerald-700' },
  { to: '/admin/auditoria', label: 'Ver auditoría', desc: 'Eventos administrativos', icon: ScrollText, tone: 'bg-sky-50 text-sky-700' },
];

const StatCard = ({ card, value }) => (
  <div className="rounded-2xl border border-brand-border/50 bg-white/90 backdrop-blur-sm p-6 shadow-soft transition-all duration-300 hover:border-brand-accent/40 hover:shadow-[0_20px_40px_-10px_rgba(159,18,57,0.20)] hover:-translate-y-1">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-textMuted">{card.label}</p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-brand-text">{fmt(value)}</p>
        {card.hint && <p className="mt-3 text-xs text-brand-textMuted">{card.hint}</p>}
      </div>
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset shadow-lg">
        <span className={`relative flex h-8 w-8 items-center justify-center rounded-lg ${card.tone.split(' ')[0]} ring-1 ${card.tone.split(' ')[2] || card.tone.split(' ')[0]}`}>
          <card.icon size={16} strokeWidth={2.5} className={`${card.tone.split(' ')[1]}`} aria-hidden="true" />
        </span>
      </div>
    </div>
  </div>
);

const Skeleton = () => (
  <div className="animate-pulse space-y-6" aria-busy="true">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-48 rounded-2xl bg-brand-border/60" />
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="h-64 rounded-2xl bg-brand-border/60 lg:col-span-2" />
      <div className="h-64 rounded-2xl bg-brand-border/60" />
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-52 rounded-2xl bg-brand-border/60" />
      ))}
    </div>
  </div>
);

export const AdminHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data);
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
      <div className="rounded-2xl border border-rose-200 bg-rose-5/50 p-8 text-center shadow-soft">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 mx-auto mb-4">
          <AlertTriangle size={24} />
        </div>
        <p className="mb-4 text-sm font-medium text-brand-text">{error}</p>
        <button type="button" onClick={load} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-brand-accentHover active:scale-[0.98]">
          <RefreshCw size={16} /> Reintentar
        </button>
      </div>
    );
  }

  const users = Number(getNested(stats, 'users')) || 0;
  const profiles = Number(getNested(stats, 'profiles')) || 0;
  const coverage = users > 0 ? Math.min(100, Math.round((profiles / users) * 100)) : 0;
  const pipelineTotal = PIPELINE.reduce((a, p) => a + (Number(getNested(stats, p.valueKey)) || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageTitle title="Resumen administrativo" description="Métricas operativas en tiempo real." />
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm font-semibold text-brand-text transition-all hover:bg-brand-accent/5 hover:border-brand-accent/40 hover:text-brand-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((card) => (
          <StatCard key={card.key} card={card} value={getNested(stats, card.valueKey)} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-brand-border/50 bg-white/90 backdrop-blur-sm shadow-soft p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-brand-text">Estado de los pedidos</h3>
            <p className="text-xs text-brand-textMuted">{fmt(pipelineTotal)} en seguimiento</p>
          </div>

          <div className="mb-6 flex h-3 w-full items-end overflow-hidden rounded-full bg-brand-border/70" role="img" aria-label="Distribución de pedidos por estado">
            {pipelineTotal > 0 && PIPELINE.map((p) => (
              <span
                key={p.key}
                className={`${p.color} transition-all duration-700 ease-out`}
                style={{ width: `${(Number(getNested(stats, p.valueKey)) || 0) / Math.max(pipelineTotal, 1) * 100}%` }}
              />
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {PIPELINE.map((p) => (
              <div key={p.key} className="rounded-xl border border-brand-border/50 bg-white/80 p-4">
                <div className="flex items-center gap-2.5 text-xs font-medium text-brand-textMuted">
                  <span className={`h-2.5 w-2.5 rounded-full ${p.color}`} /> {p.label}
                </div>
                <p className="mt-2 text-2xl font-bold text-brand-text">{fmt(getNested(stats, p.valueKey))}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-brand-border/50 bg-white/90 backdrop-blur-sm shadow-soft p-6">
          <h3 className="text-base font-semibold text-brand-text">Cobertura de perfiles</h3>
          <p className="mt-1 text-xs text-brand-textMuted">Usuarios que ya completaron su perfil de emergencia.</p>

          <div className="mt-6">
            <p className="text-5xl font-extrabold tracking-tight text-brand-accent">{coverage}%</p>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-brand-border/70">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-accent to-rose-600 transition-all duration-700 ease-out" style={{ width: `${coverage}%` }} />
            </div>
            <p className="mt-3 text-xs text-brand-textMuted">{fmt(profiles)} de {fmt(users)} usuarios</p>
          </div>
        </section>
      </div>

      <section>
        <h3 className="mb-4 text-base font-semibold text-brand-text">Accesos rápidos</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map(({ to, label, desc, icon: Icon, tone }) => (
            <Link
              key={to}
              to={to}
              className="group relative rounded-2xl border border-brand-border/50 bg-white/90 backdrop-blur-sm p-5 transition-all duration-300 hover:border-brand-accent/50 hover:shadow-[0_20px_40px_-10px_rgba(159,18,57,0.15)] hover:-translate-y-1"
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone} shadow-lg`}>
                <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
              </span>
              <div className="mt-4">
                <p className="text-sm font-semibold text-brand-text">{label}</p>
                <p className="mt-1 text-xs text-brand-textMuted">{desc}</p>
              </div>
              <ArrowRight size={14} className="absolute right-5 top-5 text-brand-textMuted transition-transform group-hover:translate-x-1 group-hover:text-brand-accent" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminHome;
