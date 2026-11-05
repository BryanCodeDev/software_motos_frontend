import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import api from '../../api/client';
import { routes } from '../../utils/routes';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import { PageTitle, PageLoader, EmptyState } from '../../components/DashPage';
import {
  Download, Link as LinkIcon, Check, Clock, AlertTriangle, AlertCircle, CheckCircle2,
  RotateCcw, CreditCard, Lock, Copy, ExternalLink, Loader2, MessageCircle, ScanLine,
  BadgeDollarSign, ShieldCheck, HeartPulse, ArrowRight, Sticker, FlaskConical,
} from 'lucide-react';

/* ───────── Constantes ───────── */
const QR_PRICE_COP = 30000;
const WHATSAPP_NUMBER = '573212209943';
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

const waLink = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

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

const STEPS = [
  { label: 'Pago', hint: 'Una sola vez' },
  { label: 'Activación', hint: 'Genera tu código' },
  { label: 'QR listo', hint: 'Descarga y comparte' },
];
const STEP_INDEX = {
  no_order: 0,
  unpaid: 0,
  under_review: 0,
  rejected: 0,
  approved_no_qr: 1,
  active: 2,
};

const TONES = {
  amber: { icon: 'bg-amber-50 text-amber-600 ring-amber-600/15', bar: 'bg-amber-400', pulse: 'bg-amber-400/30' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600 ring-emerald-600/15', bar: 'bg-emerald-500', pulse: 'bg-emerald-400/30' },
  rose: { icon: 'bg-rose-50 text-rose-600 ring-rose-600/15', bar: 'bg-rose-500', pulse: 'bg-rose-400/30' },
};

/* ───────── Piezas ───────── */
const Spinner = () => <Loader2 size={16} className="animate-spin" aria-hidden="true" />;

const WhatsAppButton = ({ message, onDark = false, className = '' }) => (
  <a
    href={waLink(message)}
    target="_blank"
    rel="noopener noreferrer"
    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors ${
      onDark
        ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
        : 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
    } ${className}`}
  >
    <MessageCircle size={16} aria-hidden="true" /> Pagar por WhatsApp
  </a>
);

const Stepper = ({ current }) => {
  const last = STEPS.length - 1;
  return (
    <div className={`${panel} p-4 sm:p-5`}>
      <ol className="flex items-start" aria-label="Progreso de activación">
        {STEPS.map((step, i) => {
          const done = i < current || current === 2;
          const active = i === current && current !== 2;
          return (
            <li key={step.label} className={`flex items-start ${i < last ? 'flex-1' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="relative flex h-9 w-9 flex-none items-center justify-center">
                  {active && <span aria-hidden="true" className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500/30" />}
                  <motion.span
                    initial={false}
                    animate={{ scale: active ? 1.06 : 1 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ring-1 transition-colors duration-300 ${
                      done
                        ? 'bg-brand-500 text-white ring-brand-500'
                        : active
                          ? 'bg-brand-500/10 text-brand-500 ring-2 ring-brand-500/50'
                          : 'bg-white text-text-secondary ring-border'
                    }`}
                    aria-current={active ? 'step' : undefined}
                  >
                    {done ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : i + 1}
                  </motion.span>
                </span>
                <div className="hidden sm:block">
                  <p className={`text-sm font-semibold ${done || active ? 'text-neutral-900' : 'text-text-secondary'}`}>{step.label}</p>
                  <p className="text-xs text-text-secondary">{step.hint}</p>
                </div>
              </div>
              {i < last && (
                <span className="relative mx-3 mt-[17px] h-0.5 flex-1 overflow-hidden rounded-full bg-border sm:mx-4" aria-hidden="true">
                  <motion.span
                    className="absolute inset-0 origin-left bg-brand-500"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: done ? 1 : 0 }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

const StateCard = ({ icon: Icon, tone = 'amber', pulse = false, title, children, actions }) => (
  <section className={`${panel} overflow-hidden`}>
    <div className={`h-1 w-full ${TONES[tone].bar}`} aria-hidden="true" />
    <div className="p-5 sm:p-6 lg:p-8">
      <div className="flex items-start gap-4">
        <span className="relative flex h-12 w-12 flex-none items-center justify-center">
          {pulse && <span aria-hidden="true" className={`absolute inset-0 animate-pulse-ring rounded-xl ${TONES[tone].pulse}`} />}
          <span className={`relative flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${TONES[tone].icon}`}>
            <Icon size={24} aria-hidden="true" />
          </span>
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <div className="mt-1 text-sm leading-relaxed text-text-secondary">{children}</div>
        </div>
      </div>
      {actions && <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  </section>
);

const CopyRow = ({ label, value }) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success(`${label} copiado`);
    } catch {
      toast.error('No se pudo copiar');
    }
  };
  return (
    <div>
      <dt className="text-xs font-semibold text-text-secondary">{label}</dt>
      <dd className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-brand-50/60 py-1.5 pl-3 pr-1.5">
        <span className="min-w-0 flex-1 break-all font-mono text-xs text-neutral-900">{value}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copiar ${label.toLowerCase()}`}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-white hover:text-brand-500"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={copied ? 'ok' : 'copy'}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex"
            >
              {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
            </motion.span>
          </AnimatePresence>
        </button>
      </dd>
    </div>
  );
};

/* ───────── Página ───────── */
export const QrPage = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });
  const reduce = useReducedMotion();

  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const [identifier, setIdentifier] = useState(null);
  const [order, setOrder] = useState(null);
  const [qrProduct, setQrProduct] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const [state, setState] = useState('loading');

  const deriveState = useCallback((id, ord) => {
    if (!id && !ord) return 'no_order';
    if (id) {
      if (id.status === 'active') return 'active';
      if (id.status === 'deactivated') return 'deactivated';
      if (id.status === 'replaced') return 'deactivated';
      return 'error';
    }
    if (!ord) return 'no_order';
    const ps = ord.payment_status;
    if (ps === 'approved') return 'approved_no_qr';
    if (ps === 'pending') return 'under_review';
    if (ps === 'unpaid') return 'unpaid';
    if (ps === 'rejected' || ps === 'cancelled' || ps === 'refunded') return 'rejected';
    return 'error';
  }, []);

  const qrObjectUrlRef = useRef(null);
  const loadingRef = useRef(loading);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    let mounted = true;

    const cleanupBlob = () => {
      if (qrObjectUrlRef.current) {
        window.URL.revokeObjectURL(qrObjectUrlRef.current);
        qrObjectUrlRef.current = null;
      }
    };

    (async () => {
      try {
        try {
          const res = await api.get('/identifiers/my');
          if (!mounted) return;
          const data = res.data.identifier || res.data;
          if (!data || data.status !== 'active') {
            throw { response: { status: 404 } };
          }
          setIdentifier(data);
          const code = data.value;
          setQrUrl(`${window.location.origin}/e/${encodeURIComponent(code)}`);
          try {
            const qr = await api.get('/identifiers/my/qr', { responseType: 'blob' });
            if (!mounted) return;
            cleanupBlob();
            const objectUrl = window.URL.createObjectURL(qr.data);
            qrObjectUrlRef.current = objectUrl;
            setQrImage(objectUrl);
          } catch {
            if (mounted) setQrImage('');
          }
          setState(deriveState(data, null));
          setLoading(false);
          return;
        } catch (err) {
          if (!(err.response && err.response.status === 404)) throw err;
        }

        const res = await api.get('/orders');
        if (!mounted) return;
        const orders = res.data.orders || res.data || [];
        const qrOrder = orders.find((o) => o.product_slug === 'qr-digital-basico');
        setOrder(qrOrder || null);
        setState(deriveState(null, qrOrder));
      } catch (err) {
        if (mounted) {
          if (err.response && err.response.status === 401) {
            setState('error');
            setLoading(false);
            return;
          }
          toastRef.current.error('No se pudo cargar el estado de tu QR');
          setState('error');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const timer = setTimeout(() => {
      if (mounted && loadingRef.current) {
        setLoading(false);
        setState('error');
      }
    }, 10000);

    return () => {
      mounted = false;
      clearTimeout(timer);
      cleanupBlob();
    };
  }, [deriveState]);

  useEffect(() => {
    if (!qrProduct) {
      api
        .get('/products')
        .then((res) => {
          const products = res.data.products || res.data || [];
          const qr = products.find((p) => p.slug === 'qr-digital-basico');
          setQrProduct(qr || null);
        })
        .catch(() => setQrProduct(null));
    }
  }, [qrProduct]);

  const createOrderAndPay = async (goToPayment = true) => {
    if (!qrProduct) {
      toast.error('El producto de activación no está disponible');
      return;
    }
    setActing(true);
    try {
      const orderRes = await api.post('/orders', {
        product_id: qrProduct.id,
        customization: { tipo: 'activacion_qr_digital', precio_cop: QR_PRICE_COP },
      });
      const newOrder = orderRes.data.order;
      setOrder(newOrder);
      setState(deriveState(null, newOrder));

      if (goToPayment) {
        const prefRes = await api.post('/payments/preference', { order_id: newOrder.id });
        window.location.href = prefRes.data.init_point;
      } else {
        toast.success('Pedido creado. Ahora puedes completar el pago.');
      }
    } catch (error) {
      setActing(false);
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err?.message || 'No se pudo crear el pedido de activación');
      }
    }
  };

  const retryPayment = async () => {
    if (!order) return;
    setActing(true);
    try {
      const prefRes = await api.post('/payments/preference', { order_id: order.id });
      window.location.href = prefRes.data.init_point;
    } catch (error) {
      setActing(false);
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err?.message || 'No se pudo iniciar el pago');
      }
    }
  };

  const activateQr = async () => {
    setActing(true);
    try {
      const res = await api.post('/identifiers/');
      if (!res.data.identifier) throw new Error('No se activó el identificador');
      const data = res.data.identifier;
      setIdentifier(data);
      const code = data.value;
      setQrUrl(`${window.location.origin}/e/${encodeURIComponent(code)}`);
      try {
        const qr = await api.get('/identifiers/my/qr', { responseType: 'blob' });
        if (qrObjectUrlRef.current) window.URL.revokeObjectURL(qrObjectUrlRef.current);
        const objectUrl = window.URL.createObjectURL(qr.data);
        qrObjectUrlRef.current = objectUrl;
        setQrImage(objectUrl);
      } catch {
        toastRef.current.error('No se pudo cargar la imagen del QR');
      }
      setState('active');
      toast.success('QR activado. Ya puedes descargarlo y compartir tu enlace público.');
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err?.message || 'No se pudo activar el QR');
      }
    } finally {
      setActing(false);
    }
  };

  const downloadQr = () => {
    if (!qrImage) return;
    try {
      const link = document.createElement('a');
      link.href = qrImage;
      link.download = `qr-emergencia-${identifier ? identifier.value : 'qr'}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('QR descargado');
    } catch {
      toast.error('No se pudo descargar el QR');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  if (loading) return <PageLoader />;

  const price = formatAmount(QR_PRICE_COP);
  const stepCurrent = STEP_INDEX[state];

  const waPay = 'Hola, quiero pagar mi pedido de activación de QR por WhatsApp.';
  const waActivate = 'Hola, quiero activar mi QR de emergencia por WhatsApp.';
  const waHelp = 'Hola, mi QR de emergencia aparece desactivado y necesito ayuda.';

  const pageDescription =
    state === 'active'
      ? 'Descarga tu código, compártelo y colócalo donde se vea rápido.'
      : `El QR funcional y tu página pública de emergencia quedan habilitados tras el pago único de ${price}.`;

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item}>
          <PageTitle title="Mi código QR de emergencia" description={pageDescription} />
        </motion.div>

        {stepCurrent !== undefined && (
          <motion.div variants={item}>
            <Stepper current={stepCurrent} />
          </motion.div>
        )}

        <motion.div variants={item}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={state}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {/* ───── Sin pedido: oferta de activación ───── */}
              {state === 'no_order' && (
                <section className={`${panel} overflow-hidden`}>
                  <div className="grid lg:grid-cols-5">
                    <div className="p-6 sm:p-8 lg:col-span-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-600/15">
                        <AlertCircle size={24} aria-hidden="true" />
                      </span>
                      <h2 className="mt-5 text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
                        Tu QR de emergencia todavía no está activado
                      </h2>
                      <p className="mt-2 max-w-lg text-sm leading-relaxed text-text-secondary">
                        Completa tu perfil, revisa qué información compartirás y realiza el pago único para
                        habilitar tu QR.
                      </p>

                      <ul className="mt-7 space-y-5">
                        {[
                          { icon: ScanLine, t: 'Página pública de emergencia', d: 'Quien escanee tu QR ve lo que autorizaste, sin cuenta ni app.' },
                          { icon: BadgeDollarSign, t: 'Pago único, sin suscripción', d: 'Sin renovaciones ni cobros automáticos.' },
                          { icon: ShieldCheck, t: 'Tu QR no lleva datos personales', d: 'Solo contiene un enlace con un código aleatorio.' },
                          { icon: Download, t: 'Descárgalo cuando quieras', d: 'En imagen PNG, listo para imprimir o pegar.' },
                        ].map(({ icon: Icon, t, d }) => (
                          <li key={t} className="flex items-start gap-3.5">
                            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
                              <Icon size={17} aria-hidden="true" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-neutral-900">{t}</p>
                              <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{d}</p>
                            </div>
                          </li>
                        ))}
                      </ul>

                      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-text-secondary">
                        <Sticker size={14} className="mt-0.5 flex-none text-brand-500" aria-hidden="true" />
                        El sticker físico es un producto adicional, con costo y envío aparte. No está incluido en
                        esta activación digital.
                      </p>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-6 text-white sm:p-8 lg:col-span-2">
                      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
                      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-400/30 blur-3xl" />
                      <div className="relative flex h-full flex-col">
                        <p className="text-sm font-medium text-white/75">Activación de QR digital</p>
                        <p className="mt-3 flex items-baseline gap-2">
                          <span className="text-5xl font-extrabold tracking-tight">{price}</span>
                        </p>
                        <p className="mt-1 text-sm text-white/70">pago único · sin suscripción</p>

                        <div className="mt-8 space-y-3 lg:mt-auto">
                          <button
                            type="button"
                            onClick={() => createOrderAndPay(true)}
                            disabled={acting}
                            className="btn w-full bg-white px-5 py-3 text-sm text-brand-500 shadow-soft hover:-translate-y-0.5 hover:bg-brand-50"
                          >
                            {acting ? <Spinner /> : <CreditCard size={16} aria-hidden="true" />}
                            {acting ? 'Redirigiendo a Mercado Pago...' : 'Pagar con Mercado Pago'}
                          </button>
                          <WhatsAppButton message={waActivate} onDark className="w-full py-3" />
                          <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-white/65">
                            <Lock size={12} aria-hidden="true" /> Pago seguro procesado por Mercado Pago
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* ───── Pago pendiente / en revisión ───── */}
              {(state === 'unpaid' || state === 'under_review') && (
                <StateCard
                  icon={Clock}
                  tone="amber"
                  pulse={state === 'under_review'}
                  title={state === 'under_review' ? 'Pago en revisión' : 'Pago pendiente'}
                  actions={
                    <>
                      {order ? (
                        <Button onClick={retryPayment} disabled={acting} variant="primary">
                          {acting && <Spinner />}
                          {acting ? 'Procesando...' : 'Ir al pago'}
                        </Button>
                      ) : (
                        <Button onClick={() => createOrderAndPay(true)} disabled={acting} variant="primary">
                          {acting && <Spinner />}
                          {acting ? 'Creando y pagando...' : 'Crear pedido y pagar'}
                        </Button>
                      )}
                      <WhatsAppButton message={waPay} />
                    </>
                  }
                >
                  <p>
                    {state === 'under_review'
                      ? 'Tu pago está siendo procesado por Mercado Pago. Una vez aprobado, podrás activar tu QR.'
                      : order
                        ? `Tienes un pedido pendiente por ${price}. Completa el pago para activar tu QR.`
                        : `No tienes un pedido activo. Crea uno por ${price} para continuar.`}
                  </p>
                  {order && (
                    <dl className="mt-4 space-y-2.5 rounded-xl border border-border bg-brand-50/60 p-4 text-xs">
                      <div className="flex justify-between gap-3">
                        <dt>Pedido</dt>
                        <dd className="font-mono font-semibold text-neutral-900">{order?.order_number || '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Producto</dt>
                        <dd className="text-neutral-900">Activación de QR digital</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Importe</dt>
                        <dd className="font-bold text-neutral-900">{price}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Modalidad</dt>
                        <dd className="text-neutral-900">Pago único, sin suscripción</dd>
                      </div>
                    </dl>
                  )}
                </StateCard>
              )}

              {/* ───── Pago aprobado ───── */}
              {state === 'approved_no_qr' && (
                <StateCard
                  icon={CheckCircle2}
                  tone="emerald"
                  pulse
                  title="Pago aprobado"
                  actions={
                    <Button onClick={activateQr} disabled={acting} variant="primary" className="sm:px-8">
                      {acting && <Spinner />}
                      {acting ? 'Activando...' : 'Activar mi QR'}
                    </Button>
                  }
                >
                  El pago de {price} fue verificado. Ahora activa tu QR para generar tu identificador público y
                  descargarlo.
                </StateCard>
              )}

              {/* ───── QR activo ───── */}
              {state === 'active' && identifier && (
                <div className="grid items-start gap-6 lg:grid-cols-5">
                  <section className={`${panel} overflow-hidden lg:col-span-3`} aria-label="Tu código QR">
                    <div className="gradient-brand flex items-center justify-between gap-3 px-5 py-4 text-white sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                          <HeartPulse size={18} aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">Perfil de emergencia</p>
                          <p className="text-xs text-white/70">Escanea con la cámara del teléfono</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-300" aria-hidden="true" />
                          <span className="relative h-2 w-2 rounded-full bg-emerald-300" />
                        </span>
                        Activo
                      </span>
                    </div>

                    <div className="relative px-5 py-8 sm:px-8 sm:py-10">
                      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0" />
                      <div className="relative mx-auto w-fit">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.94 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
                          className="relative rounded-2xl bg-white p-5 shadow-glow ring-1 ring-border sm:p-6"
                        >
                          {/* Marco de escaneo */}
                          <span aria-hidden="true" className="absolute -left-2 -top-2 h-7 w-7 rounded-tl-xl border-l-[3px] border-t-[3px] border-brand-500" />
                          <span aria-hidden="true" className="absolute -right-2 -top-2 h-7 w-7 rounded-tr-xl border-r-[3px] border-t-[3px] border-brand-500" />
                          <span aria-hidden="true" className="absolute -bottom-2 -left-2 h-7 w-7 rounded-bl-xl border-b-[3px] border-l-[3px] border-brand-500" />
                          <span aria-hidden="true" className="absolute -bottom-2 -right-2 h-7 w-7 rounded-br-xl border-b-[3px] border-r-[3px] border-brand-500" />

                          {qrImage ? (
                            <img src={qrImage} alt="Código QR de emergencia" className="h-56 w-56 sm:h-64 sm:w-64" />
                          ) : (
                            <div className="flex h-56 w-56 items-center justify-center text-center text-sm text-text-secondary sm:h-64 sm:w-64">
                              Imagen no disponible
                            </div>
                          )}

                          {qrImage && !reduce && (
                            <motion.span
                              aria-hidden="true"
                              className="pointer-events-none absolute left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-transparent via-brand-500 to-transparent shadow-[0_0_12px_2px_rgba(159,18,57,0.45)]"
                              initial={{ top: '6%', opacity: 0 }}
                              animate={{ top: '94%', opacity: [0, 1, 1, 0] }}
                              transition={{
                                top: { duration: 2.2, ease: 'easeInOut', repeat: 1, repeatDelay: 0.3, delay: 0.7 },
                                opacity: { duration: 2.2, times: [0, 0.1, 0.9, 1], repeat: 1, repeatDelay: 0.3, delay: 0.7 },
                              }}
                            />
                          )}
                        </motion.div>
                      </div>

                      <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
                        <Button onClick={downloadQr} disabled={!qrImage} variant="primary">
                          <Download size={16} /> Descargar QR
                        </Button>
                        <Button variant="secondary" onClick={copyLink}>
                          {copied ? <Check size={16} /> : <LinkIcon size={16} />}
                          {copied ? 'Copiado' : 'Copiar enlace'}
                        </Button>
                        <a
                          href={qrUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline px-5 py-2.5 text-sm"
                        >
                          <ExternalLink size={16} aria-hidden="true" /> Abrir página
                        </a>
                      </div>

                      <p className="relative mt-6 text-center text-xs leading-relaxed text-text-secondary">
                        Escanear este QR abre tu página pública de emergencia. El código solo contiene el enlace,
                        nunca tus datos personales.
                      </p>
                    </div>
                  </section>

                  <div className="space-y-6 lg:col-span-2">
                    <aside className={`${panel} p-5 sm:p-6`}>
                      <h2 className="mb-4 text-base font-semibold text-neutral-900">Estado del QR</h2>
                      <div className="mb-5 flex items-center gap-2.5 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
                        <CheckCircle2 size={16} className="flex-none" aria-hidden="true" />
                        Activo y verificable públicamente
                      </div>
                      <dl className="mb-6 space-y-4">
                        <CopyRow label="Identificador" value={identifier.value} />
                        <CopyRow label="Enlace público" value={qrUrl} />
                        <div>
                          <dt className="text-xs font-semibold text-text-secondary">Tipo de pago</dt>
                          <dd className="mt-1 text-sm text-neutral-900">Pago único, sin suscripción</dd>
                        </div>
                      </dl>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => toast.info('Desactivación: disponible desde el panel de privacidad')}
                      >
                        <Lock size={16} /> Desactivar QR
                      </Button>
                    </aside>

                    <aside className={`${panel} p-5 sm:p-6`} aria-labelledby="tips-title">
                      <h2 id="tips-title" className="mb-4 text-base font-semibold text-neutral-900">Antes de salir</h2>
                      <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                            <Sticker size={16} aria-hidden="true" />
                          </span>
                          <p className="text-sm leading-relaxed text-text-secondary">
                            <span className="font-semibold text-neutral-900">Ponlo a la vista.</span> En el casco, la
                            moto o la mochila, donde se vea rápido.
                          </p>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                            <FlaskConical size={16} aria-hidden="true" />
                          </span>
                          <p className="text-sm leading-relaxed text-text-secondary">
                            <span className="font-semibold text-neutral-900">Pruébalo tú.</span> Escanéalo con tu
                            teléfono y revisa lo que se muestra.
                          </p>
                        </li>
                      </ul>
                      <Link
                        to={routes.dashboardPrivacy}
                        className="group mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-600"
                      >
                        Elegir qué se muestra
                        <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </Link>
                    </aside>
                  </div>
                </div>
              )}

              {/* ───── Pago rechazado ───── */}
              {state === 'rejected' && (
                <StateCard
                  icon={AlertTriangle}
                  tone="rose"
                  title="Pago no completado"
                  actions={
                    <>
                      {order ? (
                        <Button onClick={retryPayment} disabled={acting} variant="primary">
                          {acting && <Spinner />}
                          {acting ? 'Procesando...' : 'Intentar nuevamente'}
                        </Button>
                      ) : (
                        <Button onClick={() => createOrderAndPay(true)} disabled={acting} variant="primary">
                          {acting && <Spinner />}
                          {acting ? 'Creando y pagando...' : 'Crear nuevo pedido'}
                        </Button>
                      )}
                      <WhatsAppButton message={waPay} />
                    </>
                  }
                >
                  <p>
                    El pago de tu pedido no fue aprobado (rechazado o cancelado). Tu QR no está activo y no se
                    expone información pública. Puedes crear un nuevo pedido o intentar nuevamente.
                  </p>
                </StateCard>
              )}

              {/* ───── Desactivado ───── */}
              {state === 'deactivated' && (
                <div className={`${panel} p-6 lg:p-8`}>
                  <EmptyState
                    icon={AlertCircle}
                    title="QR desactivado"
                    text="Este identificador ya no está activo. Su enlace público no muestra información personal."
                  />
                  <div className="mt-6 flex justify-center">
                    <a
                      href={waLink(waHelp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline px-5 py-2.5 text-sm"
                    >
                      <MessageCircle size={16} aria-hidden="true" /> Hablar con soporte
                    </a>
                  </div>
                </div>
              )}

              {/* ───── Error ───── */}
              {state === 'error' && (
                <div className={`${panel} p-6 lg:p-8`}>
                  <EmptyState
                    icon={AlertCircle}
                    title="No se pudo cargar el estado del QR"
                    text="Intenta nuevamente en unos momentos."
                  />
                  <div className="mt-6 flex justify-center">
                    <Button onClick={() => window.location.reload()} variant="outline">
                      <RotateCcw size={16} /> Recargar
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </MotionConfig>
  );
};

export default QrPage;