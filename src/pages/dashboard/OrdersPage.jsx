import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  Package, QrCode, Truck, Wallet, Check, ArrowRight, AlertTriangle, RotateCcw, Ban, Undo2, Plus,
} from 'lucide-react';
import api from '../../api/client';
import { routes } from '../../utils/routes';
import { useToast } from '../../components/useToast';
import { PageTitle, PageLoader, EmptyState } from '../../components/DashPage';
import { Badge, StatCard } from '../../components/ui-kit';

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

/* ───────── Etiquetas y tonos ───────── */
const commercialLabels = {
  draft: 'Borrador',
  pending_confirmation: 'Pendiente de confirmación',
  pending_payment: 'Pendiente de pago',
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

const paymentLabels = {
  unpaid: 'Sin pagar',
  approved: 'Aprobado',
  pending: 'Pendiente',
  in_process: 'En proceso',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

const paymentTone = {
  unpaid: 'neutral',
  approved: 'success',
  pending: 'warn',
  in_process: 'warn',
  rejected: 'danger',
  cancelled: 'danger',
  refunded: 'neutral',
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
  cancelled: { icon: Ban, cls: 'border-rose-200 bg-rose-50/70 text-rose-700', text: 'Este pedido fue cancelado.' },
  refund_requested: { icon: Undo2, cls: 'border-amber-200 bg-amber-50/70 text-amber-700', text: 'Solicitaste el reembolso de este pedido.' },
  refunded: { icon: Undo2, cls: 'border-border bg-neutral-100/70 text-text-secondary', text: 'Este pedido fue reembolsado.' },
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
        <motion.span
          className="absolute inset-0 origin-left rounded-full bg-brand-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: current / last }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.25 }}
        />
      </div>
      <ol className="relative grid grid-cols-5">
        {STAGES.map((label, i) => {
          const done = i < current || (current === last && i === last);
          const active = i === current && current !== last;
          return (
            <li key={label} className="flex flex-col items-center gap-1.5 text-center">
              <span className="relative flex h-6 w-6 items-center justify-center">
                {active && <span aria-hidden="true" className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500/30" />}
                <span
                  className={`relative flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-1 transition-colors duration-300 ${
                    done
                      ? 'bg-brand-500 text-white ring-brand-500'
                      : active
                        ? 'bg-white text-brand-500 ring-2 ring-brand-500'
                        : 'bg-white text-text-muted ring-border'
                  }`}
                >
                  {done ? <Check size={12} strokeWidth={3} aria-hidden="true" /> : i + 1}
                </span>
              </span>
              <span
                className={`text-[10px] leading-tight sm:text-xs ${
                  done || active ? 'font-semibold text-neutral-900' : 'text-text-secondary'
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

const OrderCard = ({ order: o, index }) => {
  const isQr = o.product_slug === 'qr-digital-basico';
  const Icon = isQr ? QrCode : Package;
  const closed = CLOSED.includes(o.commercial_status);
  const closedInfo = CLOSED_INFO[o.commercial_status];
  const stage = STAGE_INDEX[o.commercial_status] ?? 0;
  const needsPayment = isQr && !closed && o.payment_status !== 'approved';

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
      transition={{ duration: 0.4, ease: EASE, delay: Math.min(index, 6) * 0.05 }}
      className={`${panel} p-5 transition-shadow duration-300 hover:shadow-[0_20px_50px_-20px_rgba(159,18,57,0.35)] sm:p-6`}
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
          <Icon size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900 sm:text-base">{o.product_name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-text-secondary">
            <span className="font-mono font-semibold text-neutral-900">{o.order_number}</span>
            <span aria-hidden="true">·</span>
            <span>{formatDate(o.created_at)}</span>
          </p>
        </div>
        <p className="flex-none whitespace-nowrap text-right text-base font-bold text-neutral-900 sm:text-lg">
          {formatAmount(o.total_amount, o.currency)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge tone={commercialTone[o.commercial_status]}>
          {commercialLabels[o.commercial_status] || o.commercial_status}
        </Badge>
        <Badge tone={paymentTone[o.payment_status]}>
          Pago: {paymentLabels[o.payment_status] || o.payment_status || '—'}
        </Badge>
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
    </motion.li>
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

  const stats = useMemo(() => {
    const active = orders.filter(FILTERS[1].test).length;
    const paid = orders
      .filter((o) => o.payment_status === 'approved')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    return { active, paid };
  }, [orders]);

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
    <MotionConfig reducedMotion="user">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item}>
          <PageTitle
            title="Tus pedidos"
            description="Consulta el estado de tus solicitudes de sticker y productos."
          />
        </motion.div>

        {failed ? (
          <motion.div variants={item} className={`${panel} p-6 lg:p-8`}>
            <EmptyState
              icon={AlertTriangle}
              title="No pudimos cargar tus pedidos"
              text="Revisa tu conexión e inténtalo de nuevo."
            >
              <button type="button" onClick={load} className="btn-outline px-4 py-2 text-sm">
                <RotateCcw size={16} aria-hidden="true" /> Reintentar
              </button>
            </EmptyState>
          </motion.div>
        ) : orders.length === 0 ? (
          <motion.div variants={item} className={`${panel} p-6 lg:p-8`}>
            <EmptyState
              icon={Package}
              title="No tienes pedidos registrados"
              text="Cuando actives tu QR o pidas un sticker personalizado, podrás seguir su estado desde aquí."
            >
              <Link to={routes.products} className="btn-primary px-5 py-2.5 text-sm">
                Ver productos <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </EmptyState>
          </motion.div>
        ) : (
          <>
            {/* Métricas */}
            <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Pedidos"
                value={String(orders.length)}
                icon={Package}
                tone="bg-brand-500/10 text-brand-500"
                hint={orders.length === 1 ? 'Pedido registrado' : 'Pedidos registrados'}
              />
              <StatCard
                label="En curso"
                value={String(stats.active)}
                icon={Truck}
                tone="bg-sky-50 text-sky-700"
                hint="Pendientes de completar"
              />
              <StatCard
                label="Total pagado"
                value={formatAmount(stats.paid, 'COP')}
                icon={Wallet}
                tone="bg-emerald-50 text-emerald-700"
                hint="Pagos aprobados"
              />
            </motion.div>

            {/* Filtros */}
            <motion.div variants={item}>
              <div
                role="tablist"
                aria-label="Filtrar pedidos"
                className="custom-scrollbar flex gap-1.5 overflow-x-auto rounded-xl border border-border bg-white p-1.5 shadow-soft"
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
                      className={`focus-ring relative flex flex-none items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        active ? 'text-white' : 'text-text-secondary hover:text-neutral-900'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="orders-filter"
                          className="absolute inset-0 rounded-lg bg-brand-500 shadow-soft"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span className="relative">{f.label}</span>
                      <span
                        className={`relative rounded-full px-1.5 text-[11px] font-bold ${
                          active ? 'bg-white/20 text-white' : 'bg-brand-50 text-text-secondary'
                        }`}
                      >
                        {counts[f.id]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Lista */}
            {visible.length === 0 ? (
              <motion.div variants={item} className={`${panel} p-6 lg:p-8`}>
                <EmptyState
                  icon={Package}
                  title="Sin pedidos en esta categoría"
                  text="Prueba con otro filtro para ver el resto de tus pedidos."
                >
                  <button type="button" onClick={() => setFilter('all')} className="btn-outline px-4 py-2 text-sm">
                    Ver todos los pedidos
                  </button>
                </EmptyState>
              </motion.div>
            ) : (
              <ul className="space-y-4" aria-live="polite">
                <AnimatePresence initial>
                  {visible.map((o, i) => (
                    <OrderCard key={o.id} order={o} index={i} />
                  ))}
                </AnimatePresence>
              </ul>
            )}

            {/* Llamado a la acción */}
            <motion.div
              variants={item}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-6 text-white shadow-glow sm:p-8"
            >
              <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-md">
                  <h2 className="text-lg font-bold sm:text-xl">¿Quieres tu QR a la vista?</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                    Pide un sticker personalizado para el casco, la moto o la mochila.
                  </p>
                </div>
                <Link
                  to={routes.products}
                  className="btn flex-none bg-white px-5 py-2.5 text-sm text-brand-500 shadow-soft hover:-translate-y-0.5 hover:bg-brand-50"
                >
                  <Plus size={16} aria-hidden="true" /> Ver productos
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </MotionConfig>
  );
};

export default OrdersPage;