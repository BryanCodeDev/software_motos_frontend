import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { routes } from '../../utils/routes';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import { PageTitle, PageLoader } from '../../components/DashPage';
import {
  User, Image, AlertTriangle, Stethoscope, Pill, FileText, Save, Power, Lock, EyeOff, Eye,
  Calendar, Ruler, Scale, Baby, Settings, Phone, Shield, IdCard, Heart, Droplet, Bell,
} from 'lucide-react';

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
  { name: 'Identificación', hint: 'Quién eres' },
  { name: 'Médico', hint: 'Lo que el personal de salud necesita saber' },
  { name: 'Seguro', hint: 'Cobertura médica y afiliación' },
  { name: 'Adicional', hint: 'Notas extra' },
];

export const PrivacyPage = () => {
  const toast = useToast();
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

  const isPublic = (key) => toggles[key] === true;

  const toggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !isPublic(key) }));
    setDirty(true);
  };

  const hideAll = () => {
    setToggles((prev) => {
      const next = { ...prev };
      fieldDefs.forEach((f) => { next[f.key] = false; });
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/privacy/me', { settings: toggles });
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
  };

  if (loading) return <PageLoader />;

  const publicCount = fieldDefs.filter((f) => isPublic(f.key)).length;
  const pct = Math.round((publicCount / fieldDefs.length) * 100);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Privacidad de tu perfil"
        description="Elige qué información verá quien escanee tu QR. Todo lo que dejes oculto solo lo ves tú."
      />

      <section className={`${panel} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6`} aria-label="Resumen de visibilidad">
        <div className="flex items-center gap-4">
          <span
            className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl ring-1 ${
              publicCount === 0 ? 'bg-brand-500/10 text-brand-500 ring-brand-500/15' : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
            }`}
          >
            {publicCount === 0 ? <EyeOff size={22} aria-hidden="true" /> : <Eye size={22} aria-hidden="true" />}
          </span>
          <div>
            <p className="text-base font-semibold text-neutral-900">
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
            <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </section>

      <div className={`${panel} p-5 sm:p-6 lg:p-8`}>
        <div className="space-y-8">
          {categories.map(({ name, hint }) => (
            <section key={name} aria-labelledby={`cat-${name}`}>
              <div className="mb-3">
                <h2 id={`cat-${name}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
                  {name}
                </h2>
                <p className="mt-0.5 text-xs text-text-secondary">{hint}</p>
              </div>
              <ul className="space-y-3">
                {fieldDefs
                  .filter((f) => f.category === name)
                  .map((f) => {
                    const pub = isPublic(f.key);
                    const Icon = f.icon;
                    return (
                      <li
                        key={f.key}
                        className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
                          pub ? 'border-brand-500/30 bg-brand-500/5' : 'border-border hover:border-brand-500/30'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
                            <Icon size={18} aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-neutral-900">{f.label}</p>
                            <p className={`text-xs ${pub ? 'font-medium text-brand-500' : 'text-text-secondary'}`}>
                              {pub ? 'Visible al escanear tu QR' : 'Oculto: solo lo ves tú'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={pub}
                          aria-label={`${f.label}: ${pub ? 'visible' : 'oculto'}`}
                          onClick={() => toggle(f.key)}
                          className={`relative h-7 w-12 flex-none rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                            pub ? 'bg-brand-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                              pub ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-2.5 rounded-xl bg-brand-50/70 p-4 text-xs leading-relaxed text-text-secondary">
          <Lock size={14} className="mt-0.5 flex-shrink-0 text-brand-500" aria-hidden="true" />
          <p>
            Los cambios se aplican a tu página de emergencia cuando pulsas guardar. Los datos ocultos nunca se
            envían a quien escanea tu QR.
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" onClick={hideAll} disabled={publicCount === 0}>
            <EyeOff size={16} /> Ocultar todo
          </Button>
          <Button onClick={save} disabled={saving || !dirty} variant="primary">
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

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
    </div>
  );
};

export default PrivacyPage;