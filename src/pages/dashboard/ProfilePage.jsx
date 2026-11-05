import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../contexts/useAuth';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button, Input, Textarea } from '../../components/ui';
import { PageTitle, PageLoader } from '../../components/DashPage';
import { Reveal } from '../../components/Section';
import {
  Save, AlertTriangle, Stethoscope, Pill, FileText, Upload, Trash2, Mail, Lock, User, Eye, EyeOff,
  Calendar, Ruler, Scale, Baby, Settings, Phone, Shield, IdCard, Heart, Droplet, Bell,
  Camera, Sparkles, CheckCircle2, RotateCcw, ArrowRight,
} from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

/**
 * Campos que el backend guarda al pulsar "Guardar".
 * Coinciden con PUBLIC_FIELDS del backend (profile.service.js).
 */
const SAVED_KEYS = [
  'display_name',
  'blood_type',
  'date_of_birth',
  'document_number',
  'is_organ_donor',
  'allergies',
  'medical_conditions',
  'medications',
  'height_cm',
  'weight_kg',
  'is_pregnant',
  'medical_devices',
  'primary_doctor_name',
  'primary_doctor_phone',
  'insurance_company',
  'insurance_policy_number',
  'additional_info',
  'emergency_note',
];
const SAVED_PRIVACY_KEYS = [
  'photo_url',
  'display_name',
  'blood_type',
  'date_of_birth',
  'document_number',
  'is_organ_donor',
  'allergies',
  'medical_conditions',
  'medications',
  'height_cm',
  'weight_kg',
  'is_pregnant',
  'medical_devices',
  'primary_doctor_name',
  'primary_doctor_phone',
  'insurance_company',
  'insurance_policy_number',
  'additional_info',
  'emergency_note',
];

const fields = [
  { key: 'display_name', label: 'Nombre completo', category: 'Identificación', icon: User, input: 'text', placeholder: 'Tu nombre y apellido', hint: 'El nombre que verá quien escanee tu QR.', required: true },
  { key: 'blood_type', label: 'Tipo de sangre', category: 'Identificación', icon: Droplet, input: 'text', placeholder: 'O+', hint: 'Grupo sanguíneo y factor RH.' },
  { key: 'date_of_birth', label: 'Fecha de nacimiento', category: 'Identificación', icon: Calendar, input: 'date', placeholder: '', hint: 'Ayuda al personal de salud a calcular dosis.' },
  { key: 'document_number', label: 'Número de documento', category: 'Identificación', icon: IdCard, input: 'text', placeholder: 'Cédula o pasaporte', hint: 'Para identificarte en un centro de salud.' },
  { key: 'is_organ_donor', label: 'Donante de órganos', category: 'Identificación', icon: Heart, input: 'checkbox', checkLabel: 'Sí, soy donante de órganos', hint: 'Marca si lo eres.' },
  { key: 'allergies', label: 'Alergias', category: 'Médico', icon: AlertTriangle, input: 'textarea', placeholder: 'Ejemplo: penicilina, mariscos', hint: 'Lo más importante para el personal de salud.' },
  { key: 'medical_conditions', label: 'Condiciones médicas', category: 'Médico', icon: Stethoscope, input: 'textarea', placeholder: 'Ejemplo: asma, diabetes, hipertensión', hint: 'Condiciones que deben saberse en una emergencia.' },
  { key: 'medications', label: 'Medicamentos', category: 'Médico', icon: Pill, input: 'textarea', placeholder: 'Ejemplo: salbutamol (inhalador) cada 6 horas', hint: 'Los que tomas con regularidad.' },
  { key: 'height_cm', label: 'Estatura (cm)', category: 'Médico', icon: Ruler, input: 'number', placeholder: '170', hint: 'En centímetros.' },
  { key: 'weight_kg', label: 'Peso (kg)', category: 'Médico', icon: Scale, input: 'number', placeholder: '70', hint: 'En kilogramos.' },
  { key: 'is_pregnant', label: 'Embarazo', category: 'Médico', icon: Baby, input: 'checkbox', checkLabel: 'Hay un embarazo en curso', hint: 'Marca solo si aplica.' },
  { key: 'medical_devices', label: 'Dispositivos o implantes médicos', category: 'Médico', icon: Settings, input: 'textarea', placeholder: 'Ejemplo: marcapasos, bomba de insulina', hint: 'Los que llevas puestos o implantados.' },
  { key: 'primary_doctor_name', label: 'Médico tratante', category: 'Médico', icon: User, input: 'text', placeholder: 'Nombre de tu médico', hint: 'Tu médico de cabecera, si lo tienes.' },
  { key: 'primary_doctor_phone', label: 'Teléfono del médico', category: 'Médico', icon: Phone, input: 'tel', placeholder: '+57 300 000 0000', hint: 'Para consultarle tu historial si es necesario.' },
  { key: 'insurance_company', label: 'EPS o aseguradora', category: 'Seguro', icon: Shield, input: 'text', placeholder: 'Nombre de tu EPS o seguro', hint: 'Dónde estás afiliado.' },
  { key: 'insurance_policy_number', label: 'Número de afiliación o póliza', category: 'Seguro', icon: IdCard, input: 'text', placeholder: 'Número de carnet o póliza', hint: 'Agiliza la atención en un centro de salud.' },
  { key: 'additional_info', label: 'Algo más que deban saber', category: 'Adicional', icon: FileText, input: 'textarea', placeholder: 'Cualquier dato que pueda ayudarte en una emergencia', hint: 'Escribe lo que consideres importante.' },
  { key: 'emergency_note', label: 'Nota de emergencia', category: 'Adicional', icon: Bell, input: 'textarea', placeholder: 'Nota crítica para el personal de salud', hint: 'Lo primero que se leerá al escanear el QR.' },
];

/** Campos que ocupan todo el ancho en pantallas medianas y grandes. */
const WIDE_KEYS = ['display_name', 'document_number'];
const isWide = (f) => f.input === 'textarea' || f.input === 'checkbox' || WIDE_KEYS.includes(f.key);

const sections = [
  { id: 'identificacion', category: 'Identificación', title: 'Identificación', description: 'Lo básico para saber quién eres.', icon: IdCard },
  { id: 'medico', category: 'Médico', title: 'Información médica', description: 'Llena solo lo que te aplique. Ningún campo médico es obligatorio.', icon: Stethoscope },
  { id: 'seguro', category: 'Seguro', title: 'Seguro médico', description: 'Agiliza la atención en un centro de salud.', icon: Shield },
  { id: 'adicional', category: 'Adicional', title: 'Notas adicionales', description: 'Lo que no cabe en los otros campos.', icon: FileText },
];

/** Orden en el que sugerimos completar el perfil. */
const NEXT_STEP_ORDER = ['display_name', 'blood_type', 'allergies', 'medical_conditions', 'medications', 'emergency_note', 'document_number'];

const PRIVACY_KEYS = [
  'display_name', 'photo_url', 'blood_type', 'date_of_birth', 'document_number', 'is_organ_donor', 'allergies',
  'medical_conditions', 'medications', 'height_cm', 'weight_kg', 'is_pregnant', 'medical_devices',
  'primary_doctor_name', 'primary_doctor_phone', 'insurance_company', 'insurance_policy_number', 'additional_info', 'emergency_note',
];

const labelFor = { photo_url: 'Fotografía', ...Object.fromEntries(fields.map((f) => [f.key, f.label])) };

const emptyForm = {
  ...Object.fromEntries(fields.map((f) => [f.key, f.input === 'checkbox' ? false : ''])),
  photo_url: '',
  photoFile: null,
  privacy: {},
};

const mapPrivacy = (privacy = {}) => PRIVACY_KEYS.reduce((acc, k) => ({ ...acc, [k]: privacy[k] === true }), {});

/* ─────────────────────────── Piezas de interfaz ─────────────────────────── */

/** Interruptor compacto: un solo control por dato para decidir si se muestra al escanear. */
const VisToggle = ({ id, label, checked, onChange }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={`${label}: ${checked ? 'visible al escanear' : 'oculto'}`}
    title={checked ? 'Se muestra al escanear tu QR. Toca para ocultarlo.' : 'Solo lo ves tú. Toca para mostrarlo al escanear.'}
    onClick={onChange}
    className={`inline-flex flex-none items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-95 ${
      checked
        ? 'border-emerald-600/25 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        : 'border-border bg-white text-text-secondary hover:border-brand-500/40 hover:text-neutral-900'
    }`}
  >
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={checked ? 'on' : 'off'}
        initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.4, opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="flex"
      >
        {checked ? <Eye size={13} aria-hidden="true" /> : <EyeOff size={13} aria-hidden="true" />}
      </motion.span>
    </AnimatePresence>
    {checked ? 'Visible' : 'Oculto'}
  </button>
);

/** Anillo de progreso animado. */
const ProgressRing = ({ value }) => {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 flex-none" role="img" aria-label={`Perfil completado al ${value}%`}>
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-brand-100" />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          stroke="#9F1239"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 0.9, ease: EASE }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xl font-bold tracking-tight text-neutral-900">
        {value}%
      </span>
    </div>
  );
};

const SectionBlock = ({ meta, filled, total, children }) => {
  const Icon = meta.icon;
  return (
    <section id={`sec-${meta.id}`} aria-labelledby={`title-${meta.id}`} className={`${panel} scroll-mt-28 p-5 sm:p-6 lg:p-7`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
            <Icon size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 id={`title-${meta.id}`} className="text-lg font-semibold leading-tight text-neutral-900">{meta.title}</h2>
            <p className="mt-0.5 max-w-md text-sm text-text-secondary">{meta.description}</p>
          </div>
        </div>
        <span
          className={`flex-none rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            filled === total ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-500/10 text-brand-500'
          }`}
        >
          {filled} de {total}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
};

const FieldCard = ({ f, value, isPublic, error, onValue, onToggle }) => {
  const Icon = f.icon;
  const inputId = `f_${f.key}`;
  const hintId = `hint_${f.key}`;
  const errId = `err_${f.key}`;
  return (
    <div
      className={`rounded-xl border p-4 transition-colors duration-200 ${isWide(f) ? 'sm:col-span-2' : ''} ${
        error
          ? 'border-rose-300 bg-rose-50/40'
          : isPublic
            ? 'border-emerald-600/20 bg-emerald-50/30'
            : 'border-border bg-white hover:border-brand-500/30'
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
            <Icon size={15} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <label htmlFor={inputId} className="block text-sm font-medium text-neutral-900">
              {f.label}
              {f.required && <span className="ml-1 text-brand-500" aria-hidden="true">*</span>}
            </label>
            <p id={hintId} className="text-xs leading-relaxed text-text-secondary">{f.hint}</p>
          </div>
        </div>
        <VisToggle id={`pub_${f.key}`} label={f.label} checked={isPublic} onChange={onToggle} />
      </div>

      {f.input === 'textarea' ? (
        <Textarea
          id={inputId}
          value={value}
          onChange={(e) => onValue(e.target.value)}
          placeholder={f.placeholder}
          rows={3}
          aria-describedby={hintId}
          className="border-border text-base focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
        />
      ) : f.input === 'checkbox' ? (
        <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-lg py-1">
          <input
            id={inputId}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onValue(e.target.checked)}
            aria-describedby={hintId}
            className="h-5 w-5 flex-none rounded border-border bg-white text-brand-500 accent-brand-500 focus:ring-brand-500 focus:ring-offset-0"
          />
          <span className="text-sm text-neutral-900">{f.checkLabel || 'Sí'}</span>
        </label>
      ) : (
        <Input
          id={inputId}
          type={f.input}
          value={value}
          onChange={(e) => onValue(e.target.value)}
          placeholder={f.placeholder}
          aria-describedby={error ? `${hintId} ${errId}` : hintId}
          aria-invalid={error ? 'true' : undefined}
          className="h-11 border-border text-base focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
        />
      )}

      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={errId}
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-2 text-xs font-medium text-rose-700"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────────────────────────── Página ─────────────────────────────── */

export const ProfilePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const reduce = useReducedMotion();
  const fileRef = useRef(null);
  const formRef = useRef(null);
  const snapshotRef = useRef({ form: { ...emptyForm }, photo: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [active, setActive] = useState(sections[0].id);

  const markDirty = useCallback(() => setDirty(true), []);

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

  /* Ctrl/Cmd + S guarda */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirty && !saving) formRef.current?.requestSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dirty, saving]);

  useEffect(() => {
    const onUnauthorized = () => {
      toast.info('Tu sesión caducó. Inicia sesión de nuevo.');
      window.location.href = '/auth/login';
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/profiles/me');
        if (!mounted) return;
        const p = res.data.profile || res.data;
        const loaded = Object.fromEntries(
          fields.map((f) => {
            let v = p[f.key] ?? '';
            if (f.input === 'date' && v) {
              v = String(v).slice(0, 10);
            }
            return [f.key, f.input === 'checkbox' ? Boolean(v) : v];
          })
        );
        const next = {
          ...emptyForm,
          ...loaded,
          photo_url: p.photo_url || '',
          photoFile: null,
          privacy: mapPrivacy(p.privacy),
        };
        setForm(next);
        snapshotRef.current = { form: next, photo: p.photo_url || null };
        if (p.photo_url) setPhotoPreview(p.photo_url);
        setDirty(false);
      } catch (error) {
        if (!mounted) return;
        if (!(error.response && error.response.status === 404)) {
          toast.error('No pudimos cargar tu perfil. Recarga la página.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [toast]);

  /* Marca en el menú la sección que se está viendo */
  useEffect(() => {
    if (loading || !('IntersectionObserver' in window)) return undefined;
    const els = sections.map((s) => document.getElementById(`sec-${s.id}`)).filter(Boolean);
    if (!els.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id.replace('sec-', ''));
        });
      },
      { rootMargin: '-25% 0px -65% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [loading]);

  const goToSection = (id) => {
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setActive(id);
  };

  const goToField = (key) => {
    const el = document.getElementById(`f_${key}`);
    if (!el) return;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    window.setTimeout(() => el.focus({ preventScroll: true }), reduce ? 0 : 450);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      toast.error('Ese formato no sirve. Usa una imagen JPG, PNG o WebP.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('La imagen pesa más de 2 MB. Elige una más liviana.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({ ...prev, photoFile: file }));
      setPhotoPreview(ev.target.result);
      markDirty();
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setForm((prev) => ({ ...prev, photoFile: null, photo_url: '' }));
    setPhotoPreview(null);
    markDirty();
  };

  const setValue = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    markDirty();
  };

  const togglePrivacy = (key) => {
    setForm((prev) => ({ ...prev, privacy: { ...prev.privacy, [key]: !prev.privacy[key] } }));
    markDirty();
  };

  const privacyPublic = (key) => !!form.privacy[key];

  const discard = () => {
    const snap = snapshotRef.current;
    setForm({ ...snap.form, photoFile: null });
    setPhotoPreview(snap.photo);
    setErrors({});
    setDirty(false);
    toast.info('Cambios descartados');
  };

  const uploadPhotoFile = async () => {
    if (!form.photoFile) return form.photo_url;
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(form.photoFile);
    });
    const res = await api.post('/profiles/photo', { photo_data: dataUrl });
    return res.data.photo_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!String(form.display_name).trim()) {
      setErrors({ display_name: 'Escribe tu nombre: es lo primero que verá quien escanee tu QR.' });
      toast.error('Falta tu nombre. Es lo primero que verá quien escanee tu QR.');
      goToSection('identificacion');
      window.setTimeout(() => goToField('display_name'), 300);
      return;
    }
    setSaving(true);
    try {
      let photoUrl = form.photo_url;
      if (form.photoFile) photoUrl = await uploadPhotoFile();

      const payload = { photo_url: photoUrl || null };
      SAVED_KEYS.forEach((k) => {
        const v = form[k];
        payload[k] = typeof v === 'boolean' ? v : v || null;
      });
      await api.patch('/profiles/me', payload);

      const settings = {};
      SAVED_PRIVACY_KEYS.forEach((k) => { settings[k] = !!form.privacy[k]; });
      await api.patch('/privacy/me', { settings });

      const res = await api.get('/profiles/me');
      let nextForm = { ...form, photoFile: null };
      let nextPhoto = photoPreview;
      if (res.data.profile) {
        const p = res.data.profile;
        nextPhoto = p.photo_url || null;
        nextForm = { ...form, photo_url: p.photo_url || '', photoFile: null, privacy: mapPrivacy(p.privacy) };
        setPhotoPreview(nextPhoto);
        setForm(nextForm);
      } else {
        setForm(nextForm);
      }
      snapshotRef.current = { form: nextForm, photo: nextPhoto };

      setErrors({});
      setDirty(false);
      toast.success('Perfil guardado');
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err?.message || 'No pudimos guardar tu perfil. Intenta de nuevo.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  const isFilled = (f) => (f.input === 'checkbox' ? form[f.key] === true : String(form[f.key] || '').trim() !== '');
  const filled = fields.filter(isFilled).length + (photoPreview ? 1 : 0);
  const totalFields = fields.length + 1;
  const completion = Math.round((filled / totalFields) * 100);
  const publicKeys = PRIVACY_KEYS.filter((k) => labelFor[k]);
  const visibleKeys = publicKeys.filter((k) => privacyPublic(k));
  const hiddenCount = publicKeys.length - visibleKeys.length;
  const nextField = NEXT_STEP_ORDER.map((k) => fields.find((f) => f.key === k)).find((f) => f && !isFilled(f));

  const countFor = (s) => {
    const list = fields.filter((f) => f.category === s.category);
    const done = list.filter(isFilled).length + (s.id === 'identificacion' && photoPreview ? 1 : 0);
    const total = list.length + (s.id === 'identificacion' ? 1 : 0);
    return { done, total };
  };

  const displayName = String(form.display_name || '').trim();

  return (
    <div className="space-y-6 pb-28">
      <PageTitle
        title="Tu perfil de emergencia"
        description="Completa lo que quieras que sepan en una emergencia. En cada dato, tú eliges si se muestra o no al escanear tu QR."
      />

      {/* RESUMEN: foto, progreso y siguiente paso */}
      <Reveal>
        <section className={`${panel} relative overflow-hidden p-5 sm:p-6`} aria-label="Resumen de tu perfil">
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4 sm:gap-5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label={photoPreview ? 'Cambiar fotografía' : 'Subir fotografía'}
                className="group relative h-20 w-20 flex-none overflow-hidden rounded-full bg-brand-50 ring-2 ring-border transition-shadow hover:ring-brand-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:h-24 sm:w-24"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Vista previa de tu fotografía" className="h-full w-full object-cover" />
                ) : (
                  <User size={32} className="mx-auto text-text-secondary/60" aria-hidden="true" />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-brand-900/55 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Camera size={20} aria-hidden="true" />
                </span>
              </button>
              <input ref={fileRef} id="photo_file" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handlePhotoChange} />

              <div className="min-w-0 sm:hidden">
                <p className="truncate text-lg font-semibold text-neutral-900">{displayName || 'Tu nombre'}</p>
                <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <Mail size={12} aria-hidden="true" />
                  <span className="truncate">{user?.email || '—'}</span>
                </p>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="hidden sm:block">
                <p className="truncate text-xl font-semibold tracking-tight text-neutral-900">{displayName || 'Tu nombre'}</p>
                <p className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <Mail size={14} aria-hidden="true" />
                  <span className="truncate">{user?.email || '—'}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="py-2 text-sm">
                  <Upload size={15} /> {photoPreview ? 'Cambiar foto' : 'Subir foto'}
                </Button>
                {photoPreview && (
                  <Button type="button" variant="ghost" onClick={removePhoto} className="py-2 text-sm text-rose-600">
                    <Trash2 size={15} /> Quitar
                  </Button>
                )}
                <VisToggle id="pub_photo_url" label="Fotografía" checked={privacyPublic('photo_url')} onChange={() => togglePrivacy('photo_url')} />
              </div>
              <p className="text-xs text-text-secondary">JPG, PNG o WebP, hasta 2 MB. Solo se muestra si la dejas visible.</p>
            </div>

            <div className="flex items-center gap-4 sm:flex-col sm:gap-2">
              <ProgressRing value={completion} />
              <p className="text-xs text-text-secondary sm:text-center">{filled} de {totalFields} datos listos</p>
            </div>
          </div>

          <div className="relative mt-5 border-t border-border/70 pt-4">
            <AnimatePresence mode="wait" initial={false}>
              {nextField ? (
                <motion.div
                  key={nextField.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="flex items-start gap-2 text-sm text-neutral-900">
                    <Sparkles size={16} className="mt-0.5 flex-none text-brand-500" aria-hidden="true" />
                    <span>
                      <span className="font-semibold">Siguiente paso:</span> agrega {nextField.label.toLowerCase()}.
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => goToField(nextField.key)}
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  >
                    Completar ahora
                    <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                  </button>
                </motion.div>
              ) : (
                <motion.p
                  key="done"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm font-medium text-emerald-700"
                >
                  <CheckCircle2 size={16} aria-hidden="true" />
                  Tus datos clave están completos. Revisa qué quieres mostrar al escanear.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>
      </Reveal>

      {/* Navegación de secciones en móvil */}
      <nav aria-label="Secciones del perfil" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden custom-scrollbar">
        {sections.map((s) => {
          const { done, total } = countFor(s);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goToSection(s.id)}
              aria-current={active === s.id ? 'true' : undefined}
              className={`flex flex-none items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                active === s.id ? 'border-brand-500 bg-brand-500 text-white' : 'border-border bg-white text-neutral-900 hover:border-brand-500/40'
              }`}
            >
              {s.title}
              <span className={`text-xs ${active === s.id ? 'text-white/80' : 'text-text-secondary'}`}>{done}/{total}</span>
            </button>
          );
        })}
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6 lg:col-span-2">
          <Reveal>
            <p className="flex items-start gap-2.5 rounded-xl bg-brand-50/70 p-4 text-sm leading-relaxed text-text-secondary">
              <Eye size={16} className="mt-0.5 flex-none text-brand-500" aria-hidden="true" />
              <span>
                Junto a cada dato verás <strong className="font-semibold text-neutral-900">Oculto</strong> o{' '}
                <strong className="font-semibold text-neutral-900">Visible</strong>. Tócalo para decidir si aparece al escanear tu QR.
                Por defecto todo está oculto.
              </span>
            </p>
          </Reveal>

          {sections.map((s) => {
            const { done, total } = countFor(s);
            return (
              <Reveal key={s.id}>
                <SectionBlock meta={s} filled={done} total={total}>
                  {fields
                    .filter((f) => f.category === s.category)
                    .map((f) => (
                      <FieldCard
                        key={f.key}
                        f={f}
                        value={form[f.key]}
                        isPublic={privacyPublic(f.key)}
                        error={errors[f.key]}
                        onValue={setValue(f.key)}
                        onToggle={() => togglePrivacy(f.key)}
                      />
                    ))}
                </SectionBlock>
              </Reveal>
            );
          })}

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
                    <Button type="submit" variant="primary" disabled={saving} className="px-4 py-2 text-sm">
                      <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          {/* Navegación de secciones en escritorio */}
          <nav aria-label="Secciones del perfil" className={`${panel} hidden p-2 lg:block`}>
            <ul className="space-y-0.5">
              {sections.map((s) => {
                const Icon = s.icon;
                const { done, total } = countFor(s);
                const isActive = active === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => goToSection(s.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-brand-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      {isActive && (
                        <motion.span
                          layoutId="profile-nav-active"
                          className="absolute inset-0 rounded-xl bg-brand-500/10 ring-1 ring-brand-500/15"
                          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                        />
                      )}
                      <Icon size={16} className={`relative ${isActive ? 'text-brand-500' : 'text-text-secondary'}`} aria-hidden="true" />
                      <span className={`relative flex-1 text-sm ${isActive ? 'font-semibold text-neutral-900' : 'text-text-secondary'}`}>{s.title}</span>
                      <span className={`relative text-xs ${done === total ? 'font-medium text-emerald-700' : 'text-text-secondary'}`}>
                        {done === total ? <CheckCircle2 size={15} aria-label="Completo" /> : `${done}/${total}`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Qué se ve al escanear */}
          <div className={`${panel} p-5`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-neutral-900">Qué se ve al escanear</h2>
              <span className="text-xs text-text-secondary">{visibleKeys.length} de {publicKeys.length}</span>
            </div>
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-border/70">
              <motion.div
                className="h-full rounded-full bg-emerald-500"
                initial={false}
                animate={{ width: `${(visibleKeys.length / publicKeys.length) * 100}%` }}
                transition={{ duration: 0.5, ease: EASE }}
              />
            </div>
            {visibleKeys.length === 0 ? (
              <p className="flex items-start gap-2 text-xs leading-relaxed text-text-secondary">
                <EyeOff size={14} className="mt-0.5 flex-none text-brand-500" aria-hidden="true" />
                Por ahora nadie verá tus datos. Activa «Visible» en lo que quieras compartir.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                <AnimatePresence initial={false}>
                  {visibleKeys.map((k) => (
                    <motion.li
                      key={k}
                      layout
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.18 }}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                    >
                      <Eye size={11} aria-hidden="true" /> {labelFor[k]}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
            {hiddenCount > 0 && visibleKeys.length > 0 && (
              <p className="mt-3 text-xs text-text-secondary">{hiddenCount} {hiddenCount === 1 ? 'dato oculto' : 'datos ocultos'}, solo los ves tú.</p>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
            <Lock size={16} className="mt-0.5 flex-none text-rose-700" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-text-secondary">
              Puedes cambiar la visibilidad o borrar tus datos cuando quieras. Evita escribir contraseñas, datos bancarios
              o información que no sea útil en una emergencia.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProfilePage;