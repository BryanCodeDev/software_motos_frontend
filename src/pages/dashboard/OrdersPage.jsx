import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { routes } from '../../utils/routes';
import { useToast } from '../../components/useToast';
import { PageTitle, PageLoader, EmptyState } from '../../components/DashPage';
import { Package } from 'lucide-react';

const commercialLabels = {
  draft: 'Borrador',
  pending_confirmation: 'Pendiente de confirmación',
  pending_payment: 'Pendiente de pago',
  paid: 'Pagado',
  preparing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refund_requested: 'Reembolso solicitado',
  refunded: 'Reembolsado',
};

const commercialTone = {
  paid: 'ok',
  preparing: 'info',
  shipped: 'info',
  delivered: 'ok',
  cancelled: 'bad',
  refunded: 'neutral',
  refund_requested: 'warn',
  pending_payment: 'warn',
  pending_confirmation: 'warn',
  draft: 'neutral',
};

const paymentLabels = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  in_process: 'En proceso',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

const paymentTone = {
  approved: 'ok',
  pending: 'warn',
  in_process: 'warn',
  rejected: 'bad',
  cancelled: 'bad',
  refunded: 'neutral',
};

const tones = {
  ok: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  info: 'bg-brand-accent/10 text-brand-accent border-brand-accent/30',
  warn: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  bad: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  neutral: 'bg-black/5 text-brand-textMuted border-brand-border',
};

const Badge = ({ tone = 'neutral', children }) => (
  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${tones[tone]}`}>
    {children}
  </span>
);

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

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-CO');
};

export const OrdersPage = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/orders');
        if (!mounted) return;
        setOrders(res.data.orders || res.data || []);
      } catch (error) {
        if (!mounted) return;
        if (!(error.response && error.response.status === 404)) {
          toast.error('No se pudieron cargar los pedidos');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [toast]);

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageTitle
        title="Tus pedidos"
        description="Consulta el estado de tus solicitudes de sticker y productos."
      />

      <div className="card-static p-6 lg:p-8">
        {orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No tienes pedidos registrados"
            text="Cuando solicites un sticker QR personalizado, podrás seguir su estado desde aquí."
          >
            <Link to={routes.products} className="btn-outline">
              Ver productos
            </Link>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-brand-border text-xs uppercase tracking-wider text-brand-textMuted">
                  <th className="px-2 pb-3 font-semibold">Número</th>
                  <th className="px-2 pb-3 font-semibold">Producto</th>
                  <th className="px-2 pb-3 font-semibold">Estado</th>
                  <th className="px-2 pb-3 font-semibold">Pago</th>
                  <th className="px-2 pb-3 font-semibold">Total</th>
                  <th className="px-2 pb-3 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-brand-border/50 hover:bg-black/[0.03] transition-colors">
                    <td className="px-2 py-4 text-brand-text font-mono text-xs">{o.order_number}</td>
                    <td className="px-2 py-4 text-brand-textMuted">{o.product_name}</td>
                    <td className="px-2 py-4">
                      <Badge tone={commercialTone[o.commercial_status]}>
                        {commercialLabels[o.commercial_status] || o.commercial_status}
                      </Badge>
                    </td>
                    <td className="px-2 py-4">
                      <Badge tone={paymentTone[o.payment_status]}>
                        {paymentLabels[o.payment_status] || o.payment_status || '—'}
                      </Badge>
                    </td>
                    <td className="px-2 py-4 text-brand-text whitespace-nowrap">
                      {formatAmount(o.total_amount, o.currency)}
                    </td>
                    <td className="px-2 py-4 text-brand-textMuted whitespace-nowrap">{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;

