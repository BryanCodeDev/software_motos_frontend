import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, QrCode, Check, ArrowRight, AlertTriangle, RotateCcw, Ban, Undo2, Plus, CreditCard, Loader2 } from 'lucide-react';
import api from '../../api/client';
import { routes } from '../../utils/routes';
import { useToast } from '../../components/useToast';
import { PageTitle, PageLoader, EmptyState } from '../../components/DashPage';
import { Badge } from '../../components/ui-kit';
import Modal from '../../components/Modal';

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

/* Precio del pack de stickers. Debe coincidir con el backend; al crear el pedido se muestra el total real. */
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
const OrderCard = ({ order: o, onPay, paying }) => {
  const isQr = o.product_slug === 'qr-digital-basico';
  const Icon = isQr ? QrCode : Package;
  const closed = CLOSED.includes(o.commercial_status);
  const closedInfo = CLOSED_INFO[o.commercial_status];
  const stage = STAGE_INDEX[o.commercial_status] ?? 0;
  const needsPayment = isQr && !closed && o.payment_status !== 'approved';
  const payNotice = paymentNotice[o.payment_status];
  const stickerNeedsPayment =
    !isQr && !closed && o.payment_status !== 'approved' && ['pending_payment', 'pending_confirmation', 'draft'].includes(o.commercial_status);

  return (
    <li className={`${panel} p-5 sm:p-6`}>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-xl bg-brand-500/10 text-brand-500">
          {o.design_image_url ? (
            <img src={o.design_image_url} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <Icon size={20} aria-hidden="true" />
          )}
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
      {stickerNeedsPayment && (
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={() => onPay(o)} disabled={paying} className="btn-primary px-4 py-2 text-sm">
            {paying ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <CreditCard size={15} aria-hidden="true" />}
            {paying ? 'Redirigiendo…' : 'Pagar ahora'}
          </button>
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
  const [step, setStep] = useState('select'); // select | confirm | paying
  const [newOrder, setNewOrder] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [stickerPrice, setStickerPrice] = useState(null);

  /* Precio del sticker desde el catálogo del backend (única fuente de verdad). */
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

  /* Pagar un pedido de stickers que quedó sin pagar */
  const payOrder = async (o) => {
    setPayingId(o.id);
    try {
      const prefRes = await api.post('/payments/preference', { order_id: o.id });
      window.location.href = prefRes.data.init_point;
    } catch (err) {
      setPayingId(null);
      toastRef.current.error(err?.response?.data?.error || 'No se pudo iniciar el pago.');
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

  const chosenDesign = DESIGNS.find((d) => d.id === selectedDesignId) || null;
  /* El total que manda es el del pedido creado en el backend */
  const totalLabel = newOrder?.total_amount != null ? formatAmount(newOrder.total_amount, newOrder.currency) : stickerPrice || 'Consulta el catálogo';

  return (
    <div className="animate-fade-in space-y-5 lg:space-y-6">
      <PageTitle title="Mis pedidos" description="Sigue tu QR y tus stickers." />

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
                <OrderCard key={o.id} order={o} onPay={payOrder} paying={payingId === o.id} />
              ))}
            </ul>
          )}
        </>
      )}

      {/* ───────── Comprar stickers ───────── */}
      <Modal
        isOpen={buyOpen}
        onClose={buyLoading ? () => null : closeBuy}
        title={step === 'select' ? 'Elige el diseño' : step === 'confirm' ? 'Confirmar compra' : 'Redirigiendo al pago'}
        size="lg"
      >
        {step === 'select' && (
          <div className="space-y-5">
            <p className="text-sm text-text-secondary">
              Pack de {STICKER_QUANTITY} stickers con el mismo diseño:{' '}
              <span className="font-semibold text-neutral-900">{stickerPrice || 'Consulta el catálogo'}</span>.
            </p>
            {buyError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
                {buyError}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Diseño del sticker">
              {DESIGNS.map((design) => (
                <DesignCard key={design.id} design={design} selected={selectedDesignId} onSelect={handleSelect} />
              ))}
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={createOrder} disabled={!selectedDesignId || buyLoading} className="btn-primary px-6 py-2.5 text-sm">
                {buyLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Creando…
                  </>
                ) : (
                  <>
                    <ArrowRight size={16} aria-hidden="true" /> Continuar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-5">
            {buyError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
                {buyError}
              </div>
            )}
            <div className="flex items-center gap-4">
              {chosenDesign && (
                <img src={chosenDesign.image_url} alt={chosenDesign.name} className="h-20 w-20 flex-none rounded-xl bg-neutral-100 object-cover shadow-inner" />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-neutral-900">{chosenDesign?.name}</p>
                {chosenDesign?.description && <p className="mt-0.5 text-xs text-text-secondary">{chosenDesign.description}</p>}
              </div>
            </div>

            <dl className="divide-y divide-border rounded-xl border border-border px-4 text-sm">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-text-secondary">Producto</dt>
                <dd className="text-right font-semibold text-neutral-900">Stickers QR personalizados</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-text-secondary">Cantidad</dt>
                <dd className="text-right font-semibold text-neutral-900">{STICKER_QUANTITY} stickers, mismo diseño</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="font-semibold text-neutral-900">Total a pagar</dt>
                <dd className="text-right text-lg font-bold text-neutral-900">{totalLabel}</dd>
              </div>
            </dl>
            <p className="text-xs leading-relaxed text-text-secondary">El pago se procesa de forma segura con Mercado Pago.</p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => { setBuyError(null); setStep('select'); }} disabled={buyLoading} className="btn-outline px-6 py-2.5 text-sm">
                <ArrowRight size={16} className="rotate-180" aria-hidden="true" /> Elegir otro diseño
              </button>
              <button type="button" onClick={proceedToPayment} disabled={buyLoading} className="btn-primary px-6 py-2.5 text-sm">
                {buyLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Redirigiendo…
                  </>
                ) : (
                  <>
                    <CreditCard size={16} aria-hidden="true" /> Pagar con Mercado Pago
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'paying' && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-text-secondary">Te llevamos a Mercado Pago para completar el pago de {totalLabel}.</p>
            <Loader2 size={24} className="mt-4 animate-spin text-brand-500" aria-hidden="true" />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdersPage;