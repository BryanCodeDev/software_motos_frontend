import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, AlertTriangle, ScrollText, Download, RefreshCw, X, ChevronDown } from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { useToast } from '../../components/useToast';
import { Badge } from '../../components/ui-kit';
import { useAdminSync } from '../../contexts/useAdminSync';

const PAGE_SIZE = 25;
const panel = 'rounded-2xl border border-border bg-white';
const COLS = 'md:grid md:grid-cols-[8.5rem_minmax(0,1fr)_9rem_9rem] md:items-center md:gap-4';

const actionTone = (action = '') => {
  const a = action.toLowerCase();
  if (/(delete|remove|deactivat|cancel|revoke|unlink)/.test(a)) return 'danger';
  if (/(create|register|activat|link)/.test(a)) return 'success';
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
  d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export const AdminAudit = () => {
  const toast = useToast();
  const { refreshKey } = useAdminSync();
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
      setError(e?.response?.data?.error || 'No se pudo cargar la auditoría');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load, refreshKey]);

  const entities = useMemo(() => [...new Set(logs.map((l) => l.entity_type).filter(Boolean))].sort(), [logs]);

  const counts = useMemo(() => {
    const c = { all: logs.length, success: 0, warn: 0, danger: 0 };
    logs.forEach((l) => {
      const tone = actionTone(l.action);
      if (tone in c) c[tone] += 1;
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
  const filterBy = (setter) => (value) => { setter(value); setShown(PAGE_SIZE); };
  const clearFilters = () => { setQuery(''); setEntity(''); setKind('all'); setShown(PAGE_SIZE); };

  const exportCsv = () => {
    if (!visible.length) return;
    try {
      const rows = [
        ['Fecha', 'Actor', 'IP', 'Acción', 'Entidad', 'ID'],
        ...visible.map((l) => [l.created_at, l.actor_email || 'Sistema', l.ip_address, l.action, l.entity_type, l.entity_id]),
      ];
      const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${visible.length} eventos exportados`);
    } catch {
      toast.error('No se pudo exportar el registro');
    }
  };

  return (
    <div className="space-y-4">
      <PageTitle
        title="Auditoría"
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={load} disabled={loading} className="btn-outline px-3.5 py-2 text-sm" aria-label="Actualizar">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            </button>
            <button type="button" onClick={exportCsv} disabled={!visible.length} className="btn-outline px-3.5 py-2 text-sm">
              <Download size={16} aria-hidden="true" /> Exportar CSV
            </button>
          </div>
        }
      />

      <div className={`${panel} space-y-3 p-3 lg:p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1" role="search">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => filterBy(setQuery)(e.target.value)}
              placeholder="Buscar por actor, acción o ID"
              aria-label="Buscar eventos"
              className="input !pl-10 !pr-10"
            />
            {query && (
              <button
                type="button"
                onClick={() => filterBy(setQuery)('')}
                aria-label="Borrar búsqueda"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary hover:bg-brand-50 hover:text-neutral-900"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>
          <select
            value={entity}
            onChange={(e) => filterBy(setEntity)(e.target.value)}
            aria-label="Filtrar por entidad"
            className="input sm:!w-52"
          >
            <option value="">Todas las entidades</option>
            {entities.map((en) => <option key={en} value={en}>{en}</option>)}
          </select>
        </div>

        <div role="group" aria-label="Filtrar por tipo de acción" className="custom-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {KINDS.map((k) => {
            const active = kind === k.id;
            return (
              <button
                key={k.id}
                type="button"
                aria-pressed={active}
                onClick={() => filterBy(setKind)(k.id)}
                className={`focus-ring flex-none rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active ? 'border-brand-500 bg-brand-500 text-white' : 'border-border bg-white text-text-secondary hover:border-brand-500/40 hover:text-neutral-900'
                }`}
              >
                {k.label}
                <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-text-secondary/70'}`}>{counts[k.id]}</span>
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

      {loading && logs.length === 0 && !error && (
        <div className={`${panel} animate-pulse space-y-3 p-4`} aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-11 rounded-lg bg-border/60" />)}
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className={`${panel} flex flex-col items-center p-10 text-center`}>
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
            <ScrollText size={20} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-neutral-900">Sin eventos</p>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="btn-outline mt-4 px-4 py-2 text-sm">
              <X size={16} aria-hidden="true" /> Quitar filtros
            </button>
          )}
        </div>
      )}

      {visible.length > 0 && !error && (
        <>
          <div className={`${panel} overflow-hidden`}>
            <div className={`hidden border-b border-border bg-brand-50/70 px-4 py-3 text-xs font-semibold text-text-secondary ${COLS}`}>
              <span>Fecha</span>
              <span>Actor</span>
              <span>Acción</span>
              <span>Entidad</span>
            </div>
            <ul className="divide-y divide-border">
              {page.map((l) => (
                <li key={l.id} className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 hover:bg-brand-50/40 ${COLS}`}>
                  <span className="order-2 ml-auto whitespace-nowrap text-xs text-text-secondary md:order-none md:ml-0">{formatDate(l.created_at)}</span>
                  <div className="order-3 min-w-0 basis-full md:order-none md:basis-auto">
                    <p className="truncate text-sm text-neutral-900" title={l.actor_email || ''}>
                      {l.actor_email || <span className="text-text-secondary">Sistema</span>}
                    </p>
                    {l.ip_address && <p className="text-xs text-text-secondary">{l.ip_address}</p>}
                  </div>
                  <span className="order-1 md:order-none">
                    <Badge tone={actionTone(l.action)} size="sm">{l.action}</Badge>
                  </span>
                  <span className="order-4 text-xs text-text-secondary md:order-none md:text-sm">
                    <span className="text-neutral-900">{l.entity_type}</span>
                    {l.entity_id !== undefined && l.entity_id !== null && <span className="ml-1 font-mono">#{l.entity_id}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center gap-3">
            {visible.length > shown && (
              <button type="button" onClick={() => setShown((s) => s + PAGE_SIZE)} className="btn-outline px-5 py-2.5 text-sm">
                <ChevronDown size={16} aria-hidden="true" /> Mostrar más
              </button>
            )}
            <p className="text-xs text-text-secondary">
              {page.length} de {visible.length} eventos
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAudit;