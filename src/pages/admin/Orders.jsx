import { useEffect, useState } from 'react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';

const STATUS_OPTIONS = ['pending_confirmation','pending_payment','paid','preparing','shipped','delivered','cancelled'];

export const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/admin/orders');
      setOrders(data.orders || []);
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al cargar pedidos');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    setTimeout(() => load(), 0);
  }, []);

  const updateStatus = async (id, commercial_status) => {
    if (!confirm(`¿Cambiar estado a ${commercial_status}?`)) return;
    try {
      await api.patch(`/admin/orders/${id}`, { commercial_status });
      load();
    } catch (e) {
      alert(e?.response?.data?.error || 'Error');
    }
  };

  return (
    <div>
      <PageTitle title="Pedidos" description="Gestiona pedidos comerciales." />
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {!loading && !error && (
        <table className="w-full text-sm">
          <thead><tr><th>Número</th><th>Cliente</th><th>Producto</th><th>Total</th><th>Comercial</th><th>Pago</th><th>Acción</th></tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-t border-brand-border">
                <td>{o.order_number}</td>
                <td>{o.customer_email}</td>
                <td>{o.product_name}</td>
                <td>{o.total_amount} {o.currency}</td>
                <td>{o.commercial_status}</td>
                <td>{o.payment_status}</td>
                <td>
                  <select onChange={e=>{ if(e.target.value) updateStatus(o.id, e.target.value); e.target.value=''; }} defaultValue="" className="input text-xs">
                    <option value="">Cambiar...</option>
                    {STATUS_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
export default AdminOrders;
