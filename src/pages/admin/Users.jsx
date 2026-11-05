import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  Search, X, ShieldCheck, ShieldOff, ChevronLeft, ChevronRight, AlertTriangle, Loader2, Users as UsersIcon,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import Modal from '../../components/Modal';
import { Badge } from '../../components/ui-kit';

/* ───────── Constantes de diseño (alineadas con Home) ───────── */
const EASE = [0.22, 1, 0.36, 1];
const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const ROLE_TABS = [
  { id: '', label: 'Todos' },
  { id: 'user', label: 'Usuarios' },
  { id: 'admin', label: 'Administradores' },
];

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ───────── Piezas ───────── */
const RoleBadge = ({ role }) => (
  <Badge tone={role === 'admin' ? 'brand' : 'neutral'} size="sm">
    {role === 'admin' && <ShieldCheck size={11} aria-hidden="true" />}
    {role === 'admin' ? 'Administrador' : 'Usuario'}
  </Badge>
);

const Avatar = ({ email, admin }) => (
  <span
    className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-bold ring-1 ${
      admin ? 'bg-brand-500 text-white ring-brand-500' : 'bg-brand-500/10 text-brand-500 ring-brand-500/15'
    }`}
  >
    {(email || '?').charAt(0).toUpperCase()}
  </span>
);

const RoleAction = ({ u, meId, busy, onChange }) => {
  if (meId === u.id) return <Badge tone="info" size="sm">Tu cuenta</Badge>;
  const toAdmin = u.role === 'user';
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => onChange(u, toAdmin ? 'admin' : 'user')}
      className={`focus-ring inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        toAdmin
          ? 'border-brand-500/30 text-brand-500 hover:bg-brand-500/10'
          : 'border-amber-300 text-amber-700 hover:bg-amber-50'
      }`}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : toAdmin ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
      {toAdmin ? 'Hacer admin' : 'Quitar admin'}
    </button>
  );
};

const ErrorBanner = ({ message, onRetry }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700" role="alert">
    <AlertTriangle size={18} className="flex-none" aria-hidden="true" />
    <span className="min-w-0 flex-1">{message}</span>
    <button type="button" onClick={onRetry} className="flex-none font-semibold underline underline-offset-2">Reintentar</button>
  </div>
);

/* ───────── Página ───────── */
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
  const [confirm, setConfirm] = useState(null); // { user, role }

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

  // Búsqueda en vivo con retardo
  useEffect(() => {
    const t = setTimeout(() => {
      const q = input.trim();
      setFilters((f) => (f.q === q ? f : { ...f, q }));
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [input]);

  const hasFilters = !!(input || filters.q || filters.role);

  const clearFilters = () => {
    setInput('');
    setFilters({ q: '', role: '' });
    setPage(1);
  };

  const askChangeRole = (u, role) => setConfirm({ user: u, role });

  const doChangeRole = async () => {
    if (!confirm) return;
    const { user: u, role } = confirm;
    setBusyId(u.id);
    try {
      await api.patch(`/admin/users/${u.id}/role`, { role });
      toast.success('Rol actualizado');
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo cambiar el rol');
    } finally {
      setBusyId(null);
    }
  };

  const confirming = confirm && busyId === confirm.user.id;

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 lg:space-y-5">
        <motion.div variants={item}>
          <PageTitle title="Gestión de usuarios" description="Administra cuentas y roles." />
        </motion.div>

        {/* Barra de búsqueda y filtros */}
        <motion.form
          variants={item}
          onSubmit={(e) => { e.preventDefault(); setFilters((f) => ({ ...f, q: input.trim() })); setPage(1); }}
          className={`${panel} flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:p-4`}
          role="search"
        >
          <div className="relative min-w-0 flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Buscar por email o ID"
              aria-label="Buscar usuarios"
              className="input !pl-10 !pr-10 !text-base sm:!text-sm"
            />
            <AnimatePresence>
              {input && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setInput('')}
                  aria-label="Borrar búsqueda"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-brand-50 hover:text-neutral-900"
                >
                  <X size={15} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div role="tablist" aria-label="Filtrar por rol" className="custom-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-border bg-brand-50/50 p-1">
            {ROLE_TABS.map((t) => {
              const active = filters.role === t.id;
              return (
                <button
                  key={t.id || 'all'}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => { setFilters((f) => ({ ...f, role: t.id })); setPage(1); }}
                  className={`focus-ring relative flex-none rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    active ? 'text-white' : 'text-text-secondary hover:text-neutral-900'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="users-role-tab"
                      className="absolute inset-0 rounded-lg bg-brand-500 shadow-soft"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{t.label}</span>
                </button>
              );
            })}
          </div>

          {hasFilters && (
            <button type="button" onClick={clearFilters} className="btn-outline flex-none px-4 py-2.5 text-sm">
              <X size={16} aria-hidden="true" /> Limpiar
            </button>
          )}
        </motion.form>

        {error && <ErrorBanner message={error} onRetry={load} />}

        {loading && !error && (
          <div className={`${panel} animate-pulse space-y-3 p-4`} aria-busy="true" aria-live="polite">
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 rounded-lg bg-border/60" />)}
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className={`${panel} flex flex-col items-center p-10 text-center sm:p-12`}>
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
              <UsersIcon size={22} aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-neutral-900">No se encontraron usuarios</p>
            <p className="mt-1 text-xs text-text-secondary">Prueba con otra búsqueda o limpia los filtros.</p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="btn-outline mt-5 px-5 py-2.5 text-sm">
                <X size={16} aria-hidden="true" /> Limpiar todo
              </button>
            )}
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <>
            {/* Escritorio */}
            <div className={`${panel} hidden overflow-hidden md:block`}>
              <div className="custom-scrollbar overflow-x-auto">
                <table className="table w-full text-sm">
                  <thead className="bg-brand-50/70 text-left text-xs font-semibold text-text-secondary">
                    <tr>
                      <th scope="col" className="px-6 py-4">Usuario</th>
                      <th scope="col" className="px-6 py-4">Rol</th>
                      <th scope="col" className="px-6 py-4">Registrado</th>
                      <th scope="col" className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u, i) => (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: EASE, delay: Math.min(i, 10) * 0.03 }}
                        className="transition-colors hover:bg-brand-50/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar email={u.email} admin={u.role === 'admin'} />
                            <p className="min-w-0 truncate font-medium text-neutral-900">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                        <td className="whitespace-nowrap px-6 py-4 text-text-secondary">{formatDate(u.created_at)}</td>
                        <td className="px-6 py-4 text-right">
                          <RoleAction u={u} meId={me?.id} busy={busyId === u.id} onChange={askChangeRole} />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Móvil */}
            <ul className="space-y-3 md:hidden">
              {users.map((u, i) => (
                <motion.li
                  key={u.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE, delay: Math.min(i, 8) * 0.04 }}
                  className={`${panel} p-4`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar email={u.email} admin={u.role === 'admin'} />
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-sm font-semibold text-neutral-900">{u.email}</p>
                      <p className="mt-0.5 text-xs text-text-secondary">Registrado el {formatDate(u.created_at)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <RoleBadge role={u.role} />
                    <RoleAction u={u} meId={me?.id} busy={busyId === u.id} onChange={askChangeRole} />
                  </div>
                </motion.li>
              ))}
            </ul>

            {/* Paginación */}
            {pagination && (
              <div className="flex flex-col items-center justify-between gap-3 text-xs text-text-secondary sm:flex-row">
                <span>
                  <span className="font-semibold text-neutral-900">{pagination.total}</span>{' '}
                  {pagination.total === 1 ? 'usuario' : 'usuarios'} · Página {pagination.page} de {pagination.pages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="btn-outline px-3 py-2 text-sm"
                  >
                    <ChevronLeft size={16} aria-hidden="true" /> Anterior
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-outline px-3 py-2 text-sm"
                  >
                    Siguiente <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Confirmación de cambio de rol */}
        <Modal
          isOpen={!!confirm}
          onClose={() => (confirming ? null : setConfirm(null))}
          title={confirm?.role === 'admin' ? 'Dar permisos de administrador' : 'Quitar permisos de administrador'}
        >
          <div className="mb-6 flex items-start gap-3">
            <span
              className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ring-1 ${
                confirm?.role === 'admin'
                  ? 'bg-brand-500/10 text-brand-500 ring-brand-500/15'
                  : 'bg-amber-50 text-amber-600 ring-amber-600/15'
              }`}
            >
              {confirm?.role === 'admin' ? <ShieldCheck size={18} aria-hidden="true" /> : <ShieldOff size={18} aria-hidden="true" />}
            </span>
            <p className="text-sm leading-relaxed text-text-secondary">
              {confirm?.role === 'admin' ? (
                <>
                  <span className="break-all font-semibold text-neutral-900">{confirm?.user.email}</span> podrá gestionar
                  usuarios, pedidos y la auditoría de la plataforma.
                </>
              ) : (
                <>
                  <span className="break-all font-semibold text-neutral-900">{confirm?.user.email}</span> perderá el
                  acceso al panel administrativo.
                </>
              )}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={confirming}>Cancelar</Button>
            <Button variant={confirm?.role === 'admin' ? 'primary' : 'danger'} onClick={doChangeRole} disabled={confirming}>
              {confirming && <Loader2 size={16} className="animate-spin" />}
              {confirming ? 'Guardando...' : confirm?.role === 'admin' ? 'Dar permisos' : 'Quitar permisos'}
            </Button>
          </div>
        </Modal>
      </motion.div>
    </MotionConfig>
  );
};

export default AdminUsers;