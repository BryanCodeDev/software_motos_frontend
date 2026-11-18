import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Search, X, ShieldCheck, User, Users as UsersIcon, Loader2, AlertTriangle, QrCode, ExternalLink,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/useToast';
import { Badge } from '../../components/ui-kit';
import Modal from '../../components/Modal';

const PAGE_SIZE = 18;
const panel = 'rounded-2xl border border-border bg-white';

const ROLE_TABS = [
  { id: '', label: 'Todos' },
  { id: 'user', label: 'Usuarios' },
  { id: 'admin', label: 'Administradores' },
];

const ROLES = {
  user: { label: 'Usuario', icon: User, desc: 'Gestiona su perfil, contactos, QR y pedidos.' },
  admin: { label: 'Administrador', icon: ShieldCheck, desc: 'Accede a este panel: pedidos, códigos QR, usuarios y auditoría.' },
};

const QR_STATUS = {
  pending_activation: ['Pendiente de activación', 'warn'],
  active: ['Activo', 'success'],
  disabled: ['Deshabilitado', 'danger'],
  deactivated: ['Desvinculado', 'neutral'],
  replaced: ['Reemplazado', 'neutral'],
  retired: ['Retirado', 'neutral'],
};

const fmtDay = (d) => (d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const Avatar = ({ email, admin, large = false }) => (
  <span
    aria-hidden="true"
    className={`flex flex-none items-center justify-center rounded-full font-bold ${large ? 'h-14 w-14 text-xl' : 'h-11 w-11 text-base'} ${
      admin ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-500'
    }`}
  >
    {(email || '?').charAt(0).toUpperCase()}
  </span>
);

const Field = ({ label, children }) => (
  <div>
    <dt className="text-xs text-text-secondary">{label}</dt>
    <dd className="mt-0.5 text-sm font-medium text-neutral-900">{children}</dd>
  </div>
);

const RoleBadge = ({ role }) => (
  <Badge tone={role === 'admin' ? 'brand' : 'neutral'} size="sm">{ROLES[role]?.label || role}</Badge>
);

/* ───────── Tarjeta ───────── */
const UserCard = ({ u, isMe, onOpen }) => (
  <li className="flex flex-col rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-500/40">
    <div className="flex items-center gap-3">
      <Avatar email={u.email} admin={u.role === 'admin'} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-900" title={u.email}>{u.email}</p>
        <p className="mt-0.5 text-xs text-text-secondary">Registrado {fmtDay(u.created_at)}</p>
      </div>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <RoleBadge role={u.role} />
      {isMe && <Badge tone="info" size="sm">Tu cuenta</Badge>}
    </div>
    <div className="mt-auto flex gap-2 pt-4">
      <button type="button" onClick={() => onOpen(u, 'datos')} className="btn-outline flex-1 px-3 py-2 text-xs">Ver detalles</button>
      {!isMe && (
        <button type="button" onClick={() => onOpen(u, 'rol')} className="btn-outline flex-1 px-3 py-2 text-xs">Cambiar rol</button>
      )}
    </div>
  </li>
);

export const AdminUsers = () => {
  const toast = useToast();
  const { user: me } = useAuth();
  const [params] = useSearchParams();
  const initialQ = params.get('q') || '';

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [input, setInput] = useState(initialQ);
  const [q, setQ] = useState(initialQ);
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Detalle */
  const [sel, setSel] = useState(null); // usuario abierto
  const [tab, setTab] = useState('datos');
  const [newRole, setNewRole] = useState('user');
  const [saving, setSaving] = useState(false);
  const [qrs, setQrs] = useState(null); // null = cargando

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
    const t = setTimeout(() => { setQ(input.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [input]);

  /* QR del usuario abierto */
  useEffect(() => {
    if (!sel) return undefined;
    let alive = true;
    const t = setTimeout(async () => {
      setQrs(null);
      try {
        const { data } = await api.get('/admin/qrs', { params: { q: sel.email, page: 1, limit: 10 } });
        if (!alive) return;
        setQrs((data.qrs || []).filter((x) => x.user?.id === sel.id || x.user?.email === sel.email));
      } catch {
        if (alive) setQrs([]);
      }
    }, 0);
    return () => { alive = false; clearTimeout(t); };
  }, [sel]);

  const hasFilters = !!(input || role);
  const clearFilters = () => { setInput(''); setQ(''); setRole(''); setPage(1); };

  const open = (u, startTab) => {
    setSel(u);
    setTab(startTab);
    setNewRole(u.role === 'admin' ? 'admin' : 'user');
  };
  const close = () => { if (!saving) setSel(null); };

  const saveRole = async () => {
    if (!sel || newRole === sel.role) return;
    setSaving(true);
    try {
      await api.patch(`/admin/users/${sel.id}/role`, { role: newRole });
      toast.success(newRole === 'admin' ? 'Ahora es administrador' : 'Ya no es administrador');
      setSel((s) => (s ? { ...s, role: newRole } : s));
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo cambiar el rol');
    } finally {
      setSaving(false);
    }
  };

  const isMe = (u) => !!u && me?.id === u.id;
  const from = pagination ? (pagination.page - 1) * PAGE_SIZE + 1 : 0;
  const to = pagination ? Math.min(pagination.page * PAGE_SIZE, pagination.total) : 0;
  const tabBtn = (id, label) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={`focus-ring -mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
        tab === id ? 'border-brand-500 text-brand-600' : 'border-transparent text-text-secondary hover:text-neutral-900'
      }`}
    >
      {label}
    </button>
  );

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
                onClick={() => { setRole(t.id); setPage(1); }}
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
        <div className="grid animate-pulse gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-36 rounded-2xl bg-border/60" />)}
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className={`${panel} flex flex-col items-center p-10 text-center`}>
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
            <UsersIcon size={20} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-neutral-900">Ningún usuario coincide</p>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="btn-outline mt-4 px-4 py-2 text-sm">
              <X size={16} aria-hidden="true" /> Quitar filtros
            </button>
          )}
        </div>
      )}

      {users.length > 0 && !error && (
        <>
          <ul className={`grid gap-3 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
            {users.map((u) => <UserCard key={u.id} u={u} isMe={isMe(u)} onOpen={open} />)}
          </ul>

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

      {/* ───────── Detalle del usuario ───────── */}
      <Modal isOpen={!!sel} onClose={close} title="Usuario" size="lg">
        {sel && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar email={sel.email} admin={sel.role === 'admin'} large />
              <div className="min-w-0">
                <p className="break-all text-base font-semibold text-neutral-900">{sel.email}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <RoleBadge role={sel.role} />
                  {isMe(sel) && <Badge tone="info" size="sm">Tu cuenta</Badge>}
                </div>
              </div>
            </div>

            <div role="tablist" aria-label="Secciones del usuario" className="flex border-b border-border">
              {tabBtn('datos', 'Datos')}
              {tabBtn('rol', 'Rol')}
              {tabBtn('qr', `QR${qrs ? ` (${qrs.length})` : ''}`)}
            </div>

            {tab === 'datos' && (
              <dl className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                <Field label="Correo"><span className="break-all">{sel.email}</span></Field>
                <Field label="Rol">{ROLES[sel.role]?.label || sel.role}</Field>
                {sel.name && <Field label="Nombre">{sel.name}</Field>}
                <Field label="Registro">{fmtDate(sel.created_at)}</Field>
                {sel.last_login_at && <Field label="Último acceso">{fmtDate(sel.last_login_at)}</Field>}
                <Field label="ID"><span className="font-mono text-xs">{sel.id}</span></Field>
              </dl>
            )}

            {tab === 'rol' && (
              isMe(sel) ? (
                <p className="rounded-xl border border-border bg-brand-50/50 p-4 text-sm text-text-secondary">
                  No puedes cambiar tu propio rol. Pídeselo a otro administrador.
                </p>
              ) : (
                <div className="space-y-4">
                  <div role="radiogroup" aria-label="Rol" className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(ROLES).map(([id, r]) => {
                      const on = newRole === id;
                      const Icon = r.icon;
                      return (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setNewRole(id)}
                          className={`focus-ring rounded-xl border p-4 text-left transition-colors ${
                            on ? 'border-brand-500 bg-brand-500/10' : 'border-border bg-white hover:border-brand-500/40'
                          }`}
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                            <Icon size={16} className={on ? 'text-brand-500' : 'text-text-secondary'} aria-hidden="true" /> {r.label}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-text-secondary">{r.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                  {newRole !== sel.role && newRole === 'user' && (
                    <p className="flex items-start gap-2 text-xs leading-relaxed text-amber-700">
                      <AlertTriangle size={14} className="mt-0.5 flex-none" aria-hidden="true" />
                      Perderá el acceso a este panel de inmediato.
                    </p>
                  )}
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={close} disabled={saving} className="btn-ghost px-4 py-2 text-sm">Cerrar</button>
                    <button type="button" onClick={saveRole} disabled={saving || newRole === sel.role} className="btn-primary px-4 py-2 text-sm">
                      {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                      {saving ? 'Guardando…' : 'Guardar rol'}
                    </button>
                  </div>
                </div>
              )
            )}

            {tab === 'qr' && (
              <div className="space-y-3">
                {qrs === null && (
                  <p className="flex items-center gap-2 text-sm text-text-secondary"><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Buscando…</p>
                )}
                {qrs && qrs.length === 0 && (
                  <p className="rounded-xl border border-border bg-brand-50/50 p-4 text-sm text-text-secondary">Este usuario no tiene un QR vinculado.</p>
                )}
                {qrs && qrs.map((x) => {
                  const [label, tone] = QR_STATUS[x.status] || [x.status, 'neutral'];
                  return (
                    <div key={x.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                        <QrCode size={18} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs font-semibold text-neutral-900">{x.value}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">{x.order?.order_number ? `Pedido ${x.order.order_number}` : 'Sin pedido'}</p>
                      </div>
                      <Badge tone={tone} size="sm">{label}</Badge>
                    </div>
                  );
                })}
                <Link
                  to={`/admin/qrs?q=${encodeURIComponent(sel.email)}`}
                  className="btn-outline inline-flex px-3 py-2 text-xs"
                >
                  <ExternalLink size={14} aria-hidden="true" /> Ver en Códigos QR
                </Link>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;