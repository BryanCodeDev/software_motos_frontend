import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Copy, Download, ExternalLink, FileText, Link2,
  Loader2, Plus, Printer, QrCode, RefreshCw, Search, Unlink, User, X,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useToast } from '../../components/useToast';
import { Badge } from '../../components/ui-kit';
import Modal from '../../components/Modal';
import { useAdminSync } from '../../contexts/useAdminSync';

const PAGE_SIZE = 24;
const panel = 'rounded-2xl border border-border bg-white';

const QR_STATUS = {
  pending_activation: ['Pendiente de activación', 'warn'],
  active: ['Activo', 'success'],
  disabled: ['Deshabilitado', 'danger'],
  deactivated: ['Desvinculado', 'neutral'],
  replaced: ['Reemplazado', 'neutral'],
  retired: ['Retirado', 'neutral'],
};
const PRINT_STATUS = {
  pending_print: ['Por imprimir', 'neutral'],
  sent_to_print: ['En impresión', 'info'],
  printed: ['Impreso', 'success'],
  dispatched: ['Despachado', 'success'],
  delivered: ['Entregado', 'success'],
  cancelled: ['Cancelado', 'neutral'],
};

/* Cada tarjeta de resumen es también un filtro */
const VIEWS = [
  { id: 'all', label: 'Todos', params: {}, count: (s) => s.total },
  { id: 'active', label: 'Activos', params: { status: 'active' }, count: (s) => s.by_status?.active },
  { id: 'pending', label: 'Pendientes de activación', params: { status: 'pending_activation' }, count: (s) => s.by_status?.pending_activation },
  { id: 'unlinked', label: 'Sin vincular', params: { linked: 'false' }, count: (s) => s.unlinked },
  { id: 'archived', label: 'Archivados', params: { archived: 'true' }, count: (s) => s.by_status?.archived },
];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDay = (d) =>
  d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const publicUrl = (v) => `${window.location.origin}/e/${v}`;

const downloadBlob = async (url, fileName) => {
  const res = await api.get(url, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' }));
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

const StatusBadge = ({ map, value }) => {
  const [label, tone] = map[value] || [value || '—', 'neutral'];
  return <Badge tone={tone} size="sm">{label}</Badge>;
};

const Field = ({ label, children, wide = false }) => (
  <div className={wide ? 'sm:col-span-2' : ''}>
    <dt className="text-xs text-text-secondary">{label}</dt>
    <dd className="mt-0.5 text-sm font-medium text-neutral-900">{children}</dd>
  </div>
);

/* ───────── Tarjeta de QR ───────── */
const QrCard = ({ qr, selected, onSelect, onOpen, onLink, onUnlink, onCopy }) => (
  <li
    className={`flex flex-col rounded-2xl border p-4 transition-colors ${
      selected ? 'border-brand-500/60 bg-brand-50/60' : 'border-border bg-white hover:border-brand-500/40'
    }`}
  >
    <div className="flex items-start gap-3">
      <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
        <QrCode size={22} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs font-semibold text-neutral-900" title={qr.value}>{qr.value}</p>
        <p className="mt-0.5 text-xs text-text-secondary">Creado {fmtDay(qr.created_at)}</p>
      </div>
      <input
        type="checkbox"
        checked={selected}
        onChange={qr.user ? undefined : onSelect}
        disabled={!!qr.user}
        className="mt-1 rounded border-brand-500 text-brand-500 focus:ring-0"
        aria-label={`Seleccionar ${qr.value}`}
        title={qr.user ? 'No se puede archivar un QR vinculado a un usuario' : undefined}
      />
    </div>

    <div className="mt-3 flex flex-wrap gap-1.5">
      <StatusBadge map={QR_STATUS} value={qr.status} />
      <StatusBadge map={PRINT_STATUS} value={qr.print_status} />
    </div>

    <dl className="mt-3 space-y-2 border-t border-border pt-3 text-xs">
      <div className="flex items-center justify-between gap-3">
        <dt className="text-text-secondary">Usuario</dt>
        <dd className={`min-w-0 truncate font-medium ${qr.user ? 'text-neutral-900' : 'text-amber-700'}`} title={qr.user?.email}>
          {qr.user?.email || 'Sin asignar'}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt className="text-text-secondary">Pedido</dt>
        <dd className="min-w-0 truncate font-medium text-neutral-900">{qr.order?.order_number || '—'}</dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt className="text-text-secondary">Diseño</dt>
        <dd className="flex min-w-0 items-center gap-1.5 font-medium text-neutral-900">
          {qr.order?.design_image_url && <img src={qr.order.design_image_url} alt="" className="h-4 w-4 flex-none rounded object-cover" />}
          <span className="truncate">{qr.order?.design_name || '—'}</span>
        </dd>
      </div>
    </dl>

    <div className="mt-auto flex items-center gap-2 pt-4">
      <button type="button" onClick={onOpen} className="btn-outline flex-1 px-3 py-2 text-xs">Ver detalles</button>
      {qr.user ? (
        <button type="button" onClick={onUnlink} className="btn-outline px-3 py-2 text-xs !text-rose-700 hover:!bg-rose-50">
          <Unlink size={14} aria-hidden="true" /> Desvincular
        </button>
      ) : (
        <button type="button" onClick={onLink} className="btn-primary px-3 py-2 text-xs">
          <Link2 size={14} aria-hidden="true" /> Vincular
        </button>
      )}
      <button type="button" onClick={onCopy} aria-label="Copiar enlace público" title="Copiar enlace público" className="btn-outline h-8 w-8 flex-none">
        <Copy size={14} aria-hidden="true" />
      </button>
    </div>
  </li>
);

export const AdminQrInventory = () => {
  const toast = useToast();
  const [params] = useSearchParams();
  const initialQ = params.get('q') || '';

  const { refreshKey, refresh: globalRefresh } = useAdminSync();

  const [stats, setStats] = useState(null);
  const [qrs, setQrs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [input, setInput] = useState(initialQ);
  const [q, setQ] = useState(initialQ);
  const [view, setView] = useState('all');
  const [print, setPrint] = useState('');
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [exportBusy, setExportBusy] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);

  /* Crear */
  const [createOpen, setCreateOpen] = useState(false);
  const [createQty, setCreateQty] = useState(1);
  const [createBusy, setCreateBusy] = useState(false);
  const [created, setCreated] = useState(null); // { id, value }

  /* Vincular */
  const [linkQr, setLinkQr] = useState(null);
  const [userQuery, setUserQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [pickedUser, setPickedUser] = useState(null);
  const [linkBusy, setLinkBusy] = useState(false);

  /* Desvincular */
  const [unlinkQr, setUnlinkQr] = useState(null);
  const [unlinkBusy, setUnlinkBusy] = useState(false);

  /* Detalle */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailImage, setDetailImage] = useState(null);
  const [printBusy, setPrintBusy] = useState(false);

  const refreshLocal = () => setTick((t) => t + 1);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/qrs/stats');
      setStats(data);
    } catch {
      /* las cifras no son críticas */
    }
  }, []);

  const loadQrs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = { ...VIEWS.find((v) => v.id === view).params, page, limit: PAGE_SIZE };
      if (q) query.q = q;
      if (print) query.print_status = print;
      const { data } = await api.get('/admin/qrs', { params: query });
      setQrs(data.qrs || []);
      setPagination(data.pagination || { page: 1, pages: 0, total: 0 });
    } catch (e) {
      setError(e?.response?.data?.error || 'No se pudieron cargar los códigos QR');
    } finally {
      setLoading(false);
    }
  }, [q, view, print, page]);

  useEffect(() => {
    const t = setTimeout(loadQrs, 0);
    return () => clearTimeout(t);
  }, [loadQrs, tick, refreshKey]);

  useEffect(() => {
    const t = setTimeout(loadStats, 0);
    return () => clearTimeout(t);
  }, [loadStats, tick, refreshKey]);

  useEffect(() => {
    const t = setTimeout(() => { setQ(input.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [input]);

  /* Buscar usuarios mientras se escribe en el modal de vincular */
  useEffect(() => {
    if (!linkQr) return undefined;
    const t = setTimeout(async () => {
      setUsersLoading(true);
      try {
        const { data } = await api.get('/admin/users', { params: { q: userQuery.trim(), role: 'user', without_qr: 'true', page: 1, limit: 8 } });
        setUsers(data.users || []);
      } catch {
        setUsers([]);
      } finally {
        setUsersLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [linkQr, userQuery]);

  useEffect(() => () => { if (detailImage) URL.revokeObjectURL(detailImage); }, [detailImage]);

  const copy = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const pickView = (id) => { setView(id); setPage(1); };
  const hasFilters = !!(input || view !== 'all' || print);
  const clearFilters = () => { setInput(''); setQ(''); setView('all'); setPrint(''); setPage(1); };

  /* Selección */
  const allSelected = qrs.length > 0 && qrs.every((x) => selected.has(x.id));
  const toggleOne = (id) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(qrs.map((x) => x.id)));

  /* Crear */
  const openCreate = () => { setCreated(null); setCreateQty(1); setCreateOpen(true); };
  const closeCreate = () => { if (!createBusy) { setCreateOpen(false); setCreated(null); } };

  const doCreate = async () => {
    const qty = Math.min(100, Math.max(1, Number(createQty) || 1));
    setCreateBusy(true);
    let made = 0;
    let last = null;
    try {
      for (let i = 0; i < qty; i += 1) {
        const { data } = await api.post('/admin/qrs/create');
        last = data?.identifier || data;
        made += 1;
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || `No se pudo crear el QR${made ? ` (se crearon ${made})` : ''}`);
    } finally {
      setCreateBusy(false);
    }
    if (!made) return;
    setInput(''); setQ(''); setPrint(''); setView('unlinked'); setPage(1);
    refreshLocal();
    globalRefresh();
    if (made === 1 && last?.id && last?.value) {
      setCreated({ id: last.id, value: last.value });
    } else {
      toast.success(`${made} ${made === 1 ? 'QR creado' : 'QR creados'}. Quedan en «Sin vincular».`);
      setCreateOpen(false);
    }
  };

  /* Vincular */
  const openLink = (qr) => {
    setDetailOpen(false);
    setCreateOpen(false);
    setLinkQr(qr);
    setUserQuery('');
    setPickedUser(null);
    setUsers([]);
  };
  const closeLink = () => { if (!linkBusy) { setLinkQr(null); setPickedUser(null); } };

  const doLink = async () => {
    if (!linkQr || !pickedUser) return;
    setLinkBusy(true);
    try {
      await api.post('/admin/qrs/link', { qr_id: linkQr.id, user_id: pickedUser.id });
      toast.success(`QR vinculado a ${pickedUser.email}`);
      setLinkQr(null);
      setPickedUser(null);
      refreshLocal();
      globalRefresh();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo vincular el QR');
    } finally {
      setLinkBusy(false);
    }
  };

  /* Desvincular */
  const askUnlink = (qr) => { setDetailOpen(false); setUnlinkQr(qr); };
  const doUnlink = async () => {
    if (!unlinkQr) return;
    setUnlinkBusy(true);
    try {
      await api.post('/admin/qrs/unlink', { qr_id: unlinkQr.id });
      toast.success('QR desvinculado');
      setUnlinkQr(null);
      refreshLocal();
      globalRefresh();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo desvincular el QR');
    } finally {
      setUnlinkBusy(false);
    }
  };

  /* Detalle */
  const openDetail = async (id) => {
    setDetail(null);
    setDetailImage(null);
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const { data } = await api.get(`/admin/qrs/${id}`);
      setDetail(data.identifier || null);
      try {
        const res = await api.get(`/admin/qrs/${id}/qr`, { responseType: 'blob' });
        setDetailImage(URL.createObjectURL(new Blob([res.data], { type: 'image/png' })));
      } catch {
        setDetailImage(null);
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo cargar el detalle');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const setPrintStatus = async (status) => {
    if (!detail || !status || status === detail.print_status) return;
    setPrintBusy(true);
    try {
      await api.post(`/admin/qrs/${detail.id}/print-status`, { print_status: status });
      toast.success(`Impresión: ${PRINT_STATUS[status][0]}`);
      setDetail((d) => (d ? { ...d, print_status: status } : d));
      refreshLocal();
      globalRefresh();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo actualizar el estado');
    } finally {
      setPrintBusy(false);
    }
  };

  /* Exportar selección */
  const exportAs = async (format) => {
    if (!selected.size) return;
    setExportBusy(true);
    try {
      await downloadBlob(`/admin/qrs/export/${format}?ids=${[...selected].join(',')}`, `qrs-produccion.${format}`);
      toast.success(`${selected.size} QR exportados`);
      setSelected(new Set());
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo exportar');
    } finally {
      setExportBusy(false);
    }
  };

  /* Archivar selección (archivado lógico, no borrado) */
  const doArchive = async () => {
    if (!selected.size || archiveBusy) return;
    setArchiveBusy(true);
    let ok = 0;
    let fail = 0;
    let skipped = 0;
    const ids = [...selected].filter((id) => {
      const qr = qrs.find((q) => q.id === id);
      return !qr || !qr.user;
    });
    const skippedCount = selected.size - ids.length;
    try {
      for (const id of ids) {
        try {
          await api.post(`/admin/qrs/${id}/archive`, { reason: 'Archivado desde el panel de administración' });
          ok += 1;
        } catch {
          fail += 1;
        }
      }
      if (ok) toast.success(`${ok} QR archivado${ok !== 1 ? 's' : ''}`);
      if (fail) toast.error(`${fail} QR no se pudieron archivar`);
      if (skippedCount) toast.info(`${skippedCount} QR con usuario vinculado no se archivaron`);
      setSelected(new Set());
      refreshLocal();
      globalRefresh();
    } finally {
      setArchiveBusy(false);
    }
  };

  const s = stats || {};
  const exportBtn = 'focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-50';

  return (
    <div className="space-y-4">
      <PageTitle
        title="Códigos QR"
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={refreshLocal} disabled={loading} className="btn-outline px-3.5 py-2 text-sm" aria-label="Actualizar">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            </button>
            <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">
              <Plus size={16} aria-hidden="true" /> Crear QR
            </button>
          </div>
        }
      />

      {/* Resumen que también filtra */}
      <div role="group" aria-label="Filtrar por estado" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {VIEWS.map((v) => {
          const active = view === v.id;
          const n = v.count(s);
          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={active}
              onClick={() => pickView(v.id)}
              className={`focus-ring rounded-2xl border p-4 text-left transition-colors ${
                active ? 'border-brand-500 bg-brand-500 text-white' : 'border-border bg-white hover:border-brand-500/40'
              }`}
            >
              <p className={`text-xs ${active ? 'text-white/80' : 'text-text-secondary'}`}>{v.label}</p>
              <p className={`mt-1 text-2xl font-bold tracking-tight ${active ? 'text-white' : 'text-neutral-900'}`}>{n ?? '—'}</p>
            </button>
          );
        })}
      </div>

      <div className={`${panel} flex flex-col gap-3 p-3 sm:flex-row sm:items-center lg:p-4`}>
        <div className="relative flex-1" role="search">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Buscar por código o correo del usuario"
            aria-label="Buscar códigos QR"
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
        <select value={print} onChange={(e) => { setPrint(e.target.value); setPage(1); }} aria-label="Filtrar por impresión" className="input sm:!w-56">
          <option value="">Toda la impresión</option>
          {Object.entries(PRINT_STATUS).map(([id, [label]]) => <option key={id} value={id}>{label}</option>)}
        </select>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="btn-ghost flex-none px-3 py-2 text-sm">
            <X size={16} aria-hidden="true" /> Quitar filtros
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700" role="alert">
          <AlertTriangle size={18} className="flex-none" aria-hidden="true" />
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" onClick={refreshLocal} className="flex-none font-semibold underline underline-offset-2">Reintentar</button>
        </div>
      )}

      {loading && qrs.length === 0 && !error && (
        <div className="grid animate-pulse gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-60 rounded-2xl bg-border/60" />)}
        </div>
      )}

      {!loading && !error && qrs.length === 0 && (
        <div className={`${panel} flex flex-col items-center p-10 text-center`}>
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
            <QrCode size={20} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-neutral-900">{hasFilters ? 'Ningún QR coincide' : 'Aún no hay códigos QR'}</p>
          {hasFilters ? (
            <button type="button" onClick={clearFilters} className="btn-outline mt-4 px-4 py-2 text-sm">
              <X size={16} aria-hidden="true" /> Quitar filtros
            </button>
          ) : (
            <button type="button" onClick={openCreate} className="btn-primary mt-4 px-4 py-2 text-sm">
              <Plus size={16} aria-hidden="true" /> Crear el primero
            </button>
          )}
        </div>
      )}

      {qrs.length > 0 && !error && (
        <>
          <div className="flex items-center justify-between gap-3 px-1 text-xs text-text-secondary">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="rounded border-brand-500 text-brand-500 focus:ring-0"
              />
              Seleccionar esta página
            </label>
            <span aria-live="polite">
              <span className="font-semibold text-neutral-900">{pagination.total}</span> {pagination.total === 1 ? 'código' : 'códigos'}
            </span>
          </div>

          <ul className={`grid gap-3 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
            {qrs.map((qr) => (
              <QrCard
                key={qr.id}
                qr={qr}
                selected={selected.has(qr.id)}
                onSelect={() => toggleOne(qr.id)}
                onOpen={() => openDetail(qr.id)}
                onLink={() => openLink(qr)}
                onUnlink={() => askUnlink(qr)}
                onCopy={() => copy(publicUrl(qr.value), 'Enlace copiado')}
              />
            ))}
          </ul>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 text-xs text-text-secondary">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn-outline px-3 py-2 text-sm">
                <ChevronLeft size={16} aria-hidden="true" /> Anterior
              </button>
              <span>{page} / {pagination.pages}</span>
              <button type="button" disabled={page >= pagination.pages} onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} className="btn-outline px-3 py-2 text-sm">
                Siguiente <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Barra de selección */}
      {selected.size > 0 && (
        <div className="sticky bottom-4 z-20 flex animate-slide-up flex-col gap-3 rounded-2xl bg-brand-900 p-3 text-white shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold">{selected.size} {selected.size === 1 ? 'seleccionado' : 'seleccionados'}</span>
            <button type="button" onClick={() => setSelected(new Set())} className="text-xs font-semibold text-white/70 underline underline-offset-2 hover:text-white">
              Quitar
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/70">Exportar para producción:</span>
            <button type="button" onClick={() => exportAs('csv')} disabled={exportBusy} className={`${exportBtn} border border-white/20 bg-white/10 hover:bg-white/20`}>
              <FileText size={14} aria-hidden="true" /> CSV
            </button>
            <button type="button" onClick={() => exportAs('zip')} disabled={exportBusy} className={`${exportBtn} border border-white/20 bg-white/10 hover:bg-white/20`}>
              <Download size={14} aria-hidden="true" /> ZIP
            </button>
            <button type="button" onClick={() => exportAs('pdf')} disabled={exportBusy} className={`${exportBtn} bg-white text-brand-700 hover:bg-brand-50`}>
              {exportBusy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Printer size={14} aria-hidden="true" />} PDF
            </button>
            <button type="button" onClick={doArchive} disabled={archiveBusy} className={`${exportBtn} border border-rose-200/60 bg-rose-900/40 text-rose-200 hover:bg-rose-900/70`}>
              {archiveBusy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <AlertTriangle size={14} aria-hidden="true" />} Archivar
            </button>
          </div>
        </div>
      )}

      {/* ───────── Detalle ───────── */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle del QR" size="lg">
        {detailLoading ? (
          <div className="flex h-56 items-center justify-center"><Loader2 size={24} className="animate-spin text-text-secondary" aria-label="Cargando" /></div>
        ) : !detail ? (
          <p className="py-10 text-center text-sm text-rose-700">No se encontró el código QR.</p>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-[11rem_1fr]">
              <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-xl border border-border bg-white sm:mx-0">
                {detailImage
                  ? <img src={detailImage} alt={`QR ${detail.value}`} className="h-40 w-40" />
                  : <QrCode size={48} className="text-neutral-400" aria-hidden="true" />}
              </div>

              <dl className="grid content-start gap-x-4 gap-y-3 sm:grid-cols-2">
                <Field label="Identificador" wide><span className="break-all font-mono text-xs">{detail.value}</span></Field>
                <Field label="Estado"><StatusBadge map={QR_STATUS} value={detail.status} /></Field>
                <Field label="Impresión">
                  <select
                    value={detail.print_status || ''}
                    disabled={printBusy}
                    onChange={(e) => setPrintStatus(e.target.value)}
                    aria-label="Estado de impresión"
                    className="input !py-1.5 !text-base disabled:opacity-60 sm:!text-xs"
                  >
                    {Object.entries(PRINT_STATUS).map(([id, [label]]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </Field>
                <Field label="Usuario">
                  {detail.user?.email ? (
                    <Link to={`/admin/usuarios?q=${encodeURIComponent(detail.user.email)}`} className="break-all text-brand-600 underline-offset-2 hover:underline">
                      {detail.user.email}
                    </Link>
                  ) : <span className="text-amber-700">Sin asignar</span>}
                </Field>
                <Field label="Pedido">{detail.order?.order_number || '—'}</Field>
                <Field label="Diseño">{detail.order?.design_name || '—'}</Field>
                <Field label="Creado">{fmtDate(detail.created_at)}</Field>
                <Field label="Activado">{fmtDate(detail.activation_at)}</Field>
              </dl>
            </div>

            <div>
              <p className="mb-1.5 text-xs text-text-secondary">Enlace público permanente</p>
              <div className="flex gap-2">
                <input readOnly value={publicUrl(detail.value)} onFocus={(e) => e.target.select()} className="input min-w-0 flex-1 !text-xs font-mono" aria-label="Enlace público" />
                <button type="button" onClick={() => copy(publicUrl(detail.value), 'Enlace copiado')} className="btn-outline flex-none px-3 py-2 text-xs">
                  <Copy size={14} aria-hidden="true" /> Copiar
                </button>
                <a href={publicUrl(detail.value)} target="_blank" rel="noopener noreferrer" className="btn-outline flex-none px-3 py-2 text-xs">
                  <ExternalLink size={14} aria-hidden="true" /> Abrir
                </a>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              {detail.user ? (
                <button type="button" onClick={() => askUnlink(detail)} className="btn-outline px-4 py-2 text-sm !text-rose-700 hover:!bg-rose-50">
                  <Unlink size={16} aria-hidden="true" /> Desvincular
                </button>
              ) : (
                <button type="button" onClick={() => openLink(detail)} className="btn-primary px-4 py-2 text-sm">
                  <Link2 size={16} aria-hidden="true" /> Vincular a un usuario
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ───────── Crear ───────── */}
      <Modal isOpen={createOpen} onClose={closeCreate} title={created ? 'QR creado' : 'Crear QR'}>
        {created ? (
          <div className="space-y-5 text-center">
            <CheckCircle2 size={40} className="mx-auto text-emerald-600" aria-hidden="true" />
            <div>
              <p className="text-sm text-text-secondary">Está sin asignar. Puedes vincularlo ahora o más tarde.</p>
              <p className="mt-2 break-all font-mono text-sm font-semibold text-neutral-900">{created.value}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => openLink(created)} className="btn-primary px-4 py-2 text-sm">
                <Link2 size={16} aria-hidden="true" /> Vincular ahora
              </button>
              <button type="button" onClick={() => copy(publicUrl(created.value), 'Enlace copiado')} className="btn-outline px-4 py-2 text-sm">
                <Copy size={16} aria-hidden="true" /> Copiar enlace
              </button>
              <button type="button" onClick={() => { setCreated(null); setCreateQty(1); }} className="btn-ghost px-4 py-2 text-sm">Crear otro</button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label htmlFor="create-qty" className="mb-1.5 block text-sm font-medium text-neutral-900">¿Cuántos QR?</label>
              <input
                id="create-qty"
                type="number"
                min={1}
                max={100}
                value={createQty}
                onChange={(e) => setCreateQty(e.target.value)}
                className="input !w-28"
              />
              <p className="mt-1.5 text-xs text-text-secondary">Máximo 100. Se crean sin asignar y los vinculas después.</p>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeCreate} disabled={createBusy} className="btn-ghost px-4 py-2 text-sm">Cancelar</button>
              <button type="button" onClick={doCreate} disabled={createBusy} className="btn-primary px-4 py-2 text-sm">
                {createBusy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
                {createBusy ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ───────── Vincular ───────── */}
      <Modal isOpen={!!linkQr} onClose={closeLink} title="Vincular a un usuario">
        {linkQr && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-brand-50/50 p-3">
              <p className="text-xs text-text-secondary">QR</p>
              <p className="break-all font-mono text-sm font-semibold text-neutral-900">{linkQr.value}</p>
            </div>

            <div>
              <label htmlFor="link-search" className="mb-1.5 block text-sm font-medium text-neutral-900">Usuario</label>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
                <input
                  id="link-search"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Buscar por correo"
                  className="input !pl-9"
                  autoComplete="off"
                />
              </div>
              <ul className="custom-scrollbar mt-2 max-h-52 divide-y divide-border overflow-y-auto rounded-xl border border-border" aria-label="Resultados">
                {usersLoading && <li className="flex items-center gap-2 p-3 text-xs text-text-secondary"><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Buscando…</li>}
                {!usersLoading && users.length === 0 && <li className="p-3 text-xs text-text-secondary">No hay usuarios con ese correo.</li>}
                {!usersLoading && users.map((u) => {
                  const on = pickedUser?.id === u.id;
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => setPickedUser(u)}
                        aria-pressed={on}
                        className={`focus-ring flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${on ? 'bg-brand-500/10' : 'hover:bg-brand-50'}`}
                      >
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-500">
                          {(u.email || '?').charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-neutral-900">{u.email}</span>
                        {on && <CheckCircle2 size={16} className="flex-none text-brand-500" aria-hidden="true" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-1.5 text-xs text-text-secondary">Solo usuarios sin un QR vigente.</p>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeLink} disabled={linkBusy} className="btn-ghost px-4 py-2 text-sm">Cancelar</button>
              <button type="button" onClick={doLink} disabled={linkBusy || !pickedUser} className="btn-primary px-4 py-2 text-sm">
                {linkBusy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <User size={16} aria-hidden="true" />}
                {pickedUser ? 'Vincular a este usuario' : 'Elige un usuario'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ───────── Desvincular ───────── */}
      <Modal isOpen={!!unlinkQr} onClose={() => (unlinkBusy ? null : setUnlinkQr(null))} title="Desvincular QR">
        {unlinkQr && (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-text-secondary">
              El QR <span className="font-mono font-semibold text-neutral-900">{unlinkQr.value}</span> dejará de estar asociado
              a <span className="font-semibold text-neutral-900">{unlinkQr.user?.email || 'su usuario'}</span> y quedará desactivado.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setUnlinkQr(null)} disabled={unlinkBusy} className="btn-ghost px-4 py-2 text-sm">Cancelar</button>
              <button type="button" onClick={doUnlink} disabled={unlinkBusy} className="btn-danger px-4 py-2 text-sm">
                {unlinkBusy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                Desvincular
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminQrInventory;