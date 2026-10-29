import { useEffect, useState, useCallback } from 'react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/admin/users', { params: { q, role, page, limit: 20 } });
      setUsers(data.users || []);
      setPagination(data.pagination);
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al cargar usuarios');
    } finally { setLoading(false); }
  }, [q, role]);

  useEffect(() => {
    setTimeout(() => load(1), 0);
  }, [load]);

  const changeRole = async (id, newRole) => {
    if (!confirm(`¿Cambiar rol a ${newRole}?`)) return;
    try {
      await api.patch(`/admin/users/${id}/role`, { role: newRole });
      load(pagination?.page || 1);
    } catch (e) {
      alert(e?.response?.data?.error || 'Error');
    }
  };

  return (
    <div>
      <PageTitle title="Gestión de usuarios" description="Administra cuentas y roles." />
      <div className="flex gap-2 mb-4">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por email o id" className="input" />
        <select value={role} onChange={e=>setRole(e.target.value)} className="input">
          <option value="">Todos</option>
          <option value="user">Usuario</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={()=>load(1)} className="btn">Buscar</button>
        <button onClick={()=>{ setQ(''); setRole(''); load(1); }} className="btn">Limpiar</button>
      </div>
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {!loading && !error && (
        <>
          <table className="w-full text-sm">
            <thead><tr><th>Email</th><th>Rol</th><th>Registrado</th><th>Acciones</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-brand-border">
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    {u.role === 'user' ? (
                      <button onClick={()=>changeRole(u.id,'admin')} className="text-cyan-400">Hacer admin</button>
                    ) : (
                      <button onClick={()=>changeRole(u.id,'user')} className="text-amber-400">Quitar admin</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && <div className="mt-2 text-xs text-brand-textMuted">Total: {pagination.total} · Página {pagination.page}/{pagination.pages}</div>}
        </>
      )}
    </div>
  );
};
export default AdminUsers;
