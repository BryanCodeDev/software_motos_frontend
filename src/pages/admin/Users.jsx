import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, RefreshCw, Search, X, ShieldCheck, ShieldOff, Users as UsersIcon,
  Loader2, AlertTriangle,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { Badge } from '../../components/ui-kit';
import Modal from '../../components/Modal';

/* ───────── Constantes de diseño ───────── */
const EASE = [0.22, 1, 0.36, 1];
const PAGE_SIZE = 20;
const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };

const ROLE_TABS = [
  { id: '', label: 'Todos' },
  { id: 'user', label: 'Usuarios' },
  { id: 'admin', label: 'Administradores' },
];

const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const RoleBadge = ({ role }) => (
  <Badge tone={role === 'admin' ? 'brand' : 'neutral'} size="sm">
    {role === 'admin' ? 'Administrador' : 'Usuario'}
  </Badge>
);

const Avatar = ({ email, admin, size = 'md' }) => (
  <span
    className={`flex flex-none items-center justify-center rounded-full font-bold ring-1 ${
      size === 'lg' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm'
    } ${admin ? 'bg-brand-500 text-white ring-brand-500' : 'bg-brand-500/10 text-brand-500 ring-brand-500/15'}`}
  >
    {(email || '?').charAt(0).toUpperCase()}
  </span>
);

const ErrorBanner = ({ message, onRetry }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700" role="alert">
    <AlertTriangle size={18} className="flex-none" aria-hidden="true" />
    <span className="min-w-0 flex-1">{message}</span>
    <button type="button" onClick={onRetry} className="flex-none font-semibold underline underline-offset-2">Reintentar</button>
  </div>
);

/* ───────── Página: Administración de usuarios ───────── */
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
  const [selectedIds, setSelectedIds] = useState(new Set());
  const searchRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/users', {
        params: { q: filters.q, role: filters.role, page, limit: PAGE_SIZE },
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

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  /* Selección */
  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageSelectedCount = users.filter((u) => selectedIds.has(u.id)).length;
  const allPageSelected = users.length > 0 && pageSelectedCount === users.length;
  const somePageSelected = pageSelectedCount > 0 && !allPageSelected;

  const toggleSelectPage = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) users.forEach((u) => next.delete(u.id));
      else users.forEach((u) => next.add(u.id));
      return next;
    });

  const clearSelection = () => setSelectedIds(new Set());

  /* Rol */
  const askChangeRole = (u, role) => setConfirm({ user: u, role });

  const doChangeRole = async () => {
    if (!confirm) return;
    const { user: u, role } = confirm;
    setBusyId(u.id);
    try {
      await api.patch(`/admin/users/${u.id}/role`, { role });
      toast.success('Rol actualizado');
      setConfirm(null);
      clearSelection();
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo cambiar el rol');
    } finally {
      setBusyId(null);
    }
  };

  const confirming = confirm && busyId === confirm.user.id;
  const selectedCount = selectedIds.size;
  const from = pagination ? (pagination.page - 1) * PAGE_SIZE + 1 : 0;
  const to = pagination ? Math.min(pagination.page * PAGE_SIZE, pagination.total) : 0;

  const RowActions = ({ u }) => (
    <div className="flex items-center gap-2">
      {me?.id !== u.id && (
        <Button
          variant={u.role === 'user' ? 'outline' : 'outline'}
          size="sm"
          disabled={busyId === u.id}
          onClick={() => askChangeRole(u, u.role === 'user' ? 'admin' : 'user')}
          className="border-brand-500/30 bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50"
        >
          {busyId === u.id ? <Loader2 size={14} className="animate-spin" /> : u.role === 'user' ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
          {u.role === 'user' ? 'Hacer admin' : 'Quitar admin'}
        </Button>
      )}
      {me?.id === u.id && <Badge tone="info" size="sm">Tu cuenta</Badge>}
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={container} initial="hidden" animate="show" className={`space-y-4 lg:space-y-5 ${selectedCount > 0 ? 'pb-20' : ''}`}>
        <motion.div variants={item}>
          <PageTitle
            title="Usuarios"
            description="Gestiona cuentas de la plataforma, roles y estados de acceso."
            actions={
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Actualizar
              </Button>
            }
          />
        </motion.div>

        {/* Barra de herramientas */}
        <motion.div variants={item} className={`${panel} divide-y divide-border/70`}>
          <form
            role="search"
            onSubmit={(e) => { e.preventDefault(); setFilter('q', input.trim()); }}
            className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:p-4"
          >
            <div className="relative min-w-0 flex-1">
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
              <Input
                ref={searchRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Buscar por correo o ID"
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
                    onClick={() => { setInput(''); searchRef.current?.focus(); }}
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
                    onClick={() => setFilter('role', t.id)}
                    className={`focus-ring relative flex-none rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${active ? 'text-white' : 'text-text-secondary hover:text-neutral-900'}`}
                  >
                    {active && (
                      <motion.span layoutId="users-role-tab" className="absolute inset-0 rounded-lg bg-brand-500 shadow-soft" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
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
          </form>
        </motion.div>

        {/* Resumen de resultados */}
        {!error && (
          <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-text-secondary">
            <span aria-live="polite">
              {pagination ? (
                <>
                  <span className="font-semibold text-neutral-900">{pagination.total}</span>{' '}
                  {pagination.total === 1 ? 'resultado' : 'resultados'}
                  {hasFilters && ' con los filtros aplicados'}
                </>
              ) : (
                'Cargando…'
              )}
            </span>
            {selectedCount === 0 && users.length > 0 && (
              <span>Selecciona usuarios para gestionar sus roles.</span>
            )}
          </motion.div>
        )}

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
                <table className="w-full min-w-[700px] table-fixed text-left text-sm">
                  <thead className="border-b border-border bg-brand-50/70 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                    <tr>
                      <th scope="col" className="w-[52px] py-3 pl-4 pr-2">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectPage}
                          className="rounded border-brand-500 bg-brand-50 text-brand-500 focus:ring-0"
                          aria-label="Seleccionar todos los de la página"
                        />
                      </th>
                      <th scope="col" className="min-w-[0] py-3">Usuario</th>
                      <th scope="col" className="w-[120px] px-3 py-3">Rol</th>
                      <th scope="col" className="w-[170px] px-3 py-3">Registro</th>
                      <th scope="col" className="w-[200px] px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u, i) => {
                      const selected = selectedIds.has(u.id);
                      return (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, ease: EASE, delay: Math.min(i, 10) * 0.03 }}
                          className={`transition-colors ${selected ? 'bg-brand-50/80' : 'hover:bg-brand-50/40'}`}
                        >
                          <td className="py-3 pl-4 pr-2">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleSelect(u.id)}
                              className="rounded border-brand-500 bg-brand-50 text-brand-500 focus:ring-0"
                              aria-label={`Seleccionar a ${u.email}`}
                            />
                          </td>
                          <td className="min-w-[0] px-3 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar email={u.email} admin={u.role === 'admin'} />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-neutral-900" title={u.email}>{u.email}</p>
                                <p className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                                  <RoleBadge role={u.role} />
                                  <span>Registrado {formatDate(u.created_at)}</span>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3"><RoleBadge role={u.role} /></td>
                          <td className="whitespace-nowrap px-3 py-3 text-text-secondary">{formatDate(u.created_at)}</td>
                          <td className="px-4 py-3"><div className="flex justify-end"><RowActions u={u} /></div></td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Móvil */}
            <ul className="space-y-3 md:hidden">
              {users.map((u, i) => {
                const selected = selectedIds.has(u.id);
                return (
                  <motion.li
                    key={u.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: EASE, delay: Math.min(i, 8) * 0.04 }}
                    className={`${panel} p-4 transition-colors ${selected ? 'border-brand-500/50 bg-brand-50/60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-2.5">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelect(u.id)}
                          className="rounded border-brand-500 bg-brand-50 text-brand-500 focus:ring-0"
                          aria-label={`Seleccionar a ${u.email}`}
                        />
                      </div>
                      <Avatar email={u.email} admin={u.role === 'admin'} />
                      <div className="min-w-0 flex-1">
                        <p className="break-all text-sm font-semibold text-neutral-900">{u.email}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
                          <RoleBadge role={u.role} />
                          <span>Registrado {formatDate(u.created_at)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-border pt-3"><RowActions u={u} /></div>
                  </motion.li>
                );
              })}
            </ul>

            {/* Paginación */}
            {pagination && (
              <div className="flex flex-col items-center justify-between gap-3 text-xs text-text-secondary sm:flex-row">
                <span>
                  Mostrando <span className="font-semibold text-neutral-900">{from}–{to}</span> de{' '}
                  <span className="font-semibold text-neutral-900">{pagination.total}</span> · Página {pagination.page} de {pagination.pages}
                </span>
                <div className="flex gap-2">
                  <button type="button" disabled={pagination.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn-outline px-3 py-2 text-sm">
                    <ChevronLeft size={16} aria-hidden="true" /> Anterior
                  </button>
                  <button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn-outline px-3 py-2 text-sm">
                    Siguiente <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </MotionConfig>
  );
};

export default AdminUsers;
