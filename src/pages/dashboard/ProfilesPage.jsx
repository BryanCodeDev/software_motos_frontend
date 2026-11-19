import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../components/useToast';
import { PageTitle, PageLoader, EmptyState } from '../../components/DashPage';
import { Badge } from '../../components/ui-kit';
import Modal from '../../components/Modal';
import { Button } from '../../components/ui';
import { User, Users, Dog, Plus, QrCode, Package, AlertTriangle, RefreshCw, Loader2, Power } from 'lucide-react';

/* Rutas del panel (ajusta PACKAGES_PATH si tu ruta de paquetes es otra) */
const PROFILES_PATH = '/panel/perfiles';
const PACKAGES_PATH = '/panel/paquetes';

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const TYPES = {
  person: { label: 'Persona', icon: User },
  managed_person: { label: 'A mi cargo', icon: Users },
  pet: { label: 'Mascota', icon: Dog },
};

const FILTERS = [
  { id: 'all', label: 'Todos', test: () => true },
  { id: 'people', label: 'Personas', test: (p) => p.profile_type !== 'pet' },
  { id: 'pets', label: 'Mascotas', test: (p) => p.profile_type === 'pet' },
];

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const ProfileCard = ({ profile: p, busy, onDeactivate, onReactivate }) => {
  const cfg = TYPES[p.profile_type] || TYPES.person;
  const Icon = cfg.icon;
  const active = p.is_active !== false;
  const qrCount = Number(p.qr_count) || 0;
  const orders = Number(p.order_count) || 0;
  const subtitle = [cfg.label, p.relationship || p.pet_species].filter(Boolean).join(' · ');

  return (
    <li className={`flex flex-col rounded-2xl border p-5 transition-colors ${active ? 'border-border bg-white hover:border-brand-500/40' : 'border-border bg-neutral-50'}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-full ${active ? 'bg-brand-500/10 text-brand-500' : 'bg-neutral-200 text-text-secondary'}`}>
          {p.photo_url
            ? <img src={p.photo_url} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            : <Icon size={22} aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-neutral-900">{p.display_name || 'Sin nombre'}</p>
          <p className="truncate text-xs text-text-secondary">{subtitle}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {!active && <Badge tone="neutral" size="sm">Inactivo</Badge>}
        {p.pet_lost && <Badge tone="danger" size="sm">Perdido</Badge>}
        {active && (qrCount > 0
          ? <Badge tone="success" size="sm">{plural(qrCount, 'QR activo', 'QR activos')}</Badge>
          : <Badge tone="warn" size="sm">Sin QR</Badge>)}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-text-secondary">
        <Package size={13} aria-hidden="true" /> {plural(orders, 'pedido', 'pedidos')}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <Link to={`${PROFILES_PATH}/${p.id}`} className="btn-outline flex-1 px-3 py-2 text-xs">Ver y editar</Link>
        {active && qrCount === 0 && (
          <Link to={PACKAGES_PATH} className="btn-primary flex-1 px-3 py-2 text-xs">
            <QrCode size={14} aria-hidden="true" /> Conseguir QR
          </Link>
        )}
        {active ? (
          <button
            type="button"
            onClick={() => onDeactivate(p)}
            disabled={busy}
            aria-label={`Desactivar a ${p.display_name || 'este perfil'}`}
            title="Desactivar"
            className="btn-outline h-8 w-8 flex-none !text-rose-700 hover:!bg-rose-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Power size={14} aria-hidden="true" />}
          </button>
        ) : (
          <button type="button" onClick={() => onReactivate(p)} disabled={busy} className="btn-outline flex-1 px-3 py-2 text-xs">
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />} Reactivar
          </button>
        )}
      </div>
    </li>
  );
};

const ProfilesPage = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [toDeactivate, setToDeactivate] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get('/profiles/me/profiles');
      setProfiles(data.profiles || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudieron cargar los perfiles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const change = async (p, action) => {
    setBusyId(p.id);
    try {
      await api.patch(`/profiles/me/profiles/${p.id}/${action}`);
      toastRef.current.success(action === 'deactivate' ? 'Perfil desactivado' : 'Perfil reactivado');
      setToDeactivate(null);
      await load();
    } catch (err) {
      toastRef.current.error(err?.response?.data?.error || `No se pudo ${action === 'deactivate' ? 'desactivar' : 'reactivar'} el perfil`);
    } finally {
      setBusyId(null);
    }
  };

  const sorted = useMemo(
    () => [...profiles].sort((a, b) => (b.is_active !== false) - (a.is_active !== false) || String(a.display_name).localeCompare(String(b.display_name), 'es')),
    [profiles],
  );
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, profiles.filter(f.test).length])), [profiles]);
  const visible = sorted.filter((FILTERS.find((f) => f.id === filter) || FILTERS[0]).test);
  const activeCount = profiles.filter((p) => p.is_active !== false).length;

  if (loading) return <PageLoader />;

  const addButton = (
    <Link to={`${PROFILES_PATH}/nuevo`} className="btn-primary px-4 py-2.5 text-sm">
      <Plus size={16} aria-hidden="true" /> Agregar perfil
    </Link>
  );

  return (
    <div className="animate-fade-in space-y-5 lg:space-y-6">
      <PageTitle title="Mis perfiles" description="Personas y mascotas protegidas por tu cuenta. Cada una tiene su propio QR." />

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700" role="alert">
          <AlertTriangle size={18} className="flex-none" aria-hidden="true" />
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" onClick={load} className="inline-flex flex-none items-center gap-1.5 font-semibold underline underline-offset-2">
            <RefreshCw size={14} aria-hidden="true" /> Reintentar
          </button>
        </div>
      )}

      {profiles.length === 0 && !error ? (
        <div className={`${panel} p-6 lg:p-8`}>
          <EmptyState icon={Users} title="Aún no tienes perfiles" text="Crea uno para ti, un familiar o tu mascota. Cada perfil tendrá su propio QR permanente.">
            {addButton}
          </EmptyState>
        </div>
      ) : (
        profiles.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="group" aria-label="Filtrar perfiles" className="custom-scrollbar flex max-w-full gap-1.5 overflow-x-auto rounded-xl border border-border bg-white p-1.5">
                {FILTERS.map((f) => {
                  const on = filter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setFilter(f.id)}
                      className={`flex flex-none items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus-ring ${
                        on ? 'bg-brand-500 text-white' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900'
                      }`}
                    >
                      {f.label}
                      <span className={`rounded-full px-1.5 text-[11px] font-bold ${on ? 'bg-white/20' : 'bg-brand-50'}`}>{counts[f.id]}</span>
                    </button>
                  );
                })}
              </div>
              {addButton}
            </div>

            <p className="text-xs text-text-secondary">{activeCount} de {profiles.length} activos</p>

            {visible.length === 0 ? (
              <div className={`${panel} p-6`}>
                <EmptyState icon={Users} title="Sin perfiles en esta categoría" text="Prueba con otro filtro.">
                  <button type="button" onClick={() => setFilter('all')} className="btn-outline px-4 py-2 text-sm">Ver todos</button>
                </EmptyState>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((p) => (
                  <ProfileCard
                    key={p.id}
                    profile={p}
                    busy={busyId === p.id}
                    onDeactivate={setToDeactivate}
                    onReactivate={(prof) => change(prof, 'reactivate')}
                  />
                ))}
              </ul>
            )}
          </>
        )
      )}

      <Modal isOpen={!!toDeactivate} onClose={() => (busyId ? null : setToDeactivate(null))} title="Desactivar perfil">
        <p className="mb-6 text-sm leading-relaxed text-text-secondary">
          <span className="font-semibold text-neutral-900">{toDeactivate?.display_name || 'Este perfil'}</span> dejará de mostrarse
          al escanear su QR hasta que lo reactives.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setToDeactivate(null)} disabled={!!busyId}>Cancelar</Button>
          <Button variant="danger" onClick={() => change(toDeactivate, 'deactivate')} disabled={!!busyId}>
            {busyId && <Loader2 size={16} className="animate-spin" />}
            {busyId ? 'Desactivando…' : 'Desactivar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilesPage;