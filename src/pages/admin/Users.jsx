import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  QrCode, Download, Copy, Link, ExternalLink, RefreshCw, FileText,
  Printer, Check, CheckCircle2, AlertTriangle, Loader2, ChevronLeft,
  Search, X, Users as UsersIcon, ChevronRight, ShieldCheck, ShieldOff,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { CheckField } from '../../components/DashPage';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import Modal from '../../components/Modal';
import { Badge } from '../../components/ui-kit';

/* ───────── Constantes de diseño ───────── */
const EASE = [0.22, 1, 0.36, 1];
const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };

const ROLE_TABS = [
  { id: '', label: 'Todos' },
  { id: 'user', label: 'Usuarios' },
  { id: 'admin', label: 'Administradores' },
];

const PRINT_FILTERS = [
  { id: '', label: 'Todos' },
  { id: 'pending_print', label: 'Pendiente de impresión' },
  { id: 'sent_to_print', label: 'Enviado a impresión' },
  { id: 'printed', label: 'Impreso' },
  { id: 'delivered', label: 'Entregado' },
];

const QR_STATUS_LABEL = {
  pending_activation: 'Pendiente',
  active: 'Activo',
  disabled: 'Deshabilitado',
};
const QR_STATUS_TONE = {
  pending_activation: 'warn',
  active: 'success',
  disabled: 'danger',
};

const PRINT_STATUS_LABEL = {
  pending_print: 'Pendiente',
  sent_to_print: 'Enviado',
  printed: 'Impreso',
  delivered: 'Entregado',
};
const PRINT_STATUS_TONE = {
  pending_print: 'neutral',
  sent_to_print: 'info',
  printed: 'success',
  delivered: 'brand',
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/* ───────── Helper: descarga de archivo (blob) ───────── */
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

/* ───────── Piezas UI ───────── */
const RoleBadge = ({ role }) => (
  <Badge tone={role === 'admin' ? 'brand' : 'neutral'} size="sm">
    {role === 'admin' && <span className="mr-1" aria-hidden="true">●</span>}
    {role === 'admin' ? 'Administrador' : 'Usuario'}
  </Badge>
);

const QrStatusBadge = ({ status }) => (
  <Badge tone={QR_STATUS_TONE[status] || 'neutral'} size="sm">
    {QR_STATUS_LABEL[status] || status}
  </Badge>
);

const PrintStatusBadge = ({ status }) => (
  <Badge tone={PRINT_STATUS_TONE[status] || 'neutral'} size="sm">
    {PRINT_STATUS_LABEL[status] || status}
  </Badge>
);

const RoleAction = ({ u, meId, busy, className = '' }) => {
  if (meId === u.id) return <Badge tone="info" size="sm">Tu cuenta</Badge>;
  const toAdmin = u.role === 'user';
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {}}
      className={`focus-ring inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        toAdmin
          ? 'border-brand-500/30 text-brand-500 hover:bg-brand-500/10'
          : 'border-amber-300 text-amber-700 hover:bg-amber-50'
      } ${className}`}
      aria-label={toAdmin ? `Hacer admin a ${u.email}` : `Quitar admin a ${u.email}`}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : toAdmin ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
      {toAdmin ? 'Hacer admin' : 'Quitar admin'}
    </button>
  );
};

const Avatar = ({ email, admin }) => (
  <span
    className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-bold ring-1 ${
      admin ? 'bg-brand-500 text-white ring-brand-500' : 'bg-brand-500/10 text-brand-500 ring-brand-500/15'
    }`}
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

/* ───────── Modal: detalle del QR ───────── */
const QrDetailModal = ({
  isOpen,
  onClose,
  qr,
  user,
  history,
  loading,
  busy,
  onRegenerate,
  onSetPrintStatus,
}) => {
  const [imageObjectUrl, setImageObjectUrl] = useState(null);
  const [copyConfirmed, setCopyConfirmed] = useState(false);

  const qrUrl = qr?.qr_url;

  useEffect(() => {
    if (!isOpen || !qr?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/identifiers/${qr.id}/qr`, { responseType: 'blob' });
        if (cancelled) return;
        const blob = new Blob([res.data], { type: 'image/png' });
        setImageObjectUrl(URL.createObjectURL(blob));
      } catch {
        // silencioso: la imagen ya se había cargado o falló
      }
    })();
    return () => {
      cancelled = true;
      if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, qr?.id]);

  const handleCopy = async () => {
    if (!qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopyConfirmed(true);
      setTimeout(() => setCopyConfirmed(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = qrUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyConfirmed(true);
      setTimeout(() => setCopyConfirmed(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!qr?.id) return;
    window.location.href = `${api.defaults.baseURL || '/api'}/identifiers/${qr.id}/qr`;
  };

  const handlePreview = () => {
    if (!qrUrl) return;
    window.open(qrUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRegenerate = async () => {
    if (!onRegenerate || !qr?.id) return;
    await onRegenerate(qr.id);
    try {
      const res = await api.get(`/identifiers/${qr.id}/qr`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'image/png' });
      setImageObjectUrl(URL.createObjectURL(blob));
    } catch {
      // silencioso
    }
  };

  const printStatusOptions = [
    { id: 'pending_print', label: 'Pendiente de impresión' },
    { id: 'sent_to_print', label: 'Enviado al proveedor' },
    { id: 'printed', label: 'Impreso' },
    { id: 'delivered', label: 'Sticker entregado' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del código QR"
      size="lg"
    >
      <div className="space-y-6">
        {/* Encabezado: imagen + datos clave */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col items-center">
            <div className="relative inline-block">
              {loading ? (
                <div className="flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-brand-50">
                  <Loader2 size={24} className="animate-spin text-brand-500" />
                </div>
              ) : imageObjectUrl ? (
                <img
                  src={imageObjectUrl}
                  alt="Código QR"
                  className="h-48 w-48 rounded-2xl border border-border shadow-sm bg-white"
                />
              ) : (
                <div className="h-48 w-48 rounded-2xl border-2 border-dashed border-border bg-brand-50 flex items-center justify-center">
                  <QrCode size={44} className="text-brand-500" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={busy || !qrUrl} loading={busy}>
                {copyConfirmed ? <Check size={14} /> : <Copy size={14} />}
                {copyConfirmed ? '¡Copiado!' : 'Copiar enlace'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={busy || !qr?.id} loading={busy}>
                <Download size={14} /> Descargar PNG
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handlePreview} disabled={busy || !qrUrl} className="mt-2 text-xs">
              <ExternalLink size={14} /> Vista previa pública
            </Button>
            <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={busy || !qr?.id} loading={busy} className="mt-2 text-xs">
              <RefreshCw size={14} /> Regenerar imagen
            </Button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-brand-50 p-4">
                <p className="text-xs text-text-secondary">Identificador público</p>
                <p className="text-sm font-mono font-semibold text-neutral-900 break-all">{qr?.value}</p>
              </div>
              <div className="rounded-xl border border-border bg-brand-50 p-4">
                <p className="text-xs text-text-secondary">Estado del QR</p>
                <QrStatusBadge status={qr?.status} />
              </div>
              <div className="rounded-xl border border-border bg-brand-50 p-4">
                <p className="text-xs text-text-secondary">URL permanente</p>
                <p className="text-xs font-mono text-text-secondary break-all truncate" title={qrUrl}>{qrUrl}</p>
              </div>
              <div className="rounded-xl border border-border bg-brand-50 p-4">
                <p className="text-xs text-text-secondary">Fecha de generación</p>
                <p className="text-sm font-semibold text-neutral-900">{formatDate(qr?.created_at)}</p>
              </div>
              <div className="rounded-xl border border-border bg-brand-50 p-4">
                <p className="text-xs text-text-secondary">Fecha de activación</p>
                <p className="text-sm font-semibold text-neutral-900">{formatDate(qr?.activation_at)}</p>
              </div>
              <div className="rounded-xl border border-border bg-brand-50 p-4">
                <p className="text-xs text-text-secondary">Estado de impresión</p>
                <PrintStatusBadge status={qr?.print_status} />
              </div>
            </div>

            {/* Control de impresión */}
            <div className="rounded-xl border border-border bg-brand-50 p-4">
              <p className="mb-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Estado de impresión (admin)</p>
              <div className="flex flex-wrap gap-2">
                {printStatusOptions.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => onSetPrintStatus && onSetPrintStatus(o.id)}
                    disabled={busy}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      qr?.print_status === o.id
                        ? 'bg-brand-100 text-brand-700 border-brand-500'
                        : 'bg-white text-neutral-700 border-border hover:bg-brand-50'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PRINT_STATUS_TONE[o.id] === 'brand' ? '#2563eb' : PRINT_STATUS_TONE[o.id] === 'success' ? '#15803d' : PRINT_STATUS_TONE[o.id] === 'info' ? '#0284c7' : '#64748b' }} aria-hidden="true" />
                    {o.label}
                  </button>
                ))}
              </div>
              {qr?.user_id && (
                <p className="mt-3 text-xs text-text-secondary">
                  Cambiará el estado de impresión de <span className="font-semibold">{user?.email || 'este usuario'}</span>. El identificador y la URL del QR no se modifican.
                </p>
              )}
            </div>

            {/* Información del usuario */}
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="mb-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Usuario asociado</p>
              <div className="flex items-center gap-3">
                <Avatar email={user?.email} admin={user?.role === 'admin'} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{user?.email}</p>
                  <p className="text-xs text-text-secondary">ID {user?.id} · {user?.role === 'admin' ? 'Administrador' : 'Usuario'} · Registrado {formatDate(user?.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Historial de auditoría */}
            <div className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Historial del código</p>
                <span className="text-xs font-medium text-neutral-900">{history?.length || 0} eventos</span>
              </div>
              {history && history.length === 0 ? (
                <p className="text-xs text-text-secondary">No hay eventos registrados.</p>
              ) : (
                <ul className="divide-y divide-border/50 space-y-0">
                  {history.map((ev, i) => (
                    <li key={i} className="py-2.5">
                      <p className="text-xs font-semibold text-neutral-900">{ev.action}</p>
                      <p className="text-xs text-text-secondary">{formatDateTime(ev.created_at)}</p>
                      {ev.metadata && (
                        <p className="text-[10px] text-text-secondary/70 mt-0.5 break-all">{String(ev.metadata).slice(0, 160)}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cerrar</Button>
      </div>
    </Modal>
  );
};

/* ───────── Página ───────── */
export const AdminUsers = () => {
  const toast = useToast();
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [input, setInput] = useState('');
  const [filters, setFilters] = useState({ q: '', role: '', print_status: '' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [busyExport, setBusyExport] = useState(false);
  const [confirm, setConfirm] = useState(null); // { user, role }

  // Selección y detalle de QR
  const [selectedIds, setSelectedIds] = useState(new Set());
  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [qrDetail, setQrDetail] = useState(null);
  const [qrUser, setQrUser] = useState(null);
  const [qrHistory, setQrHistory] = useState([]);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrBusy, setQrBusy] = useState(null); // qr id en operación
  const [printBusyUser, setPrintBusyUser] = useState(null); // user id en bulk print

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/users', {
        params: { q: filters.q, role: filters.role, print_status: filters.print_status, page, limit: 20 },
      });
      setUsers(data.users || []);
      setPagination(data.pagination);
      // Mantener selección solo si sigue presente en la página
      const present = new Set((data.users || []).map((u) => u.id));
      const next = new Set([...selectedIdsRef.current].filter((id) => present.has(id)));
      setSelectedIds(next);
      setSelectAllChecked(next.size > 0 && next.size === (data.users || []).length);
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

  const hasFilters = !!(input || filters.q || filters.role || filters.print_status);

  const clearFilters = () => {
    setInput('');
    setFilters({ q: '', role: '', print_status: '' });
    setPage(1);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = users.map((u) => u.id);
    if (pageIds.length === 0) return;
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
    setSelectAllChecked(!allSelected);
  };

  const areAllPageSelected = users.length > 0 && users.every((u) => selectedIds.has(u.id));

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

  /* Exportación masiva */
  const handleExport = async (format) => {
    const ids = [...selectedIds];
    if (ids.length === 0) {
      toast.error('Selecciona al menos un usuario');
      return;
    }
    setBusyExport(true);
    try {
      const idParam = ids.join(',');
      if (format === 'zip') {
        await downloadBlob(`/identifiers/export/zip?ids=${idParam}`, 'qrs-export.zip');
        toast.success(`${ids.length} código(s) QR descargado(s) en ZIP`);
      } else if (format === 'csv') {
        await downloadBlob(`/identifiers/export/csv?ids=${idParam}`, 'qr-export.csv');
        toast.success(`CSV de ${ids.length} código(s) QR descargado`);
      } else if (format === 'pdf') {
        await downloadBlob(`/identifiers/export/pdf?ids=${idParam}&columns=3&rows=5&size_mm=25&gap_mm=8&margin_mm=12`, 'qrs-impresion.pdf');
        toast.success(`PDF de impresión de ${ids.length} código(s) QR descargado`);
      }
      setSelectedIds(new Set());
      setSelectAllChecked(false);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al exportar');
    } finally {
      setBusyExport(false);
    }
  };

  const handleBulkPrint = async (printStatus) => {
    const ids = [...selectedIds];
    if (ids.length === 0) {
      toast.error('Selecciona al menos un usuario');
      return;
    }
    setPrintBusyUser('bulk');
    try {
      await api.post('/identifiers/bulk-print-status', { user_ids: ids, print_status: printStatus });
      toast.success(`Estado de impresión actualizado a "${PRINT_STATUS_LABEL[printStatus]}" para ${ids.length} usuario(s)`);
      setSelectedIds(new Set());
      setSelectAllChecked(false);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo actualizar el estado de impresión');
    } finally {
      setPrintBusyUser(null);
    }
  };

  /* Detalle de QR */
  const openQrDetail = async (qrId) => {
    setQrLoading(true);
    try {
      const { data } = await api.get(`/identifiers/${qrId}`);
      setQrDetail(data.identifier);
      setQrUser(data.user);
      setQrHistory(data.history || []);
      setQrModal(true);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo cargar el detalle del QR');
    } finally {
      setQrLoading(false);
    }
  };

  const handleRegenerateQr = async (qrId) => {
    setQrBusy(qrId);
    try {
      await api.get(`/identifiers/${qrId}/qr`);
      toast.success('Imagen QR regenerada (mismo identificador y URL)');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo regenerar la imagen');
    } finally {
      setQrBusy(null);
    }
  };

  const handleSetPrintStatus = async (userId, printStatus) => {
    setPrintBusyUser(userId);
    try {
      await api.post('/identifiers/bulk-print-status', { user_ids: [userId], print_status: printStatus });
      toast.success(`Estado de impresión actualizado a "${PRINT_STATUS_LABEL[printStatus]}"`);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo actualizar el estado de impresión');
    } finally {
      setPrintBusyUser(null);
    }
  };

  const confirming = confirm && busyId === confirm.user.id;

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 lg:space-y-5">
        <motion.div variants={item}>
          <PageTitle
            title="Gestión de usuarios y QR"
            description="Administra cuentas, consulta el código QR permanente de cada usuario y exporta códigos para impresión de stickers."
            actions={
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-brand-50 text-sm font-medium">
                    <span>{selectedIds.size} usuario(s) seleccionado(s)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedIds(new Set())}
                      className="ml-2 text-xs text-rose-600 underline underline-offset-2 hover:text-rose-800"
                    >
                      Limpiar selección
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={busyExport || selectedIds.size === 0} loading={busyExport}>
                    <FileText size={14} /> CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('zip')} disabled={busyExport || selectedIds.size === 0} loading={busyExport}>
                    <Download size={14} /> ZIP
                  </Button>
                  <Button size="sm" onClick={() => handleExport('pdf')} disabled={busyExport || selectedIds.size === 0} loading={busyExport}>
                    <Printer size={14} /> PDF impresión
                  </Button>
                </div>
              </div>
            }
          />
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

          <div role="tablist" aria-label="Filtrar por estado de impresión" className="custom-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-border bg-brand-50/50 p-1 mt-2 lg:mt-0 lg:ml-4">
            {PRINT_FILTERS.map((f) => {
              const active = filters.print_status === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => { setFilters((f2) => ({ ...f2, print_status: f.id })); setPage(1); }}
                  className={`focus-ring relative flex-none rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    active ? 'bg-brand-500 text-white shadow-soft' : 'text-text-secondary hover:text-neutral-900'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {hasFilters && (
            <button type="button" onClick={clearFilters} className="btn-outline flex-none px-4 py-2.5 text-sm">
              <X size={16} aria-hidden="true" /> Limpiar filtros
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
                      <th scope="col" className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={areAllPageSelected}
                          onChange={toggleSelectAll}
                          className="peer sr-only"
                          aria-label="Seleccionar todos los de la página"
                        />
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border border-border bg-white transition-all ${
                            areAllPageSelected ? 'peer-checked:border-brand-500 peer-checked:bg-brand-500' : ''
                          }`}
                        >
                          {areAllPageSelected && (
                            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3.5 8.5l3 3 6-7" />
                            </svg>
                          )}
                        </span>
                      </th>
                      <th scope="col" className="px-6 py-4">Usuario</th>
                      <th scope="col" className="px-6 py-4">Correo</th>
                      <th scope="col" className="px-6 py-4">Rol</th>
                      <th scope="col" className="px-6 py-4">Estado QR</th>
                      <th scope="col" className="px-6 py-4">Estado impresión</th>
                      <th scope="col" className="px-6 py-4">Generación</th>
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
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(u.id)}
                            onChange={() => toggleSelect(u.id)}
                            className="peer sr-only"
                          />
                          <span
                            aria-hidden="true"
                            className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border border-border bg-white transition-all ${
                              selectedIds.has(u.id) ? 'peer-checked:border-brand-500 peer-checked:bg-brand-500' : ''
                            }`}
                          >
                            {selectedIds.has(u.id) && (
                              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3.5 8.5l3 3 6-7" />
                              </svg>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar email={u.email} admin={u.role === 'admin'} />
                            <p className="min-w-0 truncate font-medium text-neutral-900">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 min-w-0 break-all text-sm text-neutral-900">{u.email}</td>
                        <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                        <td className="px-6 py-4">{u.qr_id ? <QrStatusBadge status={u.qr_status || 'pending_activation'} /> : <Badge tone="neutral" size="sm">Sin QR</Badge>}</td>
                        <td className="px-6 py-4"><PrintStatusBadge status={u.qr_print_status || 'pending_print'} /></td>
                        <td className="px-6 py-4 whitespace-nowrap text-text-secondary">{formatDate(u.qr_created_at || u.created_at)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => u.qr_id && openQrDetail(u.qr_id)}
                              disabled={!u.qr_id || qrBusy === u.qr_id}
                              className={`focus-ring inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                u.qr_id
                                  ? 'border-brand-500/30 bg-brand-50 text-brand-700 hover:bg-brand-100'
                                  : 'border-border text-text-secondary hover:bg-brand-50'
                              }`}
                              aria-label={`Gestionar el QR de ${u.email}`}
                              title={u.qr_id ? 'Ver detalle del QR' : 'Sin código QR asignado'}
                            >
                              <QrCode size={13} aria-hidden="true" />
                              {qrBusy === u.qr_id ? <Loader2 size={13} className="animate-spin" /> : u.qr_id ? 'Ver QR' : 'Sin QR'}
                            </button>
                            {u.qr_id && (
                              <button
                                type="button"
                                onClick={() => {
                                  const url = `http://localhost:5173/e/${u.qr_value}`;
                                  navigator.clipboard.writeText(url);
                                  toast.success('Enlace QR copiado al portapapeles');
                                }}
                                disabled={qrBusy === u.qr_id}
                                className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-brand-50 hover:text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Copiar enlace del QR de ${u.email}`}
                                title="Copiar enlace permanente del QR"
                              >
                                <Copy size={15} aria-hidden="true" />
                              </button>
                            )}
                          </div>
                          <RoleAction u={u} meId={me?.id} busy={busyId === u.id} onChange={askChangeRole} className="ml-auto mt-2 lg:mt-0" />
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
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(u.id)}
                        onChange={() => toggleSelect(u.id)}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border border-border bg-white transition-all ${
                          selectedIds.has(u.id) ? 'peer-checked:border-brand-500 peer-checked:bg-brand-500' : ''
                        }`}
                      >
                        {selectedIds.has(u.id) && (
                          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3.5 8.5l3 3 6-7" />
                          </svg>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Avatar email={u.email} admin={u.role === 'admin'} />
                      <div className="min-w-0">
                        <p className="break-all text-sm font-semibold text-neutral-900">{u.email}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">{u.role === 'admin' ? 'Administrador' : 'Usuario'} · Registrado {formatDate(u.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  <dl className="grid gap-1.5 text-sm">
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-xs font-medium text-text-secondary">Estado QR</dt>
                      <dd className="min-w-0 text-right">{u.qr_id ? <QrStatusBadge status={u.qr_status || 'pending_activation'} /> : <Badge tone="neutral" size="sm">Sin QR</Badge>}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-xs font-medium text-text-secondary">Impresión</dt>
                      <dd className="min-w-0 text-right"><PrintStatusBadge status={u.qr_print_status || 'pending_print'} /></dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-xs font-medium text-text-secondary">Generado</dt>
                      <dd className="min-w-0 text-right text-text-secondary">{formatDate(u.qr_created_at || u.created_at)}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={() => u.qr_id && openQrDetail(u.qr_id)}
                      disabled={!u.qr_id || qrBusy === u.qr_id}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        u.qr_id
                          ? 'border-brand-500/30 bg-brand-50 text-brand-700 hover:bg-brand-100'
                          : 'border-border text-text-secondary hover:bg-brand-50'
                      }`}
                    >
                      <QrCode size={13} aria-hidden="true" />
                      {qrBusy === u.qr_id ? <Loader2 size={13} className="animate-spin" /> : u.qr_id ? 'Ver QR' : 'Sin QR'}
                    </button>
                    {u.qr_id && (
                      <button
                        type="button"
                        onClick={() => {
                          const url = `http://localhost:5173/e/${u.qr_value}`;
                          navigator.clipboard.writeText(url);
                          toast.success('Enlace QR copiado al portapapeles');
                        }}
                        disabled={qrBusy === u.qr_id}
                        className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-brand-50 hover:text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Copiar enlace del QR de ${u.email}`}
                        title="Copiar enlace permanente del QR"
                      >
                        <Copy size={15} aria-hidden="true" />
                      </button>
                    )}
                    <RoleAction u={u} meId={me?.id} busy={busyId === u.id} onChange={askChangeRole} className="ml-auto" />
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

        {/* Modal detalle QR */}
        <QrDetailModal
          isOpen={qrModal}
          onClose={() => setQrModal(false)}
          qr={qrDetail}
          user={qrUser}
          history={qrHistory}
          loading={qrLoading}
          busy={qrBusy}
          onRegenerate={handleRegenerateQr}
          onSetPrintStatus={(status) => handleSetPrintStatus(qrUser?.id, status)}
        />
      </motion.div>
    </MotionConfig>
  );
};

export default AdminUsers;
