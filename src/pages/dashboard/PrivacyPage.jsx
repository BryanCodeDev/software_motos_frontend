import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import api from '../../api/client';
import { routes } from '../../utils/routes';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import { PageTitle, PageLoader } from '../../components/DashPage';
import { Reveal } from '../../components/Section';
import { CheckField } from '../../components/DashPage';
import {
  User, Image, AlertTriangle, Stethoscope, Pill, FileText, Save, Power, Lock, EyeOff, Eye,
  Calendar, Ruler, Scale, Baby, Settings, Phone, Shield, IdCard, Heart, Droplet, Bell,
  Sparkles, RotateCcw, HeartPulse, Download, ClipboardList, UserPlus, RefreshCw,
  ChevronRight, AlertCircle, Mail, ExternalLink, Copy as CopyIcon, Trash2 as Trash2Icon,
  ArrowRight,
} from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';
const sensitivePanel = 'rounded-2xl border border-rose-200 bg-rose-50/60 shadow-[0_12px_40px_-20px_rgba(225,29,72,0.15)]';

const fieldDefs = [
  { key: 'photo_url', label: 'Fotografía', icon: Image, category: 'Identificación', sensitive: false },
  { key: 'display_name', label: 'Nombre', icon: User, category: 'Identificación', sensitive: false },
  { key: 'blood_type', label: 'Tipo de sangre', icon: Droplet, category: 'Identificación', sensitive: true },
  { key: 'date_of_birth', label: 'Fecha de nacimiento', icon: Calendar, category: 'Identificación', sensitive: false },
  { key: 'document_number', label: 'Número de documento', icon: IdCard, category: 'Identificación', sensitive: true },
  { key: 'is_organ_donor', label: 'Donante de órganos', icon: Heart, category: 'Identificación', sensitive: true },
  { key: 'allergies', label: 'Alergias', icon: AlertTriangle, category: 'Médico', sensitive: true },
  { key: 'medical_conditions', label: 'Condiciones médicas', icon: Stethoscope, category: 'Médico', sensitive: true },
  { key: 'medications', label: 'Medicamentos', icon: Pill, category: 'Médico', sensitive: true },
  { key: 'height_cm', label: 'Estatura (cm)', icon: Ruler, category: 'Médico', sensitive: true },
  { key: 'weight_kg', label: 'Peso (kg)', icon: Scale, category: 'Médico', sensitive: true },
  { key: 'is_pregnant', label: 'Embarazo', icon: Baby, category: 'Médico', sensitive: true },
  { key: 'medical_devices', label: 'Dispositivos médicos', icon: Settings, category: 'Médico', sensitive: true },
  { key: 'primary_doctor_name', label: 'Médico tratante', icon: User, category: 'Médico', sensitive: true },
  { key: 'primary_doctor_phone', label: 'Teléfono del médico', icon: Phone, category: 'Médico', sensitive: true },
  { key: 'insurance_company', label: 'Seguro médico', icon: Shield, category: 'Seguro', sensitive: true },
  { key: 'insurance_policy_number', label: 'Póliza de seguro', icon: IdCard, category: 'Seguro', sensitive: true },
  { key: 'additional_info', label: 'Información adicional', icon: FileText, category: 'Adicional', sensitive: false },
  { key: 'emergency_note', label: 'Nota de emergencia', icon: Bell, category: 'Adicional', sensitive: false },
];

const categories = [
  { name: 'Identificación', hint: 'Quién eres', icon: IdCard },
  { name: 'Médico', hint: 'Lo que el personal de salud necesita saber', icon: Stethoscope },
  { name: 'Seguro', hint: 'Cobertura médica y afiliación', icon: Shield },
  { name: 'Adicional', hint: 'Notas extra', icon: FileText },
];

const ESSENTIAL_KEYS = [
  'display_name', 'blood_type', 'allergies', 'medical_conditions', 'medications', 'medical_devices', 'emergency_note',
];

const ALL_KEYS = fieldDefs.map((f) => f.key);

const presets = [
  {
    id: 'none',
    title: 'Todo oculto',
    text: 'No se muestra ningún dato.',
    icon: EyeOff,
    keys: [],
  },
  {
    id: 'essential',
    title: 'Solo lo esencial',
    text: 'Nombre, sangre, alergias, condiciones, medicamentos, dispositivos y nota.',
    icon: Sparkles,
    keys: ESSENTIAL_KEYS,
    recommended: true,
  },
  {
    id: 'all',
    title: 'Todo visible',
    text: 'Se muestran todos los datos que llenaste.',
    icon: Eye,
    keys: ALL_KEYS,
  },
];

const sameSet = (a, b) => a.length === b.length && a.every((k) => b.includes(k));

const PrivacyRow = ({ field, pub, onToggle, reduce }) => {
  const Icon = field.icon;
  const isSensitive = field.sensitive;
  return (
    <li>
      <button
        type="button"
        role="switch"
        aria-checked={pub}
        aria-label={`${field.label}: ${pub ? 'visible al escanear' : 'oculto'}`}
        onClick={onToggle}
        className={`group flex w-full items-center justify-between gap-4 rounded-xl border p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.995] sm:p-4 ${
          pub
            ? isSensitive
              ? 'border-rose-600/25 bg-rose-50/50'
              : 'border-emerald-600/25 bg-emerald-50/50'
            : 'border-border bg-white hover:border-brand-500/30 hover:bg-brand-50/50'
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ring-1 transition-colors duration-200 ${
              pub
                ? isSensitive
                  ? 'bg-rose-100 text-rose-700 ring-rose-600/20'
                  : 'bg-emerald-100 text-emerald-700 ring-emerald-600/20'
                : 'bg-brand-500/10 text-brand-500 ring-brand-500/15'
            }`}
          >
            <Icon size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-neutral-900">{field.label}</span>
            <span className={`block text-xs transition-colors ${
              pub ? 'font-medium' : 'text-text-secondary'
            } ${pub ? (isSensitive ? 'text-rose-700' : 'text-emerald-700') : ''}`}>
              {pub ? 'Visible al escanear tu QR' : 'Oculto: solo lo ves tú'}
            </span>
            {isSensitive && !pub && (
              <span className="text-[10px] font-medium text-rose-600/70 uppercase tracking-wider mt-0.5">Dato sensible</span>
            )}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`flex h-7 w-12 flex-none items-center rounded-full p-1 transition-colors duration-200 ${
            pub ? 'justify-end bg-rose-600' : 'justify-start bg-slate-300'
          }`}
        >
          <motion.span
            layout
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 34 }}
            className="h-5 w-5 rounded-full bg-white shadow-sm"
          />
        </span>
      </button>
    </li>
  );
};

const ScanPreview = ({ visible, hiddenCount }) => (
  <div className={`${panel} p-5`}>
    <h2 className="text-sm font-semibold text-neutral-900">Vista previa pública</h2>
    <p className="mt-0.5 text-xs text-text-secondary">Así lo ve quien escanea tu QR.</p>

    <div className="mx-auto mt-4 max-w-[260px] rounded-[1.75rem] border-[3px] border-neutral-900 bg-brand-50 p-3">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-neutral-900/80" aria-hidden="true" />
      <div className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-3 text-white">
        <HeartPulse size={16} className="text-brand-300" aria-hidden="true" />
        <p className="text-xs font-semibold">Perfil de emergencia</p>
      </div>

      <ul className="mt-2 space-y-1.5" aria-label="Datos visibles">
        <AnimatePresence initial={false}>
          {visible.map((f) => {
            const Icon = f.icon;
            return (
              <motion.li
                key={f.key}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-xs font-medium text-neutral-900 shadow-sm"
              >
                <Icon size={12} className="flex-none text-brand-500" aria-hidden="true" />
                <span className="truncate">{f.label}</span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {visible.length === 0 && (
        <p className="rounded-lg border border-dashed border-border px-2.5 py-3 text-center text-[11px] leading-relaxed text-text-secondary">
          Aún no se muestra ningún dato.
        </p>
      )}

      {hiddenCount > 0 && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-border px-2.5 py-2 text-[11px] text-text-secondary">
          <Lock size={11} className="flex-none" aria-hidden="true" />
          {hiddenCount} {hiddenCount === 1 ? 'dato oculto' : 'datos ocultos'}
        </div>
      )}
    </div>
  </div>
);

const ConsentChip = ({ label, accepted, version, onChange, required = false }) => {
  return (
    <div className="rounded-xl border p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
            <Lock size={18} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">{label}</h3>
            <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">
              {accepted ? `Autorización registrada (versión ${version || '—'})` : 'Pendiente de aceptación'}
            </p>
          </div>
        </div>
        <CheckField
          id={`consent-${label.toLowerCase().replace(/\s+/g, '-')}`}
          checked={accepted === true}
          onChange={(v) => onChange(v)}
          label="Acepto esta autorización"
          hint={required ? 'Autorización requerida para continuar.' : 'Autorización opcional.'}
          disabled={false}
        />
      </div>
    </div>
  );
};

const RightRequestButton = ({ type, label, hint, icon: Icon }) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/privacy/requests', { request_type: type, details: hint });
      setSent(true);
      setOpen(false);
    } catch (error) {
      try { showApiError(error); } catch (err) { /* no-op */ }
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className={`${panel} p-4 border-emerald-200 bg-emerald-50`}>
        <CheckCircle2 className="flex-none text-emerald-600" size={18} aria-hidden="true" />
        <span className="text-sm text-emerald-800">Solicitud de {label} registrada. La atenderemos por los canales oficiales.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-3 text-left hover:bg-brand-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} aria-hidden="true" />
          <span className="text-sm font-medium text-neutral-900">{label}</span>
        </div>
        <ChevronRight size={14} className="text-text-secondary/50" aria-hidden="true" />
      </button>
      {open && (
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Detalles de la solicitud de {label}
              </label>
              <textarea
                defaultValue={hint}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-border bg-brand-50 px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 btn-outline px-3 py-2 text-sm"
              >
                Cancelar
              </button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                size="sm"
                className="px-4 py-2"
              >
                {submitting ? <RefreshCw size={14} className="animate-spin" /> : 'Enviar solicitud'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const CheckCircle2 = ({ className = '', size = 18, ...props }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="20 6 9 17 4 12" />
    <path d="M20 4H9c-2.21 0-4 1.79-4 4v12c0 2.21 1.79 4 4 4h11c2.21 0 4-1.79 4-4V8c0-2.21-1.79-4-4-4" />
  </svg>
);

export const PrivacyPage = () => {
  const toast = useToast();
  const reduce = useReducedMotion();
  const savedRef = useRef({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggles, setToggles] = useState({});
  const [dirty, setDirty] = useState(false);
  const [consentStatus, setConsentStatus] = useState({});
  const [consentLoading, setConsentLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [identifier, setIdentifier] = useState(null);
  const [qrLoading, setQrLoading] = useState(true);

  const loadPrivacy = useCallback(async () => {
    setLoading(true);
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
        toast.error('No pudimos cargar tu configuración de privacidad. Recarga la página.');
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadConsents = useCallback(async () => {
    setConsentLoading(true);
    try {
      const res = await api.get('/privacy/consents/me');
      setConsentStatus(res.data || {});
    } catch {
      setConsentStatus({});
    } finally {
      setConsentLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await api.get('/privacy/requests/me');
      setRequests(res.data.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const loadQr = useCallback(async () => {
    setQrLoading(true);
    try {
      const res = await api.get('/identifiers/my');
      setIdentifier(res.data.identifier || null);
    } catch {
      setIdentifier(null);
    } finally {
      setQrLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { loadPrivacy(); loadConsents(); loadRequests(); loadQr(); }, 0);
    return () => clearTimeout(t);
  }, [loadPrivacy, loadConsents, loadRequests, loadQr]);

  useEffect(() => {
    if (!dirty) return undefined;
    const handleBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  const isPublic = (key) => toggles[key] === true;

  const toggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !isPublic(key) }));
    setDirty(true);
  };

  const applyKeys = (keys) => {
    setToggles((prev) => {
      const next = { ...prev };
      ALL_KEYS.forEach((k) => { next[k] = keys.includes(k); });
      return next;
    });
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

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await api.patch('/privacy/me', { settings: toggles });
      savedRef.current = toggles;
      setDirty(false);
      toast.success('Privacidad guardada');
      loadConsents();
    } catch (error) {
      try { showApiError(error); } catch (err) { toast.error(err?.message || 'No pudimos guardar los cambios.'); }
    } finally {
      setSaving(false);
    }
  }, [toggles, toast, loadConsents]);

  if (loading) return <PageLoader />;

  const visibleDefs = fieldDefs.filter((f) => isPublic(f.key));
  const publicKeys = visibleDefs.map((f) => f.key);
  const publicCount = publicKeys.length;
  const hiddenCount = fieldDefs.length - publicCount;
  const pct = Math.round((publicCount / fieldDefs.length) * 100);
  const activePreset = presets.find((p) => sameSet(p.keys, publicKeys));
  const sensitiveKeys = fieldDefs.filter((f) => f.sensitive);
  const sensitiveVisible = sensitiveKeys.filter((f) => isPublic(f.key));

  const onConsentChange = (docType, accepted) => {
    setConsentStatus((prev) => ({ ...prev, [docType]: { ...prev[docType], accepted } }));
  };

  const hasMedicalVisible = sensitiveVisible.length > 0;
  const hasSensitiveConsent = consentStatus.sensitive_data?.accepted === true;

  return (
    <div className="space-y-5 pb-28 lg:space-y-6">
      {/* Encabezado */}
      <Reveal>
        <PageTitle
          title="Tu privacidad, bajo tu control"
          description="Administra qué información compartes, quién puede consultarla y cómo protegemos tus datos."
        />
      </Reveal>

      {/* Bloque 1: Visibilidad del perfil */}
      <Reveal>
        <section className={`${panel} p-5 sm:p-6`} aria-label="Visibilidad del perfil">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Visibilidad de tu perfil</h2>
              <p className="text-sm text-text-secondary">
                Elige qué información verá quien escanee tu QR. Todo lo que dejes oculto solo lo ves tú.
              </p>
            </div>
            <div className="w-full sm:w-48">
              <div className="h-2 w-full overflow-hidden rounded-full bg-border/70">
                <motion.div
                  className="h-full rounded-full bg-brand-500"
                  initial={false}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: EASE }}
                />
              </div>
              <p className="mt-2 text-xs text-text-secondary text-center">
                {publicCount} de {fieldDefs.length} datos visibles
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-border/70 pt-5">
            <p className="mb-3 text-sm font-medium text-neutral-900">
              Empieza con un atajo <span className="font-normal text-text-secondary">y ajusta dato por dato abajo</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Atajos de visibilidad">
              {presets.map((p) => {
                const Icon = p.icon;
                const selected = activePreset?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyKeys(p.keys)}
                    aria-pressed={selected}
                    className={`relative flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] ${
                      selected
                        ? 'border-brand-500/50 bg-brand-500/5 shadow-glow'
                        : 'border-border bg-white hover:border-brand-500/30'
                    }`}
                  >
                    <span className="flex w-full items-center justify-between">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${selected ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-500'} transition-colors`}>
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      {p.recommended && (
                        <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold text-brand-500">
                          Recomendado
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-neutral-900">{p.title}</span>
                    <span className="text-xs leading-relaxed text-text-secondary">{p.text}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-text-secondary" aria-live="polite">
              {activePreset ? `Atajo activo: ${activePreset.title.toLowerCase()}.` : 'Tienes una configuración personalizada.'}
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {categories.map(({ name, hint, icon: CatIcon }) => {
              const list = fieldDefs.filter((f) => f.category === name);
              const count = list.filter((f) => isPublic(f.key)).length;
              const allOn = count === list.length;
              return (
                <Reveal key={name}>
                  <section className={`${panel} p-4 sm:p-5 lg:p-6`} aria-labelledby={`cat-${name}`}>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
                          <CatIcon size={18} aria-hidden="true" />
                        </span>
                        <div>
                          <h3 id={`cat-${name}`} className="text-lg font-semibold leading-tight text-neutral-900">{name}</h3>
                          <p className="mt-0.5 text-sm text-text-secondary">{hint}</p>
                        </div>
                      </div>
                      <div className="flex flex-none flex-col items-end gap-1">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${count > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-500/10 text-brand-500'}`}>
                          {count} de {list.length} visibles
                        </span>
                        <button
                          type="button"
                          onClick={() => setCategory(name, !allOn)}
                          className="rounded text-xs font-semibold text-brand-500 transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                          {allOn ? 'Ocultar todos' : 'Mostrar todos'}
                        </button>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {list.map((f) => (
                        <PrivacyRow key={f.key} field={f} pub={isPublic(f.key)} onToggle={() => toggle(f.key)} reduce={reduce} />
                      ))}
                    </ul>
                  </section>
                </Reveal>
              );
            })}
          </div>

          <p className="mt-6 flex items-start gap-2.5 rounded-xl bg-brand-50/70 p-4 text-xs leading-relaxed text-text-secondary">
            <Lock size={14} className="mt-0.5 flex-shrink-0 text-brand-500" aria-hidden="true" />
            <span>
              Los cambios se aplican a tu página de emergencia cuando pulsas guardar. Los datos ocultos nunca se
              envían a quien escanea tu QR.
            </span>
          </p>
        </section>
      </Reveal>

      {/* Bloque 2: Información médica (datos sensibles) */}
      <Reveal>
        <section className={`${sensitivePanel} p-6 sm:p-8`} aria-label="Información médica sensible">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="mt-0.5 flex-none text-rose-600" size={22} aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-rose-900">Tu información médica es sensible</h2>
              <p className="mt-1 text-sm text-rose-700 leading-relaxed">
                No tienes obligación de proporcionarla y puedes decidir qué información autorizas a tratar y cuál deseas mostrar públicamente.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {sensitiveKeys.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.key} className="flex items-center justify-between gap-3 rounded-xl border p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${
                      isPublic(f.key) ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20' : 'bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15'
                    }`}>
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{f.label}</p>
                      <p className="text-[10px] uppercase tracking-wider text-rose-600/70 font-medium">Dato sensible de salud</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isPublic(f.key)}
                    aria-label={`${f.label}: ${isPublic(f.key) ? 'visible' : 'oculto'}`}
                    onClick={() => toggle(f.key)}
                    className={`flex h-7 w-12 flex-none items-center rounded-full p-1 transition-colors ${
                      isPublic(f.key) ? 'justify-end bg-rose-600' : 'justify-start bg-slate-300'
                    }`}
                  >
                    <motion.span
                      layout
                      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 34 }}
                      className="h-5 w-5 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>
              );
            })}

            {hasMedicalVisible && !hasSensitiveConsent && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm text-rose-800 leading-relaxed">
                  Has marcado datos médicos como visibles. Para tratarlos y mostrarlos se requiere tu autorización explícita para datos sensibles.
                  Esta autorización es independiente de la aceptación de los Términos y Condiciones.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-border/70">
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Autorizaciones de privacidad</h3>
            <div className="space-y-3">
              {[
                {
                  key: 'data_processing',
                  label: 'Tratamiento de datos personales',
                  hint: 'Autorizas el tratamiento de los datos necesarios para operar el servicio (cuenta, perfil, contactos, pagos).',
                  required: true,
                },
                {
                  key: 'sensitive_data',
                  label: 'Autorización para datos sensibles (salud)',
                  hint: 'Autorizas expresamente el tratamiento de tu información médica (alergias, condiciones, medicamentos, etc.).',
                  required: false,
                },
                {
                  key: 'notifications',
                  label: 'Notificaciones de emergencia',
                  hint: 'Autorizas el uso de tus contactos para enviar notificaciones cuando estén habilitadas.',
                  required: false,
                },
              ].map(({ key: docType, label, hint, required }) => (
                <ConsentChip
                  key={docType}
                  label={label}
                  accepted={consentStatus[docType]?.accepted}
                  version={consentStatus[docType]?.version}
                  onChange={(v) => onConsentChange(docType, v)}
                  required={required}
                />
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Bloque 3: Contactos de emergencia */}
      <Reveal>
        <section className={`${panel} p-5 sm:p-6`} aria-label="Contactos de emergencia">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Contactos de emergencia</h2>
          <p className="mb-4 text-sm text-text-secondary">
            Consulta qué información de tus contactos se utiliza y qué datos pueden mostrarse públicamente.
            La autorización para utilizar los datos del contacto es distinta de la decisión de mostrarlos públicamente.
          </p>
          <Link
            to={routes.dashboardContacts}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            Gestionar contactos <ArrowRight size={15} className="ml-1" aria-hidden="true" />
          </Link>
        </section>
      </Reveal>

      {/* Bloque 4: Estado de tu QR */}
      <Reveal>
        <section className={`${panel} p-5 sm:p-6`} aria-label="Estado del QR">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="mb-2 text-lg font-semibold text-neutral-900">Estado de tu QR</h2>
              <p className="text-sm text-text-secondary">
                Tu código QR contiene solo un identificador aleatorio. Nunca almacena datos personales ni médicos directamente.
              </p>
            </div>
            {qrLoading ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-500">
                <RefreshCw size={14} className="animate-spin" />
              </div>
            ) : identifier ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-300" aria-hidden="true" />
                  <span className="relative h-2 w-2 rounded-full bg-emerald-300" />
                </span>
                Activo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                <AlertCircle size={12} className="text-rose-600" aria-hidden="true" />
                No activado
              </span>
            )}
          </div>

          {identifier && (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-border bg-brand-50 p-4">
                <dt className="text-xs font-semibold text-text-secondary">Identificador</dt>
                <dd className="mt-1 break-all font-mono text-xs text-neutral-900">{identifier.value}</dd>
              </div>
              <div className="rounded-lg border border-border bg-brand-50 p-4">
                <dt className="text-xs font-semibold text-text-secondary">Enlace público</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span className="flex-1 break-all font-mono text-xs text-neutral-900">{identifier.qr_url}</span>
                  <button
                    type="button"
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-white hover:text-brand-500"
                    onClick={async () => {
                      try { await navigator.clipboard.writeText(identifier.qr_url); toast.success('Enlace copiado'); } catch { toast.error('No se pudo copiar'); }
                    }}
                    aria-label="Copiar enlace público"
                  >
                    <CopyIcon size={14} />
                  </button>
                </dd>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(identifier.qr_url, '_blank')}
                  className="px-4 py-2"
                >
                  <ExternalLink size={14} /> Vista previa pública
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info('Usa la opción "Desactivar QR" desde tu página de Mi QR')}
                  className="px-4 py-2"
                >
                  <Lock size={14} /> Desactivar QR
                </Button>
              </div>
              <p className="mt-3 text-xs text-text-secondary">
                Desactivar el QR hace que tu página pública deje de mostrar información. Tu cuenta y tus datos se conservan; puedes volver a activarlo más tarde.
              </p>
            </div>
          )}

          {!identifier && (
            <div className="mt-6 rounded-xl border border-border bg-brand-50 p-4">
              <p className="text-sm text-text-secondary">
                Aún no tienes un código QR activado. Actívalo desde la página de Mi QR tras completar el pago de activación.
              </p>
              <Link to={routes.dashboardQr} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-500 hover:underline">
                Ir a Mi QR <ArrowRight size={14} className="ml-1" aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>
      </Reveal>

      {/* Bloque 5: Tus derechos */}
      <Reveal>
        <section className={`${panel} p-5 sm:p-6`} aria-label="Derechos del titular">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Tus derechos</h2>
          <p className="mb-6 text-sm text-text-secondary">
            Puedes ejercer tus derechos de conocimiento, consulta, actualización, rectificación, supresión, revocación de autorización y portabilidad.
            Cada solicitud queda registrada y puede ser atendida desde la administración.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <RightRequestButton
              type="access"
              label="Consultar mis datos"
              hint="Solicito una copia de los datos personales que Tu QR Te Cuida tiene sobre mí."
              icon={User}
            />
            <RightRequestButton
              type="rectification"
              label="Solicitar corrección"
              hint="Solicito que se corrijan datos personales inexactos o incompletos."
              icon={Pill}
            />
            <RightRequestButton
              type="suppression"
              label="Solicitar eliminación"
              hint="Solicito la supresión de mis datos personales cuando proceda."
              icon={Trash2Icon}
            />
            <RightRequestButton
              type="portability"
              label="Descargar copia de mis datos"
              hint="Solicito una copia de mis datos en formato estructurado para portabilidad."
              icon={Download}
            />
            <RightRequestButton
              type="revocation"
              label="Revocar autorizaciones"
              hint="Solicito revocar autorizaciones de tratamiento cuando proceda."
              icon={Lock}
            />
            <RightRequestButton
              type="consultation"
              label="Saber cómo se tratan mis datos"
              hint="Solicito información sobre las finalidades y destinatarios del tratamiento de mis datos."
              icon={Mail}
            />
          </div>

          {requests.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Tus solicitudes recientes</h3>
              <ul className="space-y-2">
                {requests.slice(0, 5).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                    <div>
                      <p className="font-medium text-neutral-900">{r.request_type}</p>
                      <p className="text-xs text-text-secondary">{new Date(r.created_at).toLocaleDateString('es-CO')}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        r.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        r.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                        r.status === 'in_review' ? 'bg-amber-50 text-amber-700' :
                        'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </Reveal>

      {/* Bloque 6: Documentos legales */}
      <Reveal>
        <section className={`${panel} p-5 sm:p-6`} aria-label="Documentos legales">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Documentos legales</h2>
          <p className="mb-6 text-sm text-text-secondary">
            Consulta la versión vigente de nuestros documentos legales y su fecha de actualización.
          </p>
          <div className="space-y-3">
            <a
              href={routes.terms}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 hover:border-brand-500/50 transition-colors"
            >
              <div>
                <p className="font-medium text-neutral-900">Términos y Condiciones de Uso</p>
                <p className="text-xs text-text-secondary">Versión 1.0 · Reglas de uso de la plataforma</p>
              </div>
              <ArrowRight size={14} className="text-text-secondary" aria-hidden="true" />
            </a>
            <a
              href={routes.privacyPolicy}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 hover:border-brand-500/50 transition-colors"
            >
              <div>
                <p className="font-medium text-neutral-900">Política de Privacidad y Tratamiento de Datos Personales</p>
                <p className="text-xs text-text-secondary">Versión 1.0 · Tratamiento y protección de datos</p>
              </div>
              <ArrowRight size={14} className="text-text-secondary" aria-hidden="true" />
            </a>
          </div>
        </section>
      </Reveal>

      {/* Barra flotante de guardado */}
      <AnimatePresence>
        {dirty && (
          <motion.div
            role="region"
            aria-label="Guardar cambios"
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed inset-x-0 bottom-4 z-40 px-4"
          >
            <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-2xl border border-border bg-white/95 p-3 pl-4 shadow-card backdrop-blur sm:pl-5">
              <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-neutral-900">
                <span className="relative flex h-2.5 w-2.5 flex-none" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/70 motion-reduce:hidden" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                </span>
                <span className="truncate">Cambios de visibilidad sin guardar</span>
                <kbd className="hidden rounded border border-border bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-text-secondary md:inline">Ctrl + S</kbd>
              </p>
              <div className="flex flex-none items-center gap-2">
                <Button type="button" variant="ghost" onClick={discard} disabled={saving} className="px-3 py-2 text-sm">
                  <RotateCcw size={15} /> Descartar
                </Button>
                <Button type="button" variant="primary" onClick={save} disabled={saving} className="px-4 py-2 text-sm">
                  <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrivacyPage;
