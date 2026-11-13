import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  MessageCircle,
  Sticker,
  QrCode,
  Truck,
  User,
} from 'lucide-react';
import { z } from 'zod';
import api from '../api/client';
import { routes } from '../utils/routes';
import { useAuth } from '../contexts/useAuth';
import { useToast } from '../components/useToast';
import { PageTitle, PageLoader } from '../components/DashPage';
import { Button } from '../components/ui';
import { Badge } from '../components/ui-kit';

const DESIGN_STORAGE_KEY = 'tqtc_selected_design';

const loadSelectedDesign = () => {
  try {
    const raw = localStorage.getItem(DESIGN_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    return value && value.designId ? Number(value.designId) : null;
  } catch {
    return null;
  }
};

const saveSelectedDesign = (designId) => {
  try {
    localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify({ designId, updatedAt: Date.now() }));
  } catch {
    // Sin almacenamiento local: la selección vive solo en la sesión actual.
  }
};

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

const shippingSchema = z.object({
  fullName: z.string().min(3, 'Nombre completo requerido'),
  phone: z.string().min(7, 'Teléfono requerido'),
  address: z.string().min(5, 'Dirección requerida'),
  city: z.string().min(2, 'Ciudad requerida'),
  department: z.string().min(2, 'Departamento requerido'),
  postalCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

export const Checkout = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });

  const [step, setStep] = useState('diseño'); // diseño | envio | pago
  const [products, setProducts] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [selectedDesignId, setSelectedDesignId] = useState(() => loadSelectedDesign());
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    department: '',
    postalCode: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [pRes, dRes] = await Promise.all([
          api.get('/products'),
          api.get('/designs'),
        ]);
        if (!mounted) return;
        const list = pRes.data.products || pRes.data || [];
        setProducts(list);
        const stickerProduct = list.find((p) => p.slug === 'sticker-qr-personalizado');
        const productDesigns = stickerProduct
          ? ((dRes.data.designs || []).filter((d) => d.product_id === stickerProduct.id))
          : [];
        setDesigns(productDesigns);
      } catch {
        setError('No pudimos cargar el catálogo de diseños. Inténtalo de nuevo.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const stickerProduct = useMemo(
    () => products.find((p) => p.slug === 'sticker-qr-personalizado'),
    [products]
  );

  const selectedDesign = designs.find((d) => d.id === selectedDesignId);
  const designAvailable = Boolean(selectedDesign && (selectedDesign.is_available === 1 || selectedDesign.is_available === true));
  const price = useMemo(() => (stickerProduct ? stickerProduct.price : 0), [stickerProduct]);
  const total = price;

  const handleSelectDesign = (id) => {
    const design = designs.find((d) => d.id === id);
    if (!design || (design.is_available !== 1 && design.is_available !== true)) return;
    setSelectedDesignId(id);
    saveSelectedDesign(id);
    setError(null);
  };

  const continueToShipping = () => {
    setError(null);
    if (!designAvailable) {
      setError('Debes elegir un diseño disponible para continuar.');
      return;
    }
    setStep('envio');
  };

  const handleAddressChange = (key, value) => {
    setAddress((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const validateAddress = () => {
    const result = shippingSchema.safeParse({ body: address });
    if (result.success) {
      setFormErrors({});
      return true;
    }
    const errors = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path[0];
      errors[field] = issue.message;
    });
    setFormErrors(errors);
    return false;
  };

  const createOrderAndPay = async (goToMercadoPago = true) => {
    if (!designAvailable || !stickerProduct) {
      setError('El diseño o el producto no están disponibles.');
      return;
    }
    if (!validateAddress()) return;

    setBusy(true);
    setError(null);
    try {
      const res = await api.post('/orders', {
        product_id: stickerProduct.id,
        design_id: selectedDesignId,
        shipping_address: {
          fullName: address.fullName,
          phone: address.phone,
          address: address.address,
          city: address.city,
          department: address.department,
          postalCode: address.postalCode || null,
          notes: address.notes || null,
        },
      });
      const newOrder = res.data.order;
      setOrder(newOrder);

      if (goToMercadoPago) {
        const prefRes = await api.post('/payments/preference', { order_id: newOrder.id });
        setStep('pago');
        window.location.href = prefRes.data.init_point;
      } else {
        setStep('pago');
        toast.success('Pedido creado. Completa el pago por WhatsApp para finalizar.');
      }
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

  const retryPreference = async () => {
    if (!order) return;
    setBusy(true);
    try {
      const prefRes = await api.post('/payments/preference', { order_id: order.id });
      window.location.href = prefRes.data.init_point;
    } catch (err) {
      setBusy(false);
      setError(err?.response?.data?.error || 'No se pudo iniciar el pago de Mercado Pago.');
    }
  };

  const waPayMessage = `Hola, quiero pagar mi pedido de stickers QR ${order?.order_number || ''}. Deseo pagar por WhatsApp.`;
  const waHelpMessage = 'Hola, necesito ayuda con mi pedido de stickers QR de Tu QR te Cuida.';

  if (!loading && !isAuthenticated) {
    navigate(routes.login, { replace: true });
    return <PageLoader />;
  }

  if (loading) return <PageLoader />;

  const designName = selectedDesign?.name || '—';
  const designImage = selectedDesign?.image_url || '';
  const designUnavailable = Boolean(selectedDesign && (selectedDesign.is_available !== 1 && selectedDesign.is_available !== true));

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={{ hidden: {}, show: { opacity: 1 } }} initial="hidden" animate="show" className="space-y-5 lg:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PageTitle
            title="Resumen de tu compra"
            description="Confirma el diseño, tus datos de envío y el método de pago antes de pedir tus stickers."
            actions={
              <Link
                to={routes.dashboardOrders}
                className="btn-outline px-4 py-2 text-sm"
              >
                Ver mis pedidos
              </Link>
            }
          />
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert"
          >
            <AlertCircle className="mr-2 h-5 w-5" aria-hidden="true" />
            {error}
            {order?.order_number && (
              <div className="mt-2">
                <Link
                  to={routes.dashboardOrders}
                  className="inline-block mt-2 font-semibold underline underline-offset-4 text-brand-600 hover:text-brand-700"
                >
                  Ver mis pedidos <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* ───── Paso 1: Diseño y resumen ───── */}
        <AnimatePresence>
          {step === 'diseño' && (
            <motion.div
              key="step-diseno"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {designAvailable && selectedDesign ? (
                <>
                  <div className={`${panel} p-6 lg:p-8`}>
                    <h2 className="mb-2 text-lg font-bold text-neutral-900">Diseño seleccionado</h2>
                    <p className="mb-6 text-sm text-text-secondary">
                      Recibirás dos stickers personalizados con el mismo diseño que seleccionaste y tu código QR único.
                    </p>
                    <div className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={designImage}
                          alt=""
                          loading="lazy"
                          className="w-24 h-24 rounded-xl object-cover bg-neutral-100 shadow-inner"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        {!designImage && (
                          <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-neutral-100">
                            <Sticker className="h-10 w-10 text-neutral-400" aria-hidden="true" />
                          </div>
                        )}
                        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white shadow-xs ring-2 ring-white">
                          <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                          <span className="sr-only">Seleccionado</span>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-neutral-900">{selectedDesign.name}</h3>
                        {selectedDesign.description && (
                          <p className="mt-0.5 text-xs text-text-secondary">{selectedDesign.description}</p>
                        )}
                        <p className="mt-2 text-xs font-semibold text-brand-600 uppercase tracking-wider">
                          Disponible
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`${panel} p-6 lg:p-8`}>
                    <h2 className="mb-2 text-lg font-bold text-neutral-900">Resumen de compra</h2>
                    <table className="w-full text-sm divide-y divide-border">
                      <tbody>
                        <tr>
                          <td className="py-4 text-text-secondary">Producto</td>
                          <td className="py-4 text-right font-semibold text-neutral-900">Stickers QR personalizados</td>
                        </tr>
                        <tr>
                          <td className="py-4 text-text-secondary">Diseño</td>
                          <td className="py-4 text-right font-semibold text-neutral-900">{selectedDesign.name}</td>
                        </tr>
                        <tr>
                          <td className="py-4 text-text-secondary">Cantidad</td>
                          <td className="py-4 text-right font-semibold text-neutral-900">2 stickers (mismo diseño)</td>
                        </tr>
                        <tr>
                          <td className="py-4 text-text-secondary">Precio del producto</td>
                          <td className="py-4 text-right font-bold text-neutral-900">{formatAmount(total)}</td>
                        </tr>
                        <tr>
                          <td className="py-4 text-text-secondary">Envío</td>
                          <td className="py-4 text-right text-sm text-text-secondary">Se confirma antes de pagar</td>
                        </tr>
                        <tr>
                          <td className="py-4 text-text-secondary font-semibold">Total a pagar</td>
                          <td className="py-4 text-right text-lg font-bold text-neutral-900">{formatAmount(total)}</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="mt-4 text-xs leading-relaxed text-text-secondary">
                      La cantidad de stickers es fija: 2 unidades por paquete, con el mismo diseño. El código QR es tu
                      identificador permanente y no se genera uno nuevo al comprar.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                    <Link
                      to={routes.products}
                      className="btn-outline px-4 py-2.5 text-sm"
                    >
                      <ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" /> Elegir otro diseño
                    </Link>
                    <button
                      type="button"
                      onClick={continueToShipping}
                      disabled={busy}
                      className="btn px-6 py-2.5 text-sm"
                    >
                      {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                      {busy ? 'Continuando…' : 'Continuar con datos de envío'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={`${panel} p-6 lg:p-8`}>
                    <h2 className="mb-2 text-lg font-bold text-neutral-900">Elige el diseño de tus stickers</h2>
                    <p className="mb-5 text-sm text-text-secondary">
                      Selecciona uno de los diez diseños. Es obligatorio para continuar.
                    </p>
                    <div role="radiogroup" aria-label="Diseño de los stickers" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {designs.map((design) => {
                        const available = design.is_available === 1 || design.is_available === true;
                        const selected = selectedDesignId === design.id;
                        return (
                          <div
                            key={design.id}
                            role="radio"
                            aria-checked={selected}
                            aria-label={`Diseño ${design.name}${available ? '' : ', no disponible'}`}
                            tabIndex={available ? 0 : -1}
                            onClick={() => available && handleSelectDesign(design.id)}
                            onKeyDown={(e) => {
                              if ((e.key === 'Enter' || e.key === ' ') && available) {
                                e.preventDefault();
                                handleSelectDesign(design.id);
                              }
                            }}
                            className={`
                              relative flex flex-col items-center rounded-xl border p-3 transition-all duration-200
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
                              ${selected
                                ? 'border-2 border-brand-500 bg-brand-50 shadow-[0_0_0_4px_rgba(159,18,57,0.12)]'
                                : available
                                  ? 'border-border bg-white hover:border-brand-500/40 hover:shadow-soft'
                                  : 'border-border border-dashed bg-neutral-50/50 text-text-muted opacity-75'
                            }`}
                          >
                            <div className="relative mb-2 group w-20 h-20 shrink-0">
                              <img
                                src={design.image_url || ''}
                                alt=""
                                loading="lazy"
                                className="w-full h-full rounded-lg object-cover bg-neutral-100 object-center shadow-inner"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              {!design.image_url && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-neutral-100">
                                  <Sticker className="h-8 w-8 text-neutral-400" aria-hidden="true" />
                                </div>
                              )}
                              {selected && (
                                <span className="absolute right-0 top-0 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white shadow-xs ring-2 ring-white">
                                  <Check size={10} strokeWidth={2} aria-hidden="true" />
                                  <span className="sr-only">Seleccionado</span>
                                </span>
                              )}
                              {!available && (
                                <span className="absolute left-0 top-0 z-10 inline-flex items-center rounded-tl-lg rounded-br-lg border border-brand-500 bg-brand-900 px-1.5 py-0.5 text-[10px] font-bold text-white ring-1 ring-white">
                                  No disponible
                                </span>
                              )}
                            </div>
                            <h4 className={`
                              mb-1 text-xs font-semibold text-center
                              ${selected ? 'text-brand-700' : available ? 'text-neutral-900' : 'text-neutral-400'}
                            `}>
                              {design.name}
                            </h4>
                            {!available && (
                              <p className="text-[10px] font-semibold text-center text-rose-600">No disponible</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {designs.length === 0 && (
                      <p className="text-sm text-text-secondary">No hay diseños cargados en el catálogo.</p>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={continueToShipping}
                      disabled={!designAvailable || busy}
                      className="btn px-6 py-2.5 text-sm"
                    >
                      {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                      {busy ? 'Continuando…' : 'Continuar con este diseño'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───── Paso 2: Datos de envío ───── */}
        <AnimatePresence>
          {step === 'envio' && (
            <motion.div
              key="step-envio"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Datos de envío</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    Dirección donde recibirás tus 2 stickers con el diseño{" "}
                    <span className="font-semibold text-neutral-900">{designName}</span>.
                  </p>
                </div>
                <Badge tone="info" size="sm">
                  Paso 2 de 3
                </Badge>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); createOrderAndPay(true); }} className={`${panel} p-6 lg:p-8 space-y-5`}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-900/90">
                      <User size={15} className="flex-none text-brand-500" aria-hidden="true" />
                      Nombre completo <span className="text-rose-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="text"
                      value={address.fullName}
                      onChange={(e) => handleAddressChange('fullName', e.target.value)}
                      placeholder="Juan Pérez"
                      className={`input !text-base ${formErrors.fullName ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''}`}
                      aria-invalid={Boolean(formErrors.fullName)}
                    />
                    {formErrors.fullName && (
                      <p className="mt-1 text-xs font-medium text-rose-700">{formErrors.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-900/90">
                      Teléfono <span className="text-rose-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="tel"
                      value={address.phone}
                      onChange={(e) => handleAddressChange('phone', e.target.value)}
                      placeholder="300 123 4567"
                      className={`input !text-base ${formErrors.phone ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''}`}
                      aria-invalid={Boolean(formErrors.phone)}
                    />
                    {formErrors.phone && (
                      <p className="mt-1 text-xs font-medium text-rose-700">{formErrors.phone}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-900/90">
                    Dirección <span className="text-rose-600" aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    value={address.address}
                    onChange={(e) => handleAddressChange('address', e.target.value)}
                    placeholder="Calle 10 # 20-30"
                    className={`input !text-base ${formErrors.address ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''}`}
                    aria-invalid={Boolean(formErrors.address)}
                  />
                  {formErrors.address && (
                    <p className="mt-1 text-xs font-medium text-rose-700">{formErrors.address}</p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-900/90">Ciudad</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      placeholder="Bogotá"
                      className={`input !text-base ${formErrors.city ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''}`}
                      aria-invalid={Boolean(formErrors.city)}
                    />
                    {formErrors.city && (
                      <p className="mt-1 text-xs font-medium text-rose-700">{formErrors.city}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-900/90">Departamento</label>
                    <input
                      type="text"
                      value={address.department}
                      onChange={(e) => handleAddressChange('department', e.target.value)}
                      placeholder="Cundinamarca"
                      className={`input !text-base ${formErrors.department ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''}`}
                      aria-invalid={Boolean(formErrors.department)}
                    />
                    {formErrors.department && (
                      <p className="mt-1 text-xs font-medium text-rose-700">{formErrors.department}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-900/90">Código postal (opcional)</label>
                  <input
                    type="text"
                    value={address.postalCode}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    placeholder="110111"
                    className="input !text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-900/90">Notas de entrega (opcional)</label>
                  <textarea
                    value={address.notes}
                    onChange={(e) => handleAddressChange('notes', e.target.value)}
                    rows={2}
                    placeholder="Ejemplo: dejar en recepción"
                    className="input !text-base"
                  />
                </div>

                <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <Link to={routes.products} className="btn-outline px-4 py-2.5 text-sm">
                    <ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" /> Volver al diseño
                  </Link>
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn px-6 py-2.5 text-sm"
                  >
                    {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                    {busy ? 'Creando pedido…' : 'Continuar al pago'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───── Paso 3: Pago ───── */}
        <AnimatePresence>
          {step === 'pago' && (
            <motion.div
              key="step-pago"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`${panel} p-6 lg:p-8`}>
                <h2 className="mb-2 text-lg font-bold text-neutral-900">Resumen y pago</h2>
                <p className="mb-6 text-sm text-text-secondary">
                  Pedido <span className="font-mono font-semibold text-neutral-900">{order?.order_number}</span> —
                  {designName} · 2 stickers · {formatAmount(total)}
                </p>
                <table className="w-full text-sm divide-y divide-border mb-8">
                  <tbody>
                    <tr>
                      <td className="py-3 text-text-secondary">Diseño</td>
                      <td className="py-3 text-right font-semibold text-neutral-900">{designName}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-text-secondary">Cantidad</td>
                      <td className="py-3 text-right font-semibold text-neutral-900">2 stickers (mismo diseño)</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-text-secondary">Total a pagar</td>
                      <td className="py-3 text-right font-bold text-neutral-900">{formatAmount(total)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="space-y-3">
                  {order?.production_required && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      <AlertTriangle className="mr-2 h-5 w-5" aria-hidden="true" />
                      <strong>Producción bajo pedido.</strong> Tu diseño no tiene paquetes impresos disponibles.
                      Generaremos tu código QR y enviaremos tu paquete a fabricación. El tiempo de despacho
                      dependerá de la programación de producción; no es inmediato.
                    </div>
                  )}
                  {!order?.production_required && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                      <CheckCircle2 className="mr-2 h-5 w-5" aria-hidden="true" />
                      <strong>Disponible.</strong> Tu paquete incluye dos stickers personalizados con el mismo
                      código QR y estará listo para despacho tras el pago.
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => createOrderAndPay(true)}
                    disabled={busy || !order}
                    className="btn w-full px-6 py-3 text-sm"
                  >
                    {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                    {!busy ? 'Pagar con Mercado Pago' : 'Redirigiendo al pago…'}
                  </button>
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-white/65">
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    Pago seguro procesado por Mercado Pago
                  </p>

                  <div className="mt-6 rounded-xl border border-dashed border-brand-200 bg-brand-50/60 p-4 text-sm text-brand-800">
                    <MessageCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                    Prefieres pagar por WhatsApp o tu pago es manual. Escríbenos al
                    <a
                      href={`https://wa.me/573212209943?text=${encodeURIComponent(waPayMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline underline-offset-2 hover:text-brand-700"
                    >
                      WhatsApp
                    </a>
                    , indicando tu pedido {order?.order_number}. El pedido queda registrado como pendiente de pago y
                    tu selección de diseño se conserva.
                  </div>

                  {!order && (
                    <p className="mt-4 text-xs text-text-secondary">
                      Crea el pedido primero para habilitar el pago.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <Link
                  to={routes.dashboardOrders}
                  className="btn-outline px-6 py-2.5 text-sm"
                >
                  Ver estado de mis pedidos <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  );
};

export default Checkout;
