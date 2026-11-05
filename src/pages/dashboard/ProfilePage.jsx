import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button, Input, Label, Textarea } from '../../components/ui';
import { PageTitle, PageLoader } from '../../components/DashPage';
import {
  Save, ImageOff, AlertTriangle, Stethoscope, Pill, FileText, Upload, Trash2, Mail, Lock, User, Eye, EyeOff,
  Calendar, Ruler, Scale, Baby, Settings, Phone, Shield, IdCard, Heart, Droplet, Bell,
} from 'lucide-react';
import { FieldRow } from '../../components/ui-kit';
import { Badge } from '../../components/ui-kit';

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
  { key: 'display_name', label: 'Nombre completo', category: 'Identificación', icon: User, input: 'text', placeholder: 'Tu nombre y apellido', hint: 'El nombre que verá quien escanee tu QR.' },
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

const VisBadge = ({ pub }) => (
  <Badge tone={pub ? 'success' : 'neutral'} size="sm">
    {pub ? <Eye size={11} aria-hidden="true" /> : <EyeOff size={11} aria-hidden="true" />}
    {pub ? 'Visible' : 'Oculto'}
  </Badge>
);

const VisSwitch = ({ id, label, checked, onChange }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-brand-50/60 px-3 py-2.5">
    <label htmlFor={id} className="cursor-pointer text-xs leading-tight text-text-secondary">
      {checked ? 'Se muestra al escanear tu QR' : 'Solo lo ves tú'}
    </label>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${label}: ${checked ? 'visible al escanear' : 'oculto'}`}
      onClick={onChange}
      className={`relative h-6 w-11 flex-none rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
        checked ? 'bg-brand-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

const Section = ({ title, description, children }) => (
  <section className="space-y-5">
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">{title}</h2>
      {description && <p className="mt-1 max-w-md text-xs text-text-secondary">{description}</p>}
    </div>
    {children}
  </section>
);

const FieldBlock = ({ f, value, isPublic, onValue, onToggle }) => (
  <FieldRow icon={f.icon} label={f.label} hint={f.hint} className="space-y-3">
    {f.input === 'textarea' ? (
      <Textarea
        id={`f_${f.key}`}
        value={value}
        onChange={(e) => onValue(e.target.value)}
        placeholder={f.placeholder}
        rows={3}
        className="border-border text-base focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
      />
    ) : f.input === 'checkbox' ? (
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          id={`f_${f.key}`}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onValue(e.target.checked)}
          className="h-5 w-5 flex-none rounded border-border bg-white text-brand-500 accent-brand-500 focus:ring-brand-500 focus:ring-offset-0"
        />
        <span className="text-sm text-neutral-900">{f.checkLabel || 'Sí'}</span>
      </label>
    ) : (
      <Input
        id={`f_${f.key}`}
        type={f.input}
        value={value}
        onChange={(e) => onValue(e.target.value)}
        placeholder={f.placeholder}
        className="h-11 border-border text-base focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm"
      />
    )}
    <VisSwitch id={`pub_${f.key}`} label={f.label} checked={isPublic} onChange={onToggle} />
  </FieldRow>
);

export const ProfilePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dirty, setDirty] = useState(false);

  const markDirty = useCallback(() => setDirty(true), []);

  useEffect(() => {
    if (!dirty) return undefined;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

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
          fields.map((f) => [f.key, f.input === 'checkbox' ? Boolean(p[f.key]) : (p[f.key] ?? '')])
        );
        setForm({
          ...emptyForm,
          ...loaded,
          photo_url: p.photo_url || '',
          photoFile: null,
          privacy: mapPrivacy(p.privacy),
        });
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
    markDirty();
  };

  const togglePrivacy = (key) => {
    setForm((prev) => ({ ...prev, privacy: { ...prev.privacy, [key]: !prev.privacy[key] } }));
    markDirty();
  };

  const privacyPublic = (key) => !!form.privacy[key];

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
      toast.error('Escribe tu nombre: es lo primero que verá quien escanee tu QR.');
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
      if (res.data.profile) {
        const p = res.data.profile;
        setPhotoPreview(p.photo_url || null);
        setForm((prev) => ({ ...prev, photo_url: p.photo_url || '', photoFile: null, privacy: mapPrivacy(p.privacy) }));
      }

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

  const filled = fields.filter((f) => (f.input === 'checkbox' ? form[f.key] === true : String(form[f.key] || '').trim())).length + (photoPreview ? 1 : 0);
  const totalFields = fields.length + 1;
  const completion = Math.round((filled / totalFields) * 100);
  const publicKeys = PRIVACY_KEYS.filter((k) => labelFor[k]);
  const publicCount = publicKeys.filter((k) => privacyPublic(k)).length;

  const block = (f) => (
    <FieldBlock
      key={f.key}
      f={f}
      value={form[f.key]}
      isPublic={privacyPublic(f.key)}
      onValue={setValue(f.key)}
      onToggle={() => togglePrivacy(f.key)}
    />
  );
  const byCategory = (cat) => fields.filter((f) => f.category === cat).map(block);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Tu perfil de emergencia"
        description="Completa lo que quieras que sepan en una emergencia. Para cada dato, tú eliges si se muestra o no al escanear tu QR."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} noValidate className={`${panel} lg:col-span-2`}>
          <div className="space-y-10 p-4 pb-24 sm:p-6 sm:pb-28 lg:p-8 lg:pb-32">
            <Section title="Identificación">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ImageOff size={15} className="text-brand-500" aria-hidden="true" />
                  <Label htmlFor="photo_file" className="!mb-0">Fotografía</Label>
                  <VisBadge pub={privacyPublic('photo_url')} />
                </div>
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
                  <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-full bg-brand-50 ring-2 ring-border sm:h-20 sm:w-20">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Vista previa de tu fotografía" className="h-full w-full object-cover" />
                    ) : (
                      <User size={28} className="text-text-secondary/60" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                    <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="w-full py-2.5 text-sm sm:w-auto sm:px-4">
                      <Upload size={16} /> {photoPreview ? 'Cambiar foto' : 'Subir fotografía'}
                    </Button>
                    {photoPreview && (
                      <Button type="button" variant="ghost" onClick={removePhoto} className="w-full py-2.5 text-sm text-rose-600 sm:w-auto sm:px-4">
                        <Trash2 size={16} /> Quitar
                      </Button>
                    )}
                  </div>
                  <input ref={fileRef} id="photo_file" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handlePhotoChange} />
                </div>
                <p className="text-xs text-text-secondary">
                  JPG, PNG o WebP, hasta 2 MB. Se guarda de forma privada y solo se muestra si tú lo activas.
                </p>
                <VisSwitch id="pub_photo_url" label="Fotografía" checked={privacyPublic('photo_url')} onChange={() => togglePrivacy('photo_url')} />
              </div>

              {byCategory('Identificación')}
            </Section>

            <Section title="Información médica" description="Llena solo lo que te aplique. Ningún campo médico es obligatorio.">
              {byCategory('Médico')}
            </Section>

            <Section title="Seguro médico">{byCategory('Seguro')}</Section>

            <Section title="Información adicional">{byCategory('Adicional')}</Section>

            <section className="rounded-xl border border-border bg-brand-50/60 p-5">
              <h3 className="mb-2 text-sm font-semibold text-neutral-900">Cómo se usa tu información</h3>
              <p className="text-xs leading-relaxed text-text-secondary">
                Quien escanee tu QR solo verá los datos que dejes como visibles. Los demás solo los ves tú desde
                este panel. Puedes cambiar la visibilidad o eliminar tus datos cuando quieras. Evita escribir
                contraseñas, datos bancarios o información que no sea necesaria en una emergencia.
              </p>
            </section>
          </div>

          <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-b-2xl border-t border-border bg-white/90 px-5 py-4 backdrop-blur sm:px-6 lg:px-8">
            <p className={`text-xs ${dirty ? 'font-medium text-amber-700' : 'text-text-secondary'}`}>
              {dirty ? 'Tienes cambios sin guardar' : 'Todo está guardado'}
            </p>
            <Button type="submit" variant="primary" disabled={saving || !dirty}>
              <Save size={18} /> {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className={`${panel} p-5`}>
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Tu cuenta</h2>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                <Mail size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Correo</p>
                <p className="break-all text-sm text-neutral-900">{user?.email || '—'}</p>
              </div>
            </div>
          </div>

          <div className={`${panel} p-5`}>
            <div className="flex items-end justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">Perfil completado</h2>
              <span className="text-2xl font-extrabold tracking-tight text-brand-500">{completion}%</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border/70">
              <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${completion}%` }} />
            </div>
            <p className="mt-2 text-xs text-text-secondary">{filled} de {totalFields} campos con información</p>
          </div>

          <div className={`${panel} p-5`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">Qué se ve al escanear</h2>
              <span className="text-xs text-text-secondary">{publicCount} visibles</span>
            </div>
            <ul className="space-y-2.5">
              {publicKeys.map((k) => (
                <li key={k} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-text-secondary">{labelFor[k]}</span>
                  <VisBadge pub={privacyPublic(k)} />
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
            <Lock size={16} className="mt-0.5 flex-none text-rose-700" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-text-secondary">
              Nada es visible por defecto. Tú decides qué compartir y puedes cambiarlo cuando quieras.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProfilePage;