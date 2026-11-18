import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Check, CheckCircle2, Clock, CreditCard, Loader2, Lock, MessageCircle, Sticker, Truck, User, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import { routes } from '../../utils/routes';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import { PageTitle, PageLoader, EmptyState } from '../../components/DashPage';
import { Badge } from '../../components/ui-kit';

const STICKER_PRICE_COP = 30000;
const STICKER_QUANTITY = 2;
const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const formatAmount = (amount) => {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `$${amount}`;
  }
};

const price = formatAmount(STICKER_PRICE_COP);

/* ───────── Tarjeta de diseño ───────── */
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
          src={design.image_url || ''}
          alt=""
          loading="lazy"
          decoding="async"
          aria-hidden="true"
          className="w-32 h-32 rounded-xl object-cover bg-neutral-100 object-center shadow-inner"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        {!design.image_url && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-neutral-100">
            <Sticker className="h-10 w-10 text-neutral-400" aria-hidden="true" />
            <span className="text-[10px] font-medium text-neutral-500 leading-tight text-center px-2">
              Imagen pendiente
            </span>
          </div>
        )}
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

/* ───────── Página: Comprar nuevos stickers ───────── */
export const BuyStickers = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });

  const [designs, setDesigns] = useState([]);
  const [selectedDesignId, setSelectedDesignId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState('select'); // select | confirm | paying | success
  const [order, setOrder] = useState(null);

  const loadDesigns = useCallback(async () => {
    try {
      const res = await api.get('/products');
      const list = res.data.products || res.data || [];
      const stickerProduct = list.find((p) => p.slug === 'sticker-qr-personalizado');
      if (stickerProduct) {
        const dRes = await api.get('/designs', { params: { product_id: stickerProduct.id } });
        setDesigns(dRes.data.designs || []);
      } else {
        setDesigns([]);
      }
    } catch {
      setError('No se pudieron cargar los diseños. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(loadDesigns, 0);
    return () => clearTimeout(t);
  }, [loadDesigns]);

  const availableDesigns = useMemo(
    () => designs.filter((d) => d.is_available === 1 || d.is_available === true),
    [designs]
  );

  const selectedDesign = designs.find((d) => d.id === selectedDesignId);

  const handleSelect = (designId) => {
    const design = designs.find((d) => d.id === designId);
    if (!design || (design.is_available !== 1 && design.is_available !== true)) {
      setError('Este diseño no está disponible.');
      return;
    }
    setSelectedDesignId(designId);
    setError(null);
  };

  const createOrderAndPay = async () => {
    if (!selectedDesignId) {
      setError('Debes seleccionar un diseño para continuar.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.post('/orders/stickers', {
        design_id: selectedDesignId,
      });
      const newOrder = res.data.order;
      setOrder(newOrder);
      setStep('confirm');
    } catch (err) {
      setBusy(false);
      try {
        const serverMsg = err?.response?.data?.error || err?.response?.data?.details;
        setError(typeof serverMsg === 'string' ? serverMsg : 'No se pudo crear el pedido. Inténtalo de nuevo.');
      } catch {
        setError('No se pudo crear el pedido. Inténtalo de nuevo.');
      }
    } finally {
      if (!order) setBusy(false);
    }
  };

  const proceedToPayment = async () => {
    if (!order) return;
    setBusy(true);
    try {
      const prefRes = await api.post('/payments/preference', { order_id: order.id });
      setStep('paying');
      window.location.href = prefRes.data.init_point;
    } catch (err) {
      setBusy(false);
      setError(err?.response?.data?.error || 'No se pudo iniciar el pago de Mercado Pago.');
    }
  };

  const retryPayment = async () => {
    if (!order) return;
    setBusy(true);
    try {
      const prefRes = await api.post('/payments/preference', { order_id: order.id });
      window.location.href = prefRes.data.init_point;
    } catch (err) {
      setBusy(false);
      setError(err?.response?.data?.error || 'No se pudo iniciar el pago.');
    }
  };

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className={`${panel} p-6 lg:p-8`}>
        <EmptyState icon={AlertTriangle} title="Error" text={error} />
        <div className="mt-6 flex justify-center">
          <Button onClick={loadDesigns} variant="outline">
            <ArrowRight size={16} /> Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (availableDesigns.length === 0) {
    return (
      <div className={`${panel} p-6 lg:p-8`}>
        <EmptyState
          icon={AlertCircle}
          title="No hay diseños disponibles"
          text="Vuelve más tarde o escríbenos por WhatsApp para un diseño personalizado."
        />
      </div>
    );
  }

  /* ── Paso 1: Selección de diseño ── */
  if (step === 'select') {
    return (
      <div className="animate-fade-in space-y-5 lg:space-y-6">
        <PageTitle title="Comprar nuevos stickers" description="Elige uno de los seis diseños disponibles. Precio fijo: $30.000 COP por sticker." />

        <section className={`${panel} p-6 lg:p-8`}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Elige el diseño de tus stickers</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Selecciona uno de los seis diseños. Los dos stickers de tu paquete llevarán ese mismo diseño.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
              $30.000 COP por sticker · precio fijo
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Diseño de los stickers">
            {availableDesigns.map((design) => (
              <DesignCard key={design.id} design={design} selected={selectedDesignId} onSelect={handleSelect} />
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={createOrderAndPay}
              disabled={!selectedDesignId || busy}
              variant="primary"
              className="px-6 py-2.5 text-sm"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creando pedido…
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" /> Confirmar compra
                </>
              )}
            </Button>
          </div>
        </section>
      </div>
    );
  }

  /* ── Paso 2: Confirmar compra ── */
  if (step === 'confirm') {
    return (
      <div className="animate-fade-in space-y-5 lg:space-y-6">
        <PageTitle title="Confirmar compra" description="Revisa tu diseño y el precio antes de pagar." />

        <section className={`${panel} p-6 lg:p-8`}>
          <h2 className="mb-2 text-lg font-bold text-neutral-900">Resumen de tu compra</h2>
          <p className="mb-6 text-sm text-text-secondary">
            Revisa el diseño elegido y el precio. El precio es fijo y no se puede modificar.
          </p>

          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={selectedDesign?.image_url || ''}
                alt=""
                loading="lazy"
                className="w-24 h-24 rounded-xl object-cover bg-neutral-100 shadow-inner"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              {!selectedDesign?.image_url && (
                <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-neutral-100">
                  <Sticker className="h-10 w-10 text-neutral-400" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-neutral-900">{selectedDesign?.name}</h3>
              {selectedDesign?.description && (
                <p className="mt-0.5 text-xs text-text-secondary">{selectedDesign.description}</p>
              )}
              <p className="mt-2 text-xs font-semibold text-brand-600 uppercase tracking-wider">
                Disponible
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-white p-5">
            <table className="w-full text-sm divide-y divide-border">
              <tbody>
                <tr>
                  <td className="py-4 text-text-secondary">Producto</td>
                  <td className="py-4 text-right font-semibold text-neutral-900">Stickers QR personalizados</td>
                </tr>
                <tr>
                  <td className="py-4 text-text-secondary">Diseño</td>
                  <td className="py-4 text-right font-semibold text-neutral-900">{selectedDesign?.name}</td>
                </tr>
                <tr>
                  <td className="py-4 text-text-secondary">Cantidad</td>
                  <td className="py-4 text-right font-semibold text-neutral-900">{STICKER_QUANTITY} stickers (mismo diseño)</td>
                </tr>
                <tr>
                  <td className="py-4 text-text-secondary">Precio por sticker</td>
                  <td className="py-4 text-right font-bold text-neutral-900">{price}</td>
                </tr>
                <tr>
                  <td className="py-4 text-text-secondary font-semibold">Total a pagar</td>
                  <td className="py-4 text-right text-lg font-bold text-neutral-900">{price}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-xs leading-relaxed text-text-secondary">
              El precio es fijo: $30.000 COP por sticker. No se puede modificar. El pago se procesa a través de Mercado Pago.
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              onClick={() => setStep('select')}
              variant="outline"
              className="px-6 py-2.5 text-sm"
            >
              <ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" /> Elegir otro diseño
            </Button>
            <Button
              type="button"
              onClick={proceedToPayment}
              disabled={busy}
              variant="primary"
              className="px-6 py-2.5 text-sm"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Redirigiendo…
                </>
              ) : (
                <>
                  <CreditCard size={16} aria-hidden="true" /> Pagar con Mercado Pago
                </>
              )}
            </Button>
          </div>
        </section>
      </div>
    );
  }

  /* ── Pago / éxito ── */
  return (
    <div className="animate-fade-in space-y-5 lg:space-y-6">
      <PageTitle title="Estado de tu compra" description="Tu pedido se está procesando." />

      {step === 'paying' && (
        <section className={`${panel} p-6 lg:p-8`}>
          <h2 className="mb-2 text-lg font-bold text-neutral-900">Redirigiendo al pago</h2>
          <p className="mb-6 text-sm text-text-secondary">
            Serás llevado a Mercado Pago para completar el pago de {price}.
          </p>
          <div className="flex justify-center">
            <Button variant="primary" disabled className="px-6 py-2.5 text-sm">
              <Loader2 size={16} className="animate-spin" />
            </Button>
          </div>
        </section>
      )}

      {step === 'success' && order && (
        <section className={`${panel} p-6 lg:p-8`}>
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" aria-hidden="true" />
            <h2 className="text-xl font-bold text-neutral-900">Pedido creado</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Tu pedido <span className="font-mono font-semibold text-neutral-900">{order.order_number}</span> se ha registrado.
              Diseño: <span className="font-medium text-neutral-900">{order.design_name}</span>. Total: {price}.
            </p>
            <p className="mt-4 text-sm text-text-secondary">
              Cuando Mercado Pago apruebe el pago, tu QR se activará automáticamente.
            </p>
          </div>
          <div className="mt-6 flex justify-center">
            <Link to={routes.dashboardOrders} className="btn-outline px-6 py-2.5 text-sm">
              Ver mis pedidos <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default BuyStickers;
