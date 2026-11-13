import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  Barcode,
  Box,
  CheckCircle2,
  Clipboard,
  Copy,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Package,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Sticker,
  Users,
} from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import { Input } from '../../components/ui';
import { Label } from '../../components/ui';
import { Badge, StatCard } from '../../components/ui-kit';
import { routes } from '../../utils/routes';

/* ───────── Constantes ───────── */
const EASE = [0.22, 1, 0.36, 1];
const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';
const card = panel + ' p-4 sm:p-5';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const PACKAGE_STATUSES = [
  'available', 'reserved', 'assigned', 'in_production', 'printed', 'dispatched', 'delivered', 'cancelled', 'retired',
];
const PACKAGE_LABEL = {
  available: ['Disponible', 'success'],
  reserved: ['Reservado', 'warn'],
  assigned: ['Asignado', 'info'],
  in_production: ['En producción', 'info'],
  printed: ['Impreso', 'success'],
  dispatched: ['Despachado', 'success'],
  delivered: ['Entregado', 'success'],
  cancelled: ['Cancelado', 'danger'],
  retired: ['Retirado', 'neutral'],
};
const ORIGIN_LABEL = { inventory: 'Inventario', on_demand: 'Bajo pedido' };

const fmt = (n) => (n === undefined || n === null ? '—' : String(n));
const fmtDate = (n) => {
  if (!n) return '—';
  try { return new Date(n).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return String(n); }
};

const statusColor = (status) => {
  switch (status) {
    case 'available': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'reserved': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'assigned': return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'in_production': return 'bg-brand-50 text-brand-700 border-brand-200';
    case 'printed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'dispatched': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'retired': return 'bg-neutral-50 text-neutral-700 border-neutral-200';
    default: return 'bg-neutral-50 text-neutral-700 border-neutral-200';
  }
};

/* ───────── Skeleton ───────── */
const SkeletonLine = ({ w = 'w-64', h = 'h-5' }) => (
  <div className={`animate-pulse rounded-full bg-border/60 ${w} ${h}`} aria-hidden="true" />
);
const SkeletonTable = () => (
  <div className="animate-pulse space-y-2" aria-busy="true" aria-live="polite">
    <div className="space-y-2">
      <div className="h-8 w-72 rounded-lg bg-border/60" />
      <div className="h-4 w-56 rounded-lg bg-border/50" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-36 rounded-2xl bg-border/60" />)}
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="h-64 rounded-2xl bg-border/60 lg:col-span-2" />
      <div className="h-64 rounded-2xl bg-border/60" />
    </div>
  </div>
);

/* ───────── Copiar al portapapeles ───────── */
const useCopy = () => {
  const [copied, setCopied] = useState(null);
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  };
  return { copied, copy };
};

/* ───────── Página ───────── */
export const AdminQrInventory = () => {
  const toast = useToast();
  const { copied, copy } = useCopy();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [packages, setPackages] = useState([]);
  const [batches, setBatches] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchForm, setBatchForm] = useState({ design_id: '', quantity: '' });
  const [designs, setDesigns] = useState([]);
  const [filters, setFilters] = useState({ design: '', status: '', origin: '', batch: '', search: '' });
  const [statusActionLoading, setStatusActionLoading] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/qr-inventory/stats');
      setStats(data.stats || {});
    } catch {
      // No bloquear la página si las stats fallan.
    }
  }, []);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.design) params.set('design', filters.design);
      if (filters.status) params.set('status', filters.status);
      if (filters.origin) params.set('origin', filters.origin);
      if (filters.batch) params.set('batch', filters.batch);
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      const { data } = await api.get(`/admin/qr-inventory/packages?${params}`);
      setPackages(data.packages || []);
      setPagination((prev) => ({ ...prev, total: data.pagination?.total ?? 0, pages: data.pagination?.pages ?? 0 }));
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudieron cargar los paquetes');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, toast]);

  const loadBatches = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/qr-inventory/packages');
      setBatches(data.packages || []);
    } catch {
      // No bloquear si falla el listado de lotes.
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadStats();
      loadPackages();
      loadBatches();
      api.get('/designs').then(({ data }) => {
        const list = data.designs || data || [];
        setDesigns(list.filter((d) => d.is_available === 1 || d.is_available === true));
      }).catch(() => setDesigns([]));
    }, 0);
    return () => clearTimeout(t);
  }, [loadStats, loadPackages, loadBatches]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!batchForm.design_id || !batchForm.quantity) return;
    setBatchLoading(true);
    try {
      await api.post('/admin/qr-inventory/batches', {
        design_id: Number(batchForm.design_id),
        quantity: Number(batchForm.quantity),
      });
      setBatchForm({ design_id: '', quantity: '' });
      toast.success('Lote creado. Los paquetes quedaron en producción; confírmalos al recibirlos.');
      await loadPackages();
      await loadBatches();
      await loadStats();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo crear el lote');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchAction = async (batchId, action) => {
    if (!confirm(`¿Confirma que desea ${action === 'print' ? 'marcar el lote como impreso' : action === 'receive' ? 'confirmar la recepción física del lote' : 'cancelrar el lote'}?`)) return;
    setStatusActionLoading((prev) => ({ ...prev, [batchId]: true }));
    try {
      await api.post(`/admin/qr-inventory/batches/${batchId}/${action}`, {});
      toast.success(`Lote ${action === 'print' ? 'marcado como impreso' : action === 'receive' ? 'recibido (disponible)' : 'cancelrado'}`);
      await loadPackages();
      await loadBatches();
      await loadStats();
    } catch (e) {
      toast.error(e?.response?.data?.error || `No se pudo ${action} el lote`);
    } finally {
      setStatusActionLoading((prev) => ({ ...prev, [batchId]: false }));
    }
  };

  const handlePackageStatus = async (packageId, status) => {
    if (!confirm(`¿Confirma cambiar el estado del paquete a ${PACKAGE_LABEL[status]?.[0] ?? status}?`)) return;
    setStatusActionLoading((prev) => ({ ...prev, [packageId]: true }));
    try {
      await api.post(`/admin/qr-inventory/packages/${packageId}/status`, { status });
      toast.success(`Estado actualizado a ${PACKAGE_LABEL[status]?.[0] ?? status}`);
      await loadPackages();
      await loadStats();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo actualizar el estado');
    } finally {
      setStatusActionLoading((prev) => ({ ...prev, [packageId]: false }));
    }
  };

  const openDetail = async (packageId) => {
    setDetail(null);
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const { data } = await api.get(`/admin/qr-inventory/packages/${packageId}`);
      setDetail(data.package || null);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo cargar el detalle del paquete');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.location.href = `${api.defaults.baseURL}/admin/qr-inventory/export?format=csv`;
  };

  const statsMemo = useMemo(() => {
    const pkgs = stats?.packages ?? {};
    return {
      pkgs,
      ids: stats?.identifiers ?? { active: 0, pending_activation: 0 },
      batches: stats?.batches ?? {},
    };
  }, [stats]);

  const filteredPackages = useMemo(() => {
    const term = (filters.search || '').toLowerCase().trim();
    if (!term) return packages;
    return packages.filter((p) =>
      (p.value || '').toLowerCase().includes(term) ||
      (p.package_code || '').toLowerCase().includes(term) ||
      (p.batch_code || '').toLowerCase().includes(term) ||
      (p.order_number || '').toLowerCase().includes(term) ||
      (p.user_email || '').toLowerCase().includes(term)
    );
  }, [packages, filters.search]);

  const filteredBatches = useMemo(() => {
    const term = (filters.search || '').toLowerCase().trim();
    if (!term) return batches;
    return batches.filter((b) =>
      (b.batch_code || '').toLowerCase().includes(term) ||
      (b.status || '').toLowerCase().includes(term)
    );
  }, [batches, filters.search]);

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
            title="Inventario de stickers y códigos QR"
            description="Paquetes físicos reales: dos stickers con el mismo QR por paquete, diseño asociado y estado de inventario."
            actions={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
                <Button variant="outline" size="sm" onClick={handleExportCsv}>
                  <Download size={16} aria-hidden="true" /> Exportar CSV (proveedor)
                </Button>
              </div>
            }
          />
        </motion.div>

        {/* KPIs */}
        <motion.div variants={item} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
          <StatCard label="Paquetes disponibles" value={fmt(statsMemo.pkgs.available)} icon={Box} tone="bg-emerald-500" hint="Listos para venta" />
          <StatCard label="Paquetes reservados" value={fmt(statsMemo.pkgs.reserved)} icon={Package} tone="bg-amber-500" hint="En checkout pendiente" />
          <StatCard label="Paquetes asignados" value={fmt(statsMemo.pkgs.assigned)} icon={CheckCircle2} tone="bg-sky-500" hint="Asociados a un usuario" />
          <StatCard label="En producción" value={fmt(statsMemo.pkgs.in_production)} icon={Barcode} tone="bg-brand-500" hint="Imprimiéndose" />
          <StatCard label="Impresos / despachados" value={fmt((statsMemo.pkgs.printed || 0) + (statsMemo.pkgs.dispatched || 0))} icon={Sticker} tone="bg-emerald-500" hint="Listos para entrega" />
          <StatCard label="QR activos" value={fmt(statsMemo.ids.active)} icon={Users} tone="bg-brand-500" hint="Identificadores en uso" />
        </motion.div>

        {/* Generación de lotes */}
        <motion.section variants={item} aria-labelledby="batch-title">
          <h2 id="batch-title" className="mb-3 text-base font-semibold text-neutral-900 lg:mb-4">Generación de lote por diseño</h2>
          <form onSubmit={handleCreateBatch} className={`${panel} p-4 sm:p-5 grid gap-3 sm:grid-cols-4 lg:gap-5`}>
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 space-y-2">
              <Label>Diseño</Label>
              <select
                value={batchForm.design_id}
                onChange={(e) => setBatchForm((prev) => ({ ...prev, design_id: e.target.value }))}
                className="block w-full rounded-lg border bg-brand-50 px-4 py-2.5 text-base text-neutral-900 placeholder:text-text-secondary/60 transition-all duration-200 hover:border-brand-500/40 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
              >
                <option value="">Seleccionar diseño</option>
                {designs.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1 sm:col-span-1 lg:col-span-1 space-y-2">
              <Label>Cantidad de paquetes</Label>
              <input
                type="number"
                min="1"
                max="10000"
                value={batchForm.quantity}
                onChange={(e) => setBatchForm((prev) => ({ ...prev, quantity: e.target.value }))}
                placeholder="20"
                className="block w-full rounded-lg border bg-brand-50 px-4 py-2.5 text-base text-neutral-900 placeholder:text-text-secondary/60 transition-all duration-200 hover:border-brand-500/40 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
              />
            </div>
            <div className="col-span-1 sm:col-span-1 lg:col-span-1 flex items-end">
              <Button type="submit" variant="primary" size="sm" loading={batchLoading} disabled={!batchForm.design_id || !batchForm.quantity}>
                {batchLoading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
                {batchLoading ? 'Generando…' : 'Crear lote'}
              </Button>
            </div>
            <p className="col-span-full mt-1 text-xs text-text-secondary">
              Los códigos se generan digitalmente y quedan en producción; solo pasan a <strong>disponibles</strong> cuando confirmes recepción física.
            </p>
          </form>
        </motion.section>

        {/* Gestión de lotes */}
        <motion.section variants={item} aria-labelledby="lotes-title">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 id="lotes-title" className="text-base font-semibold text-neutral-900 lg:mb-4">Lotes de producción</h2>
              <p className="text-xs text-text-secondary">{fmt(filteredBatches.length)} lotes registrados</p>
            </div>
          </div>
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-sm divide-y divide-border">
              <thead>
                <tr className="text-left text-xs text-text-secondary/80">
                  <th className="px-4 py-3">Lote</th>
                  <th className="px-4 py-3">Diseño</th>
                  <th className="px-4 py-3">Solicitados</th>
                  <th className="px-4 py-3">Confirmados</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                      <AlertTriangle size={20} className="mx-auto mb-2 opacity-50" aria-hidden="true" />
                      <p>No se encontraron lotes.</p>
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => (
                    <tr key={b.id} className="group">
                      <td className="px-4 py-3 font-mono text-xs text-neutral-900">{b.batch_code}</td>
                      <td className="px-4 py-3 text-xs text-neutral-900">{b.design?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-neutral-900">{fmt(b.quantity_requested)}</td>
                      <td className="px-4 py-3 text-xs text-neutral-900">{fmt(b.quantity_confirmed)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={PACKAGE_LABEL[b.status]?.[1] ?? 'neutral'} size="xs">
                          {PACKAGE_LABEL[b.status]?.[0] ?? b.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-900">{fmtDate(b.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {b.status === 'pending_print' && (
                            <Button variant="outline" size="xs" loading={statusActionLoading[b.id] === 'print'} disabled={statusActionLoading[b.id] === 'print'} onClick={() => handleBatchAction(b.id, 'print')}>
                              Marcar impreso
                            </Button>
                          )}
                          {b.status === 'printed' && (
                            <Button variant="outline" size="xs" loading={statusActionLoading[b.id] === 'receive'} disabled={statusActionLoading[b.id] === 'receive'} onClick={() => handleBatchAction(b.id, 'receive')}>
                              Confirmar recibido
                            </Button>
                          )}
                          {['pending_print', 'generated', 'printed'].includes(b.status) && (
                            <Button variant="outline" size="xs" loading={statusActionLoading[b.id] === 'cancel'} disabled={statusActionLoading[b.id] === 'cancel'} onClick={() => handleBatchAction(b.id, 'cancel')}>
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Listado de paquetes con filtros */}
        <motion.section variants={item} aria-labelledby="packages-title">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 id="packages-title" className="text-base font-semibold text-neutral-900 lg:mb-4">Paquetes de inventario</h2>
              <p className="text-xs text-text-secondary">{fmt(pagination.total)} paquetes registrados</p>
            </div>
            <div className="flex w-full flex-col sm:flex-row gap-3 sm:w-auto">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" aria-hidden="true" />
                <input
                  placeholder="Buscar identificador, paquete o lote…"
                  className="block w-full rounded-lg border bg-brand-50 pl-10 pr-4 py-2.5 text-base text-neutral-900 placeholder:text-text-secondary/60 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                  value={filters.search}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, search: e.target.value }));
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                />
              </div>
              <div className="min-w-[140px]">
                <Label className="text-xs text-text-secondary mb-1 block">Estado</Label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full rounded-lg border bg-brand-50 px-3 py-2 text-xs text-neutral-900 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Todos</option>
                  {PACKAGE_STATUSES.map((s) => (
                    <option key={s} value={s}>{PACKAGE_LABEL[s]?.[0] ?? s}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[140px]">
                <Label className="text-xs text-text-secondary mb-1 block">Origen</Label>
                <select
                  value={filters.origin}
                  onChange={(e) => handleFilterChange('origin', e.target.value)}
                  className="block w-full rounded-lg border bg-brand-50 px-3 py-2 text-xs text-neutral-900 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Todos</option>
                  <option value="inventory">Inventario</option>
                  <option value="on_demand">Bajo pedido</option>
                </select>
              </div>
              <div className="min-w-[150px]">
                <Label className="text-xs text-text-secondary mb-1 block">Diseño</Label>
                <select
                  value={filters.design}
                  onChange={(e) => handleFilterChange('design', e.target.value)}
                  className="block w-full rounded-lg border bg-brand-50 px-3 py-2 text-xs text-neutral-900 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Todos</option>
                  {designs.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setFilters({ design: '', status: '', origin: '', batch: '', search: '' });
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}>
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
                  <th className="px-4 py-3">Paquete</th>
                  <th className="px-4 py-3">Diseño</th>
                  <th className="px-4 py-3">Identificador QR</th>
                  <th className="px-4 py-3 hidden sm:table-cell">URL pública</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Pedido</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-text-secondary">
                      <AlertTriangle size={20} className="mx-auto mb-2 opacity-50" aria-hidden="true" />
                      <p>No se encontraron paquetes.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((p) => (
                    <tr key={p.id} className="group">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-neutral-900">{p.package_code}</div>
                        <div className="text-xs text-text-secondary">{fmtDate(p.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium text-text-secondary border-border/50">
                          {p.design?.image_url && (
                            <img src={p.design.image_url} alt="" className="h-5 w-5 rounded object-cover" />
                          )}
                          {p.design?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-neutral-900 truncate max-w-xs" title={p.value}>{p.value}</div>
                        <a
                          href={`${window.location.origin}/e/${encodeURIComponent(p.value)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 text-xs text-brand-600 hover:underline"
                          title="Abrir enlace público"
                        >
                          <QrCode size={12} className="mr-1" aria-hidden="true" /> Ver público
                        </a>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-text-secondary truncate max-w-xs">{p.public_url}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={PACKAGE_LABEL[p.status]?.[1] ?? 'neutral'} size="xs">
                          {PACKAGE_LABEL[p.status]?.[0] ?? p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-neutral-900">{ORIGIN_LABEL[p.origin] ?? p.origin}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-neutral-900">{p.user_email ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-neutral-900">{p.order_number ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Button variant="outline" size="xs" onClick={() => openDetail(p.id)}>Detalle</Button>
                          {p.batch_id && p.status === 'in_production' && (
                            <Button variant="outline" size="xs" loading={statusActionLoading[p.id] === 'print'} disabled={statusActionLoading[p.id] === 'print'} onClick={() => handleBatchAction(p.batch_id, 'print')}>
                              Marcar impreso
                            </Button>
                          )}
                          {p.batch_id && p.status === 'printed' && (
                            <Button variant="outline" size="sm" loading={statusActionLoading[p.id] === 'receive'} disabled={statusActionLoading[p.id] === 'receive'} onClick={() => handleBatchAction(p.batch_id, 'receive')}>
                              Confirmar recibido
                            </Button>
                          )}
                          {!p.batch_id && p.status === 'in_production' && (
                            <span className="text-xs text-text-secondary">Producción bajo pedido</span>
                          )}
                          {p.status === 'available' && (
                            <Button variant="outline" size="sm" onClick={() => handlePackageStatus(p.id, 'reserved')}>Reservar</Button>
                          )}
                          {p.status === 'reserved' && (
                            <Button variant="outline" size="sm" onClick={() => handlePackageStatus(p.id, 'assigned')}>Asignar</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
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
                <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}>Siguiente</Button>
              </div>
            </div>
          )}
        </motion.section>
      </motion.div>

      {/* Modal de detalle de paquete */}
      <AnimatePresence>
        {detailOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center lg:items-start lg:justify-start lg:p-6"
            onClick={() => setDetailOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-3xl bg-white rounded-2xl border border-border shadow-2xl max-h-[90vh] overflow-y-auto m-4 lg:m-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="text-lg font-bold text-neutral-900">Detalle del paquete</h2>
                <button
                  type="button"
                  onClick={() => setDetailOpen(false)}
                  className="focus-ring rounded-lg p-2 text-text-secondary hover:bg-brand-50 hover:text-neutral-900 transition-colors"
                  aria-label="Cerrar detalle"
                >
                  <EyeOff size={20} aria-hidden="true" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {detailLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 size={24} className="animate-spin" aria-label="Cargando" />
                  </div>
                ) : (
                  <>
                    {!detail ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
                        <AlertCircle size={24} className="mx-auto mb-2" aria-hidden="true" />
                        <p className="text-sm font-medium">No se encontró el paquete.</p>
                      </div>
                    ) : (
                      <>
                        {/* Fila superior: diseño + QR */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:gap-6">
                          <div className={card}>
                            <h3 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">Diseño del sticker</h3>
                            <div className="aspect-square bg-neutral-100 rounded-xl flex items-center justify-center mb-3 border border-border">
                              {detail.design?.image_url ? (
                                <img src={detail.design.image_url} alt="Diseño" className="w-full h-full rounded-xl object-cover" />
                              ) : (
                                <Sticker size={28} className="text-neutral-400" aria-hidden="true" />
                              )}
                            </div>
                            <p className="text-sm font-medium text-neutral-900">{detail.design?.name ?? '—'}</p>
                            <p className="mt-0.5 text-xs text-text-secondary">{detail.design?.description ?? 'Sin descripción'}</p>
                          </div>

                          <div className={card}>
                            <h3 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">Código QR</h3>
                            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-4 mb-3">
                              <QrCode size={140} value={detail.value} color="#0b1016" className="image-rendering-pixelated" />
                            </div>
                            <div className="font-mono text-sm text-neutral-900 truncate max-w-xs" title={detail.value}>{detail.value}</div>
                            <div className="flex gap-2 mt-2">
                              <Button variant="outline" size="sm" onClick={() => copy(detail.value)} loading={copied === detail.value}>
                                {copied === detail.value ? <CheckCircle2 size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                                {copied === detail.value ? 'Copiado' : 'Copiar identificador'}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => copy(detail.public_url)} loading={copied === detail.public_url}>
                                {copied === detail.public_url ? <CheckCircle2 size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                                {copied === detail.public_url ? 'Copiado' : 'Copiar URL pública'}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Datos del paquete */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <StatCard label="Código de paquete" value={detail.package_code} icon={Package} tone="bg-brand-50" hint="Identificador interno" />
                          <StatCard label="Diseño" value={detail.design?.name ?? '—'} icon={Sticker} tone="bg-brand-50" hint="Diseño comercial" />
                          <StatCard label="Origen" value={ORIGIN_LABEL[detail.origin] ?? detail.origin} icon={Barcode} tone="bg-sky-50" hint="Inventario o bajo pedido" />
                          <StatCard label="Cantidad de stickers" value={fmt(detail.quantity_stickers)} icon={Box} tone="bg-emerald-50" hint="Dos stickers con el mismo QR" />
                        </div>

                        {/* Estados y fechas */}
                        <div className={card}>
                          <h3 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">Estado y fechas</h3>
                          <div className="grid gap-3 sm:grid-cols-4">
                            <div className="rounded-lg border p-3 bg-neutral-50">
                              <p className="text-xs text-text-secondary">Estado físico</p>
                              <Badge tone={PACKAGE_LABEL[detail.status]?.[1] ?? 'neutral'} className="mt-1 w-fit">
                                {PACKAGE_LABEL[detail.status]?.[0] ?? detail.status}
                              </Badge>
                            </div>
                            <div className="rounded-lg border p-3 bg-neutral-50">
                              <p className="text-xs text-text-secondary">Activación del QR</p>
                              <span className="mt-1 text-xs font-medium">{detail.identifier?.status ?? '—'}</span>
                            </div>
                            <div className="rounded-lg border p-3 bg-neutral-50">
                              <p className="text-xs text-text-secondary">Fecha de generación</p>
                              <p className="mt-1 text-xs font-medium text-neutral-900">{fmtDate(detail.created_at)}</p>
                            </div>
                            <div className="rounded-lg border p-3 bg-neutral-50">
                              <p className="text-xs text-text-secondary">Fecha de impresión</p>
                              <p className="mt-1 text-xs font-medium text-neutral-900">{fmtDate(detail.printed_at)}</p>
                            </div>
                            <div className="rounded-lg border p-3 bg-neutral-50">
                              <p className="text-xs text-text-secondary">Fecha de despacho</p>
                              <p className="mt-1 text-xs font-medium text-neutral-900">{fmtDate(detail.dispatched_at)}</p>
                            </div>
                            <div className="rounded-lg border p-3 bg-neutral-50">
                              <p className="text-xs text-text-secondary">Fecha de entrega</p>
                              <p className="mt-1 text-xs font-medium text-neutral-900">{fmtDate(detail.delivered_at)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Usuario y pedido asociados */}
                        <div className={card}>
                          <h3 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">Asociación</h3>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-lg border p-3 bg-neutral-50">
                              <p className="text-xs text-text-secondary">Usuario asociado</p>
                              <p className="mt-1 text-xs font-medium text-neutral-900">{detail.user_email ?? 'Sin asignar'}</p>
                            </div>
                            <div className="rounded-lg border p-3 bg-neutral-50">
                              <p className="text-xs text-text-secondary">Pedido relacionado</p>
                              <p className="mt-1 text-xs font-medium text-neutral-900">{detail.order_number ?? 'Sin asignar'}</p>
                            </div>
                            <div className="rounded-lg border p-3 bg-neutral-50">
                              <p className="text-xs text-text-secondary">Lote</p>
                              <p className="mt-1 text-xs font-medium text-neutral-900">{detail.batch_code ?? 'Sin lote'}</p>
                            </div>
                            <div className="rounded-lg border p-3 bg-neutral-50">
                              <p className="text-xs text-text-secondary">URL pública</p>
                              <a
                                href={`${window.location.origin}/e/${encodeURIComponent(detail.value)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 text-xs font-medium text-brand-600 hover:underline break-all"
                              >
                                /e/{detail.value}
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Cambiar estado físico */}
                        <div className={card}>
                          <h3 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">Cambiar estado físico</h3>
                          <p className="mb-3 text-xs text-text-secondary">
                            El estado físico es independiente de la activación del QR. Cambiarlo no activa ni desactiva el código QR.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {PACKAGE_STATUSES.map((s) => (
                              <Button
                                key={s}
                                type="button"
                                variant={detail.status === s ? 'primary' : 'outline'}
                                size="sm"
                                loading={statusActionLoading[detail.id] === s}
                                disabled={statusActionLoading[detail.id] === s || detail.status === s}
                                onClick={() => handlePackageStatus(detail.id, s)}
                              >
                                {PACKAGE_LABEL[s]?.[0] ?? s}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Historial de auditoría */}
                        <div className={card}>
                          <h3 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">Historial de auditoría</h3>
                          {detail.history?.length ? (
                            <div className="space-y-2">
                              {detail.history.slice(0, 20).map((log) => (
                                <div key={log.id} className="flex items-start gap-3 text-xs">
                                  <div className="mt-0.5 flex h-2 w-2 items-center justify-center rounded-full bg-neutral-300" />
                                  <div className="min-w-0">
                                    <p className="text-neutral-900">{log.action}</p>
                                    <p className="mt-0.5 text-text-secondary">{new Date(log.created_at).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-text-secondary">Sin historial de auditoría disponible.</p>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-border p-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
};

export default AdminQrInventory;
