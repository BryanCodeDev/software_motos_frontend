import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  Lock,
  MessageCircle,
  Sticker,
  Truck,
  User,
  ShoppingBag,
} from 'lucide-react';
import { z } from 'zod';
import api from '../api/client';
import { routes } from '../utils/routes';
import { useAuth } from '../contexts/useAuth';
import { useToast } from '../components/useToast';
import { PageTitle, PageLoader } from '../components/DashPage';
import { Button, Input, Label } from '../components/ui';

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

const TYPE_LABEL = {
  person: 'Persona',
  pet: 'Mascota',
  managed_person: 'Persona gestionada',
};

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

export const Checkout = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });

  const [step, setStep] = useState('diseño'); // diseño | envio | pago | perfiles | pago-paquete
  const [products, setProducts] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [packages, setPackages] = useState([]);
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
  const [packageId, setPackageId] = useState(null);
  const [pkg, setPkg] = useState(null);

  /* ───── Flujo de paquete / perfil (pago requerido) ───── */
  const [profileSelection, setProfileSelection] = useState([]); // ids de perfiles existentes
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [newProfileForm, setNewProfileForm] = useState({
    profile_type: 'person',
    display_name: '',
    relationship: '',
  });
  const [myProfiles, setMyProfiles] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
    const urlParams = new URLSearchParams(window.location.search);
    const pkgId = urlParams.get('package');
    const isProfileFlow = urlParams.get('type') === 'profile';
    if (pkgId || isProfileFlow) {
      setPackageId(pkgId || null);
      const [pRes] = await Promise.all([api.get('/packages')]);
      if (!mounted) return;
      const packages = pRes.data.packages || [];
      setPackages(packages);
      if (isProfileFlow) {
        const profileType = urlParams.get('profile_type') || 'person';
        const name = urlParams.get('name') || '';
        const relationship = urlParams.get('relationship') || '';
        setNewProfileForm({ profile_type: profileType, display_name: name, relationship });
        setShowNewProfile(true);
        // Para el flujo de perfil aislado (pago requerido), preseleccionar el primer paquete disponible.
        if (!pkgId && packages.length > 0) {
          setPkg(packages[0]);
        }
      } else {
        const [pRes2] = await Promise.all([api.get(`/packages/${pkgId}`)]);
        if (!mounted) return;
        setPkg(pRes2.data.package || null);
      }
      setStep('perfiles');
      setLoading(false);
      return;
    }
        const [pRes] = await Promise.all([api.get('/products')]);
    if (!mounted) return;
    const list = pRes.data.products || pRes.data || [];
    setProducts(list);
    const stickerProduct = list.find((p) => p.slug === 'sticker-qr-personalizado');
    if (stickerProduct) {
      const dRes = await api.get(`/designs?product_id=${stickerProduct.id}`);
      if (!mounted) return;
      setDesigns(dRes.data.designs || []);
    } else {
      setDesigns([]);
    }
      } catch {
        setError('No pudimos cargar el catálogo. Inténtalo de nuevo.');
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
    const result = shippingSchema.safeParse(address);
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
        if (prefRes.data.payment_method === 'manual') {
          // Mercado Pago no configurado: pago pendiente, mostrar instrucciones
          setStep('pago');
          toast.success('Pedido creado. Completa el pago por WhatsApp para finalizar.');
          return;
        }
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
      if (prefRes.data.payment_method === 'manual') {
        setBusy(false);
        setStep('pago');
        toast.success('Pedido creado. Completa el pago por WhatsApp para finalizar.');
        return;
      }
      window.location.href = prefRes.data.init_point;
    } catch (err) {
      setBusy(false);
      setError(err?.response?.data?.error || 'No se pudo iniciar el pago de Mercado Pago.');
    }
  };

  /* ───── Flujo de paquete ───── */
  useEffect(() => {
    let mounted = true;
    const loadMyProfiles = async () => {
      try {
        const { data } = await api.get('/profiles/me/profiles');
        if (mounted) setMyProfiles(data.profiles || []);
      } catch {
        /* silencioso */
      }
    };
    if (pkg) loadMyProfiles();
    return () => { mounted = false; };
  }, [pkg]);

  const createPackageOrderAndPay = async () => {
    if (!pkg) {
      setError('Paquete no encontrado.');
      return;
    }
    const totalProfiles = profileSelection.length + (showNewProfile ? 1 : 0);
    if (totalProfiles !== pkg.profile_count) {
      setError(`Este paquete requiere ${pkg.profile_count} perfil(es). Seleccionaste ${totalProfiles}.`);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const body = {
        package_id: pkg.id,
        profile_ids: profileSelection.length > 0 ? profileSelection : undefined,
        new_profiles: showNewProfile ? [newProfileForm] : undefined,
        shipping_address: null,
      };
      const res = await api.post('/orders/package', body);
      const newOrder = res.data.order;
      setOrder(newOrder);

      const prefRes = await api.post('/payments/preference', { order_id: newOrder.id });
      if (prefRes.data.payment_method === 'manual') {
        setBusy(false);
        setStep('pago');
        toast.success('Pedido creado. Completa el pago por WhatsApp para finalizar.');
        return;
      }
      setStep('pago');
      window.location.href = prefRes.data.init_point;
    } catch (err) {
      setBusy(false);
      try {
        const serverMsg = err?.response?.data?.error || err?.response?.data?.details;
        setError(typeof serverMsg === 'string' ? serverMsg : 'No se pudo crear el pedido de paquete.');
      } catch {
        setError('No se pudo crear el pedido de paquete.');
      }
    } finally {
      if (!order) setBusy(false);
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

  const flowSteps = pkg
    ? [
        { id: 'perfiles', label: 'Perfiles', icon: User },
        { id: 'pago', label: 'Pago', icon: CreditCard },
      ]
    : [
        { id: 'diseño', label: 'Diseño', icon: Sticker },
        { id: 'envio', label: 'Envío', icon: Truck },
        { id: 'pago', label: 'Pago', icon: CreditCard },
      ];
  const currentIdx = Math.max(0, flowSteps.findIndex((st) => st.id === step));

  const fieldCls = (key) => `input !text-base ${formErrors[key] ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''}`;
  const FieldError = ({ name }) =>
    formErrors[name] ? <p className="mt-1 text-xs font-medium text-rose-700">{formErrors[name]}</p> : null;
  const labelCls = 'flex items-center gap-2 text-sm font-medium text-neutral-900/90';
  const actionsCls = 'flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between';
  const stepMotion = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3 },
  };

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={{ hidden: {}, show: { opacity: 1 } }} initial="hidden" animate="show" className="space-y-5 lg:space-y-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <PageTitle
            title="Resumen de tu compra"
            description="Confirma el diseño, tus datos de envío y el método de pago antes de pedir tus stickers."
            actions={
              <Link to={routes.dashboardOrders} className="btn-outline min-h-[44px] px-4 text-sm">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Ver mis pedidos
              </Link>
            }
          />
        </motion.div>

        {/* Indicador de pasos: siempre sabes en cuál estás */}
        <nav aria-label="Progreso de la compra">
          <ol className="flex items-center">
            {flowSteps.map((st, i) => {
              const done = i < currentIdx;
              const current = i === currentIdx;
              const Icon = st.icon;
              return (
                <li key={st.id} className={`flex items-center ${i < flowSteps.length - 1 ? 'flex-1' : ''}`} aria-current={current ? 'step' : undefined}>
                  <span className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2.5">
                    <span
                      className={`flex h-10 w-10 flex-none items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        done
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : current
                            ? 'border-brand-500 bg-brand-50 text-brand-500 shadow-glow'
                            : 'border-border bg-white text-text-secondary'
                      }`}
                    >
                      {done ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : <Icon size={18} aria-hidden="true" />}
                    </span>
                    <span className={`text-xs font-semibold sm:text-sm ${current ? 'text-brand-500' : done ? 'text-neutral-900' : 'text-text-secondary'}`}>
                      {st.label}
                    </span>
                  </span>
                  {i < flowSteps.length - 1 && (
                    <span className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-border sm:mx-4" aria-hidden="true">
                      <span className={`block h-full rounded-full bg-brand-500 transition-all duration-500 ${done ? 'w-full' : 'w-0'}`} />
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {error && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
            <div>
              {error}
              {order?.order_number && (
                <div className="mt-2">
                  <Link to={routes.dashboardOrders} className="inline-flex items-center gap-1.5 font-semibold text-brand-600 underline underline-offset-4 hover:text-brand-700">
                    Ver mis pedidos <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ───── Paso 1: Diseño y resumen ───── */}
        <AnimatePresence>
          {step === 'diseño' && (
            <motion.div key="step-diseno" {...stepMotion} className="space-y-5">
              {designAvailable && selectedDesign ? (
                <>
                  <div className={`${panel} p-5 sm:p-6 lg:p-8`}>
                    <h2 className="mb-1 text-lg font-bold text-neutral-900">Diseño seleccionado</h2>
                    <p className="mb-5 text-sm text-text-secondary">
                      Recibirás dos stickers con este diseño y tu código QR único.
                    </p>
                    <div className="flex items-center gap-4 rounded-xl bg-brand-50/60 p-3">
                      <div className="relative flex-shrink-0">
                        {designImage ? (
                          <img src={designImage} alt="" loading="lazy" className="h-20 w-20 rounded-xl bg-neutral-100 object-cover shadow-inner sm:h-24 sm:w-24" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-neutral-100 sm:h-24 sm:w-24">
                            <Sticker className="h-9 w-9 text-neutral-400" aria-hidden="true" />
                          </div>
                        )}
                        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white ring-2 ring-white">
                          <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                          <span className="sr-only">Seleccionado</span>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-neutral-900">{selectedDesign.name}</h3>
                        {selectedDesign.description && <p className="mt-0.5 text-xs text-text-secondary">{selectedDesign.description}</p>}
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-brand-600">Disponible</p>
                      </div>
                    </div>
                  </div>

                  <div className={`${panel} p-5 sm:p-6 lg:p-8`}>
                    <h2 className="mb-2 text-lg font-bold text-neutral-900">Resumen de compra</h2>
                    <table className="w-full divide-y divide-border text-sm">
                      <tbody>
                        {[
                          ['Producto', 'Stickers QR personalizados'],
                          ['Diseño', selectedDesign.name],
                          ['Cantidad', '2 stickers (mismo diseño)'],
                          ['Precio del producto', formatAmount(total)],
                        ].map(([k, v]) => (
                          <tr key={k}>
                            <td className="py-3 pr-3 text-text-secondary">{k}</td>
                            <td className="py-3 text-right font-semibold text-neutral-900">{v}</td>
                          </tr>
                        ))}
                        <tr>
                          <td className="py-3 pr-3 text-text-secondary">Envío</td>
                          <td className="py-3 text-right text-xs text-text-secondary sm:text-sm">Se confirma antes de pagar</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-3 font-semibold text-text-secondary">Total a pagar</td>
                          <td className="py-3 text-right text-xl font-extrabold text-neutral-900">{formatAmount(total)}</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                      La cantidad es fija: 2 unidades por paquete, con el mismo diseño. Tu código QR es permanente y no se genera uno nuevo al comprar.
                    </p>
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Link to={routes.products} className="btn-outline min-h-[48px] px-5 text-sm">
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Elegir otro diseño
                    </Link>
                    <button type="button" onClick={continueToShipping} disabled={busy} className="btn-primary min-h-[52px] px-6 text-sm">
                      {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                      {busy ? 'Continuando…' : 'Continuar con datos de envío'}
                      {!busy && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={`${panel} p-5 sm:p-6 lg:p-8`}>
                    <h2 className="mb-1 text-lg font-bold text-neutral-900">Elige el diseño de tus stickers</h2>
                    <p className="mb-5 text-sm text-text-secondary">Toca uno de los diseños disponibles. Es obligatorio para continuar.</p>
                    <div role="radiogroup" aria-label="Diseño de los stickers" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
                            className={`relative flex flex-col items-center rounded-xl border p-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                              selected
                                ? 'border-2 border-brand-500 bg-brand-50 shadow-[0_0_0_4px_rgba(159,18,57,0.12)]'
                                : available
                                  ? 'cursor-pointer border-border bg-white hover:border-brand-500/40 hover:shadow-soft active:scale-[0.98]'
                                  : 'border-dashed border-border bg-neutral-50/50 opacity-70'
                            }`}
                          >
                            <div className="relative mb-2 aspect-square w-full max-w-[104px]">
                              {design.image_url ? (
                                <img src={design.image_url} alt="" loading="lazy" className="h-full w-full rounded-lg bg-neutral-100 object-cover object-center shadow-inner" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-lg bg-neutral-100">
                                  <Sticker className="h-8 w-8 text-neutral-400" aria-hidden="true" />
                                </div>
                              )}
                              {selected && (
                                <span className="absolute -right-1 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white ring-2 ring-white">
                                  <Check size={12} strokeWidth={3} aria-hidden="true" />
                                  <span className="sr-only">Seleccionado</span>
                                </span>
                              )}
                            </div>
                            <h4 className={`text-center text-xs font-semibold ${selected ? 'text-brand-700' : available ? 'text-neutral-900' : 'text-neutral-400'}`}>{design.name}</h4>
                            {!available && <p className="mt-0.5 text-center text-[10px] font-semibold text-rose-600">No disponible</p>}
                          </div>
                        );
                      })}
                    </div>
                    {designs.length === 0 && <p className="text-sm text-text-secondary">No hay diseños cargados en el catálogo.</p>}
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={continueToShipping} disabled={!designAvailable || busy} className="btn-primary min-h-[52px] w-full px-6 text-sm sm:w-auto">
                      {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                      {busy ? 'Continuando…' : 'Continuar con este diseño'}
                      {!busy && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
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
            <motion.div key="step-envio" {...stepMotion}>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-neutral-900">Datos de envío</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Dirección donde recibirás tus 2 stickers con el diseño <span className="font-semibold text-neutral-900">{designName}</span>.
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); createOrderAndPay(true); }} className={`${panel} space-y-5 p-5 sm:p-6 lg:p-8`} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="ship-name" className={labelCls}>
                      <User size={15} className="flex-none text-brand-500" aria-hidden="true" />
                      Nombre completo <span className="text-rose-600" aria-hidden="true">*</span>
                    </label>
                    <input id="ship-name" type="text" autoComplete="name" value={address.fullName} onChange={(e) => handleAddressChange('fullName', e.target.value)} placeholder="Juan Pérez" className={fieldCls('fullName')} aria-invalid={Boolean(formErrors.fullName)} />
                    <FieldError name="fullName" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="ship-phone" className={labelCls}>Teléfono <span className="text-rose-600" aria-hidden="true">*</span></label>
                    <input id="ship-phone" type="tel" inputMode="tel" autoComplete="tel" value={address.phone} onChange={(e) => handleAddressChange('phone', e.target.value)} placeholder="300 123 4567" className={fieldCls('phone')} aria-invalid={Boolean(formErrors.phone)} />
                    <FieldError name="phone" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ship-address" className={labelCls}>Dirección <span className="text-rose-600" aria-hidden="true">*</span></label>
                  <input id="ship-address" type="text" autoComplete="street-address" value={address.address} onChange={(e) => handleAddressChange('address', e.target.value)} placeholder="Calle 10 # 20-30" className={fieldCls('address')} aria-invalid={Boolean(formErrors.address)} />
                  <FieldError name="address" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="ship-city" className={labelCls}>Ciudad <span className="text-rose-600" aria-hidden="true">*</span></label>
                    <input id="ship-city" type="text" autoComplete="address-level2" value={address.city} onChange={(e) => handleAddressChange('city', e.target.value)} placeholder="Bogotá" className={fieldCls('city')} aria-invalid={Boolean(formErrors.city)} />
                    <FieldError name="city" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="ship-dept" className={labelCls}>Departamento <span className="text-rose-600" aria-hidden="true">*</span></label>
                    <input id="ship-dept" type="text" autoComplete="address-level1" value={address.department} onChange={(e) => handleAddressChange('department', e.target.value)} placeholder="Cundinamarca" className={fieldCls('department')} aria-invalid={Boolean(formErrors.department)} />
                    <FieldError name="department" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="ship-zip" className={labelCls}>Código postal (opcional)</label>
                    <input id="ship-zip" type="text" inputMode="numeric" autoComplete="postal-code" value={address.postalCode} onChange={(e) => handleAddressChange('postalCode', e.target.value)} placeholder="110111" className="input !text-base" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="ship-notes" className={labelCls}>Notas de entrega (opcional)</label>
                    <input id="ship-notes" type="text" value={address.notes} onChange={(e) => handleAddressChange('notes', e.target.value)} placeholder="Ej.: dejar en recepción" className="input !text-base" />
                  </div>
                </div>

                <div className={actionsCls}>
                  <button type="button" onClick={() => setStep('diseño')} className="btn-outline min-h-[48px] px-5 text-sm">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver al diseño
                  </button>
                  <button type="submit" disabled={busy} className="btn-primary min-h-[52px] px-6 text-sm">
                    {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                    {busy ? 'Creando pedido…' : 'Continuar al pago'}
                    {!busy && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───── Paso: selección de perfiles (paquete) ───── */}
        <AnimatePresence>
          {step === 'perfiles' && pkg && (
            <motion.div key="step-perfiles" {...stepMotion}>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-neutral-900">Asigna perfiles al paquete</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Selecciona {pkg.profile_count} perfil(es) existentes o crea uno nuevo. Cada perfil recibirá su propio QR permanente.
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); createPackageOrderAndPay(); }} className={`${panel} space-y-5 p-5 sm:p-6 lg:p-8`}>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-neutral-900">Perfiles existentes de tu cuenta</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {myProfiles.length === 0 && <p className="col-span-full text-sm text-text-secondary">No tienes perfiles creados aún. Crea uno nuevo abajo.</p>}
                    {myProfiles.map((p) => {
                      const selected = profileSelection.includes(p.id);
                      const alreadyHasQr = (p.qr_count || 0) > 0;
                      return (
                        <label key={p.id} className={`flex min-h-[60px] cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${selected ? 'border-brand-500 bg-brand-50' : 'border-border hover:border-brand-300'}`}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {
                              if (e.target.checked) setProfileSelection([...profileSelection, p.id]);
                              else setProfileSelection(profileSelection.filter((id) => id !== p.id));
                            }}
                            className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                          />
                          <div>
                            <div className="text-sm font-medium text-neutral-900">{p.display_name || 'Sin nombre'}</div>
                            <div className="text-xs text-text-secondary">
                              {TYPE_LABEL[p.profile_type] || p.profile_type}
                              {alreadyHasQr ? ' · Ya tiene QR' : ''}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {pkg.profile_count > profileSelection.length && (
                  <div className="border-t border-border/50 pt-4">
                    <label className="flex min-h-[44px] items-center gap-3 text-sm font-medium text-neutral-900">
                      <input type="checkbox" checked={showNewProfile} onChange={(e) => setShowNewProfile(e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                      Crear un perfil nuevo para completar el paquete
                    </label>
                    {showNewProfile && (
                      <div className="mt-3 space-y-3">
                        <Label>Tipo de perfil</Label>
                        <select value={newProfileForm.profile_type} onChange={(e) => setNewProfileForm({ ...newProfileForm, profile_type: e.target.value })} className="input !text-base">
                          <option value="person">Persona</option>
                          <option value="pet">Mascota</option>
                        </select>
                        <Label>Nombre para mostrar</Label>
                        <Input required value={newProfileForm.display_name} onChange={(e) => setNewProfileForm({ ...newProfileForm, display_name: e.target.value })} placeholder="Ej.: Ana Gómez" />
                        <Label>Relación (opcional)</Label>
                        <Input value={newProfileForm.relationship} onChange={(e) => setNewProfileForm({ ...newProfileForm, relationship: e.target.value })} placeholder="Ej.: hija, perro" />
                      </div>
                    )}
                  </div>
                )}

                <div className={actionsCls}>
                  <Link to={packages ? routes.dashboardOrders : routes.products} className="btn-outline min-h-[48px] px-5 text-sm">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a paquetes
                  </Link>
                  <button type="submit" disabled={busy} className="btn-primary min-h-[52px] px-6 text-sm">
                    {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                    {busy ? 'Creando pedido…' : 'Continuar al pago'}
                    {!busy && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───── Paso 3: Pago ───── */}
        <AnimatePresence>
          {step === 'pago' && (
            <motion.div key="step-pago" {...stepMotion}>
              <div className={`${panel} p-5 sm:p-6 lg:p-8`}>
                <h2 className="mb-1 text-lg font-bold text-neutral-900">Resumen y pago</h2>
                <p className="mb-5 text-sm text-text-secondary">
                  Pedido <span className="font-mono font-semibold text-neutral-900">{order?.order_number}</span>
                </p>
                <table className="mb-6 w-full divide-y divide-border text-sm">
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
                      <td className="py-3 text-right text-xl font-extrabold text-neutral-900">{formatAmount(total)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="space-y-3">
                  {/* Reintenta la preferencia del pedido ya creado: no genera un pedido nuevo */}
                  <button type="button" onClick={retryPreference} disabled={busy || !order} className="btn-primary min-h-[52px] w-full px-6 text-sm">
                    {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <CreditCard size={16} aria-hidden="true" />}
                    {!busy ? 'Pagar con Mercado Pago' : 'Redirigiendo al pago…'}
                  </button>
                  <p className="flex items-center justify-center gap-1.5 text-xs text-text-secondary">
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    Pago seguro procesado por Mercado Pago
                  </p>

                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-brand-200 bg-brand-50/60 p-4 text-sm text-brand-800">
                    <MessageCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
                    <p className="leading-relaxed">
                      ¿Prefieres pagar por WhatsApp o tu pago es manual? Escríbenos por{' '}
                      <a
                        href={`https://wa.me/573212209943?text=${encodeURIComponent(waPayMessage)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline underline-offset-2 hover:text-brand-700"
                      >
                        WhatsApp
                      </a>
                      , indicando tu pedido {order?.order_number}. El pedido queda pendiente de pago y tu diseño se conserva.
                    </p>
                  </div>

                  {!order && <p className="text-xs text-text-secondary">Crea el pedido primero para habilitar el pago.</p>}
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Link to={routes.dashboardOrders} className="btn-outline min-h-[48px] w-full px-6 text-sm sm:w-auto">
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