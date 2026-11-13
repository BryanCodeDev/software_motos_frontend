import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, QrCode, Check, ArrowRight, AlertTriangle, RotateCcw, Ban, Undo2, Plus } from 'lucide-react';
import api from '../../api/client';
import { routes } from '../../utils/routes';
import { useToast } from '../../components/useToast';
import { PageTitle, PageLoader, EmptyState } from '../../components/DashPage';
import { Badge } from '../../components/ui-kit';

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

/* ───────── Etiquetas y tonos ───────── */
const commercialLabels = {
  draft: 'Borrador',
  pending_confirmation: 'Por confirmar',
  pending_payment: 'Por pagar',
  paid: 'Pagado',
  preparing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refund_requested: 'Reembolso solicitado',
  refunded: 'Reembolsado',
};

const commercialTone = {
  paid: 'success',
  preparing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
  refunded: 'neutral',
  refund_requested: 'warn',
  pending_payment: 'warn',
  pending_confirmation: 'warn',
  draft: 'neutral',
};

/* El estado del pago solo se muestra cuando aporta algo distinto al estado del pedido */
const paymentNotice = {
  pending: { label: 'Pago pendiente', tone: 'warn' },
  in_process: { label: 'Pago en proceso', tone: 'warn' },
  rejected: { label: 'Pago rechazado', tone: 'danger' },
};

/* ───────── Seguimiento ───────── */
const STAGES = ['Pedido', 'Pagado', 'Preparando', 'Enviado', 'Entregado'];
const STAGE_INDEX = {
  draft: 0,
  pending_confirmation: 0,
  pending_payment: 0,
  paid: 1,
  preparing: 2,
  shipped: 3,
  delivered: 4,
};
const CLOSED = ['cancelled', 'refund_requested', 'refunded'];
const CLOSED_INFO = {
  cancelled: { icon: Ban, cls: 'border-rose-200 bg-rose-50/70 text-rose-700', text: 'Pedido cancelado.' },
  refund_requested: { icon: Undo2, cls: 'border-amber-200 bg-amber-50/70 text-amber-700', text: 'Reembolso solicitado.' },
  refunded: { icon: Undo2, cls: 'border-border bg-neutral-100/70 text-text-secondary', text: 'Pedido reembolsado.' },
};

const FILTERS = [
  { id: 'all', label: 'Todos', test: () => true },
  { id: 'active', label: 'En curso', test: (o) => !CLOSED.includes(o.commercial_status) && o.commercial_status !== 'delivered' },
  { id: 'delivered', label: 'Entregados', test: (o) => o.commercial_status === 'delivered' },
  { id: 'closed', label: 'Cancelados', test: (o) => CLOSED.includes(o.commercial_status) },
];

/* ───────── Formato ───────── */
const formatAmount = (amount, currency) => {
  if (amount === null || amount === undefined || amount === '') return '—';
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency || 'COP',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${amount} ${currency || ''}`.trim();
  }
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

/* ───────── Seguimiento visual ───────── */
const Tracker = ({ current }) => {
  const last = STAGES.length - 1;
  return (
    <div className="relative" role="group" aria-label={`Seguimiento: ${STAGES[current]}`}>
      <div className="absolute left-[10%] right-[10%] top-[11px] h-0.5 rounded-full bg-border" aria-hidden="true">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-brand-500 transition-[width] duration-700"
          style={{ width: `${(current / last) * 100}%` }}
        />
      </div>
      <ol className="relative grid grid-cols-5">
        {STAGES.map((label, i) => {
          const done = i < current || (current === last && i === last);
          const active = i === current && current !== last;
          return (
            <li key={label} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-1 ${
                  done
                    ? 'bg-brand-500 text-white ring-brand-500'
                    : active
                      ? 'bg-white text-brand-500 ring-2 ring-brand-500'
                      : 'bg-white text-text-muted ring-border'
                }`}
              >
                {done ? <Check size={12} strokeWidth={3} aria-hidden="true" /> : i + 1}
              </span>
              <span className={`text-[10px] leading-tight sm:text-xs ${done || active ? 'font-semibold text-neutral-900' : 'text-text-secondary'}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

const OrderCard = ({ order: o }) => {
  const isQr = o.product_slug === 'qr-digital-basico';
  const Icon = isQr ? QrCode : Package;
  const closed = CLOSED.includes(o.commercial_status);
  const closedInfo = CLOSED_INFO[o.commercial_status];
  const stage = STAGE_INDEX[o.commercial_status] ?? 0;
  const needsPayment = isQr && !closed && o.payment_status !== 'approved';
  const payNotice = paymentNotice[o.payment_status];

  return (
    <li className={`${panel} p-5 sm:p-6`}>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
          <Icon size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900 sm:text-base">{o.product_name}</p>
          {o.design_name && (
            <p className="mt-0.5 text-xs text-text-secondary">
              Diseño {o.design_name}, {o.sticker_quantity || 2} stickers
            </p>
          )}
          <p className="mt-0.5 text-xs text-text-secondary">
            <span className="font-mono font-semibold text-neutral-900">{o.order_number}</span>
            {' '}del {formatDate(o.created_at)}
          </p>
        </div>
        <p className="flex-none whitespace-nowrap text-base font-bold text-neutral-900 sm:text-lg">
          {formatAmount(o.total_amount, o.currency)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge tone={commercialTone[o.commercial_status]}>
          {commercialLabels[o.commercial_status] || o.commercial_status}
        </Badge>
        {payNotice && !closed && <Badge tone={payNotice.tone}>{payNotice.label}</Badge>}
      </div>

      <div className="mt-5 border-t border-border pt-5">
        {closed && closedInfo ? (
          <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${closedInfo.cls}`}>
            <closedInfo.icon size={16} className="flex-none" aria-hidden="true" />
            {closedInfo.text}
          </div>
        ) : (
          <Tracker current={stage} />
        )}
      </div>

      {isQr && !closed && (
        <div className="mt-5 flex justify-end">
          <Link to={routes.dashboardQr} className={`${needsPayment ? 'btn-primary' : 'btn-outline'} px-4 py-2 text-sm`}>
            {needsPayment ? 'Completar pago' : 'Ver mi QR'}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      )}
    </li>
  );
};

/* ───────── Página ───────── */
export const OrdersPage = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await api.get('/orders');
      const list = res.data.orders || res.data || [];
      setOrders(
        [...list].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()),
      );
    } catch (error) {
      if (!(error.response && error.response.status === 404)) {
        setFailed(true);
        toastRef.current.error('No se pudieron cargar los pedidos');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, orders.filter(f.test).length])),
    [orders],
  );

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter) || FILTERS[0];
    return orders.filter(f.test);
  }, [orders, filter]);

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in space-y-5 lg:space-y-6">
      <PageTitle title="Mis pedidos" description="Sigue el estado de tu QR y tus stickers." />

      {failed ? (
        <div className={`${panel} p-6 lg:p-8`}>
          <EmptyState icon={AlertTriangle} title="No pudimos cargar tus pedidos" text="Revisa tu conexión e inténtalo de nuevo.">
            <button type="button" onClick={load} className="btn-outline px-4 py-2 text-sm">
              <RotateCcw size={16} aria-hidden="true" /> Reintentar
            </button>
          </EmptyState>
        </div>
      ) : orders.length === 0 ? (
        <div className={`${panel} p-6 lg:p-8`}>
          <EmptyState icon={Package} title="Aún no tienes pedidos" text="Aquí verás tu QR y tus stickers cuando los pidas.">
            <Link to={routes.products} className="btn-primary px-5 py-2.5 text-sm">
              Ver productos <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Filtrar pedidos"
              className="custom-scrollbar flex max-w-full gap-1.5 overflow-x-auto rounded-xl border border-border bg-white p-1.5"
            >
              {FILTERS.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(f.id)}
                    className={`flex flex-none items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus-ring ${
                      active ? 'bg-brand-500 text-white' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900'
                    }`}
                  >
                    {f.label}
                    <span className={`rounded-full px-1.5 text-[11px] font-bold ${active ? 'bg-white/20' : 'bg-brand-50'}`}>
                      {counts[f.id]}
                    </span>
                  </button>
                );
              })}
            </div>
            <Link to={routes.products} className="btn-outline px-4 py-2 text-sm">
              <Plus size={16} aria-hidden="true" /> Pedir sticker
            </Link>
          </div>

          {visible.length === 0 ? (
            <div className={`${panel} p-6 lg:p-8`}>
              <EmptyState icon={Package} title="Sin pedidos en esta categoría" text="Prueba con otro filtro.">
                <button type="button" onClick={() => setFilter('all')} className="btn-outline px-4 py-2 text-sm">
                  Ver todos
                </button>
              </EmptyState>
            </div>
          ) : (
            <ul className="space-y-4" aria-live="polite">
              {visible.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersPage;