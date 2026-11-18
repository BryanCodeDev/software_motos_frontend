import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Search, X, ShieldCheck, ShieldOff, Users as UsersIcon, Loader2, AlertTriangle,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/useToast';
import { Badge } from '../../components/ui-kit';
import Modal from '../../components/Modal';

const PAGE_SIZE = 20;
const panel = 'rounded-2xl border border-border bg-white';
const COLS = 'md:grid md:grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_9rem] md:items-center md:gap-4';

const ROLE_TABS = [
  { id: '', label: 'Todos' },
  { id: 'user', label: 'Usuarios' },
  { id: 'admin', label: 'Administradores' },
];

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const RowAction = ({ u, isMe, busy, onAsk }) => {
  if (isMe) return <Badge tone="info" size="sm">Tu cuenta</Badge>;
  const toAdmin = u.role !== 'admin';
  const Icon = toAdmin ? ShieldCheck : ShieldOff;
  return (
    <button type="button" disabled={busy} onClick={() => onAsk(u, toAdmin ? 'admin' : 'user')} className="btn-outline px-3 py-1.5 text-xs">
      {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Icon size={14} aria-hidden="true" />}
      {toAdmin ? 'Hacer admin' : 'Quitar admin'}
    </button>
  );
};

export const AdminUsers = () => {
  const toast = useToast();
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { user, role }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/users', { params: { q, role, page, limit: PAGE_SIZE } });
      setUsers(data.users || []);
      setPagination(data.pagination || null);
    } catch (e) {
      setError(e?.response?.data?.error || 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, [q, role, page]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(input.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [input]);

  const hasFilters = !!(input || role);
  const clearFilters = () => { setInput(''); setQ(''); setRole(''); setPage(1); };
  const pickRole = (id) => { setRole(id); setPage(1); };

  const changeRole = async () => {
    if (!confirm) return;
    const { user: u, role: next } = confirm;
    setBusyId(u.id);
    try {
      await api.patch(`/admin/users/${u.id}/role`, { role: next });
      toast.success(next === 'admin' ? 'Ahora es administrador' : 'Ya no es administrador');
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo cambiar el rol');
    } finally {
      setBusyId(null);
    }
  };

  const confirming = !!confirm && busyId === confirm.user.id;
  const from = pagination ? (pagination.page - 1) * PAGE_SIZE + 1 : 0;
  const to = pagination ? Math.min(pagination.page * PAGE_SIZE, pagination.total) : 0;

  return (
    <div className="space-y-4">
      <PageTitle title="Usuarios" />

      <div className={`${panel} flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:p-4`}>
        <div className="relative min-w-0 flex-1" role="search">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Buscar por correo"
            aria-label="Buscar usuarios"
            className="input !pl-10 !pr-10"
          />
          {input && (
            <button
              type="button"
              onClick={() => setInput('')}
              aria-label="Borrar búsqueda"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary hover:bg-brand-50 hover:text-neutral-900"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
        <div role="group" aria-label="Filtrar por rol" className="custom-scrollbar flex gap-2 overflow-x-auto">
          {ROLE_TABS.map((t) => {
            const active = role === t.id;
            return (
              <button
                key={t.id || 'all'}
                type="button"
                aria-pressed={active}
                onClick={() => pickRole(t.id)}
                className={`focus-ring flex-none rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active ? 'border-brand-500 bg-brand-500 text-white' : 'border-border bg-white text-text-secondary hover:border-brand-500/40 hover:text-neutral-900'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700" role="alert">
          <AlertTriangle size={18} className="flex-none" aria-hidden="true" />
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" onClick={load} className="flex-none font-semibold underline underline-offset-2">Reintentar</button>
        </div>
      )}

      {loading && users.length === 0 && !error && (
        <div className={`${panel} animate-pulse space-y-3 p-4`} aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-lg bg-border/60" />)}
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className={`${panel} flex flex-col items-center p-10 text-center`}>
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
            <UsersIcon size={20} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-neutral-900">Sin resultados</p>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="btn-outline mt-4 px-4 py-2 text-sm">
              <X size={16} aria-hidden="true" /> Quitar filtros
            </button>
          )}
        </div>
      )}

      {users.length > 0 && !error && (
        <>
          <div className={`${panel} overflow-hidden transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
            <div className={`hidden border-b border-border bg-brand-50/70 px-4 py-3 text-xs font-semibold text-text-secondary ${COLS}`}>
              <span>Usuario</span>
              <span>Rol</span>
              <span>Registro</span>
              <span className="text-right">Acción</span>
            </div>
            <ul className="divide-y divide-border">
              {users.map((u) => (
                <li key={u.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-brand-50/40 ${COLS}`}>
                  <div className="flex min-w-0 basis-full items-center gap-3 md:basis-auto">
                    <span
                      className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold ${
                        u.role === 'admin' ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-500'
                      }`}
                      aria-hidden="true"
                    >
                      {(u.email || '?').charAt(0).toUpperCase()}
                    </span>
                    <p className="min-w-0 break-all text-sm font-medium text-neutral-900 md:truncate" title={u.email}>{u.email}</p>
                  </div>
                  <Badge tone={u.role === 'admin' ? 'brand' : 'neutral'} size="sm">
                    {u.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </Badge>
                  <span className="text-xs text-text-secondary md:text-sm">{formatDate(u.created_at)}</span>
                  <div className="ml-auto md:ml-0 md:flex md:justify-end">
                    <RowAction u={u} isMe={me?.id === u.id} busy={busyId === u.id} onAsk={(user, next) => setConfirm({ user, role: next })} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {pagination && (
            <div className="flex flex-col items-center justify-between gap-3 text-xs text-text-secondary sm:flex-row">
              <span aria-live="polite">
                <span className="font-semibold text-neutral-900">{from}–{to}</span> de {pagination.total}
              </span>
              {pagination.pages > 1 && (
                <div className="flex gap-2">
                  <button type="button" disabled={pagination.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn-outline px-3 py-2 text-sm">
                    <ChevronLeft size={16} aria-hidden="true" /> Anterior
                  </button>
                  <button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn-outline px-3 py-2 text-sm">
                    Siguiente <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={!!confirm}
        onClose={() => (confirming ? null : setConfirm(null))}
        title={confirm?.role === 'admin' ? 'Hacer administrador' : 'Quitar administrador'}
      >
        {confirm && (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-text-secondary">
              <span className="font-semibold text-neutral-900">{confirm.user.email}</span>{' '}
              {confirm.role === 'admin'
                ? 'podrá gestionar usuarios, pedidos y códigos QR.'
                : 'perderá el acceso a este panel.'}
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setConfirm(null)} disabled={confirming} className="btn-ghost px-4 py-2 text-sm">Cancelar</button>
              <button type="button" onClick={changeRole} disabled={confirming} className="btn-primary px-4 py-2 text-sm">
                {confirming && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {confirming ? 'Guardando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;