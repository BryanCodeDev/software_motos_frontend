import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/useAuth';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button, Input, Label, Textarea } from '../../components/ui';
import { PageTitle, PageLoader } from '../../components/DashPage';
import { Save, Image, ImageOff, AlertTriangle, Stethoscope, Pill, FileText, Upload, Trash2, Mail, Lock } from 'lucide-react';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Campos que el usuario puede completar. Ninguno es obligatorio salvo el nombre
// público cuando se desea mostrar en la página de emergencia.
const fields = [
  {
    key: 'display_name',
    label: 'Nombre completo',
    category: 'Identificación',
    icon: Mail,
    input: 'text',
    placeholder: 'Juan Pérez',
    hint: 'Nombre que se mostrará en tu página pública de emergencia.',
    sensitive: false,
  },
  {
    key: 'allergies',
    label: 'Alergias',
    category: 'Médico',
    icon: AlertTriangle,
    input: 'textarea',
    placeholder: 'Ejemplo: Penicilina, mariscos',
    hint: 'Información crítica para el personal de salud.',
    sensitive: true,
  },
  {
    key: 'medical_conditions',
    label: 'Condiciones médicas',
    category: 'Médico',
    icon: Stethoscope,
    input: 'textarea',
    placeholder: 'Ejemplo: Asma, diabetes, hipertensión',
    hint: 'Condiciones que deben saberse en una emergencia.',
    sensitive: true,
  },
  {
    key: 'medications',
    label: 'Medicamentos',
    category: 'Médico',
    icon: Pill,
    input: 'textarea',
    placeholder: 'Ejemplo: Salbutamol (inhalador) 200 mcg, cada 6 horas',
    hint: 'Medicamentos que tomas regularmente.',
    sensitive: true,
  },
  {
    key: 'additional_info',
    label: 'Información adicional relevante para una emergencia',
    category: 'Adicional',
    icon: FileText,
    input: 'textarea',
    placeholder: 'Tipo de sangre, grupo, notas relevantes...',
    hint: 'Cualquier otra información que pueda salvarte la vida.',
    sensitive: true,
  },
];

const categories = ['Identificación', 'Médico', 'Adicional'];

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

export const ProfilePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dirty, setDirty] = useState(false);
  const unloadHandlerBound = useRef(false);

  const markDirty = useCallback(() => setDirty(true), []);

  const resetDirty = useCallback(() => setDirty(false), []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = 'Tienes cambios sin guardar. ¿Salir de todos modos?';
      return e.returnValue;
    };
    if (dirty && !unloadHandlerBound.current) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      unloadHandlerBound.current = true;
    }
    if (!dirty && unloadHandlerBound.current) {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unloadHandlerBound.current = false;
    }
  }, [dirty]);

  // Escucha sesión caducada (el cliente HTTP lo lanza en 401).
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
        const privacy = p.privacy || {};
        setForm({
          display_name: p.display_name || '',
          allergies: p.allergies || '',
          medical_conditions: p.medical_conditions || '',
          medications: p.medications || '',
          additional_info: p.additional_info || '',
          photo_url: p.photo_url || '',
          photoFile: null,
          privacy: {
            display_name: privacy.display_name === true,
            photo_url: privacy.photo_url === true,
            allergies: privacy.allergies === true,
            medical_conditions: privacy.medical_conditions === true,
            medications: privacy.medications === true,
            additional_info: privacy.additional_info === true,
          },
        });
        if (p.photo_url) setPhotoPreview(p.photo_url);
        setDirty(false);
      } catch (error) {
        if (!mounted) return;
        if (error.response && error.response.status === 404) {
          // Sin perfil aún: se crea al guardar
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
    setForm((prev) => ({ ...prev, photoFile: null, photo_url: '' }));
    setPhotoPreview(null);
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

      // Recargar para reflejar el estado guardado (incluye visibilidad).
      const res = await api.get('/profiles/me');
      if (res.data.profile) {
        const p = res.data.profile;
        const privacy = p.privacy || {};
        setPhotoPreview(p.photo_url || null);
        setForm((prev) => ({
          ...prev,
          photo_url: p.photo_url || '',
          photoFile: null,
          privacy: {
            display_name: privacy.display_name === true,
            photo_url: privacy.photo_url === true,
            allergies: privacy.allergies === true,
            medical_conditions: privacy.medical_conditions === true,
            medications: privacy.medications === true,
            additional_info: privacy.additional_info === true,
          },
        }));
      }

      setDirty(false);
      toast.success('Perfil guardado correctamente. La página pública refleja los cambios al instante.');
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

  if (loading) return <PageLoader />;

  return (
    <div ref={formRef}>
      <PageTitle
        title="Perfil de emergencia"
        description="Registra y administra tu información personal, médica y de contacto. Decides qué se muestra públicamente."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-static p-6 lg:p-8 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            {/* Identificación */}
            <section aria-labelledby="id-heading">
              <h2 id="id-heading" className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-textMuted mb-4">
                Identificación
              </h2>
              <div className="space-y-5">
                {fields
                  .filter((f) => f.category === 'Identificación')
                  .map((f) => (
                    <div key={f.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`f_${f.key}`}>{f.label}</Label>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            privacyPublic(f.key)
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-black/5 text-brand-textMuted border-brand-border'
                          }`}
                        >
                          {privacyPublic(f.key) ? 'Público' : 'Privado'}
                        </span>
                      </div>
                      {f.key === 'photo_url' ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={handlePhotoChange}
                              className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-dark px-3 py-2 text-sm text-brand-textMuted hover:text-brand-text hover:border-brand-accent/40 transition-colors"
                              aria-label="Subir fotografía"
                            >
                              <Upload className="w-4 h-4" /> Seleccionar fotografía
                            </button>
                            <input
                              id="photo_file"
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="sr-only"
                              onChange={handlePhotoChange}
                            />
                            {form.photoFile && (
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={removePhoto}
                                className="ml-2"
                              >
                                <Trash2 className="w-3 h-3" /> Quitar
                              </Button>
                            )}
                          </div>
                          {photoPreview ? (
                            <div className="relative inline-block">
                              <img
                                src={photoPreview}
                                alt="Vista previa de la fotografía"
                                className="w-24 h-24 rounded-full object-cover border border-brand-border shadow-sm"
                              />
                              <p className="text-[11px] text-brand-textMuted mt-1">
                                Se mostrará públicamente solo si marcas la fotografía como Pública.
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-brand-textMuted">
                              La fotografía se almacena de forma privada y solo es pública si así lo autorizas.
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          <Input
                            id={`f_${f.key}`}
                            type={f.input}
                            value={form[f.key] || ''}
                            onChange={handleChange(f.key)}
                            placeholder={f.placeholder}
                            className={f.input === 'textarea' ? 'min-h-[100px]' : ''}
                          />
                          {f.hint && <p className="text-xs text-brand-textMuted">{f.hint}</p>}
                          <div className="flex items-center gap-2">
                            <input
                              id={`pub_${f.key}`}
                              type="checkbox"
                              checked={privacyPublic(f.key)}
                              onChange={() => togglePrivacy(f.key)}
                              className="h-4 w-4 rounded border-brand-border text-brand-accent"
                              aria-label={`${f.label}: público`}
                            />
                            <Label htmlFor={`pub_${f.key}`} className="mb-0 text-sm">
                              Público
                            </Label>
                            <span className="ml-auto text-[11px] text-brand-textMuted">
                              {privacyPublic(f.key) ? 'Visible en tu página de emergencia' : 'Solo tú puedes verlo'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </section>

            {/* Médico */}
            <section aria-labelledby="medical-heading">
              <h2 id="medical-heading" className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-textMuted mb-4">
                Información médica
              </h2>
              <p className="text-xs text-brand-textMuted mb-4 max-w-md">
                Rellena solo lo que corresponda a tu situación. Ningún campo médico es obligatorio.
              </p>
              <div className="space-y-5">
                {fields
                  .filter((f) => f.category === 'Médico')
                  .map((f) => (
                    <div key={f.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`f_${f.key}`}>{f.label}</Label>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            privacyPublic(f.key)
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-black/5 text-brand-textMuted border-brand-border'
                          }`}
                        >
                          {privacyPublic(f.key) ? 'Público' : 'Privado'}
                        </span>
                      </div>
                      <Textarea
                        id={`f_${f.key}`}
                        value={form[f.key] || ''}
                        onChange={handleChange(f.key)}
                        placeholder={f.placeholder}
                        rows={3}
                      />
                      {f.hint && <p className="text-xs text-brand-textMuted">{f.hint}</p>}
                      <div className="flex items-center gap-2">
                        <input
                          id={`pub_${f.key}`}
                          type="checkbox"
                          checked={privacyPublic(f.key)}
                          onChange={() => togglePrivacy(f.key)}
                          className="h-4 w-4 rounded border-brand-border text-brand-accent"
                          aria-label={`${f.label}: público`}
                        />
                        <Label htmlFor={`pub_${f.key}`} className="mb-0 text-sm">
                          Público
                        </Label>
                        <span className="ml-auto text-[11px] text-brand-textMuted">
                          {privacyPublic(f.key) ? 'Visible en tu página de emergencia' : 'Solo tú puedes verlo'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {/* Adicional */}
            <section aria-labelledby="additional-heading">
              <h2 id="additional-heading" className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-textMuted mb-4">
                Información adicional
              </h2>
              <div className="space-y-5">
                {fields
                  .filter((f) => f.category === 'Adicional')
                  .map((f) => (
                    <div key={f.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`f_${f.key}`}>{f.label}</Label>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            privacyPublic(f.key)
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-black/5 text-brand-textMuted border-brand-border'
                          }`}
                        >
                          {privacyPublic(f.key) ? 'Público' : 'Privado'}
                        </span>
                      </div>
                      <Textarea
                        id={`f_${f.key}`}
                        value={form[f.key] || ''}
                        onChange={handleChange(f.key)}
                        placeholder={f.placeholder}
                        rows={3}
                      />
                      {f.hint && <p className="text-xs text-brand-textMuted">{f.hint}</p>}
                      <div className="flex items-center gap-2">
                        <input
                          id={`pub_${f.key}`}
                          type="checkbox"
                          checked={privacyPublic(f.key)}
                          onChange={() => togglePrivacy(f.key)}
                          className="h-4 w-4 rounded border-brand-border text-brand-accent"
                          aria-label={`${f.label}: público`}
                        />
                        <Label htmlFor={`pub_${f.key}`} className="mb-0 text-sm">
                          Público
                        </Label>
                        <span className="ml-auto text-[11px] text-brand-textMuted">
                          {privacyPublic(f.key) ? 'Visible en tu página de emergencia' : 'Solo tú puedes verlo'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {/* Consentimiento y privacidad */}
            <section className="rounded-lg border border-brand-border bg-brand-dark/50 p-5">
              <h3 className="text-sm font-semibold text-brand-text mb-3">Configuración de privacidad y consentimiento</h3>
              <p className="text-xs text-brand-textMuted leading-relaxed mb-4">
                Cada control define si ese campo se publica en tu página de emergencia. Cualquier persona con
                acceso al enlace del QR podrá consultar solo lo que marques como Público. Los campos Privados
                solo se consultan desde tu panel autenticado.
              </p>
              <div className="rounded-lg border border-brand-border bg-black/40 p-4">
                <div className="flex items-start gap-3">
                  <input
                    id="consent"
                    type="checkbox"
                    checked
                    readOnly
                    disabled
                    className="mt-0.5 h-4 w-4 rounded border-brand-border text-brand-accent"
                  />
                  <div className="text-sm text-brand-text leading-relaxed">
                    Autorizo que la información que marque como Público sea accesible a través de mi página de
                    emergencia. Puedes cambiar la visibilidad o eliminar tus datos en cualquier momento desde
                    este panel. No incluyas contraseñas, datos financieros ni información innecesaria.
                  </div>
                </div>
              </div>
            </section>

            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" disabled={saving}>
                <Save size={18} /> {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </div>

        <aside className="lg:col-span-1 card-static p-6 h-fit overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h2 className="font-semibold text-brand-text mb-2">Cuenta</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 text-brand-accent flex-shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-brand-textMuted mb-0.5">Correo</div>
                    <div className="text-brand-text break-all">{user?.email || '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-brand-border bg-brand-dark/50 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-textMuted mb-3">
                Visibilidad actual
              </h3>
              <ul className="space-y-2 text-xs">
                {fields.map((f) => (
                  <li key={f.key} className="flex justify-between items-start">
                    <span className="text-brand-textMuted truncate max-w-[90px]">{f.label}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                        privacyPublic(f.key)
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-black/5 text-brand-textMuted border-brand-border'
                      }`}
                    >
                      {privacyPublic(f.key) ? 'Público' : 'Privado'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4">
              <Lock size={14} className="mt-0.5 text-rose-400 flex-shrink-0" aria-hidden="true" />
              <p className="text-xs text-brand-textMuted mt-1 leading-relaxed">
                Ningún dato sensible es público por defecto. Tú decides qué compartir y puedes cambiarlo en
                cualquier momento.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProfilePage;
