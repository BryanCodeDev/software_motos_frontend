import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import { PageTitle, PageLoader } from '../../components/DashPage';
import {
  User, Image, AlertTriangle, Stethoscope, Pill, FileText, Save, Power, Lock, EyeOff, Eye,
} from 'lucide-react';
import { Badge, StepIndicator } from '../../components/ui-kit';

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const fieldDefs = [
  { key: 'display_name', label: 'Nombre o identificación', icon: User, category: 'Identificación' },
  { key: 'photo_url', label: 'Fotografía', icon: Image, category: 'Identificación' },
  { key: 'allergies', label: 'Alergias', icon: AlertTriangle, category: 'Médico' },
  { key: 'medical_conditions', label: 'Condiciones médicas', icon: Stethoscope, category: 'Médico' },
  { key: 'medications', label: 'Medicamentos', icon: Pill, category: 'Médico' },
  { key: 'additional_info', label: 'Información adicional', icon: FileText, category: 'Otros' },
];

const categories = ['Identificación', 'Médico', 'Otros'];

export const PrivacyPage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggles, setToggles] = useState({});

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
    } catch (error) {
      if (!(error.response && error.response.status === 404)) {
        toast.error('No se pudo cargar la configuración de privacidad');
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
  };

  const hideAll = () => {
    setToggles((prev) => {
      const next = { ...prev };
      fieldDefs.forEach((f) => { next[f.key] = false; });
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/privacy/me', { settings: toggles });
      toast.success('Configuración de privacidad guardada');
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err?.message || 'No se pudo guardar la privacidad');
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
        description="Elige qué información se muestra en tu página pública de emergencia."
      />

      {/* Resumen */}
      <section className={`${panel} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6`} aria-label="Resumen de visibilidad">
        <div className="flex items-center gap-4">
          <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl ring-1 ${
            publicCount === 0 ? 'bg-brand-500/10 text-brand-500 ring-brand-500/15' : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
          }`}>
            {publicCount === 0 ? <EyeOff size={22} aria-hidden="true" /> : <Eye size={22} aria-hidden="true" />}
          </span>
          <div>
            <p className="text-base font-semibold text-neutral-900">
              {publicCount} de {fieldDefs.length} campos son públicos
            </p>
            <p className="text-xs text-text-secondary">
              {publicCount === 0 ? 'Tu página pública no muestra datos personales.' : 'Solo se publica lo que activaste.'}
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
          {categories.map((cat) => (
            <section key={cat} aria-labelledby={`cat-${cat}`}>
              <h2
                id={`cat-${cat}`}
                className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary"
              >
                {cat}
              </h2>
              <ul className="space-y-3">
                {fieldDefs
                  .filter((f) => f.category === cat)
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
                              {pub ? 'Público' : 'Oculto'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={pub}
                          aria-label={`${f.label}: ${pub ? 'público' : 'oculto'}`}
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
            Los cambios se aplican a tu página pública al guardar. Los datos marcados como privados nunca se
            envían en la respuesta del perfil público.
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" onClick={hideAll} disabled={publicCount === 0}>
            <EyeOff size={16} /> Ocultar todo
          </Button>
          <Button onClick={save} disabled={saving} variant="primary">
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </div>
      </div>

      <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 sm:p-6 lg:p-8" aria-labelledby="deactivate-title">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 id="deactivate-title" className="mb-1.5 text-base font-semibold text-neutral-900">Desactivar perfil</h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              Puedes desactivar tu perfil de emergencia. Su página pública dejará de estar disponible y tu código
              QR mostrará un aviso de inactivo.
            </p>
          </div>
          <Button
            variant="outline"
            className="flex-none"
            onClick={() =>
              toast.info('Desactivación de perfil: control administrativo pendiente de implementación')
            }
          >
            <Power size={16} /> Desactivar perfil
          </Button>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;

