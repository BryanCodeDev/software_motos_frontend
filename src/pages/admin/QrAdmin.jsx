import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock, Copy, Download, ExternalLink, FileText,
  Image as ImageIcon, Layers, Link2, Loader2, Plus, Power, PowerOff, Printer, QrCode, RefreshCw, Search, Trash2,
  Unlink, User, X,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useToast } from '../../components/useToast';
import { Badge } from '../../components/ui-kit';
import Modal from '../../components/Modal';
import StickerExportModal from '../../components/StickerExportModal';
import { useAdminSync } from '../../contexts/useAdminSync';

const PAGE_SIZE = 24;
const panel = 'rounded-2xl border border-border bg-white';
const rise = 'opacity-0 animate-slide-up';

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

/* Franja de color superior de cada tarjeta, según el estado del QR */
const STATUS_ACCENT = {
  active: 'from-emerald-500 to-emerald-300',
  pending_activation: 'from-amber-500 to-amber-300',
  disabled: 'from-rose-500 to-rose-300',
  default: 'from-neutral-200 to-neutral-100',
};

/* Cada tarjeta de resumen es también un filtro */
const VIEWS = [
  { id: 'all', label: 'Todos', icon: Layers, params: {}, count: (s) => s.total },
  { id: 'active', label: 'Activos', icon: CheckCircle2, params: { status: 'active' }, count: (s) => s.by_status?.active },
  { id: 'pending', label: 'Por activar', icon: Clock, params: { status: 'pending_activation' }, count: (s) => s.by_status?.pending_activation },
  { id: 'unlinked', label: 'Sin vincular', icon: Unlink, params: { linked: 'false' }, count: (s) => s.unlinked },
];

/* Acciones sobre un QR: una sola definición para tarjeta individual y lote */
const CALLS = {
  activate: (id) => api.post(`/admin/qrs/${id}/activate`),
  deactivate: (id) => api.post(`/admin/qrs/${id}/deactivate`),
  delete: (id) => api.delete(`/admin/qrs/${id}`),
};
const BULK_WORDS = {
  activate: ['activado', 'activar'],
  deactivate: ['desactivado', 'desactivar'],
  delete: ['eliminado', 'eliminar'],
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDay = (d) =>
  d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const publicUrl = (v) => `${window.location.origin}/e/${v}`;

const saveBlob = (blob, fileName) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

const downloadBlob = async (url, fileName) => {
  const res = await api.get(url, { responseType: 'blob' });
  saveBlob(new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' }), fileName);
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

const TONES = {
  neutral: 'text-text-secondary hover:bg-brand-50 hover:text-brand-600',
  success: 'text-text-secondary hover:bg-emerald-50 hover:text-emerald-700',
  warn: 'text-text-secondary hover:bg-amber-50 hover:text-amber-700',
  danger: 'text-text-secondary hover:bg-rose-50 hover:text-rose-700',
};

const IconButton = ({ icon: Icon, label, onClick, tone = 'neutral', busy = false, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy || disabled}
    aria-label={label}
    title={label}
    className={`focus-ring flex h-8 w-8 flex-none items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${TONES[tone]}`}
  >
    {busy ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Icon size={15} aria-hidden="true" />}
  </button>
);

/* ───────── Tarjeta de QR ───────── */
  const QrCard = ({
    qr, index, selected, busy, onSelect, onOpen, onLink, onUnlink, onCopy, onDownload, onSticker, onAction, onDelete,
  }) => {
    const linked = Boolean(qr && qr.user_id);
    const accent = STATUS_ACCENT[qr.status] || STATUS_ACCENT.default;

  return (
    <li
      style={{ animationDelay: `${Math.min(index, 11) * 35}ms` }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card ${rise} ${
        selected ? 'border-brand-500/70 bg-brand-50/70 ring-1 ring-brand-500/30' : 'border-border bg-white hover:border-brand-500/40'
      }`}
    >
      {/* Barra de color por estado (arriba) */}
      <span aria-hidden="true" className={`h-1 w-full bg-gradient-to-r ${accent}`} />

      <div className="flex flex-1 flex-col p-4">
        {/* Fila superior: código QR grande + código alfanumérico + checkbox */}
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-brand-50 border border-brand-100 text-brand-700 shadow-sm transition-transform duration-300 group-hover:scale-105">
            <QrCode size={24} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 text-[10px] font-semibold uppercase tracking-wider">
                QR
              </span>
              <span className="ml-0.5 text-sm font-mono font-semibold text-neutral-900 truncate" title={qr.value}>
                {qr.value}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-text-secondary">Creado {fmtDay(qr.created_at)}</p>
          </div>
          <div className="flex-none mt-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              className="mt-1 h-4 w-4 rounded border-brand-500 text-brand-500 focus:ring-0"
              aria-label={`Seleccionar ${qr.value}`}
              title={linked ? 'Seleccionar para exportar (no se puede modificar ni eliminar)' : 'Seleccionar QR'}
            />
          </div>
        </div>

        {/* Estados con mejor jerarquía visual */}
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge map={QR_STATUS} value={qr.status} />
          <StatusBadge map={PRINT_STATUS} value={qr.print_status} />
        </div>

        {/* Datos clave en tarjeta destacada */}
        <div className="mt-4 rounded-xl border border-border bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex-none w-20 text-xs font-semibold text-text-secondary uppercase tracking-wide">Usuario</dt>
            <dd className={`min-w-0 font-medium ${linked ? 'text-neutral-900' : 'text-rose-600'}`} title={qr.user?.email}>
              {linked ? qr.user?.email : 'Sin asignar'}
            </dd>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <dt className="flex-none w-20 text-xs font-semibold text-text-secondary uppercase tracking-wide">Pedido</dt>
            <dd className="min-w-0 truncate font-medium text-neutral-900">{qr.order?.order_number || '—'}</dd>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <dt className="flex-none w-20 text-xs font-semibold text-text-secondary uppercase tracking-wide">Diseño</dt>
            <dd className="flex min-w-0 items-center gap-1.5 font-medium text-neutral-900">
              {qr.order?.design_image_url && (
                <img src={qr.order.design_image_url} alt="" className="h-5 w-5 flex-none rounded object-cover" />
              )}
              <span className="truncate">{qr.order?.design_name || '—'}</span>
            </dd>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-border/50">
          <button type="button" onClick={onOpen} className="btn-outline px-3 py-2 text-xs">Ver detalles</button>
          {linked ? (
            <button type="button" onClick={onUnlink} className="btn-outline px-3 py-2 text-xs !text-rose-700 hover:!bg-rose-50">
              <Unlink size={14} aria-hidden="true" /> Desvincular
            </button>
          ) : (
            <button type="button" onClick={onLink} className="btn-primary px-3 py-2 text-xs">
              <Link2 size={14} aria-hidden="true" /> Vincular
            </button>
          )}
        </div>
      </div>

      {/* Acciones rápidas (iconos) */}
      <div className="flex items-center gap-0.5 border-t border-border bg-neutral-50/70 px-2 py-1.5">
        <IconButton icon={Copy} label="Copiar enlace público" onClick={onCopy} />
        <IconButton icon={Download} label="Descargar código QR" onClick={onDownload} />
        <IconButton icon={ImageIcon} label="Exportar sticker con QR" onClick={onSticker} />
        {!linked && (
          <span className="ml-auto flex items-center gap-0.5">
            {qr.status === 'disabled' && (
              <IconButton icon={Power} label="Activar" tone="success" busy={busy === 'activate'} disabled={!!busy} onClick={() => onAction('activate')} />
            )}
            {qr.status === 'active' && (
              <IconButton icon={PowerOff} label="Desactivar" tone="warn" busy={busy === 'deactivate'} disabled={!!busy} onClick={() => onAction('deactivate')} />
            )}
            <IconButton icon={Trash2} label="Eliminar" tone="danger" disabled={!!busy} onClick={onDelete} />
          </span>
        )}
      </div>
    </li>
  );
};
const Sep = () => <span aria-hidden="true" className="hidden h-6 w-px bg-white/15 lg:block" />;

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

  /* Selección: Map id → QR, así sobrevive entre páginas sin perder los datos del QR */
  const [selected, setSelected] = useState(() => new Map());
  const [exportBusy, setExportBusy] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(null); // 'archive' | 'activate' | 'deactivate' | 'delete'
  const [rowBusy, setRowBusy] = useState(null); // { id, action }
  const [deleteTarget, setDeleteTarget] = useState(null); // lista de QR a eliminar

  /* Exportar sticker */
  const [stickerExportOpen, setStickerExportOpen] = useState(false);
  const [stickerExportQr, setStickerExportQr] = useState(null);

  /* Diseños disponibles para asignar por lote a la selección */
  const [designs, setDesigns] = useState([]);
  const [designsLoading, setDesignsLoading] = useState(false);
  const [bulkDesignId, setBulkDesignId] = useState(null);

  /* Parámetros de impresión de stickers de vinilo */
  const [stickerSize, setStickerSize] = useState('5x5');
  const [stickerWidth, setStickerWidth] = useState('');
  const [stickerHeight, setStickerHeight] = useState('');

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

  /* Evitan que una respuesta lenta pise a una más reciente */
  const listReq = useRef(0);
  const detailReq = useRef(0);

  const refreshLocal = () => setTick((t) => t + 1);
  const refreshAll = () => { refreshLocal(); globalRefresh(); };

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/qrs/stats');
      setStats(data);
    } catch {
      /* las cifras no son críticas */
    }
  }, []);

  const loadDesigns = useCallback(async () => {
    setDesignsLoading(true);
    try {
      const { data } = await api.get('/products');
      const products = data.products || data || [];
      const sticker = products.find((p) => p.slug === 'sticker-qr-personalizado');
      if (!sticker) { setDesigns([]); return; }
      const dRes = await api.get(`/designs?product_id=${sticker.id}`);
      setDesigns(dRes.data.designs || dRes.data || []);
    } catch {
      setDesigns([]);
    } finally {
      setDesignsLoading(false);
    }
  }, []);

  const loadQrs = useCallback(async () => {
    const reqId = ++listReq.current;
    setLoading(true);
    setError(null);
    try {
      const query = { ...VIEWS.find((v) => v.id === view).params, page, limit: PAGE_SIZE };
      if (q) query.q = q;
      if (print) query.print_status = print;
      const { data } = await api.get('/admin/qrs', { params: query });
      if (reqId !== listReq.current) return;
      setQrs((data.qrs || []).filter(Boolean));
      setPagination(data.pagination || { page: 1, pages: 0, total: 0 });
    } catch (e) {
      if (reqId !== listReq.current) return;
      setError(e?.response?.data?.error || 'No se pudieron cargar los códigos QR');
    } finally {
      if (reqId === listReq.current) setLoading(false);
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
    const t = setTimeout(loadDesigns, 0);
    return () => clearTimeout(t);
  }, [loadDesigns, tick, refreshKey]);

  useEffect(() => {
    const t = setTimeout(() => { setQ(input.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [input]);

  /* Si al borrar/archivar la última página queda vacía, vuelve a la última que exista */
  useEffect(() => {
    const t = setTimeout(() => {
      if (!loading && pagination.pages > 0 && page > pagination.pages) setPage(pagination.pages);
    }, 0);
    return () => clearTimeout(t);
  }, [loading, pagination.pages, page]);

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

  /* Selección (todos los QR se pueden seleccionar para exportar; solo los no vinculados para modificar) */
  const selectable = qrs; // exportar: se pueden seleccionar vinculados y no vinculados
  const modifiable = qrs.filter((x) => !x.user_id); // activar/desactivar/eliminar/asignar diseño: solo no vinculados
  const allSelected = selectable.length > 0 && selectable.every((x) => selected.has(x.id));
  const toggleOne = (qr) => setSelected((prev) => {
    const n = new Map(prev);
    if (n.has(qr.id)) n.delete(qr.id); else n.set(qr.id, qr);
    return n;
  });
  const toggleAll = () => setSelected((prev) => {
    const n = new Map(prev);
    if (allSelected) selectable.forEach((x) => n.delete(x.id));
    else selectable.forEach((x) => n.set(x.id, x));
    return n;
  });
  const clearSelection = () => setSelected(new Map());

  const picked = [...selected.values()];
  const modifiablePicked = picked.filter((x) => !x.user_id);
  const activatable = modifiablePicked.filter((x) => x.status === 'disabled');
  const deactivatable = modifiablePicked.filter((x) => x.status === 'active');
  const deletable = modifiablePicked;
  const exportable = picked;

  /* Acción sobre un QR individual */
  const runRow = async (qr, kind) => {
    if (rowBusy) return;
    setRowBusy({ id: qr.id, action: kind });
    try {
      await CALLS[kind](qr.id);
      toast.success(`QR ${BULK_WORDS[kind][0]}`);
      setSelected((prev) => { const n = new Map(prev); n.delete(qr.id); return n; });
      refreshAll();
    } catch (e) {
      toast.error(e?.response?.data?.error || `No se pudo ${BULK_WORDS[kind][1]} el QR`);
    } finally {
      setRowBusy(null);
    }
  };

  /* Acción en lote (también la usa «Eliminar» tras confirmar) */
  const runBulk = async (kind, targets) => {
    if (!targets.length || bulkBusy) return;
    setBulkBusy(kind);
    let ok = 0;
    let fail = 0;
    try {
      for (const t of targets) {
        try {
          await CALLS[kind](t.id);
          ok += 1;
        } catch {
          fail += 1;
        }
      }
    } finally {
      setBulkBusy(null);
    }
    const [done, infinitive] = BULK_WORDS[kind];
    if (ok) toast.success(`${ok} QR ${done}${ok !== 1 ? 's' : ''}`);
    if (fail) toast.error(`${fail} QR no se pudieron ${infinitive}`);
    clearSelection();
    refreshAll();
  };

  /* Asignar diseño a la selección actual en lote */
  const doSetDesign = async () => {
    if (!selected.size || bulkDesignId === null && bulkDesignId !== 0) return;
    if (bulkBusy) return;
    setBulkBusy('design');
    try {
      const { data } = await api.patch('/admin/qrs/bulk/design', {
        qr_ids: [...selected.keys()],
        design_id: bulkDesignId === null ? null : bulkDesignId,
      });
      if (data && data.ok) {
        toast.success(data.message || `Diseño asignado a ${data.ok} QR`);
        clearSelection();
        refreshAll();
      } else {
        toast.error(data?.error || 'No se pudo asignar el diseño');
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo asignar el diseño');
    } finally {
      setBulkBusy(null);
      setBulkDesignId(null);
    }
  };

  /* Asignar diseño y exportar a PDF en un solo archivo */
  const doSetDesignAndExportPdf = async () => {
    if (!selected.size) return;
    if (bulkBusy) return;
    setBulkBusy('design');
    try {
      const { data } = await api.patch('/admin/qrs/bulk/design', {
        qr_ids: [...selected.keys()],
        design_id: bulkDesignId === null ? null : bulkDesignId,
      });
      if (data && data.ok) {
        await downloadBlob(`/admin/qrs/export/pdf?ids=${[...selected.keys()].join(',')}`, `qrs-diseno-${bulkDesignId ?? 'sin-diseno'}.pdf`);
        toast.success(`${data.ok} QR con diseño asignados y exportados a PDF`);
        clearSelection();
        refreshAll();
      } else {
        toast.error(data?.error || 'No se pudo asignar el diseño');
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo asignar el diseño y exportar');
    } finally {
      setBulkBusy(null);
      setBulkDesignId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await runBulk('delete', deleteTarget);
    setDeleteTarget(null);
  };

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
    refreshAll();
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

  const openStickerExport = (qr) => { setStickerExportQr(qr); setStickerExportOpen(true); };

  const doLink = async () => {
    if (!linkQr || !pickedUser) return;

    /* Validación previa para evitar conflictos 409 del servidor */
    const currentUserId = linkQr.user_id ?? linkQr.user?.id;
    if (currentUserId && currentUserId !== pickedUser.id) {
      toast.error(`El QR ya está vinculado a ${linkQr.user?.email || 'otro usuario'}`);
      return;
    }
    if (linkQr.print_status === 'printed' || linkQr.print_status === 'delivered' || linkQr.status === 'replaced') {
      toast.error('No se puede vincular un QR que ya está impreso, entregado o reemplazado.');
      return;
    }

    /* Verificar que el usuario destino no tenga ya un QR vigente */
    try {
      const { data } = await api.get('/admin/qrs', { params: { user_id: pickedUser.id, limit: 1 } });
      if (data.qrs && data.qrs.length > 0) {
        toast.error(`El usuario ${pickedUser.email} ya tiene un QR vinculado.`);
        return;
      }
    } catch {
      /* Si falla la consulta previa, se continúa y el servidor responderá si hay conflicto */
    }

    setLinkBusy(true);
    try {
      await api.post('/admin/qrs/link', { qr_id: linkQr.id, user_id: pickedUser.id });
      toast.success(`QR vinculado a ${pickedUser.email}`);
      setLinkQr(null);
      setPickedUser(null);
      refreshAll();
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

    /* Validación previa para evitar conflictos 409 del servidor */
    if (!unlinkQr.user_id && !unlinkQr.user) {
      toast.error('Este QR no está vinculado a ningún usuario.');
      return;
    }
    if (unlinkQr.print_status === 'delivered') {
      toast.error('No se puede desvincular un QR ya entregado.');
      return;
    }

    setUnlinkBusy(true);
    try {
      await api.post('/admin/qrs/unlink', { qr_id: unlinkQr.id });
      toast.success('QR desvinculado');
      setUnlinkQr(null);
      refreshAll();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo desvincular el QR');
    } finally {
      setUnlinkBusy(false);
    }
  };

  /* Detalle */
  const openDetail = async (id) => {
    const reqId = ++detailReq.current;
    setDetail(null);
    setDetailImage(null);
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const { data } = await api.get(`/admin/qrs/${id}`);
      if (reqId !== detailReq.current) return;
      setDetail(data.identifier || null);
      try {
        const res = await api.get(`/admin/qrs/${id}/qr`, { responseType: 'blob' });
        if (reqId === detailReq.current) setDetailImage(URL.createObjectURL(new Blob([res.data], { type: 'image/png' })));
      } catch {
        if (reqId === detailReq.current) setDetailImage(null);
      }
    } catch (e) {
      if (reqId !== detailReq.current) return;
      toast.error(e?.response?.data?.error || 'No se pudo cargar el detalle');
      setDetailOpen(false);
    } finally {
      if (reqId === detailReq.current) setDetailLoading(false);
    }
  };

  const setPrintStatus = async (status) => {
    if (!detail || !status || status === detail.print_status) return;
    setPrintBusy(true);
    try {
      await api.post(`/admin/qrs/${detail.id}/print-status`, { print_status: status });
      toast.success(`Impresión: ${PRINT_STATUS[status][0]}`);
      setDetail((d) => (d ? { ...d, print_status: status } : d));
      refreshAll();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo actualizar el estado');
    } finally {
      setPrintBusy(false);
    }
  };

  /* Descargar QR individual (imagen real del código) */
  const downloadQr = async (qr) => {
    try {
      const res = await api.get(`/admin/qrs/${qr.id}/qr`, { responseType: 'blob' });
      saveBlob(new Blob([res.data], { type: 'image/png' }), `qr-emergencia-${qr.value}.png`);
      toast.success('QR descargado');
    } catch {
      toast.error('No se pudo descargar el QR');
    }
  };

  /* Exportar selección */
  const exportAs = async (format) => {
    if (!selected.size) return;
    setExportBusy(true);
    try {
      const params = new URLSearchParams({
        ids: [...selected.keys()].join(','),
        format,
        size: stickerSize || '5x5',
        width_mm: stickerWidth || '',
        height_mm: stickerHeight || '',
      });
      await downloadBlob(`/admin/qrs/export/${format}?${params.toString()}`, `stickers-${stickerSize || '5x5'}mm-${format}`);
      toast.success(`${selected.size} QR exportados a ${format.toUpperCase()}`);
      clearSelection();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo exportar');
    } finally {
      setExportBusy(false);
    }
  };

  const s = stats || {};
  const busyAny = exportBusy || !!bulkBusy;
  const barBtn = 'focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';
  const barGlass = `${barBtn} border border-white/20 bg-white/10 hover:bg-white/20`;

  return (
    <div className="space-y-5">
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
      <div role="group" aria-label="Filtrar por estado" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {VIEWS.map((v, i) => {
          const active = view === v.id;
          const n = v.count(s);
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={active}
              onClick={() => pickView(v.id)}
              style={{ animationDelay: `${i * 50}ms` }}
              className={`focus-ring group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 ${rise} ${
                active
                  ? 'border-transparent bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow'
                  : 'border-border bg-white hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-soft'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${
                  active ? 'bg-white/20 text-white' : 'bg-brand-500/10 text-brand-500'
                }`}
              >
                <Icon size={18} aria-hidden="true" />
              </span>
              <p className={`mt-3 text-xs font-medium ${active ? 'text-white/80' : 'text-text-secondary'}`}>{v.label}</p>
              <p className={`mt-0.5 text-2xl font-bold tracking-tight ${active ? 'text-white' : 'text-neutral-900'}`}>{n ?? '—'}</p>
            </button>
          );
        })}
      </div>

      <div className={`${panel} flex flex-col gap-3 p-3 shadow-soft sm:flex-row sm:items-center lg:p-4`}>
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
        <div className="flex animate-fade-in items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700" role="alert">
          <AlertTriangle size={18} className="flex-none" aria-hidden="true" />
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" onClick={refreshLocal} className="flex-none font-semibold underline underline-offset-2">Reintentar</button>
        </div>
      )}

      {loading && qrs.length === 0 && !error && (
        <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-72 rounded-2xl bg-border/60" />)}
        </div>
      )}

      {!loading && !error && qrs.length === 0 && (
        <div className={`${panel} flex animate-fade-in flex-col items-center p-12 text-center`}>
          <span className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
            <span aria-hidden="true" className="absolute inset-0 rounded-2xl bg-brand-500/20 animate-pulse-ring" />
            <QrCode size={24} aria-hidden="true" />
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
            <label className={`inline-flex items-center gap-2 ${qrs.length ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
              <input
                type="checkbox"
                checked={allSelected}
                disabled={!qrs.length}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-brand-500 text-brand-500 focus:ring-0"
              />
              Seleccionar esta página
              {qrs.length > 0 && (
                <span className="text-text-muted">({modifiable.length} modificables · {qrs.length - modifiable.length} vinculados)</span>
              )}
            </label>
            <span aria-live="polite">
              <span className="font-semibold text-neutral-900">{pagination.total}</span> {pagination.total === 1 ? 'código' : 'códigos'}
            </span>
          </div>

          <ul className={`grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
            {qrs.map((qr, i) => (
              <QrCard
                key={qr.id}
                qr={qr}
                index={i}
                selected={selected.has(qr.id)}
                busy={rowBusy?.id === qr.id ? rowBusy.action : null}
                onSelect={() => toggleOne(qr)}
                onOpen={() => openDetail(qr.id)}
                onLink={() => openLink(qr)}
                onUnlink={() => askUnlink(qr)}
                onCopy={() => copy(publicUrl(qr.value), 'Enlace copiado')}
                onDownload={() => downloadQr(qr)}
                onSticker={() => openStickerExport(qr)}
                onAction={(kind) => runRow(qr, kind)}
                onDelete={() => setDeleteTarget([qr])}
              />
            ))}
          </ul>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 text-xs text-text-secondary">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn-outline px-3 py-2 text-sm">
                <ChevronLeft size={16} aria-hidden="true" /> Anterior
              </button>
              <span className="min-w-16 text-center font-medium">{page} / {pagination.pages}</span>
              <button type="button" disabled={page >= pagination.pages} onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} className="btn-outline px-3 py-2 text-sm">
                Siguiente <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Barra de selección */}
      {selected.size > 0 && (
        <div className="sticky bottom-4 z-20 flex animate-slide-up flex-col gap-2 rounded-2xl border border-white/10 bg-brand-900/95 p-2.5 text-white shadow-card backdrop-blur lg:flex-row lg:items-center lg:justify-between lg:p-3">
          <div className="flex items-center gap-2 text-sm">
            <button type="button" onClick={clearSelection} className="text-xs font-semibold text-white/70 underline underline-offset-2 hover:text-white">
              Quitar
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Configuración de impresión de stickers (tamaño y cantidad) */}
            <div className="flex items-center gap-2 flex-wrap min-w-[200px]">
              <select
                value={stickerSize}
                onChange={(e) => setStickerSize(e.target.value)}
                aria-label="Tamaño sticker"
                className="input !py-2 !px-2 !text-xs sm:!text-sm bg-white border border-brand-200 text-neutral-900 focus:ring-brand-500"
              >
                <option value="5x5">5×5 cm</option>
                <option value="50x100">50×100 cm</option>
                <option value="100x100">100×100 cm</option>
                <option value="custom">Personalizado</option>
              </select>
              {stickerSize === 'custom' && (
                <>
                  <input
                    type="number"
                    value={stickerWidth}
                    onChange={(e) => setStickerWidth(e.target.value)}
                    placeholder="Ancho mm"
                    aria-label="Ancho sticker mm"
                    className="input !py-2 !px-2 !text-xs w-20 bg-white border border-brand-200 text-neutral-900 focus:ring-brand-500"
                  />
                  <span className="text-[10px] text-text-secondary">×</span>
                  <input
                    type="number"
                    value={stickerHeight}
                    onChange={(e) => setStickerHeight(e.target.value)}
                    placeholder="Alto mm"
                    aria-label="Alto sticker mm"
                    className="input !py-2 !px-2 !text-xs w-20 bg-white border border-brand-200 text-neutral-900 focus:ring-brand-500"
                  />
                </>
              )}
            </div>

            <Sep />

            <button type="button" onClick={() => exportAs('csv')} disabled={busyAny} className={barGlass}>
              <FileText size={13} aria-hidden="true" />
              <span className="hidden sm:inline ml-1">CSV</span>
            </button>
            <button type="button" onClick={() => exportAs('zip')} disabled={busyAny} className={barGlass}>
              <Download size={13} aria-hidden="true" />
              <span className="hidden sm:inline ml-1">ZIP</span>
            </button>
            <button type="button" onClick={() => exportAs('pdf')} disabled={busyAny} className={`${barBtn} bg-white text-brand-700 hover:bg-brand-50`}>
              {exportBusy ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Printer size={13} aria-hidden="true" />}
              <span className="hidden sm:inline ml-1">PDF</span>
            </button>

            <Sep />

            {/* Asignar diseño a la selección en lote */}
            {!designsLoading && designs.length > 0 && (
              <div className="flex items-center gap-1.5">
                <select
                  value={bulkDesignId ?? ''}
                  onChange={(e) => setBulkDesignId(e.target.value === '' ? null : Number(e.target.value))}
                  disabled={bulkBusy === 'design'}
                  aria-label="Diseño para lote"
                  className="input !py-2 !px-2 !text-xs sm:!text-sm bg-white border border-brand-200 text-brand-700 focus:ring-brand-500"
                >
                  <option value="">Sin diseño</option>
                  {designs.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={doSetDesign}
                  disabled={busyAny || !designs.length || bulkDesignId === undefined}
                  className={`${barBtn} border border-brand-300/40 bg-brand-900/40 text-brand-200 hover:bg-brand-900/70`}
                >
                  {bulkBusy === 'design' ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Layers size={13} aria-hidden="true" />}
                  <span className="hidden sm:inline ml-1">Asignar diseño{bulkDesignId ? ` (${selected.size})` : ''}</span>
                </button>

                <button
                  type="button"
                  onClick={doSetDesignAndExportPdf}
                  disabled={busyAny || !designs.length || bulkDesignId === undefined}
                  className={`${barBtn} border border-brand-400/50 bg-brand-900/60 text-brand-100 hover:bg-brand-700`}
                >
                  {bulkBusy === 'design' ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Printer size={13} aria-hidden="true" />}
                  <span className="hidden sm:inline ml-1">Diseño + PDF{bulkDesignId ? ` (${selected.size})` : ''}</span>
                </button>
              </div>
            )}

            <Sep />

            <button type="button" onClick={() => runBulk('activate', activatable)} disabled={busyAny || !activatable.length} className={`${barBtn} border border-emerald-300/40 bg-emerald-900/40 text-emerald-200 hover:bg-emerald-900/70`}>
              {bulkBusy === 'activate' ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Power size={13} aria-hidden="true" />}
              <span className="hidden sm:inline ml-1">Activar{activatable.length ? ` (${activatable.length})` : ''}</span>
            </button>
            <button type="button" onClick={() => runBulk('deactivate', deactivatable)} disabled={busyAny || !deactivatable.length} className={`${barBtn} border border-amber-300/40 bg-amber-900/40 text-amber-200 hover:bg-amber-900/70`}>
              {bulkBusy === 'deactivate' ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <PowerOff size={13} aria-hidden="true" />}
              <span className="hidden sm:inline ml-1">Desactivar{deactivatable.length ? ` (${deactivatable.length})` : ''}</span>
            </button>

            <Sep />

            <button type="button" onClick={() => setDeleteTarget(deletable)} disabled={busyAny || !deletable.length} className={`${barBtn} border border-rose-300/40 bg-rose-900/40 text-rose-200 hover:bg-rose-900/70`}>
              <Trash2 size={13} aria-hidden="true" />
              <span className="hidden sm:inline ml-1">Eliminar{deletable.length ? ` (${deletable.length})` : ''}</span>
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
              <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-white to-brand-50 shadow-soft sm:mx-0">
                {detailImage
                  ? <img src={detailImage} alt={`QR ${detail.value}`} className="h-40 w-40 animate-fade-in" />
                  : <QrCode size={48} className="text-neutral-200" aria-hidden="true" />}
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

            <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => downloadQr(detail)} className="btn-outline px-3 py-2 text-xs">
                  <Download size={14} aria-hidden="true" /> Descargar QR
                </button>
                <button type="button" onClick={() => openStickerExport(detail)} className="btn-outline px-3 py-2 text-xs">
                  <ImageIcon size={14} aria-hidden="true" /> Sticker
                </button>
              </div>
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
            <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
              <span aria-hidden="true" className="absolute inset-0 rounded-full bg-emerald-500/30 animate-pulse-ring" />
              <CheckCircle2 size={28} aria-hidden="true" />
            </span>
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

      {/* ───────── Eliminar (individual o en lote) ───────── */}
      <Modal isOpen={!!deleteTarget} onClose={() => (bulkBusy === 'delete' ? null : setDeleteTarget(null))} title="Eliminar QR">
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-rose-700">
              <AlertTriangle size={18} className="mt-0.5 flex-none" aria-hidden="true" />
              <p className="text-sm leading-relaxed">
                Se eliminará de forma permanente{' '}
                {deleteTarget.length === 1
                  ? <>el código QR <span className="break-all font-mono font-semibold">{deleteTarget[0].value}</span></>
                  : <span className="font-semibold">{deleteTarget.length} códigos QR</span>}
                . Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={bulkBusy === 'delete'} className="btn-ghost px-4 py-2 text-sm">Cancelar</button>
              <button type="button" onClick={confirmDelete} disabled={bulkBusy === 'delete'} className="btn-danger px-4 py-2 text-sm">
                {bulkBusy === 'delete' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {bulkBusy === 'delete' ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ───────── Exportar sticker ───────── */}
      <StickerExportModal
        isOpen={stickerExportOpen}
        onClose={() => setStickerExportOpen(false)}
        qr={stickerExportQr}
      />
    </div>
  );
};

export default AdminQrInventory;