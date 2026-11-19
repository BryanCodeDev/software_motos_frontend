import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MotionConfig, motion } from 'framer-motion';
import {
  AlertTriangle, Check, ChevronLeft, ChevronRight, Clock, ExternalLink, Loader2, PackageOpen, RefreshCw, Search, ShoppingBag, Wallet, Wrench, X,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useToast } from '../../components/useToast';
import Modal from '../../components/Modal';
import { Badge } from '../../components/ui-kit';
import { useAdminSync } from '../../contexts/useAdminSync';

const EASE = [0.22, 1, 0.36, 1];
const panel = 'rounded-2xl border border-border bg-white';

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

/* Flujo normal de un pedido pagado */
const FLOW = ['paid', 'preparing', 'shipped', 'delivered'];
const NEXT = { paid: 'preparing', preparing: 'shipped', shipped: 'delivered' };
const NEXT_LABEL = { preparing: 'Preparar pedido', shipped: 'Marcar enviado', delivered: 'Marcar entregado' };
const CLOSING = ['cancelled', 'refunded'];

const money = (amount, currency = 'COP') => {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: currency || 'COP', maximumFractionDigits: 0 }).format(Number(amount) || 0);
  } catch {
    return `${amount} ${currency}`;
  }
};
const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

const StatusBadge = ({ map, value }) => {
  const [label, tone] = map[value] || [value || '—', 'neutral'];
  return <Badge tone={tone} size="sm">{label}</Badge>;
};

const HistoryRow = ({ h }) => (
  <div className="flex gap-3 pt-2 border-t border-border/50 first:border-0 pt-0">
    <span className="flex-none w-2 h-2 rounded-full mt-1">
      {h.new_commercial_status === 'delivered' ? <Check size={10} className="text-emerald-500" aria-hidden="true" /> : null}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-neutral-900 leading-tight">
        {h.previous_commercial_status ? `${COMMERCIAL[h.previous_commercial_status]?.[0] || h.previous_commercial_status} → ` : ''}
        <span className="font-semibold">{COMMERCIAL[h.new_commercial_status]?.[0] || h.new_commercial_status}</span>
      </p>
      <p className="text-xs text-text-secondary">
        {fmtDate(h.created_at)} {h.changed_by_email ? `· ${h.changed_by_email}` : ''} {h.reason ? `· ${h.reason}` : ''}
      </p>
    </div>
  </div>
);

const fmtMoney = (v) => money(v, 'COP');

/* ───────── Piezas ───────── */
const Progress = ({ status }) => {
  const idx = FLOW.indexOf(status);
  if (idx === -1) return null;
  return (
    <div className="flex gap-1" role="img" aria-label={`Paso ${idx + 1} de ${FLOW.length}`}>
      {FLOW.map((s, i) => (
        <span
          key={s}
          title={COMMERCIAL[s][0]}
          className={`h-1.5 flex-1 rounded-full ${i <= idx ? (idx === FLOW.length - 1 ? 'bg-emerald-500' : 'bg-brand-500') : 'bg-border'}`}
        />
      ))}
    </div>
  );
};

const Stepper = ({ status }) => {
  const idx = FLOW.indexOf(status);
  if (idx === -1) {
    return <p className="rounded-xl border border-border bg-brand-50/50 p-3 text-xs text-text-secondary">Este pedido está fuera del flujo de envío ({COMMERCIAL[status]?.[0] || status}).</p>;
  }
  return (
    <ol className="flex items-start" aria-label="Avance del pedido">
      {FLOW.map((s, i) => {
        const done = i <= idx;
        return (
          <li key={s} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-3 h-0.5 w-full ${i <= idx ? 'bg-brand-500' : 'bg-border'}`} />}
            <span
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                done ? 'bg-brand-500 text-white' : 'border border-border bg-white text-text-secondary'
              }`}
            >
              {done ? <Check size={13} aria-hidden="true" /> : i + 1}
            </span>
            <span className={`mt-1.5 text-xs ${i === idx ? 'font-semibold text-neutral-900' : 'text-text-secondary'}`}>{COMMERCIAL[s][0]}</span>
          </li>
        );
      })}
    </ol>
  );
};

const OrderActions = ({ o, busy, onPick, full = false }) => {
  const next = NEXT[o.commercial_status];
  return (
    <div className={`flex items-center gap-2 ${full ? 'flex-wrap' : ''}`}>
      {next && (
        <button type="button" disabled={busy} onClick={() => onPick(o, next)} className="btn-primary flex-none px-3 py-2 text-xs">
          {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : NEXT_LABEL[next]}
        </button>
      )}
      <select
        value=""
        disabled={busy}
        onChange={(e) => onPick(o, e.target.value)}
        aria-label={`Cambiar estado del pedido ${o.order_number}`}
        className="input min-w-0 flex-1 !py-2 !text-base sm:!text-xs"
      >
        <option value="">{next ? 'Otro estado' : 'Cambiar estado'}</option>
        {STATUS_OPTIONS.filter((s) => s !== o.commercial_status && s !== next).map((s) => (
          <option key={s} value={s}>{COMMERCIAL[s][0]}</option>
        ))}
      </select>
    </div>
  );
};

const Box = ({ title, children }) => (
  <section className="rounded-xl border border-border p-4">
    <h3 className="mb-3 text-sm font-semibold text-neutral-900">{title}</h3>
    <dl className="space-y-2.5">{children}</dl>
  </section>
);
const Row = ({ label, children }) => (
  <div className="flex items-baseline justify-between gap-4">
    <dt className="flex-none text-xs text-text-secondary">{label}</dt>
    <dd className="min-w-0 break-words text-right text-sm font-medium text-neutral-900">{children}</dd>
  </div>
);

const Summary = ({ icon: Icon, label, value }) => (
  <div className={`${panel} flex items-center gap-3 p-4`}>
    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
      <Icon size={18} aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="truncate text-xl font-bold tracking-tight text-neutral-900">{value}</p>
    </div>
  </div>
);

const OrderCard = ({ o, index, busy, onOpen, onPick }) => {
  const qty = Number(o.sticker_quantity) || 1;
  const place = [o.shipping_address?.city, o.shipping_address?.department].filter(Boolean).join(', ');
  const next = NEXT[o.commercial_status];
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE, delay: Math.min(index, 8) * 0.04 }}
      className="flex flex-col rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-500/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-neutral-900">{o.order_number}</p>
          <p className="mt-0.5 truncate text-sm text-text-secondary" title={o.customer_email}>{o.customer_email}</p>
          {place && <p className="truncate text-xs text-text-secondary">{place}</p>}
        </div>
        <p className="flex-none text-base font-bold text-neutral-900">{money(o.total_amount, o.currency)}</p>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl bg-brand-50/50 p-3">
        {o.design_image_url ? (
          <img
            src={o.design_image_url}
            alt=""
            className="h-10 w-10 flex-none rounded-lg object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white text-text-secondary"><ShoppingBag size={16} aria-hidden="true" /></span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-900">{o.product_name}</p>
          <p className="truncate text-xs text-text-secondary">{o.design_name ? `${o.design_name} · ` : ''}{qty} {qty === 1 ? 'sticker' : 'stickers'}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusBadge map={COMMERCIAL} value={o.commercial_status} />
        <StatusBadge map={PAYMENT} value={o.payment_status} />
      </div>
      <div className="mt-3"><Progress status={o.commercial_status} /></div>

      <div className="mt-auto flex items-center gap-2 pt-4">
        <button type="button" onClick={() => onOpen(o.id)} className="btn-outline flex-1 px-3 py-2 text-xs">Ver detalles</button>
        {next && (
          <button type="button" disabled={busy} onClick={() => onPick(o, next)} className="btn-primary flex-1 px-3 py-2 text-xs">
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : NEXT_LABEL[next]}
          </button>
        )}
      </div>
    </motion.li>
  );
};

/* ───────── Página ───────── */
export const AdminOrders = () => {
  const toast = useToast();
  const { refreshKey, refresh } = useAdminSync();
  const [params, setParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [payFilter, setPayFilter] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [pending, setPending] = useState(null); // { order, status }

  /* Detalle completo (historial de estados, envío, pago) */
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* Edición de transportadora y guía */
  const [carrierEdit, setCarrierEdit] = useState({ carrier: '', tracking_number: '', tracking_url: '' });
  const [carrierBusy, setCarrierBusy] = useState(false);

  /* Paginación y filtros (ejecutados en el backend) */
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  /* El filtro de estado vive en la URL (el Resumen enlaza aquí) */
  const urlStatus = params.get('estado');
  const filter = STATUS_OPTIONS.includes(urlStatus) ? urlStatus : 'all';
  const setFilter = (s) => setParams(s === 'all' ? {} : { estado: s }, { replace: true });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/orders', {
        params: {
          page,
          limit: 25,
          q: query || undefined,
          status: filter === 'all' ? undefined : filter,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      });
      setOrders(data.orders || []);
      setPagination(data.pagination || { page: 1, pages: 0, total: 0 });
    } catch (e) {
      setError(e?.response?.data?.error || 'No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [page, filter, query, dateFrom, dateTo]);

  const openDetail = async (id) => {
    setDetail(null);
    setDetailLoading(true);
    setOpenId(id);
    setCarrierEdit({ carrier: '', tracking_number: '', tracking_url: '' });
    try {
      const { data } = await api.get(`/admin/orders/${id}`);
      const o = data.order || null;
      setDetail(o);
      if (o) {
        setCarrierEdit({
          carrier: o.carrier || '',
          tracking_number: o.tracking_number || '',
          tracking_url: o.tracking_url || '',
        });
      }
    } catch {
      setDetail(null);
      toast.error('No se pudo cargar el detalle del pedido');
    } finally {
      setDetailLoading(false);
    }
  };

  const saveCarrier = async () => {
    if (!openId) return;
    setCarrierBusy(true);
    try {
      await api.patch(`/admin/orders/${openId}/carrier`, carrierEdit);
      toast.success('Información de envío actualizada');
      setDetail((d) => (d ? { ...d, ...carrierEdit } : d));
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo actualizar el envío');
    } finally {
      setCarrierBusy(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load, refreshKey]);

  const applyStatus = async (o, status) => {
    setBusyId(o.id);
    try {
      await api.patch(`/admin/orders/${o.id}/status`, { commercial_status: status });
      toast.success(`${o.order_number}: ${COMMERCIAL[status][0]}`);
      setPending(null);
      load();
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo actualizar el pedido');
    } finally {
      setBusyId(null);
    }
  };

  const askStatus = (o, status) => {
    if (!status) return;
    if (CLOSING.includes(status)) {
      setOpenId(null);
      setPending({ order: o, status });
    } else {
      applyStatus(o, status);
    }
  };

  const counts = useMemo(() => {
    const c = {};
    orders.forEach((o) => { c[o.commercial_status] = (c[o.commercial_status] || 0) + 1; });
    return c;
  }, [orders]);

  const totals = useMemo(() => ({
    toAttend: (counts.paid || 0) + (counts.preparing || 0),
    waiting: (counts.pending_payment || 0) + (counts.pending_confirmation || 0),
    revenue: orders.filter((o) => o.payment_status === 'approved').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
  }), [orders, counts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== 'all' && o.commercial_status !== filter) return false;
      if (payFilter && o.payment_status !== payFilter) return false;
      if (!q) return true;
      return [o.order_number, o.customer_email, o.product_name, o.design_name, o.qr_value].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [orders, query, filter, payFilter]);

  const chips = ['all', ...STATUS_OPTIONS.filter((s) => counts[s] || s === filter)];
  const hasFilters = !!(query || payFilter || filter !== 'all');
  const clearFilters = () => { setQuery(''); setPayFilter(''); setFilter('all'); };

  const open = orders.find((o) => o.id === openId) || null;
  const confirming = !!pending && busyId === pending.order.id;
  const addr = open?.shipping_address || {};
  const extraAddr = [
    ['Dirección', addr.address],
    ['Barrio', addr.neighborhood],
    ['Ciudad', addr.city],
    ['Departamento', addr.department],
    ['Notas', addr.notes],
  ].filter(([, v]) => v);

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-4">
        <PageTitle
          title="Pedidos"
          actions={
            <button type="button" onClick={load} disabled={loading} className="btn-outline px-3.5 py-2 text-sm" aria-label="Actualizar">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            </button>
          }
        />

        {orders.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Summary icon={ShoppingBag} label="Pedidos" value={orders.length} />
            <Summary icon={Wrench} label="Por atender" value={totals.toAttend} />
            <Summary icon={Clock} label="Esperando pago" value={totals.waiting} />
            <Summary icon={Wallet} label="Ingresos aprobados" value={money(totals.revenue)} />
          </div>
        )}

        <div className={`${panel} space-y-3 p-3 lg:p-4`}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1" role="search">
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por número, cliente, producto o QR"
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
            <select value={payFilter} onChange={(e) => setPayFilter(e.target.value)} aria-label="Filtrar por pago" className="input sm:!w-48">
              <option value="">Todos los pagos</option>
              {Object.entries(PAYMENT).map(([id, [label]]) => <option key={id} value={id}>{label}</option>)}
            </select>
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
                  <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-text-secondary/70'}`}>{s === 'all' ? orders.length : counts[s] || 0}</span>
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
          <div className="grid animate-pulse gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-64 rounded-2xl bg-border/60" />)}
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className={`${panel} flex flex-col items-center p-10 text-center`}>
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
              <PackageOpen size={20} aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-neutral-900">{hasFilters ? 'Ningún pedido coincide' : 'Aún no hay pedidos'}</p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="btn-outline mt-4 px-4 py-2 text-sm">
                <X size={16} aria-hidden="true" /> Quitar filtros
              </button>
            )}
          </div>
        )}

        {visible.length > 0 && !error && (
          <>
            <ul className={`grid gap-3 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
              {visible.map((o, i) => (
                <OrderCard key={o.id} o={o} index={i} busy={busyId === o.id} onOpen={openDetail} onPick={askStatus} />
              ))}
            </ul>
            <p className="text-center text-xs text-text-secondary">{visible.length} de {pagination.total} pedidos</p>
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 text-xs text-text-secondary mt-4">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn-outline px-3 py-2 text-sm">
                  <ChevronLeft size={16} aria-hidden="true" /> Anterior
                </button>
                <span className="font-semibold text-neutral-900">Página {page} de {pagination.pages}</span>
                <button type="button" disabled={page >= pagination.pages} onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} className="btn-outline px-3 py-2 text-sm">
                  Siguiente <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        )}

        {/* ───────── Detalle ───────── */}
        <Modal
          isOpen={!!open}
          onClose={() => { setOpenId(null); setDetail(null); setCarrierEdit({ carrier: '', tracking_number: '', tracking_url: '' }); }}
          title="Detalle del pedido"
          size="lg"
        >
          {open && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-base font-semibold text-neutral-900">{open.order_number}</p>
                  {fmtDate(open.created_at) && <p className="text-xs text-text-secondary">{fmtDate(open.created_at)}</p>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge map={COMMERCIAL} value={open.commercial_status} />
                  <StatusBadge map={PAYMENT} value={open.payment_status} />
                </div>
              </div>

              <Stepper status={open.commercial_status} />

              {detail && detail.status_history && detail.status_history.length > 0 && (
                <Box title="Historial de estados">
                  {detail.status_history.slice().reverse().map((h) => (
                    <HistoryRow key={h.id} h={h} />
                  ))}
                </Box>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Box title="Cliente">
                  {open.customer_name && <Row label="Nombre">{open.customer_name}</Row>}
                  <Row label="Correo"><span className="break-all">{open.customer_email}</span></Row>
                  {(open.customer_phone || addr.phone) && <Row label="Teléfono">{open.customer_phone || addr.phone}</Row>}
                </Box>

                <Box title="Envío">
                  {extraAddr.length === 0 && <p className="text-sm text-text-secondary">Sin dirección registrada.</p>}
                  {extraAddr.map(([label, v]) => <Row key={label} label={label}>{String(v)}</Row>)}
                  {detail && (
                    <>
                      <Row label="Transportadora">{detail.carrier || '—'}</Row>
                      {detail.tracking_number && <Row label="Número de guía">{detail.tracking_number}</Row>}
                      {detail.tracking_url && (
                        <Row label="Seguimiento">
                          <a href={detail.tracking_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline-offset-2 hover:underline break-all">
                            Ver rastreo <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        </Row>
                      )}
                      {detail.shipped_at && <Row label="Despachado">{fmtDate(detail.shipped_at)}</Row>}
                      {detail.delivered_at && <Row label="Entregado">{fmtDate(detail.delivered_at)}</Row>}
                    </>
                  )}
                </Box>

                <Box title="Producto">
                  <Row label="Producto">{open.product_name}</Row>
                  <Row label="Diseño">
                    <span className="inline-flex items-center gap-2">
                      {open.design_image_url && (
                        <img src={open.design_image_url} alt="" className="h-6 w-6 rounded object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      )}
                      {open.design_name || '—'}
                    </span>
                  </Row>
                  <Row label="Cantidad">{Number(open.sticker_quantity) || 1}</Row>
                  <Row label="QR">
                    {open.qr_value ? (
                      <Link to={`/admin/qrs?q=${encodeURIComponent(open.qr_value)}`} className="inline-flex items-center gap-1 break-all font-mono text-xs text-brand-600 hover:underline">
                        {open.qr_value} <ExternalLink size={12} aria-hidden="true" />
                      </Link>
                    ) : 'Sin QR asociado'}
                  </Row>
                </Box>

                <Box title="Pago">
                  <Row label="Total">{money(open.total_amount, open.currency)}</Row>
                  <Row label="Estado del pago"><StatusBadge map={PAYMENT} value={open.payment_status} /></Row>
                  <Row label="Moneda">{open.currency || 'COP'}</Row>
                  {detail && detail.mercado_pago_payment_id && (
                    <Row label="Referencia Mercado Pago">
                      <span className="break-all font-mono text-xs">{detail.mercado_pago_payment_id}</span>
                    </Row>
                  )}
                </Box>
              </div>

              {detail && (
                <Box title="Transportadora y guía de envío">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Transportadora</label>
                      <input
                        value={carrierEdit.carrier}
                        onChange={(e) => setCarrierEdit({ ...carrierEdit, carrier: e.target.value })}
                        placeholder="Ej. Servientrega"
                        className="input !py-1.5 !text-base disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Número de guía</label>
                      <input
                        value={carrierEdit.tracking_number}
                        onChange={(e) => setCarrierEdit({ ...carrierEdit, tracking_number: e.target.value })}
                        placeholder="Ej. GUIA123456"
                        className="input !py-1.5 !text-base disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">URL de seguimiento</label>
                      <input
                        value={carrierEdit.tracking_url}
                        onChange={(e) => setCarrierEdit({ ...carrierEdit, tracking_url: e.target.value })}
                        placeholder="https://..."
                        className="input !py-1.5 !text-base disabled:opacity-60"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button type="button" onClick={() => setCarrierEdit({ carrier: detail.carrier || '', tracking_number: detail.tracking_number || '', tracking_url: detail.tracking_url || '' })} disabled={carrierBusy} className="btn-ghost px-3 py-2 text-xs">Descartar</button>
                    <button type="button" onClick={saveCarrier} disabled={carrierBusy} className="btn-primary px-3 py-2 text-xs">
                      {carrierBusy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : 'Guardar'}
                    </button>
                  </div>
                </Box>
              )}

              <div className="border-t border-border pt-4">
                <p className="mb-2 text-xs text-text-secondary">Cambiar estado</p>
                <OrderActions o={open} busy={busyId === open.id} onPick={askStatus} full />
              </div>
            </div>
          )}
        </Modal>

        {/* ───────── Confirmar cierre ───────── */}
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
    </MotionConfig>
  );
};

export default AdminOrders;