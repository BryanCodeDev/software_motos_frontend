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
  Sparkles, RotateCcw, HeartPulse, Download, Mail, ChevronRight, ArrowRight, Trash2, Loader2,
} from 'lucide-react';

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

/* ───────── Datos ───────── */
const fieldDefs = [
  { key: 'photo_url', label: 'Fotografía', icon: ImageIcon, category: 'Identificación', sensitive: false },
  { key: 'display_name', label: 'Nombre', icon: User, category: 'Identificación', sensitive: false },
  { key: 'blood_type', label: 'Tipo de sangre', icon: Droplet, category: 'Identificación', sensitive: true },
  { key: 'date_of_birth', label: 'Fecha de nacimiento', icon: Calendar, category: 'Identificación', sensitive: false },
  { key: 'document_number', label: 'Número de documento', icon: IdCard, category: 'Identificación', sensitive: true },
  { key: 'is_organ_donor', label: 'Donante de órganos', icon: Heart, category: 'Identificación', sensitive: true },
  { key: 'allergies', label: 'Alergias', icon: AlertTriangle, category: 'Médico', sensitive: true },
  { key: 'medical_conditions', label: 'Condiciones médicas', icon: Stethoscope, category: 'Médico', sensitive: true },
  { key: 'medications', label: 'Medicamentos', icon: Pill, category: 'Médico', sensitive: true },
  { key: 'height_cm', label: 'Estatura', icon: Ruler, category: 'Médico', sensitive: true },
  { key: 'weight_kg', label: 'Peso', icon: Scale, category: 'Médico', sensitive: true },
  { key: 'is_pregnant', label: 'Embarazo', icon: Baby, category: 'Médico', sensitive: true },
  { key: 'medical_devices', label: 'Dispositivos médicos', icon: Settings, category: 'Médico', sensitive: true },
  { key: 'primary_doctor_name', label: 'Médico tratante', icon: User, category: 'Médico', sensitive: true },
  { key: 'primary_doctor_phone', label: 'Teléfono del médico', icon: Phone, category: 'Médico', sensitive: true },
  { key: 'insurance_company', label: 'EPS o aseguradora', icon: Shield, category: 'Seguro', sensitive: true },
  { key: 'insurance_policy_number', label: 'Afiliación o póliza', icon: IdCard, category: 'Seguro', sensitive: true },
  { key: 'additional_info', label: 'Información adicional', icon: FileText, category: 'Adicional', sensitive: false },
  { key: 'emergency_note', label: 'Nota de emergencia', icon: Bell, category: 'Adicional', sensitive: false },
];

const categories = ['Identificación', 'Médico', 'Seguro', 'Adicional'];

const ESSENTIAL_KEYS = [
  'display_name', 'blood_type', 'allergies', 'medical_conditions', 'medications', 'medical_devices', 'emergency_note',
];
const ALL_KEYS = fieldDefs.map((f) => f.key);

const presets = [
  { id: 'none', title: 'Todo oculto', icon: EyeOff, keys: [] },
  { id: 'essential', title: 'Solo lo esencial', icon: Sparkles, keys: ESSENTIAL_KEYS, recommended: true },
  { id: 'all', title: 'Todo visible', icon: Eye, keys: ALL_KEYS },
];

const CONSENTS = [
  { key: 'data_processing', label: 'Tratamiento de datos personales', hint: 'Cuenta, perfil, contactos y pagos.', required: true },
  { key: 'sensitive_data', label: 'Datos sensibles de salud', hint: 'Alergias, condiciones, medicamentos y similares.' },
  { key: 'notifications', label: 'Notificaciones de emergencia', hint: 'Usar tus contactos para avisarles.' },
];

const RIGHTS = [
  { type: 'access', label: 'Consultar mis datos', hint: 'Solicito una copia de los datos personales que Tu QR te Cuida tiene sobre mí.', icon: User },
  { type: 'rectification', label: 'Corregir mis datos', hint: 'Solicito que se corrijan datos personales inexactos o incompletos.', icon: Pill },
  { type: 'suppression', label: 'Eliminar mis datos', hint: 'Solicito la supresión de mis datos personales cuando proceda.', icon: Trash2 },
  { type: 'portability', label: 'Descargar una copia', hint: 'Solicito una copia de mis datos en formato estructurado.', icon: Download },
  { type: 'revocation', label: 'Revocar autorizaciones', hint: 'Solicito revocar autorizaciones de tratamiento cuando proceda.', icon: Lock },
  { type: 'consultation', label: 'Saber cómo se usan mis datos', hint: 'Solicito información sobre las finalidades y destinatarios del tratamiento de mis datos.', icon: Mail },
];

const requestLabels = Object.fromEntries(RIGHTS.map((r) => [r.type, r.label]));
const statusLabels = { pending: 'Recibida', in_review: 'En revisión', completed: 'Atendida', rejected: 'Rechazada' };
const statusCls = {
  completed: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  in_review: 'bg-amber-50 text-amber-700',
  pending: 'bg-neutral-100 text-neutral-700',
};

const TABS = [
  { id: 'visibility', label: 'Qué se muestra' },
  { id: 'consents', label: 'Autorizaciones' },
  { id: 'rights', label: 'Mis derechos' },
];

const sameSet = (a, b) => a.length === b.length && a.every((k) => b.includes(k));

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

const ScanPreview = ({ visible, hiddenCount }) => (
  <div className={`${panel} p-5`}>
    <h2 className="text-sm font-semibold text-neutral-900">Así lo ve quien escanea</h2>
    <div className="mx-auto mt-4 max-w-[260px] rounded-[1.75rem] border-[3px] border-neutral-900 bg-brand-50 p-3">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-neutral-900/80" aria-hidden="true" />
      <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-3 text-white">
        <HeartPulse size={16} className="text-brand-300" aria-hidden="true" />
        <p className="text-xs font-semibold">Perfil de emergencia</p>
      </div>
      {visible.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-border px-2.5 py-3 text-center text-[11px] text-text-secondary">
          No se muestra ningún dato.
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5" aria-label="Datos visibles">
          {visible.map((f) => {
            const Icon = f.icon;
            return (
              <li key={f.key} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-xs font-medium text-neutral-900 shadow-sm">
                <Icon size={12} className="flex-none text-brand-500" aria-hidden="true" />
                <span className="truncate">{f.label}</span>
              </li>
            );
          })}
        </ul>
      )}
      {hiddenCount > 0 && (
        <p className="mt-2 flex items-center gap-2 px-1 text-[11px] text-text-secondary">
          <Lock size={11} className="flex-none" aria-hidden="true" />
          {hiddenCount} {hiddenCount === 1 ? 'dato oculto' : 'datos ocultos'}
        </p>
      )}
    </div>
  </div>
);

const RightRequest = ({ right, onSent }) => {
  const { type, label, hint, icon: Icon } = right;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(hint);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/privacy/requests', { request_type: type, details: text.trim() || hint });
      setOpen(false);
      setText(hint);
      onSent(label);
    } catch (error) {
      try { showApiError(error); } catch { /* ya se notificó */ }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <li className="py-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-brand-50 focus-ring"
      >
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
          <Icon size={16} aria-hidden="true" />
        </span>
        <span className="flex-1 text-sm font-medium text-neutral-900">{label}</span>
        <ChevronRight size={16} className={`text-text-secondary transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <form onSubmit={submit} className="space-y-3 px-3 pb-3 pt-1">
          <label htmlFor={`req-${type}`} className="sr-only">Detalles de la solicitud</label>
          <textarea
            id={`req-${type}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="input"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost px-3 py-2 text-sm">
              Cancelar
            </button>
            <Button type="submit" variant="primary" disabled={submitting} className="px-4 py-2 text-sm">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Enviar solicitud
            </Button>
          </div>
        </form>
      )}
    </li>
  );
};

/* ───────── Página ───────── */
export const PrivacyPage = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });
  const savedRef = useRef({});

  const [tab, setTab] = useState('visibility');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggles, setToggles] = useState({});
  const [dirty, setDirty] = useState(false);
  const [consentStatus, setConsentStatus] = useState({});
  const [requests, setRequests] = useState([]);

  const loadPrivacy = useCallback(async () => {
    try {
      const res = await api.get('/privacy/me');
      const data = res.data.settings || res.data || [];
      const map = {};
      if (Array.isArray(data)) {
        data.forEach((s) => { if (s.field_name) map[s.field_name] = s.is_public; });
      }
      setToggles(map);
      savedRef.current = map;
      setDirty(false);
    } catch (error) {
      if (!(error.response && error.response.status === 404)) {
        toastRef.current.error('No pudimos cargar tu privacidad. Recarga la página.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConsents = useCallback(async () => {
    try {
      const res = await api.get('/privacy/consents/me');
      setConsentStatus(res.data || {});
    } catch {
      setConsentStatus({});
    }
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      const res = await api.get('/privacy/requests/me');
      setRequests(res.data.requests || []);
    } catch {
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { loadPrivacy(); loadConsents(); loadRequests(); }, 0);
    return () => clearTimeout(t);
  }, [loadPrivacy, loadConsents, loadRequests]);

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
      loadConsents();
    } catch (error) {
      try { showApiError(error); } catch (err) { toastRef.current.error(err?.message || 'No pudimos guardar los cambios.'); }
    } finally {
      setSaving(false);
    }
  }, [toggles, loadConsents]);

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

  const onConsentChange = (key, accepted) => {
    setConsentStatus((prev) => ({ ...prev, [key]: { ...prev[key], accepted } }));
  };

  if (loading) return <PageLoader />;

  const visibleDefs = fieldDefs.filter((f) => isPublic(f.key));
  const publicKeys = visibleDefs.map((f) => f.key);
  const hiddenCount = fieldDefs.length - visibleDefs.length;
  const activePreset = presets.find((p) => sameSet(p.keys, publicKeys));
  const medicalVisible = visibleDefs.some((f) => f.sensitive);
  const needsSensitiveConsent = medicalVisible && consentStatus.sensitive_data?.accepted !== true;

  return (
    <div className="animate-fade-in space-y-5 pb-28 lg:space-y-6">
      <PageTitle title="Privacidad" description="Tú decides qué ve quien escanee tu QR." />

      <div role="tablist" aria-label="Secciones de privacidad" className="custom-scrollbar flex gap-1.5 overflow-x-auto rounded-xl border border-border bg-white p-1.5">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`relative flex flex-1 flex-none items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-ring ${
                active ? 'bg-brand-500 text-white' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900'
              }`}
            >
              {t.label}
              {t.id === 'consents' && needsSensitiveConsent && (
                <span className="h-2 w-2 rounded-full bg-amber-500" aria-label="Requiere tu atención" />
              )}
            </button>
          );
        })}
      </div>

      {/* ───── Qué se muestra ───── */}
      {tab === 'visibility' && (
        <div role="tabpanel" className="grid items-start gap-5 lg:grid-cols-3">
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

            {needsSensitiveConsent && (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <span className="flex items-center gap-2">
                  <AlertTriangle size={16} className="flex-none" aria-hidden="true" />
                  Mostrar datos de salud requiere tu autorización.
                </span>
                <button type="button" onClick={() => setTab('consents')} className="font-semibold underline">
                  Revisar autorizaciones
                </button>
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
            <ScanPreview visible={visibleDefs} hiddenCount={hiddenCount} />
          </aside>
        </div>
      )}

      {/* ───── Autorizaciones ───── */}
      {tab === 'consents' && (
        <div role="tabpanel" className="space-y-5">
          <section className={`${panel} p-4 sm:p-5`} aria-label="Autorizaciones">
            <ul className="divide-y divide-border/70">
              {CONSENTS.map(({ key, label, hint, required }) => {
                const accepted = consentStatus[key]?.accepted === true;
                return (
                  <li key={key} className="flex items-center gap-4 py-3.5">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-neutral-900">
                        {label}
                        {required && <span className="ml-2 text-xs font-normal text-text-secondary">Requerida</span>}
                      </span>
                      <span className="block text-xs text-text-secondary">{hint}</span>
                    </span>
                    <Switch checked={accepted} onChange={() => onConsentChange(key, !accepted)} label={`${label}: ${accepted ? 'autorizado' : 'sin autorizar'}`} />
                  </li>
                );
              })}
            </ul>
          </section>

          <nav aria-label="Documentos legales" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-brand-500">
            <a href={routes.terms} className="hover:underline">Términos y condiciones</a>
            <a href={routes.privacyPolicy} className="hover:underline">Política de privacidad</a>
          </nav>
        </div>
      )}

      {/* ───── Mis derechos ───── */}
      {tab === 'rights' && (
        <div role="tabpanel" className="space-y-5">
          <section className={`${panel} p-3 sm:p-4`} aria-label="Solicitar un derecho">
            <ul className="divide-y divide-border/70">
              {RIGHTS.map((r) => (
                <RightRequest
                  key={r.type}
                  right={r}
                  onSent={(label) => {
                    toast.success(`Solicitud enviada: ${label}`);
                    loadRequests();
                  }}
                />
              ))}
            </ul>
          </section>

          {requests.length > 0 && (
            <section className={`${panel} p-4 sm:p-5`} aria-labelledby="requests-title">
              <h2 id="requests-title" className="mb-2 text-base font-semibold text-neutral-900">Tus solicitudes</h2>
              <ul className="divide-y divide-border/70">
                {requests.slice(0, 5).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span>
                      <span className="block font-medium text-neutral-900">{requestLabels[r.request_type] || r.request_type}</span>
                      <span className="block text-xs text-text-secondary">{new Date(r.created_at).toLocaleDateString('es-CO')}</span>
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCls[r.status] || statusCls.pending}`}>
                      {statusLabels[r.status] || r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

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