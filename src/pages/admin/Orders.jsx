import { useCallback, useEffect, useMemo, useState } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import {
  Search, AlertTriangle, Loader2, PackageOpen, Package, Clock, Wrench, Wallet, X, ArrowRight, Image as ImageIcon, QrCode, Sticker,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import Modal from '../../components/Modal';
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
  pending: ['Pendiente', 'warn'],
  approved: ['Aprobado', 'success'],
  rejected: ['Rechazado', 'danger'],
  cancelled: ['Cancelado', 'danger'],
  refunded: ['Reembolsado', 'neutral'],
};

const money = (amount, currency = 'COP') => {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: currency || 'COP', maximumFractionDigits: 0 }).format(Number(amount) || 0);
  } catch {
    return `${amount} ${currency}`;
  }
};

/* ───────── Piezas ───────── */
const BadgeStatus = ({ map, value }) => {
  const [label, tone] = map[value] || [value || '—', 'neutral'];
  return <Badge tone={tone} size="sm">{label}</Badge>;
};

const StatusSelect = ({ o, busy, onPick }) => (
  <div className="relative">
    <select
      value=""
      disabled={busy}
      onChange={(e) => onPick(o, e.target.value)}
      aria-label={`Cambiar estado del pedido ${o.order_number}`}
      className="input !py-1.5 !text-base disabled:opacity-60 sm:!text-xs"
    >
      <option value="">Cambiar estado…</option>
      {STATUS_OPTIONS.filter((s) => s !== o.commercial_status).map((s) => (
        <option key={s} value={s}>{COMMERCIAL[s][0]}</option>
      ))}
    </select>
    {busy && <Loader2 size={14} className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-text-secondary" aria-hidden="true" />}
  </div>
);

const ErrorBanner = ({ message, onRetry }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700" role="alert">
    <AlertTriangle size={18} className="flex-none" aria-hidden="true" />
    <span className="min-w-0 flex-1">{message}</span>
    <button type="button" onClick={onRetry} className="flex-none font-semibold underline underline-offset-2">Reintentar</button>
  </div>
);

/* ───────── Página ───────── */
export const AdminOrders = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [pending, setPending] = useState(null); // { order, status }

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

  const askStatus = (o, status) => {
    if (!status) return;
    setPending({ order: o, status });
  };

  const confirmStatus = async () => {
    if (!pending) return;
    const { order: o, status } = pending;
    setBusyId(o.id);
    try {
      await api.patch(`/admin/orders/${o.id}`, { commercial_status: status });
      toast.success('Estado actualizado');
      setPending(null);
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

  const stats = useMemo(() => {
    const toPrepare = (counts.paid || 0) + (counts.preparing || 0);
    const awaitingPayment = (counts.pending_payment || 0) + (counts.pending_confirmation || 0);
    const revenue = orders
      .filter((o) => o.payment_status === 'approved')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    return { toPrepare, awaitingPayment, revenue };
  }, [orders, counts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== 'all' && o.commercial_status !== filter) return false;
      if (!q) return true;
      return [o.order_number, o.customer_email, o.product_name, o.design_name].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [orders, query, filter]);

  const chips = ['all', ...STATUS_OPTIONS.filter((s) => counts[s])];
  const confirming = pending && busyId === pending.order.id;

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 lg:space-y-5">
        <motion.div variants={item}>
          <PageTitle title="Pedidos" description="Gestiona pedidos comerciales." />
        </motion.div>

        {/* Métricas */}
        {!loading && !error && orders.length > 0 && (
          <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Pedidos" value={String(orders.length)} icon={Package} tone="bg-brand-500/10 text-brand-500" hint="Total registrados" />
            <StatCard label="Por atender" value={String(stats.toPrepare)} icon={Wrench} tone="bg-sky-50 text-sky-700" hint="Pagados o en preparación" />
            <StatCard label="Esperando pago" value={String(stats.awaitingPayment)} icon={Clock} tone="bg-amber-50 text-amber-700" hint="Sin confirmar o sin pagar" />
            <StatCard label="Ingresos aprobados" value={money(stats.revenue)} icon={Wallet} tone="bg-emerald-50 text-emerald-700" hint="Pagos con estado aprobado" />
          </motion.div>
        )}

        {/* Búsqueda y filtros */}
        <motion.div variants={item} className={`${panel} space-y-3 p-3 lg:p-4`}>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por número, cliente o producto"
              aria-label="Buscar pedidos"
              className="input !pl-10 !pr-10 !text-base sm:!text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Borrar búsqueda"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-brand-50 hover:text-neutral-900"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div role="tablist" aria-label="Filtrar por estado" className="custom-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {chips.map((s) => {
              const active = filter === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(s)}
                  className={`focus-ring relative flex-none rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-brand-500 text-white'
                      : 'border-border bg-white text-text-secondary hover:border-brand-500/40 hover:text-neutral-900'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-orders-chip"
                      className="absolute inset-0 rounded-full bg-brand-500"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">
                    {s === 'all' ? 'Todos' : COMMERCIAL[s][0]}
                    <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-text-muted'}`}>{counts[s] || 0}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {error && <ErrorBanner message={error} onRetry={load} />}

        {loading && !error && (
          <div className={`${panel} animate-pulse space-y-3 p-4`} aria-busy="true" aria-live="polite">
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 rounded-lg bg-border/60" />)}
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className={`${panel} flex flex-col items-center p-10 text-center`}>
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
              <PackageOpen size={22} aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-neutral-900">No hay pedidos para mostrar</p>
            <p className="mt-1 text-xs text-text-secondary">Ajusta la búsqueda o el filtro de estado.</p>
            {(query || filter !== 'all') && (
              <button type="button" onClick={() => { setQuery(''); setFilter('all'); }} className="btn-outline mt-5 px-5 py-2.5 text-sm">
                <X size={16} aria-hidden="true" /> Limpiar filtros
              </button>
            )}
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <>
            {/* Escritorio */}
<div className={`${panel} hidden overflow-hidden md:block`}>
              <div className="custom-scrollbar overflow-x-auto">
                <table className="table w-full text-sm">
                  <thead className="bg-brand-50/70 text-left text-xs font-semibold text-text-secondary">
                    <tr>
                      <th scope="col" className="px-6 py-4">pedido</th>
                      <th scope="col" className="px-6 py-4">Cliente</th>
                      <th scope="col" className="px-6 py-4">Producto</th>
                      <th scope="col" className="px-6 py-4">Diseño</th>
                      <th scope="col" className="px-6 py-4 text-center">Cantidad</th>
                      <th scope="col" className="px-6 py-4">QR asociado</th>
                      <th scope="col" className="px-6 py-4 text-right">Total</th>
                      <th scope="col" className="px-6 py-4">Estado</th>
                      <th scope="col" className="px-6 py-4">Pago</th>
                      <th scope="col" className="px-6 py-4">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visible.map((o, i) => (
                      <motion.tr
                        key={o.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: EASE, delay: Math.min(i, 10) * 0.03 }}
                        className="transition-colors hover:bg-brand-50/50"
                      >
                        <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-semibold text-neutral-900">{o.order_number}</td>
                        <td className="max-w-[220px] truncate px-6 py-4 text-text-secondary" title={o.customer_email}>
                          {o.customer_email}
                          {o.shipping_address && (
                            <p className="mt-0.5 text-[10px] text-text-muted" title={String(o.shipping_address.address || '')}>
                              {String(o.shipping_address.city || '')}{o.shipping_address.city && o.shipping_address.department ? ', ' : ''}{o.shipping_address.department || ''}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-neutral-900">{o.product_name}</td>
                        <td className="px-6 py-4">
                          {o.design_name ? (
                            <div className="flex items-center gap-2.5">
                              <span className="relative flex h-6 w-6 flex-none shrink-0">
                                <img
                                  src={o.design_image_url || ''}
                                  alt=""
                                  className="h-6 w-6 rounded object-cover bg-neutral-100"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                {!o.design_image_url && <ImageIcon className="h-4 w-4 text-neutral-400" aria-hidden="true" />}
                              </span>
                              <span className="text-sm text-neutral-900 truncate max-w-[150px]" title={o.design_name}>{o.design_name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-text-secondary">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-semibold text-neutral-900 whitespace-nowrap">
                          {o.sticker_quantity || 1} sticker{o.sticker_quantity !== 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-neutral-900 truncate max-w-[140px]" title={o.qr_value || '—'}>
                            {o.qr_value || '—'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-neutral-900">{money(o.total_amount, o.currency)}</td>
                        <td className="px-6 py-4"><BadgeStatus map={COMMERCIAL} value={o.commercial_status} /></td>
                        <td className="px-6 py-4"><BadgeStatus map={PAYMENT} value={o.payment_status} /></td>
                        <td className="min-w-[180px] px-6 py-4"><StatusSelect o={o} busy={busyId === o.id} onPick={askStatus} /></td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Móvil */}
            <ul className="space-y-3 md:hidden">
              {visible.map((o, i) => (
                <motion.li
                  key={o.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE, delay: Math.min(i, 8) * 0.04 }}
                  className={`${panel} p-4`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-neutral-900">{o.order_number}</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">{o.product_name}</p>
                      {o.design_name && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="relative flex h-5 w-5 flex-none shrink-0">
                            <img
                              src={o.design_image_url || ''}
                              alt=""
                              className="h-5 w-5 rounded object-cover bg-neutral-100"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            {!o.design_image_url && <ImageIcon className="h-3 w-3 text-neutral-400" aria-hidden="true" />}
                          </span>
                          <span className="truncate text-xs text-neutral-900" title={o.design_name}>{o.design_name}</span>
                        </div>
                      )}
                      <p className="break-all text-xs text-text-secondary">{o.customer_email}</p>
                      {o.qr_value && (
                        <p className="mt-0.5 break-all text-xs text-text-secondary" title={o.qr_value}>
                          QR: {o.qr_value}
                        </p>
                      )}
                    </div>
                    <p className="whitespace-nowrap text-sm font-bold text-neutral-900">{money(o.total_amount, o.currency)}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-semibold text-neutral-500">Cantidad:</span>
                    <span className="text-xs font-semibold text-neutral-900">{o.sticker_quantity || 1} stickers</span>
                    <BadgeStatus map={COMMERCIAL} value={o.commercial_status} />
                    <BadgeStatus map={PAYMENT} value={o.payment_status} />
                  </div>
                  <div className="mt-3 border-t border-border pt-3">
                    <StatusSelect o={o} busy={busyId === o.id} onPick={askStatus} />
                  </div>
                </motion.li>
              ))}
            </ul>

            <p className="text-center text-xs text-text-secondary">
              Mostrando <span className="font-semibold text-neutral-900">{visible.length}</span> de {orders.length} pedidos
            </p>
          </>
        )}

        {/* Confirmación de cambio de estado */}
        <Modal
          isOpen={!!pending}
          onClose={() => (confirming ? null : setPending(null))}
          title="Cambiar estado del pedido"
        >
          {pending && (
            <>
              <p className="text-sm leading-relaxed text-text-secondary">
                Vas a actualizar el pedido{' '}
                <span className="font-mono font-semibold text-neutral-900">{pending.order.order_number}</span>.
              </p>
              <div className="my-5 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-border bg-brand-50/60 p-4">
                <BadgeStatus map={COMMERCIAL} value={pending.order.commercial_status} />
                <ArrowRight size={16} className="text-text-secondary" aria-hidden="true" />
                <BadgeStatus map={COMMERCIAL} value={pending.status} />
              </div>
              {['cancelled', 'refunded'].includes(pending.status) && (
                <p className="mb-5 flex items-start gap-2 text-xs leading-relaxed text-amber-700">
                  <AlertTriangle size={14} className="mt-0.5 flex-none" aria-hidden="true" />
                  Este estado cierra el pedido. Verifica el pago antes de continuar.
                </p>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setPending(null)} disabled={confirming}>Cancelar</Button>
                <Button variant="primary" onClick={confirmStatus} disabled={confirming}>
                  {confirming && <Loader2 size={16} className="animate-spin" />}
                  {confirming ? 'Guardando...' : 'Confirmar cambio'}
                </Button>
              </div>
            </>
          )}
        </Modal>
      </motion.div>
    </MotionConfig>
  );
};

export default AdminOrders;