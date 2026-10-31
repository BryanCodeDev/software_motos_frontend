import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, AlertTriangle, ScrollText } from 'lucide-react';
import api from '../../api/client';
import { PageTitle } from '../../components/DashPage';
import { Badge } from '../../components/ui-kit';

const badge = 'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset';

const actionTone = (action = '') => {
  const a = action.toLowerCase();
  if (/(delete|remove|deactivat|cancel|revoke)/.test(a)) return 'danger';
  if (/(create|register|activat)/.test(a)) return 'success';
  if (/(update|role|change|patch)/.test(a)) return 'warn';
  return 'neutral';
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const AdminAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [entity, setEntity] = useState('');

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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (entity && l.entity_type !== entity) return false;
      if (!q) return true;
      return [l.actor_email, l.action, l.entity_type, l.entity_id].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [logs, query, entity]);

  return (
    <div className="space-y-5">
      <PageTitle title="Auditoría" description="Eventos administrativos registrados." />

      <div className="rounded-2xl border border-brand-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-textMuted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por actor, acción o ID"
            aria-label="Buscar eventos"
            className="input !pl-10 !text-base sm:!text-sm"
          />
        </div>
        <select
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          aria-label="Filtrar por entidad"
          className="input !text-base sm:!w-48 sm:!text-sm"
        >
          <option value="">Todas las entidades</option>
          {entities.map((en) => <option key={en} value={en}>{en}</option>)}
        </select>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-5/50 p-4 text-sm text-rose-700 flex items-center gap-3">
          <AlertTriangle size={18} /> {error}
          <button type="button" onClick={load} className="ml-auto font-semibold underline">Reintentar</button>
        </div>
      )}

      {loading && !error && (
        <div className="rounded-2xl border border-brand-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] animate-pulse space-y-3 p-4" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 rounded-lg bg-brand-border/60" />)}
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="rounded-2xl border border-brand-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] flex flex-col items-center gap-2 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
            <ScrollText size={22} />
          </span>
          <p className="text-sm font-semibold text-brand-text">Sin eventos para mostrar</p>
          <p className="text-xs text-brand-textMuted">Aún no hay registros o no coinciden con el filtro.</p>
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <>
          <div className="rounded-2xl border border-brand-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] overflow-hidden">
            <div className="custom-scrollbar overflow-x-auto">
              <table className="table w-full text-sm">
                <thead className="bg-brand-dark/70 text-left text-[10px] font-semibold uppercase tracking-wider text-brand-textMuted">
                  <tr>
                    <th scope="col" className="px-4 py-3">Fecha</th>
                    <th scope="col" className="px-4 py-3">Actor</th>
                    <th scope="col" className="px-4 py-3">Acción</th>
                    <th scope="col" className="px-4 py-3">Entidad</th>
                    <th scope="col" className="px-4 py-3">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {visible.map((l) => (
                    <tr key={l.id} className="transition-colors hover:bg-brand-dark/60">
                      <td className="whitespace-nowrap px-4 py-3 text-brand-textMuted">{formatDate(l.created_at)}</td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-brand-text" title={l.actor_email || ''}>
                        {l.actor_email || <span className="text-brand-textMuted">Sistema</span>}
                        {l.ip_address && <span className="block text-[11px] text-brand-textMuted">{l.ip_address}</span>}
                      </td>
                      <td className="px-4 py-3"><Badge tone={actionTone(l.action)} size="sm">{l.action}</Badge></td>
                      <td className="px-4 py-3 text-brand-text">{l.entity_type}</td>
                      <td className="px-4 py-3 font-mono text-xs text-brand-textMuted">{l.entity_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="space-y-3 md:hidden">
            {visible.map((l) => (
              <li key={l.id} className="rounded-2xl border border-brand-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={actionTone(l.action)} size="sm">{l.action}</Badge>
                  <span className="text-right text-[11px] text-brand-textMuted">{formatDate(l.created_at)}</span>
                </div>
                <p className="mt-3 break-all text-sm font-medium text-brand-text">
                  {l.actor_email || 'Sistema'}
                </p>
                <p className="mt-1 text-xs text-brand-textMuted">
                  {l.entity_type} · <span className="font-mono">#{l.entity_id}</span>
                  {l.ip_address && <> · {l.ip_address}</>}
                </p>
              </li>
            ))}
          </ul>

          <p className="text-center text-xs text-brand-textMuted">
            Mostrando {visible.length} de {logs.length} eventos
          </p>
        </>
      )}
    </div>
  );
};

export default AdminAudit;
