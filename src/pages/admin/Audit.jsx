import { useCallback, useEffect, useMemo, useState } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import { Search, AlertTriangle, ScrollText, Download, RefreshCw, X, ChevronDown } from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useToast } from '../../components/useToast';
import { Badge } from '../../components/ui-kit';

/* ───────── Constantes de diseño (alineadas con Home) ───────── */
const EASE = [0.22, 1, 0.36, 1];
const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';
const PAGE_SIZE = 25;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const actionTone = (action = '') => {
  const a = action.toLowerCase();
  if (/(delete|remove|deactivat|cancel|revoke)/.test(a)) return 'danger';
  if (/(create|register|activat)/.test(a)) return 'success';
  if (/(update|role|change|patch)/.test(a)) return 'warn';
  return 'neutral';
};

const KINDS = [
  { id: 'all', label: 'Todos' },
  { id: 'success', label: 'Creaciones' },
  { id: 'warn', label: 'Cambios' },
  { id: 'danger', label: 'Eliminaciones' },
];

const formatDate = (d) =>
  d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const ErrorBanner = ({ message, onRetry }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700" role="alert">
    <AlertTriangle size={18} className="flex-none" aria-hidden="true" />
    <span className="min-w-0 flex-1">{message}</span>
    <button type="button" onClick={onRetry} className="flex-none font-semibold underline underline-offset-2">Reintentar</button>
  </div>
);

/* ───────── Página ───────── */
export const AdminAudit = () => {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [entity, setEntity] = useState('');
  const [kind, setKind] = useState('all');
  const [shown, setShown] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/audit');
      setLogs(data.logs || []);
    } catch (e) {
      setError(e?.response?.data?.error || 'Error al cargar auditoría');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const entities = useMemo(() => [...new Set(logs.map((l) => l.entity_type).filter(Boolean))].sort(), [logs]);

  const kindCounts = useMemo(() => {
    const c = { all: logs.length, success: 0, warn: 0, danger: 0 };
    logs.forEach((l) => {
      const t = actionTone(l.action);
      if (c[t] !== undefined) c[t] += 1;
    });
    return c;
  }, [logs]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (entity && l.entity_type !== entity) return false;
      if (kind !== 'all' && actionTone(l.action) !== kind) return false;
      if (!q) return true;
      return [l.actor_email, l.action, l.entity_type, l.entity_id].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [logs, query, entity, kind]);

  const page = visible.slice(0, shown);
  const hasFilters = !!(query || entity || kind !== 'all');

  const resetPaging = () => setShown(PAGE_SIZE);
  const clearFilters = () => {
    setQuery('');
    setEntity('');
    setKind('all');
    resetPaging();
  };

  const exportCsv = () => {
    if (!visible.length) return;
    try {
      const rows = [
        ['Fecha', 'Actor', 'IP', 'Acción', 'Entidad', 'ID'],
        ...visible.map((l) => [l.created_at, l.actor_email || 'Sistema', l.ip_address, l.action, l.entity_type, l.entity_id]),
      ];
      const csv = rows
        .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${visible.length} eventos exportados`);
    } catch {
      toast.error('No se pudo exportar el registro');
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageTitle title="Auditoría" description="Eventos administrativos registrados." />
          <div className="flex flex-none gap-2">
            <button type="button" onClick={load} disabled={loading} className="btn-outline px-4 py-2.5 text-sm">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Actualizar
            </button>
            <button type="button" onClick={exportCsv} disabled={!visible.length} className="btn-outline px-4 py-2.5 text-sm">
              <Download size={16} aria-hidden="true" /> Exportar CSV
            </button>
          </div>
        </motion.div>

        {/* Búsqueda y filtros */}
        <motion.div variants={item} className={`${panel} space-y-3 p-4`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); resetPaging(); }}
                placeholder="Buscar por actor, acción o ID"
                aria-label="Buscar eventos"
                className="input !pl-10 !pr-10 !text-base sm:!text-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); resetPaging(); }}
                  aria-label="Borrar búsqueda"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-brand-50 hover:text-neutral-900"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <select
              value={entity}
              onChange={(e) => { setEntity(e.target.value); resetPaging(); }}
              aria-label="Filtrar por entidad"
              className="input !text-base sm:!w-52 sm:!text-sm"
            >
              <option value="">Todas las entidades</option>
              {entities.map((en) => <option key={en} value={en}>{en}</option>)}
            </select>
          </div>

          <div role="tablist" aria-label="Filtrar por tipo de acción" className="custom-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {KINDS.map((k) => {
              const active = kind === k.id;
              return (
                <button
                  key={k.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => { setKind(k.id); resetPaging(); }}
                  className={`focus-ring relative flex-none rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-brand-500 text-white'
                      : 'border-border bg-white text-text-secondary hover:border-brand-500/40 hover:text-neutral-900'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="audit-kind-chip"
                      className="absolute inset-0 rounded-full bg-brand-500"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">
                    {k.label}
                    <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-text-muted'}`}>{kindCounts[k.id]}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {error && <ErrorBanner message={error} onRetry={load} />}

        {loading && !error && (
          <div className={`${panel} animate-pulse space-y-3 p-4`} aria-busy="true" aria-live="polite">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 rounded-lg bg-border/60" />)}
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className={`${panel} flex flex-col items-center p-10 text-center`}>
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
              <ScrollText size={22} aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-neutral-900">Sin eventos para mostrar</p>
            <p className="mt-1 text-xs text-text-secondary">Aún no hay registros o no coinciden con el filtro.</p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="btn-outline mt-5 px-5 py-2.5 text-sm">
                <X size={16} aria-hidden="true" /> Limpiar filtros
              </button>
            )}
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <>
            {/* Escritorio */}
            <div className={`${panel} hidden overflow-hidden md:block`}>
              <div className="custom-scrollbar overflow-x-auto">
                <table className="table w-full text-sm">
                  <thead className="bg-brand-50/70 text-left text-xs font-semibold text-text-secondary">
                    <tr>
                      <th scope="col" className="px-4 py-3.5">Fecha</th>
                      <th scope="col" className="px-4 py-3.5">Actor</th>
                      <th scope="col" className="px-4 py-3.5">Acción</th>
                      <th scope="col" className="px-4 py-3.5">Entidad</th>
                      <th scope="col" className="px-4 py-3.5">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {page.map((l, i) => (
                      <motion.tr
                        key={l.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: EASE, delay: Math.min(i, 10) * 0.025 }}
                        className="transition-colors hover:bg-brand-50/50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDate(l.created_at)}</td>
                        <td className="max-w-[240px] truncate px-4 py-3 text-neutral-900" title={l.actor_email || ''}>
                          {l.actor_email || <span className="text-text-secondary">Sistema</span>}
                          {l.ip_address && <span className="block text-[11px] text-text-secondary">{l.ip_address}</span>}
                        </td>
                        <td className="px-4 py-3"><Badge tone={actionTone(l.action)} size="sm">{l.action}</Badge></td>
                        <td className="px-4 py-3 text-neutral-900">{l.entity_type}</td>
                        <td className="px-4 py-3 font-mono text-xs text-text-secondary">{l.entity_id}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Móvil */}
            <ul className="space-y-3 md:hidden">
              {page.map((l, i) => (
                <motion.li
                  key={l.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE, delay: Math.min(i, 8) * 0.04 }}
                  className={`${panel} p-4`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Badge tone={actionTone(l.action)} size="sm">{l.action}</Badge>
                    <span className="text-right text-[11px] text-text-secondary">{formatDate(l.created_at)}</span>
                  </div>
                  <p className="mt-3 break-all text-sm font-medium text-neutral-900">{l.actor_email || 'Sistema'}</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {l.entity_type} · <span className="font-mono">#{l.entity_id}</span>
                    {l.ip_address && <> · {l.ip_address}</>}
                  </p>
                </motion.li>
              ))}
            </ul>

            <div className="flex flex-col items-center gap-3">
              {visible.length > shown && (
                <button type="button" onClick={() => setShown((s) => s + PAGE_SIZE)} className="btn-outline px-5 py-2.5 text-sm">
                  <ChevronDown size={16} aria-hidden="true" /> Mostrar más
                </button>
              )}
              <p className="text-center text-xs text-text-secondary">
                Mostrando <span className="font-semibold text-neutral-900">{page.length}</span> de {visible.length} eventos
                {visible.length !== logs.length && <> (total {logs.length})</>}
              </p>
            </div>
          </>
        )}
      </motion.div>
    </MotionConfig>
  );
};

export default AdminAudit;