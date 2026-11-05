import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, AlertTriangle, Loader2, PackageOpen } from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useToast } from '../../components/useToast';
import { Badge } from '../../components/ui-kit';

const STATUS_OPTIONS = [
  'pending_confirmation', 'pending_payment', 'paid', 'preparing', 'shipped',
  'delivered', 'cancelled', 'refund_requested', 'refunded',
];

const TONES = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

const COMMERCIAL = {
  draft: ['Borrador', 'slate'],
  pending_confirmation: ['Por confirmar', 'amber'],
  pending_payment: ['Pago pendiente', 'amber'],
  paid: ['Pagado', 'emerald'],
  preparing: ['Preparando', 'sky'],
  shipped: ['Enviado', 'sky'],
  delivered: ['Entregado', 'emerald'],
  cancelled: ['Cancelado', 'rose'],
  refund_requested: ['Reembolso solicitado', 'amber'],
  refunded: ['Reembolsado', 'slate'],
};

const PAYMENT = {
  unpaid: ['Sin pagar', 'slate'],
  pending: ['Pendiente', 'amber'],
  approved: ['Aprobado', 'emerald'],
  rejected: ['Rechazado', 'rose'],
  cancelled: ['Cancelado', 'rose'],
  refunded: ['Reembolsado', 'slate'],
};

const BadgeStatus = ({ map, value }) => {
  const [label, tone] = map[value] || [value || '—', 'slate'];
  return (
    <Badge tone={tone} size="sm">
      {label}
    </Badge>
  );
};

const money = (amount, currency = 'COP') => {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount) || 0);
  } catch {
    return `${amount} ${currency}`;
  }
};

export const AdminOrders = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/orders');
      setOrders(data.orders || []);
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const updateStatus = async (o, commercial_status) => {
    if (!commercial_status) return;
    const label = COMMERCIAL[commercial_status]?.[0] || commercial_status;
    if (!window.confirm(`¿Cambiar el pedido ${o.order_number} a "${label}"?`)) return;
    setBusyId(o.id);
    try {
      await api.patch(`/admin/orders/${o.id}`, { commercial_status });
      toast.success('Estado actualizado');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo actualizar el pedido');
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(() => {
    const c = { all: orders.length };
    orders.forEach((o) => { c[o.commercial_status] = (c[o.commercial_status] || 0) + 1; });
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== 'all' && o.commercial_status !== filter) return false;
      if (!q) return true;
      return [o.order_number, o.customer_email, o.product_name].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [orders, query, filter]);

  const StatusSelect = ({ o }) => (
    <div className="relative">
      <select
        value=""
        disabled={busyId === o.id}
        onChange={(e) => updateStatus(o, e.target.value)}
        aria-label={`Cambiar estado del pedido ${o.order_number}`}
        className="input !py-1.5 !text-base sm:!text-xs"
      >
        <option value="">Cambiar estado…</option>
        {STATUS_OPTIONS.filter((s) => s !== o.commercial_status).map((s) => (
          <option key={s} value={s}>{COMMERCIAL[s][0]}</option>
        ))}
      </select>
      {busyId === o.id && <Loader2 size={14} className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-text-secondary" />}
    </div>
  );

  const chips = ['all', ...STATUS_OPTIONS.filter((s) => counts[s])];

  return (
    <div className="space-y-5">
      <PageTitle title="Pedidos" description="Gestiona pedidos comerciales." />

      <div className="rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] space-y-3 p-4">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por número, cliente o producto"
            aria-label="Buscar pedidos"
            className="input !pl-10 !text-base sm:!text-sm"
          />
        </div>
        <div className="custom-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {chips.map((s) => {
            const active = filter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`flex-none rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-border bg-white text-text-secondary hover:border-brand-500/40 hover:text-neutral-900'
                }`}
              >
                {s === 'all' ? 'Todos' : COMMERCIAL[s][0]}
                <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-text-secondary/70'}`}>{counts[s] || 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-5/50 p-4 text-sm text-rose-700 flex items-center gap-3">
          <AlertTriangle size={18} /> {error}
          <button type="button" onClick={load} className="ml-auto font-semibold underline">Reintentar</button>
        </div>
      )}

      {loading && !error && (
        <div className="rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] animate-pulse space-y-3 p-4" aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-lg bg-border/60" />)}
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] flex flex-col items-center gap-2 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
            <PackageOpen size={22} />
          </span>
          <p className="text-sm font-semibold text-neutral-900">No hay pedidos para mostrar</p>
          <p className="text-xs text-text-secondary">Ajusta la búsqueda o el filtro de estado.</p>
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <>
          <div className="rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] overflow-hidden hidden md:block">
            <div className="custom-scrollbar overflow-x-auto">
              <table className="table w-full text-sm">
                <thead className="bg-brand-50/70 text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                  <tr>
                    <th scope="col" className="px-4 py-3">Pedido</th>
                    <th scope="col" className="px-4 py-3">Cliente</th>
                    <th scope="col" className="px-4 py-3">Producto</th>
                    <th scope="col" className="px-4 py-3 text-right">Total</th>
                    <th scope="col" className="px-4 py-3">Estado</th>
                    <th scope="col" className="px-4 py-3">Pago</th>
                    <th scope="col" className="px-4 py-3">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visible.map((o) => (
                    <tr key={o.id} className="transition-colors hover:bg-brand-50/60">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-neutral-900">{o.order_number}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-text-secondary" title={o.customer_email}>{o.customer_email}</td>
                      <td className="px-4 py-3 text-neutral-900">{o.product_name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-neutral-900">{money(o.total_amount, o.currency)}</td>
                      <td className="px-4 py-3"><BadgeStatus map={COMMERCIAL} value={o.commercial_status} /></td>
                      <td className="px-4 py-3"><BadgeStatus map={PAYMENT} value={o.payment_status} /></td>
                      <td className="min-w-[170px] px-4 py-3"><StatusSelect o={o} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="space-y-3 md:hidden">
            {visible.map((o) => (
              <li key={o.id} className="rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-neutral-900">{o.order_number}</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">{o.product_name}</p>
                    <p className="break-all text-xs text-text-secondary">{o.customer_email}</p>
                  </div>
                  <p className="whitespace-nowrap text-sm font-bold text-neutral-900">{money(o.total_amount, o.currency)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <BadgeStatus map={COMMERCIAL} value={o.commercial_status} />
                  <BadgeStatus map={PAYMENT} value={o.payment_status} />
                </div>
                <div className="mt-3 border-t border-border pt-3">
                  <StatusSelect o={o} />
                </div>
              </li>
            ))}
          </ul>

          <p className="text-center text-xs text-text-secondary">
            Mostrando {visible.length} de {orders.length} pedidos
          </p>
        </>
      )}
    </div>
  );
};

export default AdminOrders;


