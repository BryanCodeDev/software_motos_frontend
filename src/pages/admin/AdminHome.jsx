import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, QrCode, ShoppingBag, HeartPulse, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';

const nf = new Intl.NumberFormat('es-CO');
const fmt = (n) => (n === undefined || n === null ? '—' : nf.format(Number(n) || 0));

/* Cada bloque lleva a la lista ya filtrada */
const ORDER_TILES = [
  { key: 'pending', label: 'Pago pendiente', status: 'pending_payment', dot: 'bg-amber-500' },
  { key: 'paid', label: 'Por preparar', status: 'paid', dot: 'bg-emerald-500', urgent: true },
  { key: 'delivering', label: 'En entrega', status: 'shipped', dot: 'bg-sky-500' },
];

const Skeleton = () => (
  <div className="animate-pulse space-y-6" aria-busy="true">
    <div className="h-8 w-40 rounded-lg bg-border/60" />
    <div className="grid gap-3 sm:grid-cols-3">
      {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-border/60" />)}
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-border/60" />)}
    </div>
  </div>
);

const Tile = ({ to, children, className = '' }) => (
  <Link
    to={to}
    className={`focus-ring group flex items-center justify-between gap-3 rounded-2xl border p-4 transition-colors ${className}`}
  >
    {children}
    <ChevronRight size={18} className="flex-none text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden="true" />
  </Link>
);

export const AdminHome = () => {
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
      setError(e?.response?.data?.error || 'No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

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

  const users = Number(stats?.users) || 0;
  const profiles = Number(stats?.profiles) || 0;
  const coverage = users > 0 ? Math.min(100, Math.round((profiles / users) * 100)) : 0;

  const kpis = [
    { label: 'Usuarios', value: stats?.users, icon: Users, to: '/admin/usuarios' },
    { label: 'QR activos', value: stats?.identifiers?.active, icon: QrCode, to: '/admin/qrs' },
    { label: 'Pedidos en 7 días', value: stats?.orders?.recent, icon: ShoppingBag, to: '/admin/pedidos' },
  ];

  return (
    <div className="space-y-6">
      <PageTitle
        title="Resumen"
        actions={
          <div className="flex items-center gap-3">
            {updatedAt && (
              <span className="hidden text-xs text-text-secondary sm:inline">
                {updatedAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button type="button" onClick={load} disabled={loading} className="btn-outline px-3.5 py-2 text-sm" aria-label="Actualizar">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        }
      />

      <section aria-labelledby="orders-h">
        <h2 id="orders-h" className="mb-3 text-sm font-semibold text-neutral-900">Pedidos</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ORDER_TILES.map((t) => {
            const value = Number(stats?.orders?.[t.key]) || 0;
            const urgent = t.urgent && value > 0;
            return (
              <Tile
                key={t.key}
                to={`/admin/pedidos?estado=${t.status}`}
                className={urgent ? 'border-brand-500/40 bg-brand-50' : 'border-border bg-white hover:border-brand-500/40'}
              >
                <div>
                  <p className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className={`h-2 w-2 rounded-full ${t.dot}`} aria-hidden="true" /> {t.label}
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">{fmt(value)}</p>
                </div>
              </Tile>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="platform-h">
        <h2 id="platform-h" className="mb-3 text-sm font-semibold text-neutral-900">Plataforma</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map(({ label, value, icon: Icon, to }) => (
            <Tile key={label} to={to} className="border-border bg-white hover:border-brand-500/40">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs text-text-secondary">{label}</p>
                  <p className="text-xl font-bold text-neutral-900">{fmt(value)}</p>
                </div>
              </div>
            </Tile>
          ))}

          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                <HeartPulse size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-text-secondary">Perfiles completos</p>
                <p className="text-xl font-bold text-neutral-900">
                  {fmt(profiles)} <span className="text-sm font-medium text-text-secondary">de {fmt(users)}</span>
                </p>
              </div>
            </div>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-border/70"
              role="progressbar"
              aria-valuenow={coverage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Usuarios con perfil completo"
            >
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${coverage}%` }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminHome;