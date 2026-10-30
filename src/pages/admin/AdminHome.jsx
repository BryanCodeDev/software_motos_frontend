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

const Kpi = ({ icon: Icon, label, value, hint, tone }) => (
  <div className="card-static p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-brand-textMuted">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-brand-text">{value}</p>
      </div>
      <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl ring-1 ${tone}`}>
        <Icon size={20} aria-hidden="true" />
      </span>
    </div>
    {hint && <p className="mt-3 text-xs text-brand-textMuted">{hint}</p>}
  </div>
);

const Skeleton = () => (
  <div className="animate-pulse space-y-4" aria-busy="true">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl bg-brand-border/60" />)}
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="h-56 rounded-xl bg-brand-border/60 lg:col-span-2" />
      <div className="h-56 rounded-xl bg-brand-border/60" />
    </div>
  </div>
);

const QUICK = [
  { to: '/admin/usuarios', label: 'Gestionar usuarios', desc: 'Cuentas y roles', icon: Users },
  { to: '/admin/pedidos', label: 'Revisar pedidos', desc: 'Estados y pagos', icon: Package },
  { to: '/admin/auditoria', label: 'Ver auditoría', desc: 'Eventos administrativos', icon: ScrollText },
];

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

  const users = Number(stats?.users) || 0;
  const profiles = Number(stats?.profiles) || 0;
  const coverage = users > 0 ? Math.min(100, Math.round((profiles / users) * 100)) : 0;

  const pipeline = [
    { key: 'pending', label: 'Pendientes', value: Number(stats?.orders?.pending) || 0, bar: 'bg-amber-500' },
    { key: 'paid', label: 'Pagados', value: Number(stats?.orders?.paid) || 0, bar: 'bg-emerald-500' },
    { key: 'delivering', label: 'En entrega', value: Number(stats?.orders?.delivering) || 0, bar: 'bg-sky-500' },
  ];
  const pipelineTotal = pipeline.reduce((a, p) => a + p.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageTitle title="Resumen administrativo" description="Métricas operativas en tiempo real." />
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="btn-outline !px-4 !py-2 text-sm self-start"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Actualizar
        </button>
      </div>

      {loading && !stats && <Skeleton />}

      {error && (
        <div className="card-static flex flex-col items-center gap-3 p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle size={22} />
          </span>
          <p className="text-sm font-medium text-brand-text">{error}</p>
          <button type="button" onClick={load} className="btn-primary !px-5 !py-2 text-sm">Reintentar</button>
        </div>
      )}

      {stats && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi icon={Users} label="Usuarios" value={fmt(stats.users)} tone="bg-sky-50 text-sky-700 ring-sky-600/15" hint="Cuentas registradas" />
            <Kpi icon={HeartPulse} label="Perfiles de emergencia" value={fmt(stats.profiles)} tone="bg-brand-accent/10 text-brand-accent ring-brand-accent/20" hint={`${coverage}% de los usuarios tiene perfil`} />
            <Kpi icon={QrCode} label="QR activos" value={fmt(stats.identifiers?.active)} tone="bg-emerald-50 text-emerald-700 ring-emerald-600/15" hint="Identificadores en uso" />
            <Kpi icon={ShoppingBag} label="Pedidos (7 días)" value={fmt(stats.orders?.recent)} tone="bg-amber-50 text-amber-700 ring-amber-600/15" hint="Actividad reciente" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="card-static p-5 lg:col-span-2" aria-labelledby="pipeline-title">
              <div className="flex items-center justify-between">
                <h3 id="pipeline-title" className="text-base font-semibold text-brand-text">Estado de los pedidos</h3>
                <span className="text-xs text-brand-textMuted">{fmt(pipelineTotal)} en seguimiento</span>
              </div>

              <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-brand-border/70" role="img" aria-label="Distribución de pedidos por estado">
                {pipelineTotal > 0 && pipeline.map((p) => (
                  <span
                    key={p.key}
                    className={`${p.bar} transition-all duration-500`}
                    style={{ width: `${(p.value / pipelineTotal) * 100}%` }}
                  />
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {pipeline.map((p) => (
                  <div key={p.key} className="rounded-xl border border-brand-border bg-brand-dark/60 p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-brand-textMuted">
                      <span className={`h-2.5 w-2.5 rounded-full ${p.bar}`} /> {p.label}
                    </div>
                    <p className="mt-2 text-2xl font-bold text-brand-text">{fmt(p.value)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="card-static p-5" aria-labelledby="coverage-title">
              <h3 id="coverage-title" className="text-base font-semibold text-brand-text">Cobertura de perfiles</h3>
              <p className="mt-1 text-xs text-brand-textMuted">Usuarios que ya completaron su perfil de emergencia.</p>
              <p className="mt-5 text-4xl font-extrabold tracking-tight text-brand-accent">{coverage}%</p>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-brand-border/70">
                <div className="h-full rounded-full bg-brand-accent transition-all duration-500" style={{ width: `${coverage}%` }} />
              </div>
              <p className="mt-3 text-xs text-brand-textMuted">{fmt(profiles)} de {fmt(users)} usuarios</p>
            </section>
          </div>

          <section aria-labelledby="quick-title">
            <h3 id="quick-title" className="mb-3 text-base font-semibold text-brand-text">Accesos rápidos</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {QUICK.map(({ to, label, desc, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="card group flex items-center gap-4 p-4"
                >
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-text">{label}</p>
                    <p className="text-xs text-brand-textMuted">{desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-brand-textMuted transition-transform group-hover:translate-x-1 group-hover:text-brand-accent" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminHome;