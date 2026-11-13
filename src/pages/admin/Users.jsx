import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  QrCode, Download, Copy, ExternalLink, RefreshCw, FileText, Printer, Check,
  AlertTriangle, Loader2, ChevronLeft, ChevronRight, Search, X, Minus, Clock,
  Users as UsersIcon, ShieldCheck, ShieldOff,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useAuth } from '../../contexts/useAuth';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import Modal from '../../components/Modal';
import { Badge } from '../../components/ui-kit';

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

/* Flujo de impresión de stickers, en orden */
const PRINT_STEPS = [
  { id: 'pending_print', label: 'Pendiente', long: 'Pendiente de impresión', dot: 'bg-slate-400' },
  { id: 'sent_to_print', label: 'Enviado', long: 'Enviado al proveedor', dot: 'bg-sky-500' },
  { id: 'printed', label: 'Impreso', long: 'Impreso', dot: 'bg-emerald-500' },
  { id: 'delivered', label: 'Entregado', long: 'Sticker entregado', dot: 'bg-brand-500' },
];
const PRINT_FILTERS = [{ id: '', label: 'Todos', dot: 'bg-neutral-900' }, ...PRINT_STEPS];
const PRINT_LABEL = Object.fromEntries(PRINT_STEPS.map((s) => [s.id, s.label]));
const PRINT_TONE = { pending_print: 'neutral', sent_to_print: 'info', printed: 'success', delivered: 'brand' };

const QR_STATUS_LABEL = { pending_activation: 'Pendiente', active: 'Activo', disabled: 'Deshabilitado' };
const QR_STATUS_TONE = { pending_activation: 'warn', active: 'success', disabled: 'danger' };

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const publicUrl = (value) => `${window.location.origin}/e/${value}`;

/* ───────── Helpers ───────── */
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
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
};

/* ───────── Piezas UI ───────── */
const Checkbox = ({ checked, indeterminate = false, onChange, label }) => (
  <label className="relative inline-flex h-5 w-5 flex-none cursor-pointer">
    <input type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="peer sr-only" />
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 ${
        checked || indeterminate ? 'border-brand-500 bg-brand-500 text-white' : 'border-border bg-white hover:border-brand-500/50'
      }`}
    >
      {indeterminate && !checked ? <Minus size={12} strokeWidth={3} /> : checked ? <Check size={12} strokeWidth={3} /> : null}
    </span>
  </label>
);

const IconBtn = ({ label, onClick, disabled, tone = 'neutral', children }) => {
  const tones = {
    neutral: 'border-border text-text-secondary hover:bg-brand-50 hover:text-neutral-900',
    brand: 'border-brand-500/30 text-brand-500 hover:bg-brand-500/10',
    warn: 'border-amber-300 text-amber-700 hover:bg-amber-50',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`focus-ring inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  );
};

const RoleBadge = ({ role }) => (
  <Badge tone={role === 'admin' ? 'brand' : 'neutral'} size="sm">
    {role === 'admin' ? 'Administrador' : 'Usuario'}
  </Badge>
);

const QrStatusBadge = ({ status }) => (
  <Badge tone={QR_STATUS_TONE[status] || 'neutral'} size="sm">{QR_STATUS_LABEL[status] || status}</Badge>
);

const PrintStatusBadge = ({ status }) => (
  <Badge tone={PRINT_TONE[status] || 'neutral'} size="sm">{PRINT_LABEL[status] || status}</Badge>
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

const Fact = ({ label, children, className = '' }) => (
  <div className={`rounded-xl border border-border bg-brand-50/60 p-3.5 ${className}`}>
    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{label}</p>
    <div className="mt-1 min-w-0 text-sm font-semibold text-neutral-900">{children}</div>
  </div>
);

/* ───────── Modal: detalle del QR ───────── */
const QrDetailModal = ({ isOpen, onClose, qr, user, history, loading, busy, printBusy, onRegenerate, onSetPrintStatus }) => {
  const toast = useToast();
  const [imageUrl, setImageUrl] = useState(null);
  const [imageVersion, setImageVersion] = useState(0);
  const [copied, setCopied] = useState(false);

  const qrUrl = qr?.qr_url || (qr?.value ? publicUrl(qr.value) : '');

  useEffect(() => {
    if (!isOpen || !qr?.id) return undefined;
    let cancelled = false;
    let objectUrl = null;
    (async () => {
      try {
        const res = await api.get(`/identifiers/${qr.id}/qr`, { responseType: 'blob' });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([res.data], { type: 'image/png' }));
        setImageUrl(objectUrl);
      } catch {
        // sin imagen: se muestra el marcador
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, qr?.id, imageVersion]);

  const handleCopy = async () => {
    if (!qrUrl) return;
    const ok = await copyText(qrUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const handleDownload = async () => {
    if (!qr?.id) return;
    try {
      await downloadBlob(`/identifiers/${qr.id}/qr`, `qr-${qr.value || qr.id}.png`);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo descargar el QR');
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerate || !qr?.id) return;
    await onRegenerate(qr.id);
    setImageVersion((v) => v + 1);
  };

  const currentStep = PRINT_STEPS.findIndex((s) => s.id === qr?.print_status);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle del código QR" size="lg">
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Imagen + acciones */}
        <div className="flex flex-col items-center gap-3">
          {loading ? (
            <div className="flex h-52 w-52 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-brand-50">
              <Loader2 size={24} className="animate-spin text-brand-500" />
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt="Código QR" className="h-52 w-52 rounded-2xl border border-border bg-white shadow-sm" />
          ) : (
            <div className="flex h-52 w-52 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-brand-50">
              <QrCode size={44} className="text-brand-500" aria-hidden="true" />
            </div>
          )}
          <div className="grid w-full gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={busy || !qrUrl}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? '¡Copiado!' : 'Copiar enlace'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={busy || !qr?.id}>
              <Download size={14} /> Descargar PNG
            </Button>
            <Button variant="ghost" size="sm" onClick={() => qrUrl && window.open(qrUrl, '_blank', 'noopener,noreferrer')} disabled={!qrUrl}>
              <ExternalLink size={14} /> Vista previa pública
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRegenerate} disabled={busy || !qr?.id} loading={busy}>
              <RefreshCw size={14} /> Regenerar imagen
            </Button>
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          {/* Usuario */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4">
            <Avatar email={user?.email} admin={user?.role === 'admin'} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-900">{user?.email || '—'}</p>
              <p className="mt-0.5 text-xs text-text-secondary">ID {user?.id} · Registrado {formatDate(user?.created_at)}</p>
            </div>
            {user?.role && <RoleBadge role={user.role} />}
          </div>

          {/* Datos del QR */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Fact label="Identificador público"><span className="break-all font-mono">{qr?.value || '—'}</span></Fact>
            <Fact label="Estado del QR">{qr?.status ? <QrStatusBadge status={qr.status} /> : '—'}</Fact>
            <Fact label="Generación">{formatDate(qr?.created_at)}</Fact>
            <Fact label="Activación">{formatDate(qr?.activation_at)}</Fact>
            <Fact label="URL permanente" className="sm:col-span-2">
              <span className="block break-all font-mono text-xs font-medium text-text-secondary">{qrUrl || '—'}</span>
            </Fact>
          </div>

          {/* Flujo de impresión */}
          <div className="rounded-xl border border-border bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Estado de impresión</p>
              {printBusy && <Loader2 size={14} className="animate-spin text-brand-500" aria-hidden="true" />}
            </div>
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRINT_STEPS.map((s, i) => {
                const active = qr?.print_status === s.id;
                const done = currentStep > i;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => !active && onSetPrintStatus?.(s.id)}
                      disabled={printBusy}
                      aria-pressed={active}
                      className={`focus-ring flex w-full flex-col items-start gap-1.5 rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        active
                          ? 'border-brand-500 bg-brand-500/10 text-brand-700'
                          : done
                            ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-50'
                            : 'border-border bg-white text-text-secondary hover:bg-brand-50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {done ? <Check size={13} className="text-emerald-600" aria-hidden="true" /> : <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />}
                        <span className="tabular-nums opacity-60">{i + 1}</span>
                      </span>
                      <span className="leading-tight">{s.long}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-xs text-text-secondary">
              Cambia solo el estado de impresión de <span className="font-semibold text-neutral-900">{user?.email || 'este usuario'}</span>.
              El identificador y la URL del QR no se modifican.
            </p>
          </div>

          {/* Historial */}
          <div className="rounded-xl border border-border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Historial del código</p>
              <span className="text-xs font-medium text-neutral-900">{history?.length || 0} eventos</span>
            </div>
            {!history || history.length === 0 ? (
              <p className="text-xs text-text-secondary">No hay eventos registrados.</p>
            ) : (
              <ul className="max-h-56 space-y-0 overflow-y-auto pr-1 custom-scrollbar">
                {history.map((ev, i) => (
                  <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < history.length - 1 && <span aria-hidden="true" className="absolute left-[9px] top-5 -bottom-0 w-px bg-border" />}
                    <span className="relative mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                      <Clock size={11} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-900">{ev.action}</p>
                      <p className="text-xs text-text-secondary">{formatDateTime(ev.created_at)}</p>
                      {ev.metadata && <p className="mt-0.5 break-all text-[10px] text-text-secondary/70">{String(ev.metadata).slice(0, 160)}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
  const [bulkConfirm, setBulkConfirm] = useState(null); // estado de impresión a aplicar

  // La selección se conserva al cambiar de página
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [qrModal, setQrModal] = useState(false);
  const [qrDetail, setQrDetail] = useState(null);
  const [qrUser, setQrUser] = useState(null);
  const [qrHistory, setQrHistory] = useState([]);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrBusy, setQrBusy] = useState(null);
  const [printBusyUser, setPrintBusyUser] = useState(null); // id de usuario o 'bulk'
  const searchRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/users', {
        params: { q: filters.q, role: filters.role, print_status: filters.print_status, page, limit: PAGE_SIZE },
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

  const hasFilters = !!(input || filters.q || filters.role || filters.print_status);

  const clearFilters = () => {
    setInput('');
    setFilters({ q: '', role: '', print_status: '' });
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
    if (ids.length === 0) return;
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
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Error al exportar');
    } finally {
      setBusyExport(false);
    }
  };

  /* Estado de impresión masivo */
  const doBulkPrint = async () => {
    const ids = [...selectedIds];
    if (!bulkConfirm || ids.length === 0) return;
    setPrintBusyUser('bulk');
    try {
      await api.post('/identifiers/bulk-print-status', { user_ids: ids, print_status: bulkConfirm });
      toast.success(`Impresión marcada como "${PRINT_LABEL[bulkConfirm]}" para ${ids.length} usuario(s)`);
      setBulkConfirm(null);
      clearSelection();
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo actualizar el estado de impresión');
    } finally {
      setPrintBusyUser(null);
    }
  };

  /* Detalle de QR */
  const openQrDetail = async (qrId) => {
    setQrBusy(qrId);
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
      setQrBusy(null);
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
    if (!userId) return;
    setPrintBusyUser(userId);
    try {
      await api.post('/identifiers/bulk-print-status', { user_ids: [userId], print_status: printStatus });
      toast.success(`Estado de impresión: "${PRINT_LABEL[printStatus]}"`);
      setQrDetail((d) => (d ? { ...d, print_status: printStatus } : d));
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo actualizar el estado de impresión');
    } finally {
      setPrintBusyUser(null);
    }
  };

  const copyUserLink = async (u) => {
    const ok = await copyText(publicUrl(u.qr_value));
    if (ok) toast.success('Enlace del QR copiado');
    else toast.error('No se pudo copiar el enlace');
  };

  const confirming = confirm && busyId === confirm.user.id;
  const selectedCount = selectedIds.size;
  const from = pagination ? (pagination.page - 1) * PAGE_SIZE + 1 : 0;
  const to = pagination ? Math.min(pagination.page * PAGE_SIZE, pagination.total) : 0;

  /* Acciones por fila (compartidas entre tabla y tarjetas) */
  const RowActions = ({ u }) => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => u.qr_id && openQrDetail(u.qr_id)}
        disabled={!u.qr_id || qrBusy === u.qr_id}
        className={`focus-ring inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          u.qr_id ? 'border-brand-500/30 bg-brand-50 text-brand-700 hover:bg-brand-100' : 'border-border text-text-secondary'
        }`}
        aria-label={`Gestionar el QR de ${u.email}`}
      >
        {qrBusy === u.qr_id ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} aria-hidden="true" />}
        {u.qr_id ? 'Gestionar QR' : 'Sin QR'}
      </button>
      {u.qr_id && (
        <IconBtn label={`Copiar enlace del QR de ${u.email}`} onClick={() => copyUserLink(u)}>
          <Copy size={15} aria-hidden="true" />
        </IconBtn>
      )}
      {me?.id === u.id ? (
        <Badge tone="info" size="sm">Tu cuenta</Badge>
      ) : (
        <IconBtn
          label={u.role === 'user' ? `Hacer administrador a ${u.email}` : `Quitar administrador a ${u.email}`}
          tone={u.role === 'user' ? 'brand' : 'warn'}
          disabled={busyId === u.id}
          onClick={() => askChangeRole(u, u.role === 'user' ? 'admin' : 'user')}
        >
          {busyId === u.id ? <Loader2 size={15} className="animate-spin" /> : u.role === 'user' ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
        </IconBtn>
      )}
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={container} initial="hidden" animate="show" className={`space-y-4 lg:space-y-5 ${selectedCount > 0 ? 'pb-28' : ''}`}>
        <motion.div variants={item}>
          <PageTitle
            title="Usuarios y códigos QR"
            description="Gestiona cuentas y roles, sigue el estado de impresión de los stickers y exporta códigos QR."
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
              <input
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

          <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4 lg:px-4 lg:py-3">
            <span className="flex-none text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Impresión de stickers</span>
            <div role="tablist" aria-label="Filtrar por estado de impresión" className="custom-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:pb-0">
              {PRINT_FILTERS.map((f) => {
                const active = filters.print_status === f.id;
                return (
                  <button
                    key={f.id || 'all'}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter('print_status', f.id)}
                    className={`focus-ring inline-flex flex-none items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      active ? 'border-brand-500 bg-brand-500 text-white shadow-soft' : 'border-border bg-white text-text-secondary hover:border-brand-500/40 hover:text-neutral-900'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${active ? 'bg-white' : f.dot}`} aria-hidden="true" />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
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
              <span>Marca usuarios para exportar sus QR o cambiar su estado de impresión.</span>
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
                <table className="w-full min-w-[860px] table-fixed text-left text-sm">
                  <thead className="border-b border-border bg-brand-50/70 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                    <tr>
                      <th scope="col" className="w-[52px] py-3 pl-4 pr-2">
                        <Checkbox checked={allPageSelected} indeterminate={somePageSelected} onChange={toggleSelectPage} label="Seleccionar todos los de la página" />
                      </th>
                      <th scope="col" className="min-w-[0] py-3">Usuario</th>
                      <th scope="col" className="w-[200px] px-3 py-3">Código QR</th>
                      <th scope="col" className="w-[150px] px-3 py-3">Impresión</th>
                      <th scope="col" className="w-[170px] px-3 py-3">Generación</th>
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
                            <Checkbox checked={selected} onChange={() => toggleSelect(u.id)} label={`Seleccionar a ${u.email}`} />
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
                          <td className="px-3 py-3">
                            {u.qr_id ? (
                              <div className="space-y-1">
                                <QrStatusBadge status={u.qr_status || 'pending_activation'} />
                                {u.qr_value && <p className="font-mono text-[11px] text-text-secondary">{String(u.qr_value).slice(0, 10)}…</p>}
                              </div>
                            ) : (
                              <Badge tone="neutral" size="sm">Sin QR</Badge>
                            )}
                          </td>
                          <td className="px-3 py-3"><PrintStatusBadge status={u.qr_print_status || 'pending_print'} /></td>
                          <td className="whitespace-nowrap px-3 py-3 text-text-secondary">{formatDate(u.qr_created_at || u.created_at)}</td>
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
                      <div className="pt-2.5"><Checkbox checked={selected} onChange={() => toggleSelect(u.id)} label={`Seleccionar a ${u.email}`} /></div>
                      <Avatar email={u.email} admin={u.role === 'admin'} />
                      <div className="min-w-0 flex-1">
                        <p className="break-all text-sm font-semibold text-neutral-900">{u.email}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
                          <RoleBadge role={u.role} />
                          <span>Registrado {formatDate(u.created_at)}</span>
                        </p>
                      </div>
                    </div>
                    <dl className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-border bg-brand-50/50 p-3 text-xs">
                      <div>
                        <dt className="font-medium text-text-secondary">QR</dt>
                        <dd className="mt-1">{u.qr_id ? <QrStatusBadge status={u.qr_status || 'pending_activation'} /> : <Badge tone="neutral" size="sm">Sin QR</Badge>}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-text-secondary">Impresión</dt>
                        <dd className="mt-1"><PrintStatusBadge status={u.qr_print_status || 'pending_print'} /></dd>
                      </div>
                      <div>
                        <dt className="font-medium text-text-secondary">Generado</dt>
                        <dd className="mt-1 text-neutral-900">{formatDate(u.qr_created_at || u.created_at)}</dd>
                      </div>
                    </dl>
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

        {/* Barra de acciones masivas */}
        <AnimatePresence>
          {selectedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 28 }}
              transition={{ duration: 0.25, ease: EASE }}
              role="region"
              aria-label="Acciones sobre la selección"
              className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-4xl"
            >
              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-brand-900/95 p-3 text-white shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-white/15 px-2 text-sm font-bold tabular-nums">{selectedCount}</span>
                  <span className="text-sm font-medium">{selectedCount === 1 ? 'usuario seleccionado' : 'usuarios seleccionados'}</span>
                  <button type="button" onClick={clearSelection} className="text-xs font-semibold text-white/70 underline underline-offset-2 hover:text-white">Limpiar</button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value=""
                    onChange={(e) => e.target.value && setBulkConfirm(e.target.value)}
                    disabled={printBusyUser === 'bulk'}
                    aria-label="Cambiar estado de impresión de la selección"
                    className="focus-ring h-9 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white"
                  >
                    <option value="" className="text-neutral-900">Marcar impresión…</option>
                    {PRINT_STEPS.map((s) => <option key={s.id} value={s.id} className="text-neutral-900">{s.long}</option>)}
                  </select>
                  <button type="button" onClick={() => handleExport('csv')} disabled={busyExport} className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold transition-colors hover:bg-white/20 disabled:opacity-50">
                    <FileText size={14} aria-hidden="true" /> CSV
                  </button>
                  <button type="button" onClick={() => handleExport('zip')} disabled={busyExport} className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold transition-colors hover:bg-white/20 disabled:opacity-50">
                    <Download size={14} aria-hidden="true" /> ZIP
                  </button>
                  <button type="button" onClick={() => handleExport('pdf')} disabled={busyExport} className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-50">
                    {busyExport ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} aria-hidden="true" />} PDF impresión
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmación de cambio de rol */}
        <Modal
          isOpen={!!confirm}
          onClose={() => (confirming ? null : setConfirm(null))}
          title={confirm?.role === 'admin' ? 'Dar permisos de administrador' : 'Quitar permisos de administrador'}
        >
          <div className="mb-6 flex items-start gap-3">
            <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ring-1 ${confirm?.role === 'admin' ? 'bg-brand-500/10 text-brand-500 ring-brand-500/15' : 'bg-amber-50 text-amber-600 ring-amber-600/15'}`}>
              {confirm?.role === 'admin' ? <ShieldCheck size={18} aria-hidden="true" /> : <ShieldOff size={18} aria-hidden="true" />}
            </span>
            <p className="text-sm leading-relaxed text-text-secondary">
              {confirm?.role === 'admin' ? (
                <><span className="break-all font-semibold text-neutral-900">{confirm?.user.email}</span> podrá gestionar usuarios, pedidos y la auditoría de la plataforma.</>
              ) : (
                <><span className="break-all font-semibold text-neutral-900">{confirm?.user.email}</span> perderá el acceso al panel administrativo.</>
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

        {/* Confirmación de estado de impresión masivo */}
        <Modal
          isOpen={!!bulkConfirm}
          onClose={() => (printBusyUser === 'bulk' ? null : setBulkConfirm(null))}
          title="Actualizar estado de impresión"
        >
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
              <Printer size={18} aria-hidden="true" />
            </span>
            <p className="text-sm leading-relaxed text-text-secondary">
              Se marcará como <span className="font-semibold text-neutral-900">{PRINT_LABEL[bulkConfirm]}</span> el estado de impresión de{' '}
              <span className="font-semibold text-neutral-900">{selectedCount} {selectedCount === 1 ? 'usuario' : 'usuarios'}</span>.
              El identificador y la URL de cada QR no se modifican.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setBulkConfirm(null)} disabled={printBusyUser === 'bulk'}>Cancelar</Button>
            <Button onClick={doBulkPrint} disabled={printBusyUser === 'bulk'}>
              {printBusyUser === 'bulk' && <Loader2 size={16} className="animate-spin" />}
              {printBusyUser === 'bulk' ? 'Guardando...' : 'Aplicar'}
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
          busy={!!qrBusy}
          printBusy={!!printBusyUser}
          onRegenerate={handleRegenerateQr}
          onSetPrintStatus={(status) => handleSetPrintStatus(qrUser?.id, status)}
        />
      </motion.div>
    </MotionConfig>
  );
};

export default AdminUsers;