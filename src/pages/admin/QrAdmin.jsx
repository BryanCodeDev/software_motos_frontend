import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  AlertTriangle, Barcode, Check, CheckCircle2, Copy, Download, ExternalLink, FileText,
  Loader2, Package, Plus, Printer, QrCode, RefreshCw, Search, Sticker, Users,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { Label } from '../../components/ui';
import { Badge, StatCard } from '../../components/ui-kit';
import Modal from '../../components/Modal';
import { routes } from '../../utils/routes';

/* ───────── Constantes de diseño ───────── */
const EASE = [0.22, 1, 0.36, 1];
const PAGE_SIZE = 25;
const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';
const card = panel + ' p-4 sm:p-5';
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };

const QR_STATUS_LABEL = { pending_activation: 'Pendiente de activación', active: 'Activo', disabled: 'Deshabilitado', deactivated: 'Desvinculado', replaced: 'Reemplazado', retired: 'Retirado' };
const QR_STATUS_TONE = { pending_activation: 'warn', active: 'success', disabled: 'danger', deactivated: 'neutral', replaced: 'neutral', retired: 'neutral' };
const PRINT_LABEL = { pending_print: 'Pendiente de impresión', sent_to_print: 'Enviado a impresión', printed: 'Impreso', dispatched: 'Despachado', delivered: 'Entregado', cancelled: 'Cancelado' };
const PRINT_TONE = { pending_print: 'neutral', sent_to_print: 'info', printed: 'success', dispatched: 'success', delivered: 'success', cancelled: 'neutral' };

const fmtDate = (d) => d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const publicUrl = (v) => `${window.location.origin}/e/${v}`;

const downloadBlob = async (url, fileName) => {
  const res = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};

const copyText = async (text) => {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
};

/* ───────── Piezas UI ───────── */
const QrStatusBadge = ({ status }) => (
  <Badge tone={QR_STATUS_TONE[status] || 'neutral'} size="sm">{QR_STATUS_LABEL[status] || status}</Badge>
);

const PrintStatusBadge = ({ status }) => (
  <Badge tone={PRINT_TONE[status] || 'neutral'} size="sm">{PRINT_LABEL[status] || status}</Badge>
);

/* ───────── Página: Administración QR ───────── */
export const AdminQrInventory = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [qrs, setQrs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ q: '', status: '', print_status: '', linked: '', from: '', to: '', design: '' });
  const [page, setPage] = useState(1);
  const [busyIds, setBusyIds] = useState(new Set());
  const [exportBusy, setExportBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal de vinculación
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkQrId, setLinkQrId] = useState(null);
  const [linkUserId, setLinkUserId] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);

  // Modal detalle
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailImage, setDetailImage] = useState(null);
  const [detailBusy, setDetailBusy] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/qrs/stats');
      setStats(data);
    } catch {
      // no bloquear la página si fallan las stats
    }
  }, []);

  const loadQrs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      if (filters.status) params.set('status', filters.status);
      if (filters.print_status) params.set('print_status', filters.print_status);
      if (filters.linked) params.set('linked', filters.linked);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.design) params.set('design', filters.design);
      params.set('page', String(page));
      params.set('limit', String(pagination.limit));
      const { data } = await api.get(`/admin/qrs?${params}`);
      setQrs(data.qrs || []);
      setPagination(data.pagination || { page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudieron cargar los códigos QR');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pagination.limit, toast]);

  useEffect(() => {
    const t = setTimeout(() => { loadStats(); loadQrs(); }, 0);
    return () => clearTimeout(t);
  }, [loadStats, loadQrs]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ q: '', status: '', print_status: '', linked: '', from: '', to: '', design: '' });
    setPage(1);
  };

  const toggleSelect = (id) =>
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const toggleSelectAll = () => {
    if (qrs.length > 0 && qrs.every((q) => selectedIds.has(q.id))) setSelectedIds(new Set());
    else setSelectedIds(new Set(qrs.map((q) => q.id)));
  };

  const toggleLinkOpen = (qrId = null) => {
    setLinkOpen(!linkOpen);
    if (!linkOpen && qrId) {
      setLinkQrId(qrId);
      setLinkUserId('');
      loadAvailableUsers();
    } else {
      setLinkQrId(null);
      setLinkUserId('');
      setAvailableUsers([]);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const { data } = await api.get('/admin/users', { params: { q: '', role: 'user', page: 1, limit: 200 } });
      setAvailableUsers((data.users || []));
    } catch {
      setAvailableUsers([]);
    }
  };

  const doLink = async () => {
    if (!linkQrId || !linkUserId) return;
    setLinkLoading(true);
    try {
      await api.post('/admin/qrs/link', { qr_id: linkQrId, user_id: linkUserId });
      toast.success('QR vinculado al usuario');
      setLinkOpen(false);
      setLinkQrId(null);
      setLinkUserId('');
      setAvailableUsers([]);
      loadQrs();
      loadStats();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo vincular el QR');
    } finally {
      setLinkLoading(false);
    }
  };

  const doUnlink = async (qrId) => {
    if (!confirm('¿Desvincular este QR de su usuario? El QR quedará desactivado y sin propietario.')) return;
    const id = qrId;
    setBusyIds((prev) => new Set([...prev, id]));
    try {
      await api.post('/admin/qrs/unlink', { qr_id: id });
      toast.success('QR desvinculado');
      loadQrs();
      loadStats();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo desvincular el QR');
    } finally {
      setBusyIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

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
        const objectUrl = URL.createObjectURL(new Blob([res.data], { type: 'image/png' }));
        setDetailImage(objectUrl);
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

  const doSetPrintStatus = async (id, printStatus) => {
    setDetailBusy(id);
    setBusyIds((prev) => new Set([...prev, id]));
    try {
      await api.post(`/admin/qrs/${id}/print-status`, { print_status: printStatus });
      toast.success(`Estado de impresión: ${PRINT_LABEL[printStatus]}`);
      setDetail((d) => d ? { ...d, print_status: printStatus } : d);
      loadQrs();
      loadStats();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo actualizar el estado');
    } finally {
      setDetailBusy(null);
      setBusyIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleExport = async (format) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setExportBusy(true);
    try {
      const idParam = ids.join(',');
      if (format === 'csv') {
        await downloadBlob(`/admin/qrs/export/csv?ids=${idParam}`, 'qrs-produccion.csv');
      } else if (format === 'zip') {
        await downloadBlob(`/admin/qrs/export/zip?ids=${idParam}`, 'qrs-produccion.zip');
      } else if (format === 'pdf') {
        await downloadBlob(`/admin/qrs/export/pdf?ids=${idParam}`, 'qrs-produccion.pdf');
      }
      toast.success(`${ids.length} código(s) QR exportado(s) para producción`);
      clearSelection();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al exportar');
    } finally {
      setExportBusy(false);
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const statsMemo = useMemo(() => stats || {}, [stats]);
  const busy = (id) => busyIds.has(id) || detailBusy === id;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center p-10">
      <Loader2 size={24} className="animate-spin" aria-label="Cargando" />
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 lg:space-y-6">
        <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageTitle
            title="Administración QR"
            description="Todos los códigos QR del sistema. Un QR por usuario, enlace permanente, diseño de sticker y estado de producción."
            actions={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
                <Button variant="outline" size="sm" onClick={() => { loadStats(); loadQrs(); }} disabled={loading}>
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Actualizar
                </Button>
                <Button variant="outline" size="sm" onClick={toggleLinkOpen}>
                  <Plus size={14} aria-hidden="true" /> Vincular QR a usuario
                </Button>
              </div>
            }
          />
        </motion.div>

        {/* KPIs */}
        <motion.div variants={item} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
          <StatCard label="QR registrados" value={statsMemo.total ?? '—'} icon={Barcode} tone="bg-brand-500" hint="Identificadores en el sistema" />
          <StatCard label="QR activos" value={statsMemo.by_status?.active ?? '—'} icon={Check} tone="bg-emerald-500" hint="Listos para usar" />
          <StatCard label="Pendientes de activación" value={statsMemo.by_status?.pending_activation ?? '—'} icon={QrCode} tone="bg-amber-500" hint="Sin pago aprobado" />
          <StatCard label="QR vinculados" value={statsMemo.linked ?? '—'} icon={Users} tone="bg-sky-500" hint="Con usuario asociado" />
          <StatCard label="QR sin vincular" value={statsMemo.unlinked ?? '—'} icon={AlertTriangle} tone="bg-neutral-500" hint="Sin propietario" />
          <StatCard label="Impresos" value={statsMemo.by_print_status?.printed ?? '—'} icon={Sticker} tone="bg-brand-500" hint="Sticker fabricado" />
        </motion.div>

        {/* Filtros y búsqueda */}
        <motion.section variants={item} aria-labelledby="qr-list-title">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 id="qr-list-title" className="text-base font-semibold text-neutral-900 lg:mb-4">Códigos QR registrados</h2>
              <p className="text-xs text-text-secondary">{pagination.total} QR · página {page} de {pagination.pages}</p>
            </div>
            <div className="flex w-full flex-col sm:flex-row gap-3 sm:w-auto">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" aria-hidden="true" />
                <Input
                  placeholder="Buscar identificador o correo…"
                  value={filters.q}
                  onChange={(e) => { setFilters((prev) => ({ ...prev, q: e.target.value })); setPage(1); }}
                  className="block w-full rounded-lg border bg-brand-50 pl-10 pr-4 py-2.5 text-base text-neutral-900 placeholder:text-text-secondary/60 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                />
              </div>
              <div className="min-w-[140px]">
                <Label>Estado del QR</Label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full rounded-lg border bg-brand-50 px-3 py-2 text-xs text-neutral-900 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Todos</option>
                  <option value="active">Activo</option>
                  <option value="pending_activation">Pendiente de activación</option>
                  <option value="disabled">Deshabilitado</option>
                  <option value="deactivated">Desvinculado</option>
                  <option value="replaced">Reemplazado</option>
                </select>
              </div>
              <div className="min-w-[140px]">
                <Label>Producción</Label>
                <select
                  value={filters.print_status}
                  onChange={(e) => handleFilterChange('print_status', e.target.value)}
                  className="block w-full rounded-lg border bg-brand-50 px-3 py-2 text-xs text-neutral-900 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Todos</option>
                  <option value="pending_print">Pendiente de impresión</option>
                  <option value="sent_to_print">Enviado a impresión</option>
                  <option value="printed">Impreso</option>
                  <option value="dispatched">Despachado</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div className="min-w-[140px]">
                <Label>Vinculado</Label>
                <select
                  value={filters.linked}
                  onChange={(e) => handleFilterChange('linked', e.target.value)}
                  className="block w-full rounded-lg border bg-brand-50 px-3 py-2 text-xs text-neutral-900 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Todos</option>
                  <option value="true">Sí (con usuario)</option>
                  <option value="false">No (sin propietario)</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-sm divide-y divide-border">
              <thead>
                <tr className="text-left text-xs text-text-secondary/80">
                  <th className="px-4 py-3 w-[48px]">
                    <input
                      type="checkbox"
                      checked={qrs.length > 0 && qrs.every((q) => selectedIds.has(q.id))}
                      onChange={toggleSelectAll}
                      className="rounded border-brand-500 bg-brand-50 text-brand-500 focus:ring-0"
                      aria-label="Seleccionar todos"
                    />
                  </th>
                  <th className="px-4 py-3">Identificador QR</th>
                  <th className="px-4 py-3 hidden sm:table-cell">URL pública</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Estado QR</th>
                  <th className="px-4 py-3">Producción</th>
                  <th className="px-4 py-3">Diseño de sticker</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Pedido</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {qrs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-text-secondary">
                      <AlertTriangle size={20} className="mx-auto mb-2 opacity-50" aria-hidden="true" />
                      <p>No se encontraron códigos QR.</p>
                    </td>
                  </tr>
                ) : (
                  qrs.map((q) => {
                    const selected = selectedIds.has(q.id);
                    const qrUrl = publicUrl(q.value);
                    return (
                      <tr key={q.id} className={`group transition-colors ${selected ? 'bg-brand-50/80' : 'hover:bg-brand-50/40'}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelect(q.id)}
                            className="rounded border-brand-500 bg-brand-50 text-brand-500 focus:ring-0"
                            aria-label={`Seleccionar QR ${q.value}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs text-neutral-900 truncate max-w-xs" title={q.value}>{q.value}</div>
                          <button
                            type="button"
                            onClick={() => copyText(q.value)}
                            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-brand-600 hover:text-brand-700 underline"
                            title="Copiar identificador"
                          >
                            <Copy size={12} aria-hidden="true" />
                          </button>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs text-text-secondary truncate max-w-xs" title={qrUrl}>{qrUrl}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold">
                              {(q.user?.email || '?').charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-neutral-900 truncate" title={q.user?.email || '—'}>{q.user?.email || 'Sin asignar'}</p>
                              {q.user?.role && <span className="text-[10px] text-text-secondary">{q.user.role === 'admin' ? 'Administrador' : 'Usuario'}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><QrStatusBadge status={q.status} /></td>
                        <td className="px-4 py-3"><PrintStatusBadge status={q.print_status} /></td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium text-text-secondary border-border/50">
                            {q.order?.design_image_url && <img src={q.order.design_image_url} alt="" className="h-5 w-5 rounded object-cover" />}
                            {q.order?.design_name || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs text-neutral-900">{q.order?.order_number || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-neutral-900">{fmtDateShort(q.created_at)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openDetail(q.id)}
                              disabled={busy(q.id)}
                              className="focus-ring inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-brand-500/30 text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                              aria-label={`Detalle de ${q.value}`}
                            >
                              <Package size={14} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => copyText(qrUrl)}
                              disabled={busy(q.id)}
                              className="focus-ring inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-brand-500/30 text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                              aria-label={`Copiar enlace de ${q.value}`}
                            >
                              <Copy size={14} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => q.user ? doUnlink(q.id) : toggleLinkOpen(q.id)}
                              disabled={busy(q.id)}
                              className="focus-ring inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-brand-500/30 text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                              aria-label={q.user ? 'Desvincular QR' : 'Vincular QR a usuario'}
                            >
                              {q.user ? <ExternalLink size={14} className="text-rose-600" aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="text-xs text-text-secondary">
                Página {pagination.page} de {pagination.pages}
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}>Siguiente</Button>
              </div>
            </div>
          )}

          {/* Barra de acciones masivas */}
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 28 }}
              className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-brand-900/95 p-3 text-white shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-3.5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-white/15 px-2 text-sm font-bold tabular-nums">{selectedIds.size}</span>
                <span className="text-sm font-medium">{selectedIds.size === 1 ? 'QR seleccionado' : 'QRs seleccionados'}</span>
                <button type="button" onClick={clearSelection} className="text-xs font-semibold text-white/70 underline underline-offset-2 hover:text-white">Limpiar</button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => handleExport('csv')} disabled={exportBusy} className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold transition-colors hover:bg-white/20 disabled:opacity-50">
                  <FileText size={14} aria-hidden="true" /> CSV
                </button>
                <button type="button" onClick={() => handleExport('zip')} disabled={exportBusy} className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold transition-colors hover:bg-white/20 disabled:opacity-50">
                  <Download size={14} aria-hidden="true" /> ZIP
                </button>
                <button type="button" onClick={() => handleExport('pdf')} disabled={exportBusy} className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-50">
                  {exportBusy ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} aria-hidden="true" />} PDF
                </button>
              </div>
            </motion.div>
          )}
        </motion.section>

        {/* Modal: Vincular QR a usuario */}
        <Modal isOpen={linkOpen} onClose={() => toggleLinkOpen()} title="Vincular QR a un usuario">
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>QR a vincular</Label>
              <p className="text-xs font-mono text-neutral-900 truncate max-w-xs">{linkQrId ? qrs.find((q) => q.id === linkQrId)?.value : '—'}</p>
            </div>
            <div className="space-y-2">
              <Label>Usuario</Label>
              <select
                value={linkUserId}
                onChange={(e) => setLinkUserId(e.target.value)}
                disabled={linkLoading}
                className="block w-full rounded-lg border bg-brand-50 px-4 py-2.5 text-base text-neutral-900 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Seleccionar usuario</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.email} ({u.role === 'admin' ? 'Administrador' : 'Usuario'})</option>
                ))}
              </select>
              {availableUsers.length === 0 && (
                <p className="text-xs text-text-secondary">No hay usuarios disponibles para vincular.</p>
              )}
            </div>
            <p className="text-xs text-text-secondary">
              Un QR solo puede vincularse a un usuario que no tenga ya un QR vigente. Los QR impresos o entregados no son elegibles.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => toggleLinkOpen()} disabled={linkLoading}>Cancelar</Button>
              <Button onClick={doLink} disabled={linkLoading || !linkUserId || availableUsers.length === 0}>
                {linkLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} aria-hidden="true" />}
                Vincular
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal: Detalle de QR */}
        <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle del código QR" size="lg">
          <div className="p-6 space-y-6">
            {detailLoading ? (
              <div className="flex h-64 items-center justify-center"><Loader2 size={24} className="animate-spin" /></div>
            ) : (
              <>
                {!detail ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
                    <AlertTriangle size={24} className="mx-auto mb-2" aria-hidden="true" />
                    <p className="text-sm font-medium">No se encontró el código QR.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:gap-6">
                      <div className={card}>
                        <h3 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">Código QR</h3>
                        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-4 mb-3">
                          {detailImage ? (
                            <img src={detailImage} alt="Código QR" className="h-48 w-48 rounded-xl border border-brand-100 bg-white" />
                          ) : (
                            <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-neutral-100">
                              <QrCode size={48} className="text-neutral-400" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div className="font-mono text-sm text-neutral-900 truncate max-w-xs" title={detail.value}>{detail.value}</div>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" onClick={() => copyText(detail.value)}>
                            <Copy size={16} aria-hidden="true" /> Copiar identificador
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => copyText(publicUrl(detail.value))}>
                            <Copy size={16} aria-hidden="true" /> Copiar URL pública
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => window.open(publicUrl(detail.value), '_blank', 'noopener,noreferrer')}>
                            <ExternalLink size={16} aria-hidden="true" /> Vista previa
                          </Button>
                        </div>
                      </div>

                      <div className={card}>
                        <h3 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">Datos</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border p-3 bg-neutral-50">
                            <p className="text-xs text-text-secondary">Estado del QR</p>
                            <Badge tone={QR_STATUS_TONE[detail.status] || 'neutral'} className="mt-1 w-fit">{QR_STATUS_LABEL[detail.status] || detail.status}</Badge>
                          </div>
                          <div className="rounded-lg border p-3 bg-neutral-50">
                            <p className="text-xs text-text-secondary">Producción / impresión</p>
                            <Badge tone={PRINT_TONE[detail.print_status] || 'neutral'} className="mt-1 w-fit">{PRINT_LABEL[detail.print_status] || detail.print_status}</Badge>
                          </div>
                          <div className="rounded-lg border p-3 bg-neutral-50">
                            <p className="text-xs text-text-secondary">Usuario asociado</p>
                            <p className="mt-1 text-xs font-medium text-neutral-900">{detail.user?.email || 'Sin asignar'}</p>
                          </div>
                          <div className="rounded-lg border p-3 bg-neutral-50">
                            <p className="text-xs text-text-secondary">Pedido relacionado</p>
                            <p className="mt-1 text-xs font-medium text-neutral-900">{detail.order?.order_number || '—'}</p>
                          </div>
                          <div className="rounded-lg border p-3 bg-neutral-50">
                            <p className="text-xs text-text-secondary">Diseño de sticker</p>
                            <p className="mt-1 text-xs font-medium text-neutral-900">{detail.order?.design_name || '—'}</p>
                          </div>
                          <div className="rounded-lg border p-3 bg-neutral-50">
                            <p className="text-xs text-text-secondary">Fecha de generación</p>
                            <p className="mt-1 text-xs font-medium text-neutral-900">{fmtDate(detail.created_at)}</p>
                          </div>
                          <div className="rounded-lg border p-3 bg-neutral-50">
                            <p className="text-xs text-text-secondary">Activación</p>
                            <p className="mt-1 text-xs font-medium text-neutral-900">{fmtDate(detail.activation_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={card}>
                      <h3 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">Cambiar estado de impresión</h3>
                      <p className="mb-3 text-xs text-text-secondary">
                        El estado de impresión es independiente de la activación del QR. Cambiarlo no afecta el identificador ni la URL.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(PRINT_LABEL).map(([id, label]) => (
                          <Button
                            key={id}
                            type="button"
                            variant={detail.print_status === id ? 'primary' : 'outline'}
                            size="sm"
                            loading={detailBusy === id}
                            disabled={detailBusy === id || detail.print_status === id}
                            onClick={() => doSetPrintStatus(detail.id, id)}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className={card}>
                      <h3 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">Acciones de usuario</h3>
                      <div className="flex flex-wrap gap-2">
                        {detail.user && (
                          <Button variant="outline" size="sm" onClick={() => { setDetailOpen(false); doUnlink(detail.id); }} disabled={detailBusy === detail.id}>
                            Desvincular de {detail.user.email}
                          </Button>
                        )}
                        {!detail.user && (
                          <Button variant="outline" size="sm" onClick={() => { setDetailOpen(false); toggleLinkOpen(detail.id); }}>
                            Vincular a un usuario
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => copyText(publicUrl(detail.value))}>
                          Copiar enlace público
                        </Button>
                      </div>
                    </div>

                    <div className={card}>
                      <h3 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">URL permanente</h3>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={publicUrl(detail.value)}
                          readOnly
                          className="flex-1 rounded-lg border bg-brand-50 pl-4 pr-10 py-2.5 text-xs font-mono text-neutral-900"
                        />
                        <button
                          type="button"
                          onClick={() => copyText(publicUrl(detail.value))}
                          className="rounded-r-lg border border-transparent bg-brand-500 px-3 py-2.5 text-white hover:bg-brand-600"
                          title="Copiar URL pública"
                        >
                          <Copy size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <div className="border-t border-border p-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)}>Cerrar</Button>
          </div>
        </Modal>
      </motion.div>
    </MotionConfig>
  );
};

export default AdminQrInventory;
