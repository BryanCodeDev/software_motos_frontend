import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import api from '../../api/client';
import { routes } from '../../utils/routes';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button, Input, Label, Textarea } from '../../components/ui';
import { PageTitle, PageLoader, EmptyState, CheckField } from '../../components/DashPage';
import { Badge } from '../../components/ui-kit';
import Modal from '../../components/Modal';
import {
  User, Users, Dog, Plus, QrCode, Package, AlertTriangle, RefreshCw, Loader2, Power, ArrowRight,
  Camera, Check, ArrowLeft, ArrowRight as ArrowRight2, Eye, EyeOff, RotateCcw, Save, Trash2,
  Edit2,
} from 'lucide-react';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

/* ───────── Mi cuenta: campos del perfil médico (público) ───────── */
/* Coincide con PUBLIC_FIELDS del backend y con fieldDefs de Privacidad. */
const fields = [
  { key: 'display_name', label: 'Nombre completo', category: 'identificacion', input: 'text', placeholder: 'Tu nombre y apellido', required: true, wide: true, recommended: true },
  { key: 'blood_type', label: 'Tipo de sangre', category: 'identificacion', input: 'select', options: BLOOD_TYPES, recommended: true },
  { key: 'date_of_birth', label: 'Fecha de nacimiento', category: 'identificacion', input: 'date' },
  { key: 'document_number', label: 'Número de documento', category: 'identificacion', input: 'text', placeholder: 'Cédula, tarjeta de identidad o pasaporte', wide: true },
  { key: 'is_organ_donor', label: 'Donante de órganos', category: 'identificacion', input: 'checkbox', checkLabel: 'Soy donante de órganos' },
  { key: 'allergies', label: 'Alergias', category: 'medico', input: 'textarea', placeholder: 'Ej.: penicilina, mariscos', none: true, recommended: true },
  { key: 'medical_conditions', label: 'Condiciones médicas', category: 'medico', input: 'textarea', placeholder: 'Ej.: asma, diabetes, epilepsia', none: true, recommended: true },
  { key: 'medications', label: 'Medicamentos', category: 'medico', input: 'textarea', placeholder: 'Ej.: salbutamol cada 6 horas', none: true, recommended: true },
  { key: 'medical_devices', label: 'Dispositivos o implantes', category: 'medico', input: 'textarea', placeholder: 'Ej.: marcapasos', none: true },
  { key: 'height_cm', label: 'Estatura (cm)', category: 'medico', input: 'number', placeholder: '170' },
  { key: 'weight_kg', label: 'Peso (kg)', category: 'medico', input: 'number', placeholder: '70' },
  { key: 'primary_doctor_name', label: 'Médico tratante', category: 'medico', input: 'text', placeholder: 'Nombre de tu médico' },
  { key: 'primary_doctor_phone', label: 'Teléfono del médico', category: 'medico', input: 'tel', placeholder: '+57 300 000 0000' },
  { key: 'is_pregnant', label: 'Embarazo', category: 'medico', input: 'checkbox', checkLabel: 'Hay un embarazo en curso' },
  { key: 'insurance_company', label: 'EPS o aseguradora', category: 'otros', input: 'text', placeholder: 'Nombre de tu EPS o seguro' },
  { key: 'insurance_policy_number', label: 'Afiliación o póliza', category: 'otros', input: 'text', placeholder: 'Número de carnet o póliza' },
  { key: 'emergency_note', label: 'Nota de emergencia', category: 'otros', input: 'textarea', placeholder: 'Lo primero que debe leer el personal de salud', recommended: true },
  { key: 'additional_info', label: 'Algo más que deban saber', category: 'otros', input: 'textarea', placeholder: 'Cualquier dato útil en una emergencia' },
];

const SAVED_KEYS = fields.map((f) => f.key);
const sections = [
  { id: 'identificacion', title: 'Identificación' },
  { id: 'medico', title: 'Salud' },
  { id: 'otros', title: 'Seguro y notas' },
];

const emptyForm = {
  ...Object.fromEntries(fields.map((f) => [f.key, f.input === 'checkbox' ? false : ''])),
  photo_url: '', photoFile: null, profile_id: '',
};
const isWide = (f) => f.wide || f.input === 'textarea' || f.input === 'checkbox';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/* Visibilidad junto al dato (cuenta) */
const VisToggle = ({ on, busy, onToggle, label }) => (
  <button type="button" onClick={onToggle} disabled={busy} aria-pressed={on} aria-label={`${label}: ${on ? 'visible al escanear. Pulsa para ocultar' : 'oculto. Pulsa para mostrar'}`} className={`focus-ring inline-flex flex-none items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors disabled:opacity-60 ${on ? 'bg-brand-500/10 text-brand-600' : 'bg-neutral-100 text-text-secondary hover:bg-brand-50'}`}>
    {on ? <Eye size={12} aria-hidden="true" /> : <EyeOff size={12} aria-hidden="true" />}{on ? 'Visible' : 'Oculto'}
  </button>
);

const Field = ({ f, value, error, onValue, vis }) => {
  const id = `ac_${f.key}`;
  const errId = `ac_err_${f.key}`;
  const empty = String(value ?? '').trim() === '';
  const toggle = vis && (
    <VisToggle on={vis.map[f.key] === true} busy={vis.busy === f.key} onToggle={() => vis.toggle(f.key)} label={f.label} />
  );
  if (f.input === 'checkbox') {
    return (
      <div className="sm:col-span-2"><div className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
        <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onValue(e.target.checked)} className="h-5 w-5 flex-none rounded border-border accent-brand-500" /><span className="text-sm text-neutral-900">{f.checkLabel}</span>{toggle}
      </div></div>
    );
  }
  return (
    <div className={isWide(f) ? 'sm:col-span-2' : ''}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Label htmlFor={id} className="!mb-0">{f.label}{f.required && <span className="ml-1 text-brand-500" aria-hidden="true">*</span>}</Label>
        <div className="flex items-center gap-2">
          {f.none && empty && <button type="button" onClick={() => onValue('Ninguna')} className="focus-ring rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-text-secondary transition-colors hover:border-brand-500/40 hover:text-neutral-900">No tengo</button>}
          {toggle}
        </div>
      </div>
      {f.input === 'textarea' ? (
        <Textarea id={id} value={value} onChange={(e) => onValue(e.target.value)} placeholder={f.placeholder} rows={3} className="text-base sm:text-sm" />
      ) : f.input === 'select' ? (
        <select id={id} value={value} onChange={(e) => onValue(e.target.value)} className="input h-11"><option value="">Elige una opción</option>{value && !f.options.includes(value) && <option value={value}>{value}</option>}{f.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
      ) : (
        <Input id={id} type={f.input} value={value} onChange={(e) => onValue(e.target.value)} placeholder={f.placeholder} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? errId : undefined} className="h-11 text-base sm:text-sm" />
      )}
      {error && <p id={errId} role="alert" className="mt-1.5 text-xs font-medium text-rose-700">{error}</p>}
    </div>
  );
};

/* ───────── Mis perfiles: tarjeta de perfil de emergencia ───────── */
const TYPES = {
  person: { label: 'Persona', icon: User },
  managed_person: { label: 'A mi cargo', icon: Users },
  pet: { label: 'Mascota', icon: Dog },
};

const FILTERS_MP = [
  { id: 'all', label: 'Todos', test: () => true },
  { id: 'people', label: 'Personas', test: (p) => p.profile_type !== 'pet' },
  { id: 'pets', label: 'Mascotas', test: (p) => p.profile_type === 'pet' },
];

const ProfileCardMP = ({ profile: p, busy, onDelete, onEdit, onSetActive, profileQrMap, isActive }) => {
  const cfg = TYPES[p.profile_type] || TYPES.person;
  const Icon = cfg.icon;
  const profileActive = Boolean(p.is_active);
  const hasQr = Boolean(profileQrMap[p.id]);
  const orders = Number(p.order_count || 0) || 0;
  const subtitle = [cfg.label, p.relationship || p.pet_species].filter(Boolean).join(' · ');
  return (
    <li className={`flex flex-col rounded-2xl border p-5 transition-colors ${isActive ? 'border-brand-500 bg-brand-50/50 shadow-sm' : profileActive ? 'border-border bg-white hover:border-brand-500/40' : 'border-border bg-neutral-50'}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-full ${profileActive ? 'bg-brand-500/10 text-brand-500' : 'bg-neutral-200 text-text-secondary'}`}>
          {p.photo_url ? <img src={p.photo_url} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <Icon size={22} aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-neutral-900">{p.display_name || 'Sin nombre'}</p>
          <p className="truncate text-xs text-text-secondary">{subtitle}</p>
        </div>
        {isActive && <span className="flex-none text-[10px] font-bold bg-brand-500 text-white rounded-full px-2 py-0.5">Activo</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {!profileActive && <Badge tone="neutral" size="sm">Inactivo</Badge>}
        {p.pet_lost && <Badge tone="danger" size="sm">Perdido</Badge>}
        {profileActive && (hasQr ? <Badge tone="success" size="sm">QR activo</Badge> : <Badge tone="warn" size="sm">Sin QR</Badge>)}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-text-secondary"><Package size={13} aria-hidden="true" /> {plural(orders, 'pedido', 'pedidos')}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <button type="button" onClick={() => { onSetActive(p.id); onEdit(p); }} disabled={busy} className="btn-outline flex-1 px-3 py-2 text-xs">{busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Edit2 size={14} aria-hidden="true" />} Ver y editar</button>
        {profileActive && !hasQr && <Link to={routes.dashboardPedidos} className="btn-primary flex-1 px-3 py-2 text-xs"><QrCode size={14} aria-hidden="true" /> Conseguir QR</Link>}
        {!isActive && profileActive ? (
          <button type="button" onClick={() => onSetActive(p.id)} className="btn-outline flex-1 px-3 py-2 text-xs">{busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Users size={14} aria-hidden="true" />} Usar este perfil</button>
        ) : null}
        {isActive ? null : (profileActive ? (
          <button type="button" onClick={() => onDelete(p)} disabled={busy} aria-label={`Eliminar a ${p.display_name || 'este perfil'}`} title="Eliminar" className="btn-outline h-8 w-8 flex-none !text-rose-700 hover:!bg-rose-50">{busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />}</button>
        ) : null)}
      </div>
    </li>
  );
};

/* ====================================================================== */
/* Página principal: Mi perfil                                            */
/* ====================================================================== */
export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });

  const fileRef = useRef(null);
  const formRef = useRef(null);
  const snapshotRef = useRef({ form: { ...emptyForm }, photo: null });

  /* ── Estado: Mi cuenta ── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [tab, setTab] = useState(sections[0].id);
  const [visMap, setVisMap] = useState({});
  const [visReady, setVisReady] = useState(false);
  const [visBusy, setVisBusy] = useState(null);
  const [accountEdit, setAccountEdit] = useState(false);

  const markDirty = useCallback(() => setDirty(true), []);

  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    const onUnauthorized = () => {
      toast.info('Tu sesión caducó. Inicia sesión de nuevo.');
      window.location.href = '/auth/login';
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [toast]);

  /* Carga cuenta + perfiles de emergencia */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [profRes, privRes] = await Promise.allSettled([
          api.get('/profiles/me'),
          api.get('/privacy/me'),
        ]);
        if (!mounted) return;
        if (profRes.status === 'fulfilled') {
          const data = profRes.value.data;
          const profiles = data.profiles || (Array.isArray(data) ? data : []);
          const mainAcct = profiles.find((p) => p.is_main === 1 || p.is_main === true) || profiles[0];
          const p = mainAcct || {};
          const loaded = Object.fromEntries(fields.map((f) => {
            let v = p[f.key] ?? '';
            if (f.input === 'date' && v) v = String(v).slice(0, 10);
            return [f.key, f.input === 'checkbox' ? Boolean(v) : v];
          }));
          const next = { ...emptyForm, ...loaded, photo_url: p.photo_url || '', photoFile: null, profile_id: p.id || '' };
          setForm(next);
          snapshotRef.current = { form: next, photo: p.photo_url || null };
          if (p.photo_url) setPhotoPreview(p.photo_url);
          setDirty(false);
        }
        if (privRes.status === 'fulfilled') {
          const list = privRes.value.data.settings || privRes.value.data || [];
          const map = {};
          if (Array.isArray(list)) list.forEach((s) => { if (s.field_name) map[s.field_name] = s.is_public; });
          setVisMap(map);
          setVisReady(true);
        }
      } catch (error) {
        if (!(error.response && error.response.status === 404)) toast.error('No pudimos cargar tu cuenta. Recarga la página.');
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [toast]);

  const toggleVis = async (key) => {
    const prevMap = visMap;
    const nextMap = { ...visMap, [key]: !visMap[key] };
    setVisMap(nextMap); setVisBusy(key);
    try { await api.patch('/privacy/me', { settings: nextMap }); }
    catch { setVisMap(prevMap); toast.error('No se pudo cambiar la visibilidad.'); }
    finally { setVisBusy(null); }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) { toast.error('Usa una imagen JPG, PNG o WebP.'); return; }
    if (file.size > MAX_PHOTO_BYTES) { toast.error('La imagen pesa más de 2 MB. Elige una más liviana.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setForm((prev) => ({ ...prev, photoFile: file })); setPhotoPreview(ev.target.result); markDirty(); };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => { setForm((prev) => ({ ...prev, photoFile: null, photo_url: '' })); setPhotoPreview(null); markDirty(); };

  const setValue = (key) => (value) => { setForm((prev) => ({ ...prev, [key]: value })); if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined })); markDirty(); };

  const discard = () => { const snap = snapshotRef.current; setForm({ ...snap.form, photoFile: null }); setPhotoPreview(snap.photo); setErrors({}); setDirty(false); toast.info('Cambios descartados'); };

  const uploadPhotoFile = async () => {
    if (!form.photoFile) return form.photo_url;
    const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(form.photoFile); });
    const res = await api.post('/profiles/photo', { photo_data: dataUrl, profile_id: form.profile_id || undefined });
    return res.data.photo_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!String(form.display_name).trim()) { setErrors({ display_name: 'Escribe tu nombre: es lo primero que verá quien escanee tu QR.' }); toast.error('Falta tu nombre.'); setTab('identificacion'); window.setTimeout(() => document.getElementById('ac_display_name')?.focus(), 50); return; }
    if (!form.profile_id) { setErrors({ profile_id: 'No se pudo identificar el perfil.' }); toast.error('Perfil no identificado.'); return; }
    setSaving(true);
    try {
      const payload = {};
      SAVED_KEYS.forEach((k) => { const v = form[k]; payload[k] = typeof v === 'boolean' ? v : v || null; });
      const snapshotPhoto = snapshotRef.current?.photo || null;
      const photoRemoved = !form.photoFile && snapshotPhoto && form.photo_url === '';
      // Solo incluir photo_url si hay un archivo nuevo (subido) o se está eliminando explícitamente.
      if (form.photoFile) {
        const photoUrl = await uploadPhotoFile();
        payload.photo_url = photoUrl || null;
      } else if (photoRemoved) {
        payload.photo_url = null;
      }
      await api.patch('/profiles/me', payload);
      const res = await api.get('/profiles/me');
      let nextForm = { ...form, photoFile: null };
      let nextPhoto = photoPreview;
      if (res.data.profile) { nextPhoto = res.data.profile.photo_url || null; nextForm = { ...form, photo_url: res.data.profile.photo_url || '', photoFile: null }; setPhotoPreview(nextPhoto); }
      setForm(nextForm); snapshotRef.current = { form: nextForm, photo: nextPhoto }; setErrors({}); setDirty(false);
      await refreshUser();
      toast.success('Perfil guardado');
    } catch (error) { try { showApiError(error); } catch (err) { toast.error(err?.message || 'No pudimos guardar tu perfil. Intenta de nuevo.'); } }
    finally { setSaving(false); }
  };

  /* ── Estado: Mis perfiles de emergencia ── */
  const [profiles, setProfiles] = useState([]);
  const [mpLoading, setMpLoading] = useState(true);
  const [mpError, setMpError] = useState(null);
  const [mpFilter, setMpFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editingSaving, setEditingSaving] = useState(false);
  const [editingErrors, setEditingErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [createType, setCreateType] = useState('person');
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm, setCreateForm] = useState({ display_name: '', relationship: '', consent_accepted: false, pet_owner_name: user?.name || '', pet_sex: 'no_especificado' });
  const [createErrors, setCreateErrors] = useState({});

  /* Mapa profile_id -> tiene QR activo, para mostrar el estado real por perfil */
  const [profileQrMap, setProfileQrMap] = useState({});

  const loadProfiles = useCallback(async () => {
    setMpError(null);
    try {
      const { data } = await api.get('/profiles/me/profiles');
      const profiles = data.profiles || [];
      setProfiles(profiles);
      // Establecer el perfil principal como activo por defecto; si no hay principal, el primero.
      if (!activeProfileId && profiles.length > 0) {
        const main = profiles.find((p) => p.is_main === 1 || p.is_main === true);
        setActiveProfileId((main || profiles[0]).id);
      }
      // Cargar identificadores del usuario para saber qué perfiles tienen QR activo
      try {
        const { data: idData } = await api.get('/identifiers/my');
        const identifiers = idData.identifiers || idData || [];
        const map = {};
        identifiers.forEach((id) => {
          if ((id.status === 'active' || id.status === 'pending_activation') && id.profile_id) {
            map[id.profile_id] = true;
          }
        });
        setProfileQrMap(map);
      } catch { /* no críticos */ }
    } catch (err) { setMpError(err?.response?.data?.error || 'No se pudieron cargar los perfiles'); }
    finally { setMpLoading(false); }
  }, [activeProfileId]);

  useEffect(() => {
    const t = setTimeout(loadProfiles, 0);
    return () => clearTimeout(t);
  }, [loadProfiles]);

  /* Si se elimina el perfil activo, seleccionar el principal o el primero disponible */
  const resetActiveProfileIfNeeded = useCallback(() => {
    if (activeProfileId && profiles.length > 0 && !profiles.find((p) => p.id === activeProfileId)) {
      const main = profiles.find((p) => p.is_main === 1 || p.is_main === true);
      setActiveProfileId((main || profiles[0]).id);
    }
  }, [profiles, activeProfileId]);

  const saveEditProfile = async () => {
    const target = editingProfile || profiles.find((p) => p.id === activeProfileId);
    if (!target) return;
    setEditingSaving(true);
    setEditingErrors({});
    try {
      const payload = {
        display_name: String(editForm.display_name || '').trim() || null,
        relationship: target.profile_type === 'pet' ? null : String(editForm.relationship || '').trim() || null,
      };
      await api.patch(`/profiles/me/profiles/${target.id}`, payload);
      toastRef.current.success('Perfil actualizado');
      setEditingProfile(null);
      await loadProfiles();
      await refreshUser();
    } catch (err) {
      const msg = err?.response?.data?.error || 'No se pudo actualizar el perfil.';
      setEditingErrors({ display_name: msg });
    } finally {
      setEditingSaving(false);
    }
  };

  const deleteProfile = async (p) => {
    // No permitir eliminar el perfil activo (el que se usa para interactuar)
    if (p.id === activeProfileId) {
      toastRef.current.error('No puedes eliminar el perfil que estás usando actualmente. Cambia a otro perfil primero.');
      return;
    }
    setToDelete(null);
    setBusyId(p.id);
    try {
      // El backend no expone DELETE para perfiles: la acción disponible es desactivar,
      // que quita el perfil de la vista operativa (equivalente a eliminar para el usuario).
      await api.patch(`/profiles/me/profiles/${p.id}/deactivate`);
      toastRef.current.success('Perfil eliminado');
      await loadProfiles();
      resetActiveProfileIfNeeded();
      await refreshUser();
    } catch (err) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.error || 'No se pudo eliminar el perfil.';
      if (status === 409) {
        if (code === 'profile_is_main') {
          toastRef.current.error('No puedes desactivar tu perfil principal. Promueve otro perfil a principal primero.');
        } else if (code === 'profile_inactive') {
          toastRef.current.error('Este perfil ya está inactivo.');
        } else {
          toastRef.current.error(msg);
        }
      } else {
        toastRef.current.error(msg);
      }
    } finally {
      setBusyId(null);
    }
  };

  const sorted = useMemo(() => [...profiles].sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0) || String(a.display_name).localeCompare(String(b.display_name), 'es')), [profiles]);
  const countsMP = useMemo(() => Object.fromEntries(FILTERS_MP.map((f) => [f.id, profiles.filter(f.test).length])), [profiles]);
  const visibleMP = sorted.filter((FILTERS_MP.find((f) => f.id === mpFilter) || FILTERS_MP[0]).test);
  const activeCount = profiles.filter((p) => Boolean(p.is_active)).length;

  const isPet = createType === 'pet';
  const isManaged = createType === 'managed_person';

  const createSetValue = (key) => (value) => { setCreateForm((prev) => ({ ...prev, [key]: value })); if (createErrors[key]) setCreateErrors((prev) => ({ ...prev, [key]: undefined })); };

  const createValidate = (forStep) => {
    const next = {};
    if (forStep === 1) {
      if (!createForm.display_name.trim()) next.display_name = isPet ? 'Escribe el nombre de la mascota.' : 'Escribe el nombre de la persona.';
    }
    if (forStep === 2 && isManaged && !createForm.consent_accepted) next.consent_accepted = 'Debes confirmar que tienes autorización.';
    setCreateErrors(next);
    return Object.keys(next).length === 0;
  };

  const createSubmit = async () => {
    if (!createValidate(1)) return;
    setCreating(false);
    navigate(`/panel/checkout?type=profile&profile_type=${createType}&name=${encodeURIComponent(createForm.display_name.trim())}&relationship=${encodeURIComponent(createForm.relationship || '')}`);
  };

  if (loading) return <PageLoader />;

  const fullName = user?.name || user?.email?.split('@')[0];
  const firstName = fullName ? fullName.trim().split(' ')[0] : null;
  const isFilled = (f) => (f.input === 'checkbox' ? form[f.key] === true : String(form[f.key] || '').trim() !== '');
  const essentials = fields.filter((f) => f.recommended);
  const essentialsDone = essentials.filter(isFilled).length;
  const pct = Math.round((essentialsDone / essentials.length) * 100);
  const vis = visReady ? { map: visMap, busy: visBusy, toggle: toggleVis } : null;
  const displayName = String(form.display_name || '').trim();

  return (
    <div className="animate-fade-in space-y-5 lg:space-y-6">
      <PageTitle title={firstName ? `Mi perfil, ${firstName}` : 'Mi perfil'} description="Tu cuenta de acceso y los perfiles de emergencia que administras, en un solo lugar." />

      {/* ===== SECCIÓN A: MI CUENTA ===== */}
      <section aria-label="Mi cuenta" className="space-y-5">
        <div className={`${panel} flex items-center gap-4 p-4 sm:p-5`}>
          <button type="button" onClick={() => fileRef.current?.click()} aria-label={photoPreview ? 'Cambiar fotografía' : 'Subir fotografía'} className="group relative h-20 w-20 flex-none overflow-hidden rounded-full bg-brand-50 ring-2 ring-border transition-shadow hover:ring-brand-500/50 focus-ring">
            {photoPreview ? <img src={photoPreview} alt="Tu fotografía" className="h-full w-full object-cover" /> : <User size={30} className="mx-auto text-text-secondary/60" aria-hidden="true" />}
            <span className="absolute inset-0 flex items-center justify-center bg-brand-900/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Camera size={20} aria-hidden="true" /></span>
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handlePhotoChange} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-neutral-900">{displayName || 'Tu nombre'}</p>
            <p className="truncate text-sm text-text-secondary">{user?.email || ''}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-border/70" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Datos esenciales completados">
                <div className="h-full rounded-full bg-brand-500 transition-[width] duration-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="flex-none text-xs text-text-secondary">Esenciales {essentialsDone} de {essentials.length}</span>
            </div>
          </div>
          {accountEdit && <button type="button" onClick={() => setAccountEdit(false)} className="btn-ghost text-xs text-rose-600 hover:underline">Cancelar edición</button>}
          {!accountEdit && <button type="button" onClick={() => setAccountEdit(true)} className="btn-outline px-3 py-2 text-xs font-semibold">Editar cuenta</button>}
        </div>

        {accountEdit ? (
          <form ref={formRef} onSubmit={handleSubmit} noValidate className={`${panel} p-5 sm:p-6 space-y-4`}>
            <div role="tablist" aria-label="Secciones de la cuenta" className="custom-scrollbar flex gap-1.5 overflow-x-auto rounded-xl border border-border bg-white p-1.5 mb-4">
              {sections.map((s) => {
                const list = fields.filter((f) => f.category === s.id);
                const done = list.filter(isFilled).length;
                const active = tab === s.id;
                return (
                  <button key={s.id} type="button" role="tab" aria-selected={active} onClick={() => setTab(s.id)} className={`flex flex-1 flex-none items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-ring ${active ? 'bg-brand-500 text-white' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900'}`}>
                    {s.title}<span className={`text-xs ${active ? 'text-white/80' : 'text-text-secondary'}`}>{done === list.length ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : `${done}/${list.length}`}</span>
                  </button>
                );
              })}
            </div>
            <section role="tabpanel" className="grid gap-4 sm:grid-cols-2">
              {fields.filter((f) => f.category === tab).map((f) => (
                <Field key={f.key} f={f} value={form[f.key]} error={errors[f.key]} onValue={setValue(f.key)} vis={vis} />
              ))}
            </section>
            <div className="flex items-center justify-between gap-3 mt-4">
              <button type="button" onClick={discard} disabled={saving} className="btn-ghost px-4 py-2 text-sm"><RotateCcw size={15} /> Descartar</button>
              <Button type="submit" variant="primary" disabled={saving} className="px-4 py-2 text-sm"><Save size={16} /> {saving ? 'Guardando...' : 'Guardar cuenta'}</Button>
            </div>
          </form>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`${panel} p-4`}>
              <p className="text-xs font-medium text-text-secondary">Nombre</p>
              <p className="text-sm font-semibold text-neutral-900 truncate">{displayName || 'Sin nombre'}</p>
            </div>
            <div className={`${panel} p-4`}>
              <p className="text-xs font-medium text-text-secondary">Correo</p>
              <p className="text-sm font-semibold text-neutral-900 truncate">{user?.email || '—'}</p>
            </div>
            <div className={`${panel} p-4 sm:col-span-2 lg:col-span-2`}>
              <p className="text-xs font-medium text-text-secondary mb-2">Datos esenciales</p>
              <p className="text-sm text-text-secondary">{essentialsDone} de {essentials.length} completados ({pct}%)</p>
            </div>
            <div className={`${panel} p-4 sm:col-span-2 lg:col-span-2`}>
              <p className="text-xs font-medium text-text-secondary mb-2">QR de emergencia</p>
              <p className="text-sm font-semibold text-neutral-900">Consúltalo en Mi QR</p>
              <Link to={routes.dashboardQr} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:text-brand-600"><ArrowRight2 size={14} aria-hidden="true" /> Ir a Mi QR</Link>
            </div>
          </div>
        )}
      </section>

      {/* ===== SECCIÓN B: MIS PERFILES ===== */}
      <section aria-label="Mis perfiles de emergencia" id="mis-perfiles" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Mis perfiles de emergencia</h2>
            <p className="text-sm text-text-secondary">{activeCount} de {profiles.length} activos · Cada perfil tiene su propio QR.</p>
          </div>
          <button type="button" onClick={() => setCreating(true)} className="btn-primary px-5 py-2.5 text-sm"><Plus size={16} aria-hidden="true" /> Agregar perfil</button>
        </div>

        {/* Selector de perfil activo para interactuar */}
        {profiles.length > 0 && (
          <div className={`${panel} p-4`}>
            <p className="text-xs font-medium text-text-secondary mb-2">Perfil activo para interactuar</p>
            <div className="flex gap-2 overflow-x-auto custom-scrollbar">
              {sorted.map((p) => {
                const isActive = p.id === activeProfileId;
                const hasQr = Boolean(profileQrMap[p.id]);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setActiveProfileId(p.id); setEditingProfile(p); setEditForm({ display_name: p.display_name || '', relationship: p.relationship || '' }); }}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors min-w-[150px] ${isActive ? 'border-brand-500 bg-brand-50/50 shadow-sm' : 'border-border bg-white hover:border-brand-500/40'}`}
                  >
                    <span className={`flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full ${p.photo_url ? 'bg-brand-500/10 text-brand-500' : 'bg-brand-500/10 text-text-secondary'}`}>
                      {p.photo_url ? <img src={p.photo_url} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <Users size={18} aria-hidden="true" />}
                    </span>
                    <span className="text-xs font-semibold truncate w-full">{p.display_name || 'Sin nombre'}</span>
                    {isActive && <span className="text-[10px] font-bold bg-brand-500 text-white rounded-full px-1.5 py-0">USANDO</span>}
                    {!hasQr && <span className="text-[10px] text-text-secondary">Sin QR</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {mpLoading ? <PageLoader /> : mpError ? (
          <div className={`${panel} p-6 lg:p-8`}>
            <EmptyState icon={AlertTriangle} title="No se pudieron cargar los perfiles" text={mpError}>
              <button type="button" onClick={loadProfiles} className="btn-outline px-4 py-2 text-sm"><RefreshCw size={16} aria-hidden="true" /> Reintentar</button>
            </EmptyState>
          </div>
        ) : profiles.length === 0 ? (
          <div className={`${panel} p-6 lg:p-8`}>
            <EmptyState icon={Users} title="Aún no tienes perfiles de emergencia" text="Crea uno para ti, un familiar o tu mascota. Cada perfil tendrá su propio QR permanente.">
              <button type="button" onClick={() => setCreating(true)} className="btn-primary px-5 py-2.5 text-sm"><Plus size={16} aria-hidden="true" /> Agregar perfil</button>
            </EmptyState>
          </div>
        ) : (
          <>
            <div role="group" aria-label="Filtrar perfiles" className="custom-scrollbar flex max-w-full gap-1.5 overflow-x-auto rounded-xl border border-border bg-white p-1.5">
              {FILTERS_MP.map((f) => {
                const on = mpFilter === f.id;
                return (
                  <button key={f.id} type="button" aria-pressed={on} onClick={() => setMpFilter(f.id)} className={`flex flex-none items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus-ring ${on ? 'bg-brand-500 text-white' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900'}`}>
                    {f.label}<span className={`rounded-full px-1.5 text-[11px] font-bold ${on ? 'bg-white/20' : 'bg-brand-50'}`}>{countsMP[f.id]}</span>
                  </button>
                );
              })}
            </div>
            {visibleMP.length === 0 ? (
              <div className={`${panel} p-6`}>
                <EmptyState icon={Users} title="Sin perfiles en esta categoría" text="Prueba con otro filtro.">
                  <button type="button" onClick={() => setMpFilter('all')} className="btn-outline px-4 py-2 text-sm">Ver todos</button>
                </EmptyState>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleMP.map((p) => (
                  <ProfileCardMP key={p.id} profile={p} busy={busyId === p.id} onDelete={(prof) => setToDelete(prof)} onEdit={() => {
                    setActiveProfileId(p.id);
                    setEditingProfile(p);
                    setEditForm({ display_name: p.display_name || '', relationship: p.relationship || '' });
                  }} onSetActive={setActiveProfileId} profileQrMap={profileQrMap} isActive={p.id === activeProfileId} />
                ))}
              </ul>
            )}
          </>
        )}

        <Modal isOpen={!!toDelete} onClose={() => (busyId ? null : setToDelete(null))} title="Eliminar perfil">
          <p className="mb-6 text-sm leading-relaxed text-text-secondary"><span className="font-semibold text-neutral-900">{toDelete?.display_name || 'Este perfil'}</span> se eliminará permanentemente, incluyendo su código QR asociado. Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setToDelete(null)} disabled={!!busyId}>Cancelar</Button>
            <Button variant="danger" onClick={() => deleteProfile(toDelete)} disabled={!!busyId}>{busyId && <Loader2 size={16} className="animate-spin" />}{busyId ? 'Eliminando…' : 'Eliminar'}</Button>
          </div>
        </Modal>

        {/* Modal: editar perfil */}
        <Modal isOpen={!!editingProfile} onClose={() => setEditingProfile(null)} title="Editar perfil" size="lg">
          <div className="space-y-5">
            <div>
              <p className="text-sm text-text-secondary">Actualiza el nombre y la relación de este perfil de emergencia.</p>
              {editingProfile && <p className="text-xs font-semibold text-neutral-900 mb-3">Perfil: {editingProfile.profile_type === 'pet' ? 'Mascota' : editingProfile.profile_type === 'managed_person' ? 'A mi cargo' : 'Persona'}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ep_display_name">Nombre para mostrar<span className="ml-1 text-brand-500" aria-hidden="true">*</span></Label>
                <Input id="ep_display_name" value={editForm.display_name || ''} onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })} aria-invalid={editingErrors.display_name ? 'true' : undefined} className="h-11" autoFocus />
                {editingErrors.display_name && <p role="alert" className="mt-1.5 text-xs font-medium text-rose-700">{editingErrors.display_name}</p>}
              </div>
              {editingProfile && editingProfile.profile_type !== 'pet' && (
                <div>
                  <Label htmlFor="ep_relationship">Relación contigo</Label>
                  <Input id="ep_relationship" value={editForm.relationship || ''} onChange={(e) => setEditForm({ ...editForm, relationship: e.target.value })} placeholder="Ej.: esposa, hijo, mamá" className="h-11" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => setEditingProfile(null)} className="btn-ghost px-4 py-2 text-sm">Cancelar</button>
              <button type="button" onClick={saveEditProfile} disabled={editingSaving} className="btn-primary px-6 py-2.5 text-sm">{editingSaving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : 'Guardar cambios'}</button>
            </div>
          </div>
        </Modal>

        {/* Modal: crear perfil */}
        <Modal isOpen={creating} onClose={() => setCreating(false)} title="Agregar perfil de emergencia" size="lg">
          <div className="space-y-5">
            <p className="text-sm text-text-secondary">Elige qué tipo de perfil crear. Cada uno recibe su propio QR permanente.</p>
            <div role="radiogroup" aria-label="Tipo de perfil" className="grid gap-3 sm:grid-cols-3">
              {[
                { value: 'person', label: 'Persona', icon: User, desc: 'Para ti o para otro adulto.' },
                { value: 'pet', label: 'Mascota', icon: Dog, desc: 'Para tu perro, gato u otro animal.' },
                { value: 'managed_person', label: 'A mi cargo', icon: Users, desc: 'Un hijo, adulto mayor o alguien a quien asistas.' },
              ].map((t) => {
                const active = createType === t.value;
                const Icon = t.icon;
                return (
                  <button key={t.value} type="button" role="radio" aria-checked={active} onClick={() => setCreateType(t.value)} className={`focus-ring flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-colors ${active ? 'border-brand-500 bg-brand-50' : 'border-border bg-white hover:border-brand-500/40'}`}>
                    <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${active ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-500'}`}><Icon size={22} aria-hidden="true" /></span>
                    <span className="font-semibold text-neutral-900">{t.label}</span>
                    <span className="text-xs leading-relaxed text-text-secondary">{t.desc}</span>
                  </button>
                );
              })}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cp_display_name">Nombre para mostrar<span className="ml-1 text-brand-500" aria-hidden="true">*</span></Label>
                <Input id="cp_display_name" value={createForm.display_name} onChange={(e) => createSetValue('display_name')(e.target.value)} placeholder={isPet ? 'Ej.: Firulais' : 'Ej.: María Gómez'} aria-invalid={createErrors.display_name ? 'true' : undefined} className="h-11" autoFocus />
                {createErrors.display_name && <p role="alert" className="mt-1.5 text-xs font-medium text-rose-700">{createErrors.display_name}</p>}
              </div>
              {!isPet && (
                <div>
                  <Label htmlFor="cp_relationship">Relación contigo</Label>
                  <Input id="cp_relationship" value={createForm.relationship} onChange={(e) => createSetValue('relationship')(e.target.value)} placeholder="Ej.: esposa, hijo, mamá" className="h-11" />
                </div>
              )}
              {isManaged && (
                <div className="sm:col-span-2">
                  <CheckField id="cp_consent" checked={createForm.consent_accepted} onChange={createSetValue('consent_accepted')} label="Declaro tener autorización para gestionar los datos de esta persona." />
                  {createErrors.consent_accepted && <p role="alert" className="mt-1.5 text-xs font-medium text-rose-700">{createErrors.consent_accepted}</p>}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => setCreating(false)} className="btn-ghost px-4 py-2 text-sm">Cancelar</button>
              <button type="button" onClick={createSubmit} disabled={createSaving} className="btn-primary px-6 py-2.5 text-sm">{createSaving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{createSaving ? 'Creando…' : 'Crear perfil'}</button>
            </div>
          </div>
        </Modal>
      </section>
    </div>
  );
};

export default ProfilePage;
