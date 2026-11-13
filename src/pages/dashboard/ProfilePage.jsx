import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import api from '../../api/client';
import { routes } from '../../utils/routes';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button, Input, Label, Textarea } from '../../components/ui';
import { PageTitle, PageLoader } from '../../components/DashPage';
import { Camera, Check, ArrowLeft, ArrowRight, RotateCcw, Save, Trash2, User } from 'lucide-react';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

/**
 * Campos que el backend guarda al pulsar "Guardar" (PUBLIC_FIELDS en profile.service.js).
 * La visibilidad de cada dato se gestiona solo en la página de Privacidad.
 */
const fields = [
  { key: 'display_name', label: 'Nombre completo', category: 'identificacion', input: 'text', placeholder: 'Tu nombre y apellido', required: true, wide: true },
  { key: 'blood_type', label: 'Tipo de sangre', category: 'identificacion', input: 'text', placeholder: 'O+' },
  { key: 'date_of_birth', label: 'Fecha de nacimiento', category: 'identificacion', input: 'date' },
  { key: 'document_number', label: 'Número de documento', category: 'identificacion', input: 'text', placeholder: 'Cédula o pasaporte', wide: true },
  { key: 'is_organ_donor', label: 'Donante de órganos', category: 'identificacion', input: 'checkbox', checkLabel: 'Soy donante de órganos' },
  { key: 'allergies', label: 'Alergias', category: 'medico', input: 'textarea', placeholder: 'Ej.: penicilina, mariscos' },
  { key: 'medical_conditions', label: 'Condiciones médicas', category: 'medico', input: 'textarea', placeholder: 'Ej.: asma, diabetes' },
  { key: 'medications', label: 'Medicamentos', category: 'medico', input: 'textarea', placeholder: 'Ej.: salbutamol cada 6 horas' },
  { key: 'medical_devices', label: 'Dispositivos o implantes', category: 'medico', input: 'textarea', placeholder: 'Ej.: marcapasos' },
  { key: 'height_cm', label: 'Estatura (cm)', category: 'medico', input: 'number', placeholder: '170' },
  { key: 'weight_kg', label: 'Peso (kg)', category: 'medico', input: 'number', placeholder: '70' },
  { key: 'primary_doctor_name', label: 'Médico tratante', category: 'medico', input: 'text', placeholder: 'Nombre de tu médico' },
  { key: 'primary_doctor_phone', label: 'Teléfono del médico', category: 'medico', input: 'tel', placeholder: '+57 300 000 0000' },
  { key: 'is_pregnant', label: 'Embarazo', category: 'medico', input: 'checkbox', checkLabel: 'Hay un embarazo en curso' },
  { key: 'insurance_company', label: 'EPS o aseguradora', category: 'seguro', input: 'text', placeholder: 'Nombre de tu EPS o seguro' },
  { key: 'insurance_policy_number', label: 'Afiliación o póliza', category: 'seguro', input: 'text', placeholder: 'Número de carnet o póliza' },
  { key: 'emergency_note', label: 'Nota de emergencia', category: 'adicional', input: 'textarea', placeholder: 'Lo primero que debe leer el personal de salud' },
  { key: 'additional_info', label: 'Algo más que deban saber', category: 'adicional', input: 'textarea', placeholder: 'Cualquier dato útil en una emergencia' },
];

const SAVED_KEYS = fields.map((f) => f.key);

const sections = [
  { id: 'identificacion', title: 'Identificación' },
  { id: 'medico', title: 'Médico' },
  { id: 'seguro', title: 'Seguro' },
  { id: 'adicional', title: 'Notas' },
];

const emptyForm = {
  ...Object.fromEntries(fields.map((f) => [f.key, f.input === 'checkbox' ? false : ''])),
  photo_url: '',
  photoFile: null,
};

const isWide = (f) => f.wide || f.input === 'textarea' || f.input === 'checkbox';

const Field = ({ f, value, error, onValue }) => {
  const id = `f_${f.key}`;
  const errId = `err_${f.key}`;
  return (
    <div className={isWide(f) ? 'sm:col-span-2' : ''}>
      {f.input === 'checkbox' ? (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-white p-3.5 transition-colors hover:border-brand-500/30">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onValue(e.target.checked)}
            className="h-5 w-5 flex-none rounded border-border accent-brand-500"
          />
          <span className="text-sm text-neutral-900">{f.checkLabel}</span>
        </label>
      ) : (
        <>
          <Label htmlFor={id}>
            {f.label}
            {f.required && <span className="ml-1 text-brand-500" aria-hidden="true">*</span>}
          </Label>
          {f.input === 'textarea' ? (
            <Textarea
              id={id}
              value={value}
              onChange={(e) => onValue(e.target.value)}
              placeholder={f.placeholder}
              rows={3}
              className="text-base sm:text-sm"
            />
          ) : (
            <Input
              id={id}
              type={f.input}
              value={value}
              onChange={(e) => onValue(e.target.value)}
              placeholder={f.placeholder}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? errId : undefined}
              className="h-11 text-base sm:text-sm"
            />
          )}
        </>
      )}
      {error && (
        <p id={errId} role="alert" className="mt-1.5 text-xs font-medium text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
};

export const ProfilePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const formRef = useRef(null);
  const snapshotRef = useRef({ form: { ...emptyForm }, photo: null });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const [tab, setTab] = useState(sections[0].id);

  const markDirty = useCallback(() => setDirty(true), []);

  /* Avisa si intentan salir con cambios sin guardar */
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
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
            if (f.input === 'date' && v) v = String(v).slice(0, 10);
            return [f.key, f.input === 'checkbox' ? Boolean(v) : v];
          }),
        );
        const next = { ...emptyForm, ...loaded, photo_url: p.photo_url || '', photoFile: null };
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

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      toast.error('Usa una imagen JPG, PNG o WebP.');
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
      toast.error('Falta tu nombre.');
      setTab('identificacion');
      window.setTimeout(() => document.getElementById('f_display_name')?.focus(), 50);
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

      const res = await api.get('/profiles/me');
      let nextForm = { ...form, photoFile: null };
      let nextPhoto = photoPreview;
      if (res.data.profile) {
        nextPhoto = res.data.profile.photo_url || null;
        nextForm = { ...form, photo_url: res.data.profile.photo_url || '', photoFile: null };
        setPhotoPreview(nextPhoto);
      }
      setForm(nextForm);
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
  const countFor = (id) => {
    const list = fields.filter((f) => f.category === id);
    return { done: list.filter(isFilled).length, total: list.length };
  };
  const filled = fields.filter(isFilled).length;
  const pct = Math.round((filled / fields.length) * 100);
  const displayName = String(form.display_name || '').trim();

  const tabIndex = sections.findIndex((s) => s.id === tab);
  const prev = sections[tabIndex - 1];
  const nextSection = sections[tabIndex + 1];

  return (
    <div className="animate-fade-in space-y-4 pb-28 lg:space-y-5">
      <PageTitle title="Tu perfil" description="Llena solo lo que quieras. Qué se muestra lo decides en Privacidad." />

      {/* Quién eres: foto, nombre y avance */}
      <section className={`${panel} flex items-center gap-4 p-4 sm:p-5`} aria-label="Resumen del perfil">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label={photoPreview ? 'Cambiar fotografía' : 'Subir fotografía'}
          className="group relative h-20 w-20 flex-none overflow-hidden rounded-full bg-brand-50 ring-2 ring-border transition-shadow hover:ring-brand-500/50 focus-ring"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Tu fotografía" className="h-full w-full object-cover" />
          ) : (
            <User size={30} className="mx-auto text-text-secondary/60" aria-hidden="true" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-brand-900/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Camera size={20} aria-hidden="true" />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handlePhotoChange} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-neutral-900">{displayName || 'Tu nombre'}</p>
          <p className="truncate text-sm text-text-secondary">{user?.email || ''}</p>
          <div className="mt-3 flex items-center gap-3">
            <div
              className="h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-border/70"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Perfil completado"
            >
              <div className="h-full rounded-full bg-brand-500 transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="flex-none text-xs text-text-secondary">{pct}%</span>
          </div>
          {photoPreview && (
            <button
              type="button"
              onClick={removePhoto}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:underline"
            >
              <Trash2 size={13} aria-hidden="true" /> Quitar foto
            </button>
          )}
        </div>
      </section>

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Navegación entre secciones */}
        <div role="tablist" aria-label="Secciones del perfil" className="custom-scrollbar flex gap-1.5 overflow-x-auto rounded-xl border border-border bg-white p-1.5">
          {sections.map((s) => {
            const { done, total } = countFor(s.id);
            const active = tab === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(s.id)}
                className={`flex flex-1 flex-none items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-ring ${
                  active ? 'bg-brand-500 text-white' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900'
                }`}
              >
                {s.title}
                <span className={`text-xs ${active ? 'text-white/80' : 'text-text-secondary'}`}>
                  {done === total ? <Check size={13} strokeWidth={3} aria-label="Completo" /> : `${done}/${total}`}
                </span>
              </button>
            );
          })}
        </div>

        <section role="tabpanel" className={`${panel} p-5 sm:p-6`}>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields
              .filter((f) => f.category === tab)
              .map((f) => (
                <Field key={f.key} f={f} value={form[f.key]} error={errors[f.key]} onValue={setValue(f.key)} />
              ))}
          </div>
        </section>

        {/* Avanzar sin perderse */}
        <div className="flex items-center justify-between gap-3">
          {prev ? (
            <button type="button" onClick={() => setTab(prev.id)} className="btn-ghost px-4 py-2 text-sm">
              <ArrowLeft size={16} aria-hidden="true" /> {prev.title}
            </button>
          ) : (
            <span />
          )}
          {nextSection ? (
            <button type="button" onClick={() => setTab(nextSection.id)} className="btn-outline px-4 py-2 text-sm">
              {nextSection.title} <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <Link to={routes.dashboardContacts} className="btn-outline px-4 py-2 text-sm">
              Siguiente: contactos <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>

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
                <Button type="submit" variant="primary" disabled={saving} className="px-4 py-2 text-sm">
                  <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfilePage;