import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle, ChevronLeft, ChevronRight, Copy, Download, ExternalLink, FileText, Link2, Loader2,
  Plus, Printer, QrCode, RefreshCw, Search, Unlink, X,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useToast } from '../../components/useToast';
import { Badge } from '../../components/ui-kit';
import Modal from '../../components/Modal';

const PAGE_SIZE = 25;
const panel = 'rounded-2xl border border-border bg-white';
const COLS = 'xl:grid xl:grid-cols-[1.25rem_minmax(0,1.3fr)_10rem_minmax(0,1fr)_8.5rem] xl:items-center xl:gap-4';

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

/* Cada pestaña equivale a un filtro del backend */
const VIEWS = [
  { id: 'all', label: 'Todos', params: {}, count: (s) => s.total },
  { id: 'active', label: 'Activos', params: { status: 'active' }, count: (s) => s.by_status?.active },
  { id: 'pending', label: 'Pendientes', params: { status: 'pending_activation' }, count: (s) => s.by_status?.pending_activation },
  { id: 'unlinked', label: 'Sin vincular', params: { linked: 'false' }, count: (s) => s.unlinked },
];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
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

const QrRow = ({ qr, selected, onSelect, onOpen, onCopy, onLink }) => (
  <li className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-brand-50/40 ${COLS} ${selected ? 'bg-brand-50/70' : ''}`}>
    <input
      type="checkbox"
      checked={selected}
      onChange={onSelect}
      className="rounded border-brand-500 text-brand-500 focus:ring-0"
      aria-label={`Seleccionar ${qr.value}`}
    />
    <div className="min-w-0 flex-1 xl:flex-none">
      <button
        type="button"
        onClick={onOpen}
        title="Ver detalle"
        className="focus-ring block max-w-full truncate rounded font-mono text-xs font-semibold text-neutral-900 hover:text-brand-600 hover:underline"
      >
        {qr.value}
      </button>
      <p className="mt-0.5 truncate text-xs text-text-secondary">{qr.user?.email || 'Sin asignar'}</p>
    </div>
    <div className="flex flex-wrap gap-1.5 xl:flex-col xl:items-start">
      <StatusBadge map={QR_STATUS} value={qr.status} />
      <StatusBadge map={PRINT_STATUS} value={qr.print_status} />
    </div>
    <div className="min-w-0 basis-full text-xs text-text-secondary xl:basis-auto">
      {qr.order?.order_number ? (
        <>
          <p className="font-mono font-semibold text-neutral-900">{qr.order.order_number}</p>
          <p className="flex items-center gap-1.5 truncate">
            {qr.order.design_image_url && <img src={qr.order.design_image_url} alt="" className="h-4 w-4 flex-none rounded object-cover" />}
            <span className="truncate">{qr.order.design_name || 'Sin diseño'}</span>
          </p>
        </>
      ) : (
        <span>Sin pedido</span>
      )}
    </div>
    <div className="ml-auto flex items-center gap-2 xl:ml-0 xl:justify-end">
      {!qr.user && (
        <button type="button" onClick={onLink} className="btn-outline px-3 py-1.5 text-xs">
          <Link2 size={14} aria-hidden="true" /> Vincular
        </button>
      )}
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copiar enlace de ${qr.value}`}
        title="Copiar enlace público"
        className="btn-outline h-8 w-8 flex-none"
      >
        <Copy size={14} aria-hidden="true" />
      </button>
    </div>
  </li>
);

export const AdminQrInventory = () => {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [qrs, setQrs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [view, setView] = useState('all');
  const [print, setPrint] = useState('');
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [exportBusy, setExportBusy] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);

  const [linkQr, setLinkQr] = useState(null);
  const [linkUserId, setLinkUserId] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [linkBusy, setLinkBusy] = useState(false);

  const [unlinkQr, setUnlinkQr] = useState(null);
  const [unlinkBusy, setUnlinkBusy] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailImage, setDetailImage] = useState(null);
  const [printBusy, setPrintBusy] = useState(false);

  const refresh = () => setTick((t) => t + 1);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/qrs/stats');
      setStats(data);
    } catch {
      /* las cifras de las pestañas no son críticas */
    }
  }, []);

  const loadQrs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...VIEWS.find((v) => v.id === view).params, page, limit: PAGE_SIZE };
      if (q) params.q = q;
      if (print) params.print_status = print;
      const { data } = await api.get('/admin/qrs', { params });
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
  }, [loadQrs, tick]);

  useEffect(() => {
    const t = setTimeout(loadStats, 0);
    return () => clearTimeout(t);
  }, [loadStats, tick]);

  useEffect(() => {
    const t = setTimeout(() => { setQ(input.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [input]);

  /* Liberar la imagen del detalle al cambiarla o cerrar */
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
  const pickPrint = (v) => { setPrint(v); setPage(1); };
  const hasFilters = !!(input || view !== 'all' || print);
  const clearFilters = () => { setInput(''); setQ(''); setView('all'); setPrint(''); setPage(1); };

  /* Selección */
  const allSelected = qrs.length > 0 && qrs.every((x) => selected.has(x.id));
  const toggleOne = (id) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(qrs.map((x) => x.id)));

  /* Crear */
  const createQr = async () => {
    setCreateBusy(true);
    try {
      await api.post('/admin/qrs/create');
      toast.success('QR creado. Vincúlalo a un usuario desde la lista.');
      setInput(''); setQ(''); setPrint(''); setView('unlinked'); setPage(1);
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo crear el QR');
    } finally {
      setCreateBusy(false);
    }
  };

  /* Vincular */
  const openLink = async (qr) => {
    setDetailOpen(false);
    setLinkQr(qr);
    setLinkUserId('');
    try {
      const { data } = await api.get('/admin/users', { params: { q: '', role: 'user', page: 1, limit: 200 } });
      setAvailableUsers(data.users || []);
    } catch {
      setAvailableUsers([]);
    }
  };
  const closeLink = () => { setLinkQr(null); setLinkUserId(''); setAvailableUsers([]); };

  const doLink = async () => {
    if (!linkQr || !linkUserId) return;
    setLinkBusy(true);
    try {
      await api.post('/admin/qrs/link', { qr_id: linkQr.id, user_id: linkUserId });
      toast.success('QR vinculado');
      closeLink();
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo vincular el QR');
    } finally {
      setLinkBusy(false);
    }
  };

  /* Desvincular */
  const doUnlink = async () => {
    if (!unlinkQr) return;
    setUnlinkBusy(true);
    try {
      await api.post('/admin/qrs/unlink', { qr_id: unlinkQr.id });
      toast.success('QR desvinculado');
      setUnlinkQr(null);
      refresh();
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
      refresh();
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

  const s = stats || {};
  const exportBtn = 'focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-50';

  return (
    <div className="space-y-4">
      <PageTitle
        title="Códigos QR"
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={refresh} disabled={loading} className="btn-outline px-3.5 py-2 text-sm" aria-label="Actualizar">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            </button>
            <button type="button" onClick={createQr} disabled={createBusy} className="btn-primary px-4 py-2 text-sm">
              {createBusy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
              Crear QR
            </button>
          </div>
        }
      />

      <div className={`${panel} space-y-3 p-3 lg:p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1" role="search">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Buscar por código o correo"
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
          <select value={print} onChange={(e) => pickPrint(e.target.value)} aria-label="Filtrar por impresión" className="input sm:!w-56">
            <option value="">Toda la impresión</option>
            {Object.entries(PRINT_STATUS).map(([id, [label]]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
        <div role="group" aria-label="Filtrar por estado" className="custom-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {VIEWS.map((v) => {
            const active = view === v.id;
            const n = v.count(s);
            return (
              <button
                key={v.id}
                type="button"
                aria-pressed={active}
                onClick={() => pickView(v.id)}
                className={`focus-ring flex-none rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active ? 'border-brand-500 bg-brand-500 text-white' : 'border-border bg-white text-text-secondary hover:border-brand-500/40 hover:text-neutral-900'
                }`}
              >
                {v.label}
                {n !== undefined && n !== null && <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-text-secondary/70'}`}>{n}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700" role="alert">
          <AlertTriangle size={18} className="flex-none" aria-hidden="true" />
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" onClick={refresh} className="flex-none font-semibold underline underline-offset-2">Reintentar</button>
        </div>
      )}

      {loading && qrs.length === 0 && !error && (
        <div className={`${panel} animate-pulse space-y-3 p-4`} aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 rounded-lg bg-border/60" />)}
        </div>
      )}

      {!loading && !error && qrs.length === 0 && (
        <div className={`${panel} flex flex-col items-center p-10 text-center`}>
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
            <QrCode size={20} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-neutral-900">Sin códigos QR</p>
          {hasFilters ? (
            <button type="button" onClick={clearFilters} className="btn-outline mt-4 px-4 py-2 text-sm">
              <X size={16} aria-hidden="true" /> Quitar filtros
            </button>
          ) : (
            <button type="button" onClick={createQr} disabled={createBusy} className="btn-primary mt-4 px-4 py-2 text-sm">
              <Plus size={16} aria-hidden="true" /> Crear QR
            </button>
          )}
        </div>
      )}

      {qrs.length > 0 && !error && (
        <>
          <div className={`${panel} overflow-hidden transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
            <div className={`flex items-center gap-3 border-b border-border bg-brand-50/70 px-4 py-3 text-xs font-semibold text-text-secondary ${COLS}`}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="rounded border-brand-500 text-brand-500 focus:ring-0"
                aria-label="Seleccionar todos los de esta página"
              />
              <span>Código y usuario</span>
              <span className="hidden xl:inline">Estado</span>
              <span className="hidden xl:inline">Pedido y diseño</span>
              <span className="hidden xl:inline" />
            </div>
            <ul className="divide-y divide-border">
              {qrs.map((qr) => (
                <QrRow
                  key={qr.id}
                  qr={qr}
                  selected={selected.has(qr.id)}
                  onSelect={() => toggleOne(qr.id)}
                  onOpen={() => openDetail(qr.id)}
                  onCopy={() => copy(publicUrl(qr.value), 'Enlace copiado')}
                  onLink={() => openLink(qr)}
                />
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 text-xs text-text-secondary sm:flex-row">
            <span aria-live="polite">
              <span className="font-semibold text-neutral-900">{pagination.total}</span> {pagination.total === 1 ? 'código' : 'códigos'}
            </span>
            {pagination.pages > 1 && (
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn-outline px-3 py-2 text-sm">
                  <ChevronLeft size={16} aria-hidden="true" /> Anterior
                </button>
                <span>{page} / {pagination.pages}</span>
                <button type="button" disabled={page >= pagination.pages} onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} className="btn-outline px-3 py-2 text-sm">
                  Siguiente <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Acciones sobre la selección */}
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
          </div>
        </div>
      )}

      {/* Detalle */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Código QR" size="lg">
        {detailLoading ? (
          <div className="flex h-56 items-center justify-center"><Loader2 size={24} className="animate-spin text-text-secondary" aria-label="Cargando" /></div>
        ) : !detail ? (
          <p className="py-10 text-center text-sm text-rose-700">No se encontró el código QR.</p>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-[11rem_1fr]">
              <div className="space-y-3">
                <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-xl border border-border bg-white sm:mx-0">
                  {detailImage
                    ? <img src={detailImage} alt={`QR ${detail.value}`} className="h-40 w-40" />
                    : <QrCode size={48} className="text-neutral-400" aria-hidden="true" />}
                </div>
                <div className="flex justify-center gap-2 sm:justify-start">
                  <button type="button" onClick={() => copy(publicUrl(detail.value), 'Enlace copiado')} className="btn-outline px-3 py-1.5 text-xs">
                    <Copy size={14} aria-hidden="true" /> Copiar enlace
                  </button>
                  <a href={publicUrl(detail.value)} target="_blank" rel="noopener noreferrer" className="btn-outline px-3 py-1.5 text-xs">
                    <ExternalLink size={14} aria-hidden="true" /> Abrir
                  </a>
                </div>
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
                <Field label="Usuario">{detail.user?.email || 'Sin asignar'}</Field>
                <Field label="Pedido">{detail.order?.order_number || '—'}</Field>
                <Field label="Diseño">{detail.order?.design_name || '—'}</Field>
                <Field label="Creado">{fmtDate(detail.created_at)}</Field>
                <Field label="Activado">{fmtDate(detail.activation_at)}</Field>
              </dl>
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              {detail.user ? (
                <button type="button" onClick={() => { setDetailOpen(false); setUnlinkQr(detail); }} className="btn-outline px-4 py-2 text-sm !text-rose-700 hover:!bg-rose-50">
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

      {/* Vincular */}
      <Modal isOpen={!!linkQr} onClose={() => (linkBusy ? null : closeLink())} title="Vincular a un usuario">
        {linkQr && (
          <div className="space-y-5">
            <div>
              <p className="text-xs text-text-secondary">Código</p>
              <p className="break-all font-mono text-sm font-semibold text-neutral-900">{linkQr.value}</p>
            </div>
            <div>
              <label htmlFor="link-user" className="mb-1.5 block text-xs text-text-secondary">Usuario</label>
              <select id="link-user" value={linkUserId} onChange={(e) => setLinkUserId(e.target.value)} disabled={linkBusy} className="input">
                <option value="">Elegir usuario</option>
                {availableUsers.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
              </select>
              {availableUsers.length === 0 && <p className="mt-1.5 text-xs text-text-secondary">No hay usuarios disponibles.</p>}
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeLink} disabled={linkBusy} className="btn-ghost px-4 py-2 text-sm">Cancelar</button>
              <button type="button" onClick={doLink} disabled={linkBusy || !linkUserId} className="btn-primary px-4 py-2 text-sm">
                {linkBusy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                Vincular
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Desvincular */}
      <Modal isOpen={!!unlinkQr} onClose={() => (unlinkBusy ? null : setUnlinkQr(null))} title="Desvincular QR">
        {unlinkQr && (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-text-secondary">
              El QR <span className="font-mono font-semibold text-neutral-900">{unlinkQr.value}</span> quedará desactivado y sin propietario.
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