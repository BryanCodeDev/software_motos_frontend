import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, AlertTriangle, Loader2, PackageOpen, X } from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useToast } from '../../components/useToast';
import Modal from '../../components/Modal';
import { Badge } from '../../components/ui-kit';

const panel = 'rounded-2xl border border-border bg-white';
const COLS = 'xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_5.5rem_8.5rem_14rem] xl:gap-4';

/* ───────── Estados ───────── */
const STATUS_OPTIONS = [
  'pending_confirmation', 'pending_payment', 'paid', 'preparing', 'shipped',
  'delivered', 'cancelled', 'refund_requested', 'refunded',
];
const COMMERCIAL = {
  draft: ['Borrador', 'neutral'],
  pending_confirmation: ['Por confirmar', 'warn'],
  pending_payment: ['Pago pendiente', 'warn'],
  paid: ['Pagado', 'success'],
  preparing: ['Preparando', 'info'],
  shipped: ['Enviado', 'info'],
  delivered: ['Entregado', 'success'],
  cancelled: ['Cancelado', 'danger'],
  refund_requested: ['Reembolso solicitado', 'warn'],
  refunded: ['Reembolsado', 'neutral'],
};
const PAYMENT = {
  unpaid: ['Sin pagar', 'neutral'],
  pending: ['Pago en proceso', 'warn'],
  approved: ['Pago aprobado', 'success'],
  rejected: ['Pago rechazado', 'danger'],
  cancelled: ['Pago cancelado', 'danger'],
  refunded: ['Pago reembolsado', 'neutral'],
};

/* Flujo normal: un botón para el siguiente paso */
const NEXT = { paid: 'preparing', preparing: 'shipped', shipped: 'delivered' };
const NEXT_LABEL = { preparing: 'Preparar pedido', shipped: 'Marcar enviado', delivered: 'Marcar entregado' };
/* Estados que cierran el pedido: piden confirmación */
const CLOSING = ['cancelled', 'refunded'];

const money = (amount, currency = 'COP') => {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: currency || 'COP', maximumFractionDigits: 0 }).format(Number(amount) || 0);
  } catch {
    return `${amount} ${currency}`;
  }
};

const StatusBadge = ({ map, value }) => {
  const [label, tone] = map[value] || [value || '—', 'neutral'];
  return <Badge tone={tone} size="sm">{label}</Badge>;
};

const OrderActions = ({ o, busy, onPick }) => {
  const next = NEXT[o.commercial_status];
  return (
    <div className="flex items-center gap-2">
      {next && (
        <button type="button" disabled={busy} onClick={() => onPick(o, next)} className="btn-primary flex-none px-3 py-1.5 text-xs">
          {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : NEXT_LABEL[next]}
        </button>
      )}
      <select
        value=""
        disabled={busy}
        onChange={(e) => onPick(o, e.target.value)}
        aria-label={`Cambiar estado del pedido ${o.order_number}`}
        className="input min-w-0 flex-1 !py-1.5 !text-base sm:!text-xs"
      >
        <option value="">{next ? 'Otro estado' : 'Cambiar estado'}</option>
        {STATUS_OPTIONS.filter((s) => s !== o.commercial_status && s !== next).map((s) => (
          <option key={s} value={s}>{COMMERCIAL[s][0]}</option>
        ))}
      </select>
    </div>
  );
};

export const AdminOrders = () => {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [pending, setPending] = useState(null); // { order, status }

  /* El filtro vive en la URL: se puede enlazar desde el Resumen y funciona el botón Atrás */
  const urlStatus = params.get('estado');
  const filter = STATUS_OPTIONS.includes(urlStatus) ? urlStatus : 'all';
  const setFilter = (s) => setParams(s === 'all' ? {} : { estado: s }, { replace: true });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/orders');
      setOrders(data.orders || []);
    } catch (e) {
      setError(e?.response?.data?.error || 'No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const applyStatus = async (o, status) => {
    setBusyId(o.id);
    try {
      await api.patch(`/admin/orders/${o.id}`, { commercial_status: status });
      toast.success(`${o.order_number}: ${COMMERCIAL[status][0]}`);
      setPending(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo actualizar el pedido');
    } finally {
      setBusyId(null);
    }
  };

  const askStatus = (o, status) => {
    if (!status) return;
    if (CLOSING.includes(status)) setPending({ order: o, status });
    else applyStatus(o, status);
  };

  const counts = useMemo(() => {
    const c = {};
    orders.forEach((o) => { c[o.commercial_status] = (c[o.commercial_status] || 0) + 1; });
    return c;
  }, [orders]);

  const revenue = useMemo(
    () => orders.filter((o) => o.payment_status === 'approved').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
    [orders],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== 'all' && o.commercial_status !== filter) return false;
      if (!q) return true;
      return [o.order_number, o.customer_email, o.product_name, o.design_name].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [orders, query, filter]);

  const chips = ['all', ...STATUS_OPTIONS.filter((s) => counts[s] || s === filter)];
  const hasFilters = !!query || filter !== 'all';
  const confirming = !!pending && busyId === pending.order.id;

  return (
    <div className="space-y-4">
      <PageTitle title="Pedidos" />

      <div className={`${panel} space-y-3 p-3 lg:p-4`}>
        <div className="relative" role="search">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por número, cliente o producto"
            aria-label="Buscar pedidos"
            className="input !pl-10 !pr-10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Borrar búsqueda"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary hover:bg-brand-50 hover:text-neutral-900"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
        <div role="group" aria-label="Filtrar por estado" className="custom-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {chips.map((s) => {
            const active = filter === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(s)}
                className={`focus-ring flex-none rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active ? 'border-brand-500 bg-brand-500 text-white' : 'border-border bg-white text-text-secondary hover:border-brand-500/40 hover:text-neutral-900'
                }`}
              >
                {s === 'all' ? 'Todos' : COMMERCIAL[s][0]}
                <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-text-secondary/70'}`}>
                  {s === 'all' ? orders.length : counts[s] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700" role="alert">
          <AlertTriangle size={18} className="flex-none" aria-hidden="true" />
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" onClick={load} className="flex-none font-semibold underline underline-offset-2">Reintentar</button>
        </div>
      )}

      {loading && orders.length === 0 && !error && (
        <div className={`${panel} animate-pulse space-y-3 p-4`} aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-lg bg-border/60" />)}
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className={`${panel} flex flex-col items-center p-10 text-center`}>
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
            <PackageOpen size={20} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-neutral-900">Sin pedidos</p>
          {hasFilters && (
            <button type="button" onClick={() => { setQuery(''); setFilter('all'); }} className="btn-outline mt-4 px-4 py-2 text-sm">
              <X size={16} aria-hidden="true" /> Quitar filtros
            </button>
          )}
        </div>
      )}

      {visible.length > 0 && !error && (
        <>
          <div className={`${panel} overflow-hidden`}>
            <div className={`hidden border-b border-border bg-brand-50/70 px-4 py-3 text-xs font-semibold text-text-secondary ${COLS}`}>
              <span>Pedido</span>
              <span>Producto</span>
              <span className="text-right">Total</span>
              <span>Estado</span>
              <span>Acción</span>
            </div>
            <ul className="divide-y divide-border">
              {visible.map((o) => {
                const qty = Number(o.sticker_quantity) || 1;
                const place = [o.shipping_address?.city, o.shipping_address?.department].filter(Boolean).join(', ');
                return (
                  <li key={o.id} className={`flex flex-wrap items-center gap-x-4 gap-y-3 p-4 hover:bg-brand-50/30 ${COLS}`}>
                    <div className="min-w-0 basis-full xl:basis-auto">
                      <p className="font-mono text-xs font-semibold text-neutral-900">{o.order_number}</p>
                      <p className="mt-0.5 truncate text-sm text-text-secondary" title={o.customer_email}>{o.customer_email}</p>
                      {place && <p className="truncate text-xs text-text-secondary">{place}</p>}
                    </div>

                    <div className="min-w-0 basis-full xl:basis-auto">
                      <p className="truncate text-sm font-medium text-neutral-900">{o.product_name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-secondary">
                        {o.design_image_url && (
                          <img
                            src={o.design_image_url}
                            alt=""
                            className="h-5 w-5 flex-none rounded object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <span className="truncate">{o.design_name ? `${o.design_name} · ` : ''}{qty} {qty === 1 ? 'sticker' : 'stickers'}</span>
                      </p>
                      {o.qr_value && <p className="truncate font-mono text-xs text-text-secondary" title={o.qr_value}>QR {o.qr_value}</p>}
                    </div>

                    <p className="text-sm font-semibold text-neutral-900 xl:text-right">{money(o.total_amount, o.currency)}</p>

                    <div className="flex flex-wrap gap-1.5 xl:flex-col xl:items-start">
                      <StatusBadge map={COMMERCIAL} value={o.commercial_status} />
                      <StatusBadge map={PAYMENT} value={o.payment_status} />
                    </div>

                    <div className="w-full xl:w-auto">
                      <OrderActions o={o} busy={busyId === o.id} onPick={askStatus} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="text-center text-xs text-text-secondary">
            {visible.length} de {orders.length} pedidos · Ingresos aprobados <span className="font-semibold text-neutral-900">{money(revenue)}</span>
          </p>
        </>
      )}

      <Modal
        isOpen={!!pending}
        onClose={() => (confirming ? null : setPending(null))}
        title={pending?.status === 'refunded' ? 'Marcar como reembolsado' : 'Cancelar pedido'}
      >
        {pending && (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-text-secondary">
              El pedido <span className="font-mono font-semibold text-neutral-900">{pending.order.order_number}</span> pasará a{' '}
              <span className="font-semibold text-neutral-900">{COMMERCIAL[pending.status][0].toLowerCase()}</span> y se cerrará.
              Revisa el pago antes de continuar.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setPending(null)} disabled={confirming} className="btn-ghost px-4 py-2 text-sm">Volver</button>
              <button type="button" onClick={() => applyStatus(pending.order, pending.status)} disabled={confirming} className="btn-danger px-4 py-2 text-sm">
                {confirming && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {confirming ? 'Guardando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminOrders;