import { useState, useEffect } from 'react';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button } from '../../components/ui';
import { PageTitle, PageLoader } from '../../components/DashPage';
import { User, Image, AlertTriangle, Stethoscope, Pill, FileText, Save, Power, Lock } from 'lucide-react';

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/privacy/me');
        if (!mounted) return;
        const data = res.data.settings || res.data || [];
        const map = {};
        if (Array.isArray(data)) {
          data.forEach((s) => {
            if (s.field_name) map[s.field_name] = s.is_public;
          });
        }
        setToggles(map);
      } catch (error) {
        if (!mounted) return;
        if (!(error.response && error.response.status === 404)) {
          toast.error('No se pudo cargar la configuración de privacidad');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [toast]);

  // Un campo sin configuración explícita se trata como Privado (por defecto nada es público).
  const isPublic = (key) => toggles[key] === true;

  const toggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !isPublic(key) }));
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

  return (
    <div>
      <PageTitle
        title="Privacidad de tu perfil"
        description="Elige qué información se muestra en tu página pública de emergencia."
      />

      <div className="card-static p-6 lg:p-8 mb-8">
        <div className="space-y-8">
          {categories.map((cat) => (
            <section key={cat} aria-labelledby={`cat-${cat}`}>
              <h2
                id={`cat-${cat}`}
                className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-textMuted mb-3"
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
                        className="flex items-center justify-between gap-4 p-4 rounded-lg border border-brand-border hover:border-brand-accent/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
                            <Icon className="w-4 h-4" aria-hidden="true" />
                          </span>
                          <p className="text-sm font-medium text-brand-text truncate">{f.label}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span
                            className={`text-xs font-medium w-14 text-right ${
                              pub ? 'text-brand-accent' : 'text-brand-textMuted'
                            }`}
                          >
                            {pub ? 'Público' : 'Oculto'}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={pub}
                            aria-label={`${f.label}: ${pub ? 'público' : 'oculto'}`}
                            onClick={() => toggle(f.key)}
                            className={`relative w-11 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark ${
                              pub ? 'bg-brand-accent' : 'bg-brand-border'
                            }`}
                          >
                            <span
                              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                pub ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-2 text-xs text-brand-textMuted leading-relaxed">
          <Lock size={14} className="mt-0.5 flex-shrink-0 text-brand-accent" aria-hidden="true" />
          <p>
            Los cambios se aplican a tu página pública al guardar. Los datos marcados como privados nunca se
            envían en la respuesta del perfil público.
          </p>
        </div>

        <div className="mt-6">
          <Button onClick={save} disabled={saving} variant="primary">
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </div>
      </div>

      <div className="card-static p-6 lg:p-8 border-rose-500/20">
        <h2 className="font-semibold text-brand-text mb-2">Desactivar perfil</h2>
        <p className="text-brand-textMuted text-sm leading-relaxed mb-5 max-w-2xl">
          Puedes desactivar tu perfil de emergencia. Su página pública dejará de estar disponible y tu código
          QR mostrará un aviso de inactivo.
        </p>
        <Button
          variant="outline"
          onClick={() =>
            toast.info('Desactivación de perfil: control administrativo pendiente de implementación')
          }
        >
          <Power size={16} /> Desactivar perfil
        </Button>
      </div>
    </div>
  );
};

export default PrivacyPage;
