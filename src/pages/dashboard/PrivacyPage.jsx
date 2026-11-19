import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { routes } from '../../utils/routes';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import { PageTitle, PageLoader } from '../../components/DashPage';
import {
  User, Image as ImageIcon, AlertTriangle, Stethoscope, Pill, FileText, Save, Lock, EyeOff, Eye,
  Calendar, Ruler, Scale, Baby, Settings, Phone, Shield, IdCard, Heart, Droplet, Bell,
  Sparkles, RotateCcw, HeartPulse, ArrowRight, Mail,
} from 'lucide-react';

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

/* ───────── Datos ───────── */
/* Las claves deben coincidir con las de ProfilePage y con el backend */
const fieldDefs = [
  { key: 'photo_url', label: 'Fotografía', icon: ImageIcon, category: 'Identificación', sensitive: false },
  { key: 'display_name', label: 'Nombre', icon: User, category: 'Identificación', sensitive: false },
  { key: 'blood_type', label: 'Tipo de sangre', icon: Droplet, category: 'Identificación', sensitive: true },
  { key: 'date_of_birth', label: 'Fecha de nacimiento', icon: Calendar, category: 'Identificación', sensitive: false },
  { key: 'document_number', label: 'Número de documento', icon: IdCard, category: 'Identificación', sensitive: true },
  { key: 'is_organ_donor', label: 'Donante de órganos', icon: Heart, category: 'Identificación', sensitive: true },
  { key: 'allergies', label: 'Alergias', icon: AlertTriangle, category: 'Salud', sensitive: true },
  { key: 'medical_conditions', label: 'Condiciones médicas', icon: Stethoscope, category: 'Salud', sensitive: true },
  { key: 'medications', label: 'Medicamentos', icon: Pill, category: 'Salud', sensitive: true },
  { key: 'height_cm', label: 'Estatura', icon: Ruler, category: 'Salud', sensitive: true },
  { key: 'weight_kg', label: 'Peso', icon: Scale, category: 'Salud', sensitive: true },
  { key: 'is_pregnant', label: 'Embarazo', icon: Baby, category: 'Salud', sensitive: true },
  { key: 'medical_devices', label: 'Dispositivos médicos', icon: Settings, category: 'Salud', sensitive: true },
  { key: 'primary_doctor_name', label: 'Médico tratante', icon: User, category: 'Salud', sensitive: true },
  { key: 'primary_doctor_phone', label: 'Teléfono del médico', icon: Phone, category: 'Salud', sensitive: true },
  { key: 'insurance_company', label: 'EPS o aseguradora', icon: Shield, category: 'Seguro y notas', sensitive: true },
  { key: 'insurance_policy_number', label: 'Afiliación o póliza', icon: IdCard, category: 'Seguro y notas', sensitive: true },
  { key: 'additional_info', label: 'Información adicional', icon: FileText, category: 'Seguro y notas', sensitive: false },
  { key: 'emergency_note', label: 'Nota de emergencia', icon: Bell, category: 'Seguro y notas', sensitive: false },
];

const categories = ['Identificación', 'Salud', 'Seguro y notas'];

const ESSENTIAL_KEYS = [
  'display_name', 'blood_type', 'allergies', 'medical_conditions', 'medications', 'medical_devices', 'emergency_note',
];
const ALL_KEYS = fieldDefs.map((f) => f.key);

const presets = [
  { id: 'none', title: 'Todo oculto', icon: EyeOff, keys: [] },
  { id: 'essential', title: 'Solo lo esencial', icon: Sparkles, keys: ESSENTIAL_KEYS, recommended: true },
  { id: 'all', title: 'Todo visible', icon: Eye, keys: ALL_KEYS },
];

const sameSet = (a, b) => a.length === b.length && a.every((k) => b.includes(k));

/* Valor tal como se vería en pantalla; null si no hay dato */
const valueOf = (key, p) => {
  const v = p?.[key];
  if (v === null || v === undefined || v === '') return key.startsWith('is_') ? (p ? 'No' : null) : null;
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (key === 'date_of_birth') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  if (key === 'height_cm') return `${v} cm`;
  if (key === 'weight_kg') return `${v} kg`;
  return String(v);
};

/* ───────── Piezas ───────── */
const Switch = ({ checked, onChange, label, danger = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`flex h-6 w-11 flex-none items-center rounded-full p-0.5 transition-colors focus-ring ${
      checked ? (danger ? 'bg-rose-600' : 'bg-brand-500') : 'bg-slate-300'
    }`}
  >
    <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

const FieldRow = ({ field, pub, onToggle }) => {
  const Icon = field.icon;
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span
        className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${
          pub ? 'bg-brand-500/10 text-brand-500' : 'bg-neutral-100 text-text-secondary'
        }`}
      >
        <Icon size={16} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-neutral-900">{field.label}</span>
        {field.sensitive && <span className="block text-xs text-rose-700">Dato sensible</span>}
      </span>
      <span className="w-14 flex-none text-right text-xs text-text-secondary">{pub ? 'Visible' : 'Oculto'}</span>
      <Switch checked={pub} onChange={onToggle} danger={field.sensitive} label={`${field.label}: ${pub ? 'visible al escanear' : 'oculto'}`} />
    </li>
  );
};

/* Vista previa con tus datos reales y tus contactos visibles */
const ScanPreview = ({ visible, hiddenCount, profile, contacts }) => {
  const photoVisible = visible.some((f) => f.key === 'photo_url');
  const nameVisible = visible.some((f) => f.key === 'display_name');
  const rows = visible.filter((f) => f.key !== 'photo_url' && f.key !== 'display_name');
  const shownContacts = contacts.filter((c) => c.is_public);

  return (
    <div className={`${panel} p-5`}>
      <h2 className="text-sm font-semibold text-neutral-900">Así lo ve quien escanea</h2>
      <div className="mx-auto mt-4 max-w-[280px] rounded-[1.75rem] border-[3px] border-neutral-900 bg-brand-50 p-3">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-neutral-900/80" aria-hidden="true" />
        <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-3 text-white">
          <HeartPulse size={16} className="flex-none text-brand-300" aria-hidden="true" />
          <p className="text-xs font-semibold">Perfil de emergencia</p>
        </div>

        {(photoVisible || nameVisible) && (
          <div className="mt-2 flex items-center gap-2.5 rounded-lg bg-white p-2.5 shadow-sm">
            {photoVisible && (
              profile?.photo_url
                ? <img src={profile.photo_url} alt="" className="h-10 w-10 flex-none rounded-full object-cover" />
                : <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-50 text-text-secondary"><User size={18} aria-hidden="true" /></span>
            )}
            {nameVisible && (
              <p className="min-w-0 truncate text-sm font-semibold text-neutral-900">
                {profile?.display_name || <span className="font-normal italic text-text-secondary">Sin nombre</span>}
              </p>
            )}
          </div>
        )}

        {rows.length === 0 && !photoVisible && !nameVisible ? (
          <p className="mt-2 rounded-lg border border-dashed border-border px-2.5 py-3 text-center text-[11px] text-text-secondary">
            No se muestra ningún dato.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5" aria-label="Datos visibles">
            {rows.map((f) => {
              const Icon = f.icon;
              const val = valueOf(f.key, profile);
              return (
                <li key={f.key} className="flex items-start gap-2 rounded-lg bg-white px-2.5 py-2 text-xs shadow-sm">
                  <Icon size={12} className="mt-0.5 flex-none text-brand-500" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-[10px] text-text-secondary">{f.label}</span>
                    {val
                      ? <span className="block break-words font-medium text-neutral-900">{val}</span>
                      : <span className="block italic text-text-secondary">Sin completar</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-2.5 border-t border-border pt-2.5">
          <p className="mb-1.5 px-1 text-[10px] font-semibold text-text-secondary">Contactos</p>
          {shownContacts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-800">
              Ningún contacto es visible. Quien escanee no sabrá a quién llamar.{' '}
              <Link to={routes.dashboardContacts} className="font-semibold underline">Revisar contactos</Link>
            </p>
          ) : (
            <ul className="space-y-1.5">
              {shownContacts.map((c) => (
                <li key={c.id} className="rounded-lg bg-white px-2.5 py-2 text-xs shadow-sm">
                  <p className="truncate font-semibold text-neutral-900">
                    {c.name}{c.relationship && <span className="font-normal text-text-secondary"> · {c.relationship}</span>}
                  </p>
                  {c.display_phone && c.phone && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-text-secondary"><Phone size={11} aria-hidden="true" /> {c.phone}</p>
                  )}
                  {c.display_email && c.email && (
                    <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-text-secondary"><Mail size={11} className="flex-none" aria-hidden="true" /><span className="truncate">{c.email}</span></p>
                  )}
                  {!(c.display_phone && c.phone) && !(c.display_email && c.email) && (
                    <p className="mt-0.5 text-[11px] italic text-text-secondary">Sin datos para contactarlo</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {hiddenCount > 0 && (
          <p className="mt-2.5 flex items-center gap-2 px-1 text-[11px] text-text-secondary">
            <Lock size={11} className="flex-none" aria-hidden="true" />
            {hiddenCount} {hiddenCount === 1 ? 'dato oculto' : 'datos ocultos'}
          </p>
        )}
      </div>
    </div>
  );
};

/* ───────── Página ───────── */
export const PrivacyPage = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });
  const savedRef = useRef({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggles, setToggles] = useState({});
  const [dirty, setDirty] = useState(false);
  const [profile, setProfile] = useState(null);
  const [contacts, setContacts] = useState([]);

  const loadPrivacy = useCallback(async () => {
    try {
      const [privRes, profRes, contactsRes] = await Promise.allSettled([
        api.get('/privacy/me'),
        api.get('/profiles/me'),
        api.get('/contacts'),
      ]);

      if (privRes.status === 'fulfilled') {
        const data = privRes.value.data.settings || privRes.value.data || [];
        const map = {};
        if (Array.isArray(data)) {
          data.forEach((s) => { if (s.field_name) map[s.field_name] = s.is_public; });
        }
        setToggles(map);
        savedRef.current = map;
        setDirty(false);
      } else if (!(privRes.reason?.response && privRes.reason.response.status === 404)) {
        toastRef.current.error('No pudimos cargar tu privacidad. Recarga la página.');
      }

      if (profRes.status === 'fulfilled') setProfile(profRes.value.data.profile || profRes.value.data || null);
      if (contactsRes.status === 'fulfilled') setContacts(contactsRes.value.data.contacts || contactsRes.value.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { loadPrivacy(); }, 0);
    return () => clearTimeout(t);
  }, [loadPrivacy]);

  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await api.patch('/privacy/me', { settings: toggles });
      savedRef.current = toggles;
      setDirty(false);
      toastRef.current.success('Privacidad guardada');
    } catch (error) {
      try { showApiError(error); } catch (err) { toastRef.current.error(err?.message || 'No pudimos guardar los cambios.'); }
    } finally {
      setSaving(false);
    }
  }, [toggles]);

  /* Ctrl/Cmd + S guarda */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dirty, saving, save]);

  const isPublic = (key) => toggles[key] === true;

  const toggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
  };

  const applyKeys = (keys) => {
    setToggles(Object.fromEntries(ALL_KEYS.map((k) => [k, keys.includes(k)])));
    setDirty(true);
  };

  const setCategory = (name, value) => {
    setToggles((prev) => {
      const next = { ...prev };
      fieldDefs.filter((f) => f.category === name).forEach((f) => { next[f.key] = value; });
      return next;
    });
    setDirty(true);
  };

  const discard = () => {
    setToggles(savedRef.current);
    setDirty(false);
    toast.info('Cambios descartados');
  };

  if (loading) return <PageLoader />;

  const visibleDefs = fieldDefs.filter((f) => isPublic(f.key));
  const publicKeys = visibleDefs.map((f) => f.key);
  const hiddenCount = fieldDefs.length - visibleDefs.length;
  const activePreset = presets.find((p) => sameSet(p.keys, publicKeys));
  const sensitiveVisible = visibleDefs.filter((f) => f.sensitive).length;

  return (
    <div className="animate-fade-in space-y-5 pb-28 lg:space-y-6">
      <PageTitle title="Privacidad" description="Tú decides qué ve quien escanee tu QR. La vista previa usa tus datos reales." />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section aria-label="Atajos" className="grid gap-3 sm:grid-cols-3">
            {presets.map((p) => {
              const Icon = p.icon;
              const selected = activePreset?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyKeys(p.keys)}
                  aria-pressed={selected}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors focus-ring ${
                    selected ? 'border-brand-500/60 bg-brand-500/5' : 'border-border bg-white hover:border-brand-500/30'
                  }`}
                >
                  <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${selected ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-500'}`}>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-neutral-900">{p.title}</span>
                    {p.recommended && <span className="block text-xs text-brand-500">Recomendado</span>}
                  </span>
                </button>
              );
            })}
          </section>

          {sensitiveVisible > 0 && (
            <p className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 flex-none" aria-hidden="true" />
              Cualquiera que escanee tu QR verá {sensitiveVisible === 1 ? '1 dato sensible' : `${sensitiveVisible} datos sensibles`}. Muéstralos solo si ayudan a que te atiendan mejor.
            </p>
          )}

          {categories.map((name) => {
            const list = fieldDefs.filter((f) => f.category === name);
            const count = list.filter((f) => isPublic(f.key)).length;
            const allOn = count === list.length;
            return (
              <section key={name} className={`${panel} p-4 sm:p-5`} aria-labelledby={`cat-${name}`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 id={`cat-${name}`} className="text-base font-semibold text-neutral-900">
                    {name} <span className="text-sm font-normal text-text-secondary">{count} de {list.length} visibles</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setCategory(name, !allOn)}
                    className="rounded text-xs font-semibold text-brand-500 hover:text-brand-600 focus-ring"
                  >
                    {allOn ? 'Ocultar todos' : 'Mostrar todos'}
                  </button>
                </div>
                <ul className="mt-2 divide-y divide-border/70">
                  {list.map((f) => (
                    <FieldRow key={f.key} field={f} pub={isPublic(f.key)} onToggle={() => toggle(f.key)} />
                  ))}
                </ul>
              </section>
            );
          })}

          <div className="flex justify-end">
            <Link to={routes.dashboardQr} className="btn-outline px-4 py-2 text-sm">
              Siguiente: mi QR <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <ScanPreview visible={visibleDefs} hiddenCount={hiddenCount} profile={profile} contacts={contacts} />
        </aside>
      </div>

      {/* Barra de guardado: aparece solo con cambios pendientes */}
      {dirty && (
        <div role="region" aria-label="Guardar cambios" className="fixed inset-x-0 bottom-4 z-40 animate-slide-up px-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-2xl border border-border bg-white/95 p-3 pl-4 shadow-card backdrop-blur sm:pl-5">
            <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-neutral-900">
              <span className="h-2.5 w-2.5 flex-none rounded-full bg-amber-500" aria-hidden="true" />
              <span className="truncate">Cambios sin guardar</span>
            </p>
            <div className="flex flex-none items-center gap-2">
              <Button type="button" variant="ghost" onClick={discard} disabled={saving} className="px-3 py-2 text-sm">
                <RotateCcw size={15} /> <span className="hidden sm:inline">Descartar</span>
              </Button>
              <Button type="button" variant="primary" onClick={save} disabled={saving} className="px-4 py-2 text-sm">
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacyPage;