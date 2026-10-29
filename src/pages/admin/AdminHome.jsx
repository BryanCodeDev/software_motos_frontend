import { useEffect, useState } from 'react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';

export const AdminHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data);
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al cargar estadísticas');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    setTimeout(() => load(), 0);
  }, []);

  if (loading) return <div className="text-brand-textMuted">Cargando...</div>;
  if (error) return <div className="text-red-400">{error} <button onClick={load} className="underline">Reintentar</button></div>;

  return (
    <div>
      <PageTitle title="Resumen administrativo" description="Métricas operativas en tiempo real." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-static p-4"><p className="text-xs text-brand-textMuted">Usuarios</p><p className="text-2xl font-bold">{stats?.users}</p></div>
        <div className="card-static p-4"><p className="text-xs text-brand-textMuted">Perfiles</p><p className="text-2xl font-bold">{stats?.profiles}</p></div>
        <div className="card-static p-4"><p className="text-xs text-brand-textMuted">Identificadores activos</p><p className="text-2xl font-bold">{stats?.identifiers?.active}</p></div>
        <div className="card-static p-4"><p className="text-xs text-brand-textMuted">Pedidos (7 días)</p><p className="text-2xl font-bold">{stats?.orders?.recent}</p></div>
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-static p-4"><p className="text-xs text-brand-textMuted">Pedidos pendientes</p><p className="text-xl font-bold">{stats?.orders?.pending}</p></div>
        <div className="card-static p-4"><p className="text-xs text-brand-textMuted">Pagados</p><p className="text-xl font-bold">{stats?.orders?.paid}</p></div>
        <div className="card-static p-4"><p className="text-xs text-brand-textMuted">En entrega</p><p className="text-xl font-bold">{stats?.orders?.delivering}</p></div>
      </div>
    </div>
  );
};

export default AdminHome;
