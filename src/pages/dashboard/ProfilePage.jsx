import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button, Input, Label, Textarea } from '../../components/ui';
import { PageTitle } from '../../components/DashPage';
import {
  Save, ImageOff, AlertTriangle, Stethoscope, Pill, FileText, Upload, Trash2, Mail, Lock, User, Eye, EyeOff,
} from 'lucide-react';
import { FormSection, FieldRow, Badge, EmptyState, ConfirmDialog } from '../../components/ui-kit';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const panel = 'rounded-2xl border border-brand-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const fields = [
  {
    key: 'display_name',
    label: 'Nombre completo',
    category: 'Identificación',
    icon: User,
    input: 'text',
    placeholder: 'Juan Pérez',
    hint: 'Nombre que se mostrará en tu página pública de emergencia.',
  },
  {
    key: 'allergies',
    label: 'Alergias',
    category: 'Médico',
    icon: AlertTriangle,
    input: 'textarea',
    placeholder: 'Ejemplo: Penicilina, mariscos',
    hint: 'Información crítica para el personal de salud.',
  },
  {
    key: 'medical_conditions',
    label: 'Condiciones médicas',
    category: 'Médico',
    icon: Stethoscope,
    input: 'textarea',
    placeholder: 'Ejemplo: Asma, diabetes, hipertensión',
    hint: 'Condiciones que deben saberse en una emergencia.',
  },
  {
    key: 'medications',
    label: 'Medicamentos',
    category: 'Médico',
    icon: Pill,
    input: 'textarea',
    placeholder: 'Ejemplo: Salbutamol (inhalador) 200 mcg, cada 6 horas',
    hint: 'Medicamentos que tomas regularmente.',
  },
  {
    key: 'additional_info',
    label: 'Información adicional relevante para una emergencia',
    category: 'Adicional',
    icon: FileText,
    input: 'textarea',
    placeholder: 'Tipo de sangre, grupo, notas relevantes...',
    hint: 'Cualquier otra información que pueda salvarte la vida.',
  },
];

const PRIVACY_KEYS = ['display_name', 'photo_url', 'allergies', 'medical_conditions', 'medications', 'additional_info'];

const emptyForm = {
  display_name: '',
  allergies: '',
  medical_conditions: '',
  medications: '',
  additional_info: '',
  photo_url: '',
  photoFile: null,
  privacy: {},
};

const mapPrivacy = (privacy = {}) =>
  PRIVACY_KEYS.reduce((acc, k) => ({ ...acc, [k]: privacy[k] === true }), {});

const VisBadge = ({ pub }) => (
  <Badge tone={pub ? 'success' : 'neutral'} size="sm">
    {pub ? <Eye size={11} aria-hidden="true" /> : <EyeOff size={11} aria-hidden="true" />}
    {pub ? 'Público' : 'Privado'}
  </Badge>
);

const VisSwitch = ({ id, label, checked, onChange }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-dark/70 px-3 py-2.5">
    <label htmlFor={id} className="cursor-pointer text-xs text-brand-textMuted">
      {checked ? 'Visible en tu página de emergencia' : 'Solo tú puedes verlo'}
    </label>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${label}: ${checked ? 'público' : 'privado'}`}
      onClick={onChange}
      className={`relative h-6 w-11 flex-none rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 ${
        checked ? 'bg-brand-accent' : 'bg-slate-300'
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
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-textMuted">{title}</h2>
      {description && <p className="mt-1 max-w-md text-xs text-brand-textMuted">{description}</p>}
    </div>
    {children}
  </section>
);

const FieldBlock = ({ f, value, isPublic, onChange, onToggle }) => {
  const Icon = f.icon;
  return (
    <FieldRow icon={Icon} label={f.label} hint={f.hint} className="space-y-2">
      {f.input === 'textarea' ? (
        <Textarea id={`f_${f.key}`} value={value} onChange={onChange} placeholder={f.placeholder} rows={3} className="text-base sm:text-sm" />
      ) : (
        <Input id={`f_${f.key}`} type={f.input} value={value} onChange={onChange} placeholder={f.placeholder} className="h-11 text-base sm:text-sm" />
      )}
      <div className="flex items-center justify-between">
        <VisBadge pub={isPublic} />
        <VisSwitch id={`pub_${f.key}`} label={f.label} checked={isPublic} onChange={onToggle} />
      </div>
    </FieldRow>
  );
};

export const ProfilePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState(false);

  const markDirty = useCallback(() => setDirty(true), []);

  useEffect(() => {
    if (!dirty) return undefined;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Tienes cambios sin guardar. ¿Salir de todos modos?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    const onUnauthorized = () => {
      toast.info('Sesión caducada. Inicia sesión nuevamente.');
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
        setForm({
          display_name: p.display_name || '',
          allergies: p.allergies || '',
          medical_conditions: p.medical_conditions || '',
          medications: p.medications || '',
          additional_info: p.additional_info || '',
          photo_url: p.photo_url || '',
          photoFile: null,
          privacy: mapPrivacy(p.privacy),
        });
        if (p.photo_url) setPhotoPreview(p.photo_url);
        setDirty(false);
      } catch (error) {
        if (!mounted) return;
        if (error.response && error.response.status === 404) {
          setDirty(false);
        } else {
          toast.error('No se pudo cargar el perfil');
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
      toast.error('Tipo de archivo no permitido. Usa JPG, PNG o WebP.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('La imagen supera el límite de 2 MB.');
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
    setConfirmDeletePhoto(true);
  };

  const confirmRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photoFile: null, photo_url: '' }));
    setPhotoPreview(null);
    setConfirmDeletePhoto(false);
    markDirty();
  };

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    markDirty();
  };

  const togglePrivacy = (key) => {
    setForm((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: !prev.privacy[key] },
    }));
    markDirty();
  };

  const privacyPublic = (key) => !!form.privacy[key];

  const uploadPhotoFile = async () => {
    if (!form.photoFile) return form.photo_url;
    const reader = new FileReader();
    const dataUrl = await new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(form.photoFile);
    });
    const res = await api.post('/profiles/photo', { photo_data: dataUrl });
    return res.data.photo_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let photoUrl = form.photo_url;
      if (form.photoFile) {
        photoUrl = await uploadPhotoFile();
      }

      await api.patch('/profiles/me', {
        display_name: form.display_name || null,
        photo_url: photoUrl || null,
        allergies: form.allergies || null,
        medical_conditions: form.medical_conditions || null,
        medications: form.medications || null,
        additional_info: form.additional_info || null,
      });

      await api.patch('/privacy/me', {
        settings: {
          display_name: form.privacy.display_name,
          photo_url: form.privacy.photo_url,
          allergies: form.privacy.allergies,
          medical_conditions: form.privacy.medical_conditions,
          medications: form.privacy.medications,
          additional_info: form.privacy.additional_info,
        },
      });

      const res = await api.get('/profiles/me');
      if (res.data.profile) {
        const p = res.data.profile;
        setPhotoPreview(p.photo_url || null);
        setForm((prev) => ({
          ...prev,
          photo_url: p.photo_url || '',
          photoFile: null,
          privacy: mapPrivacy(p.privacy),
        }));
      }

      setDirty(false);
      toast.success('Perfil guardado correctamente.');
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err?.message || 'No se pudo guardar el perfil');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="animate-pulse rounded-full h-12 w-12 bg-brand-border/60" /></div>;

  const filled =
    fields.filter((f) => String(form[f.key] || '').trim()).length + (photoPreview ? 1 : 0);
  const totalFields = fields.length + 1;
  const completion = Math.round((filled / totalFields) * 100);
  const publicCount = PRIVACY_KEYS.filter((k) => privacyPublic(k)).length;

  const blockProps = (f) => ({
    f,
    value: form[f.key] || '',
    isPublic: privacyPublic(f.key),
    onChange: handleChange(f.key),
    onToggle: () => togglePrivacy(f.key),
  });

  const labelFor = { photo_url: 'Fotografía', ...Object.fromEntries(fields.map((f) => [f.key, f.label])) };

  return (
    <div className="space-y-6">
      <PageTitle
        title="Perfil de emergencia"
        description="Registra y administra tu información personal, médica y de contacto. Decides qué se muestra públicamente."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} noValidate className={`${panel} lg:col-span-2`}>
          <div className="space-y-10 p-5 sm:p-6 lg:p-8">
            {/* Identificación */}
            <Section title="Identificación">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ImageOff size={15} className="text-brand-accent" aria-hidden="true" />
                  <Label htmlFor="photo_file" className="!mb-0">Fotografía</Label>
                  <VisBadge pub={privacyPublic('photo_url')} />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-full bg-brand-dark ring-2 ring-brand-border">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Vista previa de la fotografía" className="h-full w-full object-cover" />
                    ) : (
                      <User size={30} className="text-brand-textMuted/60" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                      <Upload size={16} /> {photoPreview ? 'Cambiar' : 'Subir fotografía'}
                    </Button>
                    {photoPreview && (
                      <Button type="button" variant="ghost" onClick={removePhoto}>
                        <Trash2 size={16} /> Quitar
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    id="photo_file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handlePhotoChange}
                  />
                </div>
                <p className="text-xs text-brand-textMuted">
                  JPG, PNG o WebP, máximo 2 MB. Se almacena de forma privada y solo es pública si así lo autorizas.
                </p>
                <VisSwitch
                  id="pub_photo_url"
                  label="Fotografía"
                  checked={privacyPublic('photo_url')}
                  onChange={() => togglePrivacy('photo_url')}
                />
              </div>

              {fields.filter((f) => f.category === 'Identificación').map((f) => (
                <FieldBlock key={f.key} {...blockProps(f)} />
              ))}
            </Section>

            {/* Médico */}
            <Section title="Información médica" description="Rellena solo lo que corresponda a tu situación. Ningún campo médico es obligatorio.">
              {fields.filter((f) => f.category === 'Médico').map((f) => (
                <FieldBlock key={f.key} {...blockProps(f)} />
              ))}
            </Section>

            {/* Adicional */}
            <Section title="Información adicional">
              {fields.filter((f) => f.category === 'Adicional').map((f) => (
                <FieldBlock key={f.key} {...blockProps(f)} />
              ))}
            </Section>

            {/* Consentimiento */}
            <section className="rounded-xl border border-brand-border bg-brand-dark/60 p-5">
              <h3 className="mb-2 text-sm font-semibold text-brand-text">Privacidad y consentimiento</h3>
              <p className="mb-4 text-xs leading-relaxed text-brand-textMuted">
                Cada control define si ese campo se publica en tu página de emergencia. Cualquier persona con
                acceso al enlace del QR podrá consultar solo lo que marques como Público. Los campos Privados
                solo se consultan desde tu panel autenticado.
              </p>
              <div className="flex items-start gap-3 rounded-lg border border-brand-border bg-white p-4">
                <input
                  id="consent"
                  type="checkbox"
                  checked
                  readOnly
                  disabled
                  className="mt-0.5 h-4 w-4 flex-none rounded border-brand-border accent-brand-accent"
                />
                <label htmlFor="consent" className="text-sm leading-relaxed text-brand-text">
                  Autorizo que la información que marque como Público sea accesible a través de mi página de
                  emergencia. Puedes cambiar la visibilidad o eliminar tus datos en cualquier momento desde
                  este panel. No incluyas contraseñas, datos financieros ni información innecesaria.
                </label>
              </div>
            </section>
          </div>

          {/* Barra de guardado */}
          <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-b-2xl border-t border-brand-border bg-white/90 px-5 py-4 backdrop-blur sm:px-6 lg:px-8">
            <p className={`text-xs ${dirty ? 'font-medium text-amber-700' : 'text-brand-textMuted'}`}>
              {dirty ? 'Tienes cambios sin guardar' : 'Todo guardado'}
            </p>
            <Button type="submit" variant="primary" disabled={saving || !dirty}>
              <Save size={18} /> {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className={`${panel} p-5`}>
            <h2 className="mb-4 text-sm font-semibold text-brand-text">Cuenta</h2>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent">
                <Mail size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-textMuted">Correo</p>
                <p className="break-all text-sm text-brand-text">{user?.email || '—'}</p>
              </div>
            </div>
          </div>

          <div className={`${panel} p-5`}>
            <div className="flex items-end justify-between">
              <h2 className="text-sm font-semibold text-brand-text">Perfil completado</h2>
              <span className="text-2xl font-extrabold tracking-tight text-brand-accent">{completion}%</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-brand-border/70">
              <div className="h-full rounded-full bg-brand-accent transition-all duration-500" style={{ width: `${completion}%` }} />
            </div>
            <p className="mt-2 text-xs text-brand-textMuted">{filled} de {totalFields} campos con información</p>
          </div>

          <div className={`${panel} p-5`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-text">Visibilidad actual</h2>
              <span className="text-xs text-brand-textMuted">{publicCount} públicos</span>
            </div>
            <ul className="space-y-2.5">
              {PRIVACY_KEYS.map((k) => (
                <li key={k} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-brand-textMuted">{labelFor[k]}</span>
                  <VisBadge pub={privacyPublic(k)} />
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
            <Lock size={16} className="mt-0.5 flex-none text-rose-700" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-brand-textMuted">
              Ningún dato sensible es público por defecto. Tú decides qué compartir y puedes cambiarlo en
              cualquier momento.
            </p>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        isOpen={confirmDeletePhoto}
        onClose={() => setConfirmDeletePhoto(false)}
        title="Quitar fotografía"
        text="¿Estás seguro de que deseas quitar tu fotografía de perfil?"
        onConfirm={confirmRemovePhoto}
        confirmLabel="Quitar"
      />
    </div>
  );
};

export default ProfilePage;
