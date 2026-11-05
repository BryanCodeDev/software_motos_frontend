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
import {
  User, Image, AlertTriangle, Stethoscope, Pill, FileText, Save, Power, Lock, EyeOff, Eye,
  Calendar, Ruler, Scale, Baby, Settings, Phone, Shield, IdCard, Heart, Droplet, Bell,
  Sparkles, RotateCcw, HeartPulse,
} from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const fieldDefs = [
  { key: 'photo_url', label: 'Fotografía', icon: Image, category: 'Identificación' },
  { key: 'display_name', label: 'Nombre', icon: User, category: 'Identificación' },
  { key: 'blood_type', label: 'Tipo de sangre', icon: Droplet, category: 'Identificación' },
  { key: 'date_of_birth', label: 'Fecha de nacimiento', icon: Calendar, category: 'Identificación' },
  { key: 'document_number', label: 'Número de documento', icon: IdCard, category: 'Identificación' },
  { key: 'is_organ_donor', label: 'Donante de órganos', icon: Heart, category: 'Identificación' },
  { key: 'allergies', label: 'Alergias', icon: AlertTriangle, category: 'Médico' },
  { key: 'medical_conditions', label: 'Condiciones médicas', icon: Stethoscope, category: 'Médico' },
  { key: 'medications', label: 'Medicamentos', icon: Pill, category: 'Médico' },
  { key: 'height_cm', label: 'Estatura (cm)', icon: Ruler, category: 'Médico' },
  { key: 'weight_kg', label: 'Peso (kg)', icon: Scale, category: 'Médico' },
  { key: 'is_pregnant', label: 'Embarazo', icon: Baby, category: 'Médico' },
  { key: 'medical_devices', label: 'Dispositivos médicos', icon: Settings, category: 'Médico' },
  { key: 'primary_doctor_name', label: 'Médico tratante', icon: User, category: 'Médico' },
  { key: 'primary_doctor_phone', label: 'Teléfono del médico', icon: Phone, category: 'Médico' },
  { key: 'insurance_company', label: 'Seguro médico', icon: Shield, category: 'Seguro' },
  { key: 'insurance_policy_number', label: 'Póliza de seguro', icon: IdCard, category: 'Seguro' },
  { key: 'additional_info', label: 'Información adicional', icon: FileText, category: 'Adicional' },
  { key: 'emergency_note', label: 'Nota de emergencia', icon: Bell, category: 'Adicional' },
];

const categories = [
  { name: 'Identificación', hint: 'Quién eres', icon: IdCard },
  { name: 'Médico', hint: 'Lo que el personal de salud necesita saber', icon: Stethoscope },
  { name: 'Seguro', hint: 'Cobertura médica y afiliación', icon: Shield },
  { name: 'Adicional', hint: 'Notas extra', icon: FileText },
];

/** Lo mínimo que más ayuda a quien te auxilia. */
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

/* ─────────────────────────── Piezas de interfaz ─────────────────────────── */

/** Fila completa clicable: el interruptor es solo la parte visual, así el área táctil es grande. */
const PrivacyRow = ({ field, pub, onToggle, reduce }) => {
  const Icon = field.icon;
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
            ? 'border-emerald-600/25 bg-emerald-50/50'
            : 'border-border bg-white hover:border-brand-500/30 hover:bg-brand-50/50'
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ring-1 transition-colors duration-200 ${
              pub ? 'bg-emerald-100 text-emerald-700 ring-emerald-600/20' : 'bg-brand-500/10 text-brand-500 ring-brand-500/15'
            }`}
          >
            <Icon size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-neutral-900">{field.label}</span>
            <span className={`block text-xs transition-colors ${pub ? 'font-medium text-emerald-700' : 'text-text-secondary'}`}>
              {pub ? 'Visible al escanear tu QR' : 'Oculto: solo lo ves tú'}
            </span>
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`flex h-7 w-12 flex-none items-center rounded-full p-1 transition-colors duration-200 ${
            pub ? 'justify-end bg-emerald-600' : 'justify-start bg-slate-300'
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

/** Vista previa tipo teléfono de lo que verá quien escanee el QR. */
const ScanPreview = ({ visible, hiddenCount }) => (
  <div className={`${panel} p-5`}>
    <h2 className="text-sm font-semibold text-neutral-900">Vista previa</h2>
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

/* ─────────────────────────────── Página ─────────────────────────────── */

export const PrivacyPage = () => {
  const toast = useToast();
  const reduce = useReducedMotion();
  const savedRef = useRef({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggles, setToggles] = useState({});
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/privacy/me');
      const data = res.data.settings || res.data || [];
      const map = {};
      if (Array.isArray(data)) {
        data.forEach((s) => {
          if (s.field_name) map[s.field_name] = s.is_public;
        });
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

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  /* Avisa si intentan salir con cambios sin guardar */
  useEffect(() => {
    if (!dirty) return undefined;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
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
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err?.message || 'No pudimos guardar los cambios. Intenta de nuevo.');
      }
    } finally {
      setSaving(false);
    }
  }, [toggles, toast]);

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

  if (loading) return <PageLoader />;

  const visibleDefs = fieldDefs.filter((f) => isPublic(f.key));
  const publicKeys = visibleDefs.map((f) => f.key);
  const publicCount = publicKeys.length;
  const hiddenCount = fieldDefs.length - publicCount;
  const pct = Math.round((publicCount / fieldDefs.length) * 100);
  const activePreset = presets.find((p) => sameSet(p.keys, publicKeys));

  return (
    <div className="space-y-5 pb-28 lg:space-y-6">
      <PageTitle
        title="Privacidad de tu perfil"
        description="Elige qué información verá quien escanee tu QR. Todo lo que dejes oculto solo lo ves tú."
      />

      {/* RESUMEN + ATAJOS */}
      <Reveal>
        <section className={`${panel} p-5 sm:p-6`} aria-label="Resumen de visibilidad">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={publicCount === 0 ? 'hidden' : 'shown'}
                  initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl ring-1 ${
                    publicCount === 0 ? 'bg-brand-500/10 text-brand-500 ring-brand-500/15' : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                  }`}
                >
                  {publicCount === 0 ? <EyeOff size={22} aria-hidden="true" /> : <Eye size={22} aria-hidden="true" />}
                </motion.span>
              </AnimatePresence>
              <div>
                <p className="text-base font-semibold text-neutral-900" aria-live="polite">
                  {publicCount} de {fieldDefs.length} datos son visibles
                </p>
                <p className="text-xs text-text-secondary">
                  {publicCount === 0
                    ? 'Quien escanee tu QR no verá datos personales.'
                    : 'Quien escanee tu QR solo verá lo que activaste.'}
                </p>
              </div>
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
        </section>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {categories.map(({ name, hint, icon: CatIcon }) => {
            const list = fieldDefs.filter((f) => f.category === name);
            const count = list.filter((f) => isPublic(f.key)).length;
            const allOn = count === list.length;
            return (
              <Reveal key={name}>
                <section className={`${panel} p-5 sm:p-6`} aria-labelledby={`cat-${name}`}>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
                        <CatIcon size={18} aria-hidden="true" />
                      </span>
                      <div>
                        <h2 id={`cat-${name}`} className="text-lg font-semibold leading-tight text-neutral-900">{name}</h2>
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
                  <ul className="space-y-2.5">
                    {list.map((f) => (
                      <PrivacyRow key={f.key} field={f} pub={isPublic(f.key)} onToggle={() => toggle(f.key)} reduce={reduce} />
                    ))}
                  </ul>
                </section>
              </Reveal>
            );
          })}

          <Reveal>
            <p className="flex items-start gap-2.5 rounded-xl bg-brand-50/70 p-4 text-xs leading-relaxed text-text-secondary">
              <Lock size={14} className="mt-0.5 flex-shrink-0 text-brand-500" aria-hidden="true" />
              <span>
                Los cambios se aplican a tu página de emergencia cuando pulsas guardar. Los datos ocultos nunca se
                envían a quien escanea tu QR.
              </span>
            </p>
          </Reveal>

          <Reveal>
            <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 sm:p-6 lg:p-8" aria-labelledby="deactivate-title">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-2xl">
                  <h2 id="deactivate-title" className="mb-1.5 text-base font-semibold text-neutral-900">Desactivar mi perfil</h2>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    Si lo desactivas, tu página de emergencia deja de estar disponible y quien escanee tu QR verá un
                    aviso de que ya no está activo. Escríbenos y lo hacemos por ti.
                  </p>
                </div>
                <Link to={routes.contact} className="btn-outline flex-none">
                  <Power size={16} /> Pedir la desactivación
                </Link>
              </div>
            </section>
          </Reveal>
        </div>

        <aside className="h-fit lg:sticky lg:top-24">
          <ScanPreview visible={visibleDefs} hiddenCount={hiddenCount} />
        </aside>
      </div>

      {/* Barra flotante de guardado: solo aparece cuando hay cambios */}
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
                <span className="truncate">Cambios sin guardar</span>
                <kbd className="hidden rounded border border-border bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-text-secondary md:inline">Ctrl + S</kbd>
              </p>
              <div className="flex flex-none items-center gap-2">
                <Button type="button" variant="ghost" onClick={discard} disabled={saving} className="px-3 py-2 text-sm">
                  <RotateCcw size={15} /> <span className="hidden sm:inline">Descartar</span>
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