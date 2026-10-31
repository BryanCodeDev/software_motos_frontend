import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { routes } from '../../utils/routes';
import { useToast } from '../../components/useToast';
import { PageTitle, PageLoader, EmptyState } from '../../components/DashPage';
import { Package } from 'lucide-react';
import { Badge } from '../../components/ui-kit';

const panel = 'rounded-2xl border border-brand-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

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

const paymentLabels = {
  unpaid: 'Sin pagar',
  approved: 'Aprobado',
  pending: 'Pendiente',
  in_process: 'En proceso',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

const paymentTone = {
  unpaid: 'neutral',
  approved: 'success',
  pending: 'warn',
  in_process: 'warn',
  rejected: 'danger',
  cancelled: 'danger',
  refunded: 'neutral',
};

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
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const OrdersPage = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data.orders || res.data || []);
    } catch (error) {
      if (!(error.response && error.response.status === 404)) {
        toast.error('No se pudieron cargar los pedidos');
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Tus pedidos"
        description="Consulta el estado de tus solicitudes de sticker y productos."
      />

      {orders.length === 0 ? (
        <div className={`${panel} p-6 lg:p-8`}>
          <EmptyState
            icon={Package}
            title="No tienes pedidos registrados"
            text="Cuando solicites un sticker QR personalizado, podrás seguir su estado desde aquí."
          >
            <Link to={routes.products} className="btn-outline">
              Ver productos
            </Link>
          </EmptyState>
        </div>
      ) : (
        <>
          <p className="text-xs text-brand-textMuted">
            {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
          </p>

          {/* Escritorio */}
          <div className={`${panel} hidden overflow-hidden md:block`}>
            <div className="custom-scrollbar overflow-x-auto">
              <table className="table w-full text-left text-sm">
                <thead className="bg-brand-dark/70 text-[10px] font-semibold uppercase tracking-wider text-brand-textMuted">
                  <tr>
                    <th scope="col" className="px-5 py-3">Número</th>
                    <th scope="col" className="px-5 py-3">Producto</th>
                    <th scope="col" className="px-5 py-3">Estado</th>
                    <th scope="col" className="px-5 py-3">Pago</th>
                    <th scope="col" className="px-5 py-3 text-right">Total</th>
                    <th scope="col" className="px-5 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="transition-colors hover:bg-brand-dark/60">
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-brand-text">{o.order_number}</td>
                      <td className="px-5 py-4 text-brand-text">{o.product_name}</td>
                      <td className="px-5 py-4">
                        <Badge tone={commercialTone[o.commercial_status]}>
                          {commercialLabels[o.commercial_status] || o.commercial_status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={paymentTone[o.payment_status]}>
                          {paymentLabels[o.payment_status] || o.payment_status || '—'}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-brand-text">
                        {formatAmount(o.total_amount, o.currency)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-brand-textMuted">{formatDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Móvil */}
          <ul className="space-y-3 md:hidden">
            {orders.map((o) => (
              <li key={o.id} className={`${panel} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-brand-text">{o.order_number}</p>
                    <p className="mt-1 text-sm font-semibold text-brand-text">{o.product_name}</p>
                    <p className="mt-0.5 text-xs text-brand-textMuted">{formatDate(o.created_at)}</p>
                  </div>
                  <p className="whitespace-nowrap text-sm font-bold text-brand-text">
                    {formatAmount(o.total_amount, o.currency)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-brand-border pt-3">
                  <Badge tone={commercialTone[o.commercial_status]}>
                    {commercialLabels[o.commercial_status] || o.commercial_status}
                  </Badge>
                  <Badge tone={paymentTone[o.payment_status]}>
                    Pago: {paymentLabels[o.payment_status] || o.payment_status || '—'}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default OrdersPage;
