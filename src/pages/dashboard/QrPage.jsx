import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { routes } from '../../utils/routes';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import { PageTitle, PageLoader, EmptyState } from '../../components/DashPage';
import {
  Download, Link as LinkIcon, Check, Clock, AlertTriangle, AlertCircle, CheckCircle2,
  RotateCcw, CreditCard, Lock, ExternalLink, Loader2, MessageCircle, ScanLine,
  BadgeDollarSign, ShieldCheck, ArrowRight,
} from 'lucide-react';

/* ───────── Constantes ───────── */
const QR_PRICE_COP = 30000;
const WHATSAPP_NUMBER = '573212209943';

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

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

const STEPS = ['Pago', 'Activación', 'QR listo'];
const STEP_INDEX = {
  no_order: 0,
  unpaid: 0,
  under_review: 0,
  rejected: 0,
  approved_no_qr: 1,
};

const TONES = {
  amber: { icon: 'bg-amber-50 text-amber-600', bar: 'bg-amber-400' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' },
  rose: { icon: 'bg-rose-50 text-rose-600', bar: 'bg-rose-500' },
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

const Stepper = ({ current }) => (
  <ol className={`${panel} flex items-center gap-2 p-4 sm:px-6`} aria-label="Progreso de activación">
    {STEPS.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <li key={label} className={`flex items-center gap-2 ${i < STEPS.length - 1 ? 'flex-1' : ''}`} aria-current={active ? 'step' : undefined}>
          <span
            className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold ring-1 ${
              done
                ? 'bg-brand-500 text-white ring-brand-500'
                : active
                  ? 'bg-brand-500/10 text-brand-500 ring-2 ring-brand-500/50'
                  : 'bg-white text-text-secondary ring-border'
            }`}
          >
            {done ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : i + 1}
          </span>
          <span className={`hidden text-sm font-semibold sm:inline ${done || active ? 'text-neutral-900' : 'text-text-secondary'}`}>{label}</span>
          {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 rounded-full ${done ? 'bg-brand-500' : 'bg-border'}`} aria-hidden="true" />}
        </li>
      );
    })}
  </ol>
);

const StateCard = ({ icon: Icon, tone = 'amber', title, children, actions }) => (
  <section className={`${panel} overflow-hidden`}>
    <div className={`h-1 w-full ${TONES[tone].bar}`} aria-hidden="true" />
    <div className="p-5 sm:p-6 lg:p-8">
      <div className="flex items-start gap-4">
        <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl ${TONES[tone].icon}`}>
          <Icon size={24} aria-hidden="true" />
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

/* ───────── Página ───────── */
export const QrPage = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });

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
          setQrUrl(`${window.location.origin}/e/${encodeURIComponent(data.value)}`);
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
          setQrProduct(products.find((p) => p.slug === 'qr-digital-basico') || null);
        })
        .catch(() => setQrProduct(null));
    }
  }, [qrProduct]);

  const createOrderAndPay = async () => {
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

      const prefRes = await api.post('/payments/preference', { order_id: newOrder.id });
      window.location.href = prefRes.data.init_point;
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
      setQrUrl(`${window.location.origin}/e/${encodeURIComponent(data.value)}`);
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
      toast.success('QR activado');
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

  const payButton = (label, busyLabel) => (
    <Button onClick={order ? retryPayment : createOrderAndPay} disabled={acting} variant="primary">
      {acting && <Spinner />}
      {acting ? busyLabel : label}
    </Button>
  );

  return (
    <div className="animate-fade-in space-y-5 lg:space-y-6">
      <PageTitle
        title="Mi QR"
        description={state === 'active' ? 'Descárgalo y ponlo donde se vea rápido.' : `Se activa con un pago único de ${price}.`}
      />

      {stepCurrent !== undefined && <Stepper current={stepCurrent} />}

      {/* ───── Sin pedido: oferta de activación ───── */}
      {state === 'no_order' && (
        <section className={`${panel} overflow-hidden`}>
          <div className="grid lg:grid-cols-5">
            <div className="p-6 sm:p-8 lg:col-span-3">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Activa tu QR de emergencia</h2>
              <ul className="mt-6 space-y-5">
                {[
                  { icon: ScanLine, t: 'Sin cuenta ni app', d: 'Quien escanee ve lo que autorizaste.' },
                  { icon: BadgeDollarSign, t: 'Pago único', d: 'Sin renovaciones ni cobros automáticos.' },
                  { icon: ShieldCheck, t: 'Sin datos personales', d: 'El QR solo contiene un enlace con código aleatorio.' },
                ].map(({ icon: Icon, t, d }) => (
                  <li key={t} className="flex items-start gap-3.5">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                      <Icon size={17} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{t}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs leading-relaxed text-text-secondary">
                El sticker físico se pide aparte, con costo y envío propios.
              </p>
            </div>

            <div className="flex flex-col bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-6 text-white sm:p-8 lg:col-span-2">
              <p className="text-sm font-medium text-white/75">QR digital</p>
              <p className="mt-2 text-5xl font-extrabold tracking-tight">{price}</p>
              <div className="mt-8 space-y-3 lg:mt-auto">
                <button
                  type="button"
                  onClick={createOrderAndPay}
                  disabled={acting}
                  className="btn w-full bg-white px-5 py-3 text-sm text-brand-500 shadow-soft hover:-translate-y-0.5 hover:bg-brand-50"
                >
                  {acting ? <Spinner /> : <CreditCard size={16} aria-hidden="true" />}
                  {acting ? 'Redirigiendo...' : 'Pagar con Mercado Pago'}
                </button>
                <WhatsAppButton message={waActivate} onDark className="w-full py-3" />
                <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-white/65">
                  <Lock size={12} aria-hidden="true" /> Pago seguro con Mercado Pago
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ───── Pago pendiente o en revisión ───── */}
      {(state === 'unpaid' || state === 'under_review') && (
        <StateCard
          icon={Clock}
          tone="amber"
          title={state === 'under_review' ? 'Pago en revisión' : 'Pago pendiente'}
          actions={
            <>
              {state === 'unpaid' && payButton(order ? 'Ir al pago' : 'Crear pedido y pagar', 'Procesando...')}
              <WhatsAppButton message={waPay} />
            </>
          }
        >
          <p>
            {state === 'under_review'
              ? 'Mercado Pago está procesando tu pago. Cuando lo apruebe, podrás activar tu QR.'
              : order
                ? `Completa el pago de ${price} para activar tu QR.`
                : `Crea tu pedido de ${price} para continuar.`}
          </p>
          {order?.order_number && (
            <p className="mt-3 text-xs">
              Pedido <span className="font-mono font-semibold text-neutral-900">{order.order_number}</span>
            </p>
          )}
        </StateCard>
      )}

      {/* ───── Pago aprobado ───── */}
      {state === 'approved_no_qr' && (
        <StateCard
          icon={CheckCircle2}
          tone="emerald"
          title="Pago aprobado"
          actions={
            <Button onClick={activateQr} disabled={acting} variant="primary" className="sm:px-8">
              {acting && <Spinner />}
              {acting ? 'Activando...' : 'Activar mi QR'}
            </Button>
          }
        >
          Activa tu QR para generar el código y descargarlo.
        </StateCard>
      )}

      {/* ───── QR activo ───── */}
      {state === 'active' && identifier && (
        <section className={`${panel} mx-auto max-w-md overflow-hidden`} aria-label="Tu código QR">
          <div className="relative px-5 py-8 sm:px-8">
            <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0" />
            <div className="relative mx-auto w-fit rounded-2xl bg-white p-5 shadow-glow ring-1 ring-border sm:p-6">
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
            </div>
          </div>

          <div className="space-y-3 border-t border-border p-5 sm:p-6">
            <Button onClick={downloadQr} disabled={!qrImage} variant="primary" className="w-full">
              <Download size={16} /> Descargar QR
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={copyLink}>
                {copied ? <Check size={16} /> : <LinkIcon size={16} />}
                {copied ? 'Copiado' : 'Copiar enlace'}
              </Button>
              <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="btn-outline px-5 py-2.5 text-sm">
                <ExternalLink size={16} aria-hidden="true" /> Probar
              </a>
            </div>
            <Link
              to={routes.dashboardPrivacy}
              className="group flex items-center justify-center gap-2 pt-2 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-600"
            >
              Elegir qué se muestra
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      {/* ───── Pago rechazado ───── */}
      {state === 'rejected' && (
        <StateCard
          icon={AlertTriangle}
          tone="rose"
          title="Pago no completado"
          actions={
            <>
              {payButton(order ? 'Intentar de nuevo' : 'Crear nuevo pedido', 'Procesando...')}
              <WhatsAppButton message={waPay} />
            </>
          }
        >
          El pago no fue aprobado, así que tu QR sigue inactivo.
        </StateCard>
      )}

      {/* ───── Desactivado ───── */}
      {state === 'deactivated' && (
        <div className={`${panel} p-6 lg:p-8`}>
          <EmptyState
            icon={AlertCircle}
            title="QR desactivado"
            text="Este código ya no muestra información. Escríbenos si quieres reactivarlo."
          />
          <div className="mt-6 flex justify-center">
            <a href={waLink(waHelp)} target="_blank" rel="noopener noreferrer" className="btn-outline px-5 py-2.5 text-sm">
              <MessageCircle size={16} aria-hidden="true" /> Hablar con soporte
            </a>
          </div>
        </div>
      )}

      {/* ───── Error ───── */}
      {state === 'error' && (
        <div className={`${panel} p-6 lg:p-8`}>
          <EmptyState icon={AlertCircle} title="No se pudo cargar tu QR" text="Inténtalo de nuevo en unos momentos." />
          <div className="mt-6 flex justify-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              <RotateCcw size={16} /> Recargar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QrPage;