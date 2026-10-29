import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import { PageTitle, PageLoader, EmptyState } from '../../components/DashPage';
import {
  Download,
  Link as LinkIcon,
  QrCode,
  Check,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  CreditCard,
  Lock,
} from 'lucide-react';

const QR_PRICE_COP = 30000;

const getQrProduct = (products) =>
  (products || []).find((p) => p.slug === 'qr-digital-basico') || null;

const commercialLabels = {
  pending_confirmation: 'Pendiente de confirmación',
  pending_payment: 'Pendiente de pago',
  paid: 'Pagado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
};
const paymentLabels = {
  unpaid: 'No pagado',
  pending: 'Pendiente',
  in_process: 'En proceso',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
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

export const QrPage = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });

  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  // Datos de activación
  const [identifier, setIdentifier] = useState(null);
  const [order, setOrder] = useState(null);
  const [qrProduct, setQrProduct] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Estado derivado de la activación
  // 'loading' | 'no_order' | 'unpaid' | 'under_review' | 'approved_no_qr' | 'active' | 'rejected' | 'deactivated' | 'error'
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

  useEffect(() => {
    let mounted = true;
    let objectUrl = null;
    (async () => {
      try {
        // 1. ¿Ya hay un identificador activo?
        try {
          const res = await api.get('/identifiers/my');
          if (!mounted) return;
          const data = res.data.identifier || res.data;
          setIdentifier(data);
          const code = data.value;
          setQrUrl(`${window.location.origin}/e/${encodeURIComponent(code)}`);
          try {
            const qr = await api.get('/identifiers/my/qr', { responseType: 'blob' });
            if (!mounted) return;
            objectUrl = window.URL.createObjectURL(qr.data);
            setQrImage(objectUrl);
          } catch {
            if (mounted) toastRef.current.error('No se pudo cargar la imagen del QR');
          }
          setState(deriveState(data, null));
          setLoading(false);
          return;
        } catch (err) {
          if (!(err.response && err.response.status === 404)) throw err;
        }

        // 2. Sin identificador: revisar órdenes de activación de QR
        const res = await api.get('/orders');
        if (!mounted) return;
        const orders = res.data.orders || res.data || [];
        const qrOrder = orders.find((o) => o.product_slug === 'qr-digital-basico');
        setOrder(qrOrder || null);
        setState(deriveState(null, qrOrder));
      } catch (error) {
        if (!mounted) return;
        toastRef.current.error('No se pudo cargar el estado de tu QR');
        setState('error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [deriveState, toast]);

  useEffect(() => {
    if (!qrProduct) {
      api
        .get('/products')
        .then((res) => setQrProduct(getQrProduct(res.data.products || res.data || [])))
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

      // Crear preferencia de pago y redirigir a Mercado Pago
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
      setActing(false);
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
    } catch (err) {
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

  const formatMoney = (amount) => formatAmount(amount);

  if (loading) return <PageLoader />;

  const isActing = acting;

  return (
    <div>
      <PageTitle
        title="Mi código QR de emergencia"
        description="El QR funcional y tu página pública de emergencia quedan habilitados tras el pago único de $30.000 COP."
      />

      {/* --- Sin compra: estado pendiente --- */}
      {state === 'no_order' && (
        <div className="card-static p-6 lg:p-8 mb-8 border-rose-500/20">
          <div className="flex items-start gap-4 mb-6">
            <AlertCircle className="w-8 h-8 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-brand-text text-lg">Tu QR de emergencia todavía no está activado</h2>
              <p className="text-brand-textMuted text-sm leading-relaxed mt-1">
                Completa tu perfil, revisa qué información compartirás y realiza el pago único de{' '}
                <span className="font-bold text-brand-text">{formatMoney(QR_PRICE_COP)}</span> para habilitar tu QR.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-brand-border bg-brand-dark/60 p-5 mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-textMuted mb-3">
              Qué estás adquiriendo
            </h3>
            <ul className="space-y-2 text-sm text-brand-textMuted">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-brand-accent flex-shrink-0" aria-hidden="true" />
                <span>Activación digital de tu código QR de emergencia (página pública autorizada).</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-brand-accent flex-shrink-0" aria-hidden="true" />
                <span>Pago único de <span className="font-bold text-brand-text">{formatMoney(QR_PRICE_COP)}</span>. Sin suscripción mensual ni anual.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-brand-accent flex-shrink-0" aria-hidden="true" />
                <span>Sin cobros automáticos de renovación.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-brand-accent flex-shrink-0" aria-hidden="true" />
                <span>El QR contiene solo el enlace con tu identificador, nunca tus datos personales ni médicos.</span>
              </li>
            </ul>
            <p className="text-[11px] text-brand-textMuted mt-3 leading-relaxed">
              El sticker físico es un producto adicional con costo y envío separados; no está incluido en esta
              activación digital.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={createOrderAndPay}
              disabled={isActing}
              variant="primary"
              className="lg:px-8"
            >
              <CreditCard className="w-4 h-4" />{' '}
              {isActing ? 'Creando pedido...' : `Activar mi QR por ${formatMoney(QR_PRICE_COP)}`}
            </Button>
          </div>
        </div>
      )}

      {/* --- Pago pendiente / en revisión --- */}
      {(state === 'unpaid' || state === 'under_review') && (
        <div className="card-static p-6 lg:p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <Clock className="w-8 h-8 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-brand-text text-lg">
                {state === 'under_review' ? 'Pago en revisión' : 'Pago pendiente'}
              </h2>
              <p className="text-brand-textMuted text-sm leading-relaxed mt-1">
                {state === 'under_review'
                  ? 'Tu pago está siendo procesado por Mercado Pago. Una vez aprobado, podrás activar tu QR.'
                  : 'Tienes un pedido pendiente por ' + formatMoney(QR_PRICE_COP) + '. Completa el pago para activar tu QR.'}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-brand-border bg-brand-dark/60 p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="w-4 h-4 text-brand-accent" aria-hidden="true" />
              <span className="text-sm text-brand-text">Pedido {order?.order_number}</span>
            </div>
            <div className="text-xs text-brand-textMuted space-y-1">
              <div>Producto: Activación de QR digital</div>
              <div>Importe: <span className="font-bold text-brand-text">{formatMoney(QR_PRICE_COP)}</span></div>
              <div>Pago único, sin suscripción.</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={retryPayment} disabled={isActing} variant="primary">
              {isActing ? 'Procesando...' : 'Ir al pago'}
            </Button>
          </div>
        </div>
      )}

      {/* --- Pago aprobado, QR por activar --- */}
      {state === 'approved_no_qr' && (
        <div className="card-static p-6 lg:p-8 mb-8 border-emerald-500/20">
          <div className="flex items-start gap-4 mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-brand-text text-lg">Pago aprobado</h2>
              <p className="text-brand-textMuted text-sm leading-relaxed mt-1">
                El pago de {formatMoney(QR_PRICE_COP)} fue verificado. Ahora activa tu QR para generar tu
                identificador público y descargarlo.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={activateQr} disabled={isActing} variant="primary" className="lg:px-8">
              {isActing ? 'Activando...' : 'Activar mi QR'}
            </Button>
          </div>
        </div>
      )}

      {/* --- QR activo --- */}
      {state === 'active' && identifier && (
        <div className="grid lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-3 card-static p-6 lg:p-8">
            <div className="flex justify-center mb-6">
              <div className="rounded-2xl bg-white p-5 shadow-glow">
                {qrImage ? (
                  <img src={qrImage} alt="Código QR de emergencia" className="w-56 h-56 sm:w-64 sm:h-64" />
                ) : (
                  <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center text-sm text-slate-500 text-center">
                    Imagen no disponible
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <Button onClick={downloadQr} disabled={!qrImage} variant="primary">
                <Download className="w-4 h-4" /> Descargar QR
              </Button>
              <Button variant="secondary" onClick={copyLink}>
                {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar enlace'}
              </Button>
            </div>
            <p className="mt-4 text-center text-xs text-brand-textMuted break-all">{qrUrl}</p>
            <p className="mt-2 text-center text-[11px] text-brand-textMuted">
              Escanear este QR abre tu página pública de emergencia. El código solo contiene el enlace, nunca
              tus datos personales.
            </p>
          </div>

          <aside className="lg:col-span-2 card-static p-6 h-fit">
            <h2 className="font-semibold text-brand-text mb-4">Estado del QR</h2>
            <div className="flex items-center gap-2 mb-5">
              <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span className="text-emerald-300 text-sm font-medium">Activo y verificable públicamente</span>
            </div>
            <div className="space-y-3 text-sm text-brand-textMuted mb-6">
              <div className="flex justify-between">
                <span>Identificador</span>
                <span className="font-mono text-brand-text truncate max-w-xs">{identifier.value}</span>
              </div>
              <div className="flex justify-between">
                <span>Enlace público</span>
                <span className="font-mono text-brand-text truncate max-w-xs">{qrUrl}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipo de pago</span>
                <span>Pago único, sin suscripción</span>
              </div>
            </div>
            <Button variant="outline" onClick={() => toast.info('Desactivación: disponible desde el panel de privacidad')}>
              <Lock className="w-4 h-4" /> Desactivar QR
            </Button>
          </aside>
        </div>
      )}

      {/* --- Rechazado / cancelado --- */}
      {state === 'rejected' && (
        <div className="card-static p-6 lg:p-8 mb-8 border-rose-500/20">
          <div className="flex items-start gap-4 mb-6">
            <AlertTriangle className="w-8 h-8 text-rose-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-brand-text text-lg">Pago no completado</h2>
              <p className="text-brand-textMuted text-sm leading-relaxed mt-1">
                El pago de tu pedido no fue aprobado (rechazado o cancelado). Tu QR no está activo y no se
                expone información pública. Puedes intentar nuevamente.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={retryPayment} disabled={isActing} variant="primary">
              {isActing ? 'Procesando...' : 'Intentar nuevamente'}
            </Button>
          </div>
        </div>
      )}

      {/* --- Desactivado --- */}
      {state === 'deactivated' && (
        <div className="card-static p-6 lg:p-8 mb-8 border-rose-500/20">
          <EmptyState
            icon={AlertCircle}
            title="QR desactivado"
            text="Este identificador ya no está activo. Su enlace público no muestra información personal."
          />
        </div>
      )}

      {/* --- Error --- */}
      {state === 'error' && (
        <div className="card-static p-6 lg:p-8 mb-8">
          <EmptyState
            icon={AlertCircle}
            title="No se pudo cargar el estado del QR"
            text="Intenta nuevamente en unos momentos."
          />
          <div className="mt-6">
            <Button onClick={() => window.location.reload()} variant="outline">
              <RotateCcw className="w-4 h-4" /> Recargar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QrPage;
