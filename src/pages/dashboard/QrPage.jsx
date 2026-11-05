import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import { PageTitle, PageLoader, EmptyState } from '../../components/DashPage';
import {
  Download, Link as LinkIcon, Check, Clock, AlertTriangle, AlertCircle, CheckCircle2,
  RotateCcw, CreditCard, Lock,
} from 'lucide-react';
import { Badge, StepIndicator } from '../../components/ui-kit';

const QR_PRICE_COP = 30000;

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

const STEP_LABELS = ['Pago', 'Activación', 'QR listo'];
const STEP_INDEX = {
  no_order: 0,
  unpaid: 0,
  under_review: 0,
  rejected: 0,
  approved_no_qr: 1,
  active: 2,
};

const Stepper = ({ current }) => (
  <ol className="mb-6 flex items-center" aria-label="Progreso de activación">
    {STEP_LABELS.map((label, i) => {
      const done = i < current || current === 2;
      const active = i === current && current !== 2;
      return (
        <li key={label} className={`flex items-center ${i < STEP_LABELS.length - 1 ? 'flex-1' : ''}`}>
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-bold ring-1 ${
                done
                  ? 'bg-brand-500 text-white ring-brand-500'
                  : active
                    ? 'bg-brand-500/10 text-brand-500 ring-brand-500/40'
                    : 'bg-white text-text-secondary ring-border'
              }`}
            >
              {done ? <Check size={15} aria-hidden="true" /> : i + 1}
            </span>
            <span className={`hidden text-sm font-medium sm:inline ${done || active ? 'text-neutral-900' : 'text-text-secondary'}`}>
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <span className={`mx-3 h-px flex-1 ${i < current ? 'bg-brand-500' : 'bg-border'}`} aria-hidden="true" />
          )}
        </li>
      );
    })}
  </ol>
);

const TONES = {
  amber: 'bg-amber-50 text-amber-600 ring-amber-600/15',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-600/15',
  rose: 'bg-rose-50 text-rose-600 ring-rose-600/15',
};

const StateCard = ({ icon: Icon, tone = 'amber', title, children, actions }) => (
  <section className={`${panel} p-5 sm:p-6 lg:p-8`}>
    <div className="flex items-start gap-4">
      <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl ring-1 ${TONES[tone]}`}>
        <Icon size={24} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        <div className="mt-1 text-sm leading-relaxed text-text-secondary">{children}</div>
      </div>
    </div>
    {actions && <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>}
  </section>
);

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
        const objectUrl = window.URL.createObjectURL(qr.data);
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

  return (
    <div className="space-y-6">
      <PageTitle
        title="Mi código QR de emergencia"
        description="El QR funcional y tu página pública de emergencia quedan habilitados tras el pago único de $30.000 COP."
      />

      {stepCurrent !== undefined && <Stepper current={stepCurrent} />}

      {state === 'no_order' && (
        <section className={`${panel} p-5 sm:p-6 lg:p-8`}>
          <div className="flex items-start gap-4">
            <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl ring-1 ${TONES.amber}`}>
              <AlertCircle size={24} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Tu QR de emergencia todavía no está activado</h2>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                Completa tu perfil, revisa qué información compartirás y realiza el pago único de{' '}
                <span className="font-bold text-neutral-900">{price}</span> para habilitar tu QR.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-brand-50/60 p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
                Qué estás adquiriendo
              </h3>
              <p className="text-right">
                <span className="text-2xl font-extrabold tracking-tight text-brand-500">{price}</span>
                <span className="block text-[11px] text-text-secondary">pago único</span>
              </p>
            </div>
            <ul className="space-y-2.5 text-sm text-text-secondary">
              {[
                'Activación digital de tu código QR de emergencia (página pública autorizada).',
                <>Pago único de <span className="font-bold text-neutral-900">{price}</span>. Sin suscripción mensual ni anual.</>,
                'Sin cobros automáticos de renovación.',
                'El QR contiene solo el enlace con tu identificador, nunca tus datos personales ni médicos.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                    <Check size={12} aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-text-secondary">
              El sticker físico es un producto adicional con costo y envío separados; no está incluido en esta
              activación digital.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() => createOrderAndPay(true)}
              disabled={acting}
              variant="primary"
              className="w-full sm:w-auto sm:px-8"
            >
              <CreditCard size={16} />
              {acting ? 'Pagar con Mercado Pago...' : `Pagar con Mercado Pago (${price})`}
            </Button>
            <a
              href="https://wa.me/573212209943?text=Hola%2C%20quiero%20activar%20mi%20QR%20de%20emergencia%20por%20WhatsApp."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 sm:w-auto"
            >
              Pagar por WhatsApp
            </a>
          </div>
        </section>
      )}

      {(state === 'unpaid' || state === 'under_review') && (
        <StateCard
          icon={Clock}
          tone="amber"
          title={state === 'under_review' ? 'Pago en revisión' : 'Pago pendiente'}
          actions={
            <>
              {order ? (
                <Button onClick={retryPayment} disabled={acting} variant="primary">
                  {acting ? 'Procesando...' : 'Ir al pago'}
                </Button>
              ) : (
                <Button onClick={() => createOrderAndPay(true)} disabled={acting} variant="primary">
                  {acting ? 'Creando y pagando...' : 'Crear pedido y pagar'}
                </Button>
              )}
              <a
                href="https://wa.me/573212209943?text=Hola%2C%20quiero%20pagar%20mi%20pedido%20de%20activaci%C3%B3n%20de%20QR%20por%20WhatsApp."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                Pagar por WhatsApp
              </a>
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
            <dl className="mt-4 space-y-2 rounded-xl border border-border bg-brand-50/60 p-4 text-xs">
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

      {state === 'approved_no_qr' && (
        <StateCard
          icon={CheckCircle2}
          tone="emerald"
          title="Pago aprobado"
          actions={
            <Button onClick={activateQr} disabled={acting} variant="primary" className="sm:px-8">
              {acting ? 'Activando...' : 'Activar mi QR'}
            </Button>
          }
        >
          El pago de {price} fue verificado. Ahora activa tu QR para generar tu identificador público y
          descargarlo.
        </StateCard>
      )}

      {state === 'active' && identifier && (
        <div className="grid gap-6 lg:grid-cols-5">
          <section className={`${panel} p-5 sm:p-6 lg:col-span-3 lg:p-8`}>
            <div className="mb-6 flex justify-center">
              <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_20px_50px_-20px_rgba(159,18,57,0.35)] sm:p-5">
                {qrImage ? (
                  <img src={qrImage} alt="Código QR de emergencia" className="h-56 w-56 sm:h-64 sm:w-64" />
                ) : (
                  <div className="flex h-56 w-56 items-center justify-center text-center text-sm text-slate-500 sm:h-64 sm:w-64">
                    Imagen no disponible
                  </div>
                )}
              </div>
            </div>
            <div className="mb-4 flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={downloadQr} disabled={!qrImage} variant="primary">
                <Download size={16} /> Descargar QR
              </Button>
              <Button variant="secondary" onClick={copyLink}>
                {copied ? <Check size={16} /> : <LinkIcon size={16} />}
                {copied ? 'Copiado' : 'Copiar enlace'}
              </Button>
            </div>
            <p className="break-all rounded-lg bg-brand-50/70 px-3 py-2 text-center font-mono text-xs text-text-secondary">
              {qrUrl}
            </p>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-text-secondary">
              Escanear este QR abre tu página pública de emergencia. El código solo contiene el enlace, nunca
              tus datos personales.
            </p>
          </section>

          <aside className={`${panel} h-fit p-5 sm:p-6 lg:col-span-2`}>
            <h2 className="mb-4 text-base font-semibold text-neutral-900">Estado del QR</h2>
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 size={16} className="flex-none" aria-hidden="true" />
              Activo y verificable públicamente
            </div>
            <dl className="mb-6 space-y-3 text-sm">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Identificador</dt>
                <dd className="mt-0.5 break-all font-mono text-xs text-neutral-900">{identifier.value}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Enlace público</dt>
                <dd className="mt-0.5 break-all font-mono text-xs text-neutral-900">{qrUrl}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Tipo de pago</dt>
                <dd className="mt-0.5 text-neutral-900">Pago único, sin suscripción</dd>
              </div>
            </dl>
            <Button variant="outline" className="w-full" onClick={() => toast.info('Desactivación: disponible desde el panel de privacidad')}>
              <Lock size={16} /> Desactivar QR
            </Button>
          </aside>
        </div>
      )}

      {state === 'rejected' && (
        <StateCard
          icon={AlertTriangle}
          tone="rose"
          title="Pago no completado"
          actions={
            <>
              {order ? (
                <Button onClick={retryPayment} disabled={acting} variant="primary">
                  {acting ? 'Procesando...' : 'Intentar nuevamente'}
                </Button>
              ) : (
                <Button onClick={() => createOrderAndPay(true)} disabled={acting} variant="primary">
                  {acting ? 'Creando y pagando...' : 'Crear nuevo pedido'}
                </Button>
              )}
              <a
                href="https://wa.me/573212209943?text=Hola%2C%20quiero%20pagar%20mi%20pedido%20de%20activaci%C3%B3n%20de%20QR%20por%20WhatsApp."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                Pagar por WhatsApp
              </a>
            </>
          }
        >
          <p>
            El pago de tu pedido no fue aprobado (rechazado o cancelado). Tu QR no está activo y no se
            expone información pública. Puedes crear un nuevo pedido o intentar nuevamente.
          </p>
        </StateCard>
      )}

      {state === 'deactivated' && (
        <div className={`${panel} p-6 lg:p-8`}>
          <EmptyState
            icon={AlertCircle}
            title="QR desactivado"
            text="Este identificador ya no está activo. Su enlace público no muestra información personal."
          />
        </div>
      )}

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
    </div>
  );
};

export default QrPage;


