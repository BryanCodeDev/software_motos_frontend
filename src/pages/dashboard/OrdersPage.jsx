import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, QrCode, Check, ArrowRight, AlertTriangle, RotateCcw, Ban, Undo2, Plus, Sticker, CreditCard, Loader2, Lock, X, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import { routes } from '../../utils/routes';
import { useToast } from '../../components/useToast';
import { PageTitle, PageLoader, EmptyState } from '../../components/DashPage';
import { Badge } from '../../components/ui-kit';

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const STICKER_QUANTITY = 2;

const DESIGNS = [
  { id: 1, name: 'Diseño 1', image_url: '/img/sticker-1.png', description: 'Diseño clásico y discreto' },
  { id: 2, name: 'Diseño 2', image_url: '/img/sticker-2.png', description: 'Estilo moderno y minimalista' },
  { id: 3, name: 'Diseño 3', image_url: '/img/sticker-3.png', description: 'Diseño deportivo y dinámico' },
  { id: 4, name: 'Diseño 4', image_url: '/img/sticker-4.png', description: 'Estilo urbano y actual' },
  { id: 5, name: 'Diseño 5', image_url: '/img/sticker-5.png', description: 'Diseño elegante y sobrio' },
  { id: 6, name: 'Diseño 6', image_url: '/img/sticker-6.png', description: 'Estilo aventurero y resistente' },
];

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

/* ───────── Tarjeta de diseño para compra de sticker ───────── */
const DesignCard = ({ design, selected, onSelect }) => {
  const isSelected = selected === design.id;
  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={() => onSelect(design.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(design.id);
        }
      }}
      className={`
        relative flex flex-col items-center rounded-2xl border p-4 lg:p-6 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
        ${isSelected
          ? 'border-2 border-brand-500 bg-brand-50 shadow-[0_0_0_4px_rgba(159,18,57,0.12)]'
          : 'border-border bg-white hover:border-brand-500/40 hover:shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]'
      }`}
    >
      <div className="relative mb-3 group">
        <img
          src={design.image_url}
          alt={design.name}
          className="w-32 h-32 rounded-xl object-cover bg-neutral-100 object-center shadow-inner"
        />
        {isSelected && (
          <span className="absolute right-0 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-soft ring-2 ring-white">
            <Check size={14} strokeWidth={2.5} aria-hidden="true" />
            <span className="sr-only">Seleccionado</span>
          </span>
        )}
      </div>
      <h3 className="mb-1 font-semibold text-center text-neutral-900">{design.name}</h3>
      {design.description && (
        <p className="text-[10px] leading-relaxed text-center text-text-secondary/70 px-2">{design.description}</p>
      )}
    </div>
  );
};

/* ───────── Seguimiento visual ───────── */
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

/* ───────── Página: Mis pedidos ───────── */
export const OrdersPage = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState('all');

  /* Compra de sticker */
  const [buyOpen, setBuyOpen] = useState(false);
  const [selectedDesignId, setSelectedDesignId] = useState(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState(null);
  const [step, setStep] = useState('select'); // select | confirm | paying | success
  const [newOrder, setNewOrder] = useState(null);
  const [stickerPrice, setStickerPrice] = useState(null);

  // Precio del sticker desde el catálogo del backend (única fuente de verdad).
  useEffect(() => {
    let mounted = true;
    const loadStickerPrice = async () => {
      try {
        const { data } = await api.get('/products');
        const list = data.products || data || [];
        const sticker = list.find((p) => p.slug === 'sticker-qr-personalizado');
        if (mounted && sticker) setStickerPrice(formatAmount(sticker.price, 'COP'));
      } catch {
        // Sin precio de catálogo.
      }
    };
    loadStickerPrice();
    return () => { mounted = false; };
  }, []);

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

  const openBuy = () => {
    setBuyError(null);
    setSelectedDesignId(null);
    setNewOrder(null);
    setStep('select');
    setBuyOpen(true);
  };

  const closeBuy = () => {
    setBuyOpen(false);
    setBuyError(null);
    setSelectedDesignId(null);
    setNewOrder(null);
    setStep('select');
  };

  const handleSelect = (designId) => {
    const design = DESIGNS.find((d) => d.id === designId);
    if (!design) {
      setBuyError('Este diseño no está disponible.');
      return;
    }
    setSelectedDesignId(designId);
    setBuyError(null);
  };

  const createOrder = async () => {
    if (!selectedDesignId) {
      setBuyError('Debes seleccionar un diseño para continuar.');
      return;
    }
    setBuyLoading(true);
    setBuyError(null);
    try {
      const res = await api.post('/orders/stickers', { design_id: selectedDesignId });
      setNewOrder(res.data.order);
      setStep('confirm');
    } catch (err) {
      try {
        const msg = err?.response?.data?.error || err?.response?.data?.details;
        setBuyError(typeof msg === 'string' ? msg : 'No se pudo crear el pedido.');
      } catch {
        setBuyError('No se pudo crear el pedido.');
      }
    } finally {
      setBuyLoading(false);
    }
  };

  const proceedToPayment = async () => {
    if (!newOrder) return;
    setBuyLoading(true);
    try {
      const prefRes = await api.post('/payments/preference', { order_id: newOrder.id });
      setStep('paying');
      window.location.href = prefRes.data.init_point;
    } catch (err) {
      setBuyLoading(false);
      setBuyError(err?.response?.data?.error || 'No se pudo iniciar el pago.');
    }
  };

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
      <PageTitle title="Mis pedidos" description="Sigue el estado de tu QR y tus stickers. Compra nuevos stickers desde esta misma sección." />

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
            <button type="button" onClick={openBuy} className="btn-primary px-5 py-2.5 text-sm">
              <Plus size={16} aria-hidden="true" /> Pedir sticker
            </button>
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
            <button type="button" onClick={openBuy} className="btn-outline px-4 py-2 text-sm">
              <Plus size={16} aria-hidden="true" /> Pedir sticker
            </button>
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

      {/* ───────── Modal: Comprar sticker ───────── */}
      {buyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Comprar sticker">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeBuy} />
          <div className="relative w-full max-w-2xl mx-auto mt-10 sm:mt-20 rounded-2xl border border-border bg-white shadow-[0_24px_80px_-20px_rgba(159,18,57,0.35)] p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">Comprar nuevo sticker</h2>
              <button type="button" onClick={closeBuy} className="rounded-full p-1.5 text-text-secondary hover:bg-neutral-100">
                <X size={18} className="block" aria-hidden="true" />
              </button>
            </div>

            {/* Paso 1: Selección de diseño */}
            {step === 'select' && (
              <>
                <div className="mb-6">
                  <h3 className="mb-2 text-base font-semibold text-neutral-900">Elige el diseño</h3>
                  <p className="text-sm text-text-secondary">
                    Los dos stickers llevarán el mismo diseño. Precio: {stickerPrice || 'Consulta el catálogo'} por sticker.
                  </p>
                </div>
                {buyError && (
                  <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
                    {buyError}
                  </div>
                )}
                {DESIGNS.length === 0 && (
                  <div className="rounded-xl border border-border bg-neutral-50 p-6 text-center text-sm text-text-secondary">
                    No hay diseños disponibles en este momento.
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Diseño del sticker">
                  {DESIGNS.map((design) => (
                    <DesignCard key={design.id} design={design} selected={selectedDesignId} onSelect={handleSelect} />
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={createOrder}
                    disabled={!selectedDesignId || buyLoading}
                    className="btn-primary px-6 py-2.5 text-sm"
                  >
                    {buyLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Creando…
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4" /> Continuar
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Paso 2: Confirmar compra */}
            {step === 'confirm' && (
              <>
                <div className="mb-6">
                  <h3 className="mb-2 text-base font-semibold text-neutral-900">Confirmar compra</h3>
                  <p className="text-sm text-text-secondary">Revisa el diseño y el precio antes de pagar.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={(DESIGNS.find((d) => d.id === selectedDesignId)?.image_url || '')}
                      alt={(DESIGNS.find((d) => d.id === selectedDesignId)?.name || '')}
                      className="w-24 h-24 rounded-xl object-cover bg-neutral-100 shadow-inner"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-neutral-900">{DESIGNS.find((d) => d.id === selectedDesignId)?.name}</h3>
                    {(DESIGNS.find((d) => d.id === selectedDesignId)?.description) && (
                      <p className="mt-0.5 text-xs text-text-secondary">{DESIGNS.find((d) => d.id === selectedDesignId)?.description}</p>
                    )}
                  </div>
                </div>
                <div className="mt-6 rounded-xl border border-border p-4">
                  <table className="w-full text-sm divide-y divide-border">
                    <tbody>
                      <tr>
                        <td className="py-3 text-text-secondary">Producto</td>
                        <td className="py-3 text-right font-semibold text-neutral-900">Stickers QR personalizados</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-text-secondary">Diseño</td>
                        <td className="py-3 text-right font-semibold text-neutral-900">{DESIGNS.find((d) => d.id === selectedDesignId)?.name}</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-text-secondary">Cantidad</td>
                        <td className="py-3 text-right font-semibold text-neutral-900">{STICKER_QUANTITY} stickers (mismo diseño)</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-text-secondary">Precio por sticker</td>
                        <td className="py-3 text-right font-bold text-neutral-900">{stickerPrice || '—'}</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-text-secondary font-semibold">Total a pagar</td>
                        <td className="py-3 text-right text-lg font-bold text-neutral-900">{stickerPrice || '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                    El precio se confirma desde el catálogo antes de pagar. No se puede modificar desde el navegador. El pago se procesa a través de Mercado Pago.
                  </p>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="btn-outline px-6 py-2.5 text-sm"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" /> Elegir otro diseño
                  </button>
                  <button
                    type="button"
                    onClick={proceedToPayment}
                    disabled={buyLoading}
                    className="btn-primary px-6 py-2.5 text-sm"
                  >
                    {buyLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Redirigiendo…
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} aria-hidden="true" /> Pagar con Mercado Pago
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Pago / éxito */}
            {step === 'paying' && (
              <div className="flex flex-col items-center justify-center py-10">
                <h3 className="mb-2 text-base font-semibold text-neutral-900">Redirigiendo al pago</h3>
                <p className="text-sm text-text-secondary">Serás llevado a Mercado Pago para completar el pago de {stickerPrice || '—'}.</p>
                <Loader2 size={24} className="animate-spin mt-4" />
              </div>
            )}

            {step === 'success' && newOrder && (
              <div className="text-center py-6">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" aria-hidden="true" />
                <h3 className="mb-2 text-lg font-bold text-neutral-900">Pedido creado</h3>
                <p className="mb-4 text-sm text-text-secondary">
                  Pedido <span className="font-mono font-semibold text-neutral-900">{newOrder.order_number}</span>. Diseño: <span className="font-medium text-neutral-900">{newOrder.design_name}</span>. Total: {formatAmount(newOrder.total_amount, newOrder.currency)}.
                </p>
                <p className="mt-4 text-sm text-text-secondary">
                  Cuando Mercado Pago apruebe el pago, tu QR se activará automáticamente.
                </p>
                <div className="mt-6 flex justify-center">
                  <button type="button" onClick={closeBuy} className="btn-outline px-6 py-2.5 text-sm">
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
