import { useEffect, useState } from 'react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';

export const AdminAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/admin/audit');
      setLogs(data.logs || []);
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al cargar auditoría');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    setTimeout(() => load(), 0);
  }, []);

  return (
    <div>
      <PageTitle title="Auditoría" description="Eventos administrativos registrados." />
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {!loading && !error && (
        <table className="w-full text-sm">
          <thead><tr><th>Fecha</th><th>Actor</th><th>Acción</th><th>Entidad</th><th>ID</th></tr></thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-t border-brand-border">
                <td>{new Date(l.created_at).toLocaleString()}</td>
                <td>{l.actor_email || '-'}</td>
                <td>{l.action}</td>
                <td>{l.entity_type}</td>
                <td>{l.entity_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
export default AdminAudit;
