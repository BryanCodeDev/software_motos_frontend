import { useCallback, useEffect, useState } from 'react';
import {
  Search, X, ShieldCheck, ShieldOff, ChevronLeft, ChevronRight, BadgeCheck, AlertTriangle, Loader2,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/useToast';
import { Badge, ConfirmDialog } from '../../components/ui-kit';

const badge = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset';

const RoleBadge = ({ role }) => (
  <span
    className={`${badge} ${
      role === 'admin'
        ? 'bg-brand-accent/10 text-brand-accent ring-brand-accent/20'
        : 'bg-slate-100 text-slate-700 ring-slate-500/20'
    }`}
  >
    {role === 'admin' ? 'Administrador' : 'Usuario'}
  </span>
);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Avatar = ({ email }) => (
  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-accent/10 text-sm font-bold text-brand-accent">
    {(email || '?').charAt(0).toUpperCase()}
  </span>
);

export const AdminUsers = () => {
  const toast = useToast();
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [input, setInput] = useState('');
  const [filters, setFilters] = useState({ q: '', role: '' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirmRole, setConfirmRole] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/users', {
        params: { q: filters.q, role: filters.role, page, limit: 20 },
      });
      setUsers(data.users || []);
      setPagination(data.pagination);
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const submitSearch = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, q: input.trim() }));
    setPage(1);
  };

  const clearFilters = () => {
    setInput('');
    setFilters({ q: '', role: '' });
    setPage(1);
  };

  const changeRole = async (u, newRole) => {
    const msg = newRole === 'admin'
      ? `¿Dar permisos de administrador a ${u.email}?`
      : `¿Quitar permisos de administrador a ${u.email}?`;
    if (!window.confirm(msg)) return;
    setBusyId(u.id);
    try {
      await api.patch(`/admin/users/${u.id}/role`, { role: newRole });
      toast.success('Rol actualizado');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo cambiar el rol');
    } finally {
      setBusyId(null);
    }
  };

  const hasFilters = Boolean(filters.q || filters.role);

  const RoleAction = ({ u }) => {
    if (me?.id === u.id) return <span className="text-xs font-medium text-brand-textMuted">Tu cuenta</span>;
    const busy = busyId === u.id;
    const toAdmin = u.role === 'user';
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => changeRole(u, toAdmin ? 'admin' : 'user')}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
          toAdmin
            ? 'border-brand-accent/30 text-brand-accent hover:bg-brand-accent/10'
            : 'border-amber-300 text-amber-700 hover:bg-amber-50'
        }`}
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : toAdmin ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
        {toAdmin ? 'Hacer admin' : 'Quitar admin'}
      </button>
    );
  };

  const verified = (u) =>
    u.email_verified === undefined ? null : u.email_verified ? (
      <Badge tone="success" size="sm">
        <BadgeCheck size={12} /> Verificado
      </Badge>
    ) : (
      <Badge tone="neutral" size="sm">Sin verificar</Badge>
    );

  return (
    <div className="space-y-5">
      <PageTitle title="Gestión de usuarios" description="Administra cuentas y roles." />

      <form onSubmit={submitSearch} className="rounded-2xl border border-brand-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-textMuted" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Buscar por email o id"
            aria-label="Buscar usuarios"
            className="input !pl-10 !text-base sm:!text-sm"
          />
        </div>
        <select
          value={filters.role}
          onChange={(e) => { setFilters((f) => ({ ...f, role: e.target.value })); setPage(1); }}
          aria-label="Filtrar por rol"
          className="input !text-base sm:!w-44 sm:!text-sm"
        >
          <option value="">Todos los roles</option>
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </select>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1 !px-5 !py-2.5 text-sm sm:flex-none">Buscar</button>
          {(hasFilters || input) && (
            <button type="button" onClick={clearFilters} className="btn-outline !px-4 !py-2.5 text-sm" aria-label="Limpiar filtros">
              <X size={16} /> <span className="sm:hidden lg:inline">Limpiar</span>
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-5/50 p-4 text-sm text-rose-700 flex items-center gap-3">
          <AlertTriangle size={18} /> {error}
          <button type="button" onClick={load} className="ml-auto font-semibold underline">Reintentar</button>
        </div>
      )}

      {loading && !error && (
        <div className="rounded-2xl border border-brand-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] animate-pulse space-y-3 p-4" aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-lg bg-brand-border/60" />)}
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="rounded-2xl border border-brand-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] p-10 text-center">
          <p className="text-sm font-semibold text-brand-text">No se encontraron usuarios</p>
          <p className="mt-1 text-xs text-brand-textMuted">Prueba con otra búsqueda o limpia los filtros.</p>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <>
          <div className="rounded-2xl border border-brand-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] overflow-hidden">
            <div className="custom-scrollbar overflow-x-auto">
              <table className="table w-full text-sm">
                <thead className="bg-brand-dark/70 text-left text-[10px] font-semibold uppercase tracking-wider text-brand-textMuted">
                  <tr>
                    <th scope="col" className="px-4 py-3">Usuario</th>
                    <th scope="col" className="px-4 py-3">Rol</th>
                    <th scope="col" className="px-4 py-3">Registrado</th>
                    <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {users.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-brand-dark/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar email={u.email} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-brand-text">{u.email}</p>
                            <div className="mt-0.5">{verified(u)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="whitespace-nowrap px-4 py-3 text-brand-textMuted">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3 text-right"><RoleAction u={u} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="space-y-3 md:hidden">
            {users.map((u) => (
              <li key={u.id} className="rounded-2xl border border-brand-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] p-4">
                <div className="flex items-start gap-3">
                  <Avatar email={u.email} />
                  <div className="min-w-0 flex-1">
                    <p className="break-all text-sm font-semibold text-brand-text">{u.email}</p>
                    <p className="mt-0.5 text-xs text-brand-textMuted">Registrado el {formatDate(u.created_at)}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-brand-border pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    <RoleBadge role={u.role} />
                    {verified(u)}
                  </div>
                  <RoleAction u={u} />
                </div>
              </li>
            ))}
          </ul>

          {pagination && (
            <div className="flex flex-col items-center justify-between gap-3 text-xs text-brand-textMuted sm:flex-row">
              <span>
                {pagination.total} usuarios · Página {pagination.page} de {pagination.pages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn-outline !px-3 !py-2 text-sm"
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-outline !px-3 !py-2 text-sm"
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminUsers;
