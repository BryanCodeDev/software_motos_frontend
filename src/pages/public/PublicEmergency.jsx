import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import api from '../../api/client';
import { Phone, Mail, ShieldAlert, AlertCircle, Droplet, AlertTriangle, FileText, Siren, Image, ImageOff, Stethoscope, Pill } from 'lucide-react';
import Seo from '../../components/Seo';

const cleanPhone = (phone) => String(phone).replace(/[^\d+]/g, '');

/** Contenedor común. Las páginas públicas nunca deben indexarse: contienen datos personales. */
const Shell = ({ children, title = 'Perfil de emergencia' }) => (
  <main className="min-h-screen bg-brand-dark py-8 px-4 sm:py-12">
    <Seo title={title} description="Información de contacto de emergencia" noindex />
    <div className="max-w-xl mx-auto animate-slide-up">{children}</div>
    <p className="max-w-xl mx-auto mt-8 text-center text-[11px] text-brand-textMuted">
      Tu QR te Cuida · <a href="https://mastercodecompany.com/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors">MasterCode Company</a>
    </p>
  </main>
);

const Notice = ({ icon: Icon, tone = 'muted', title, text, extra }) => (
  <Shell title={title}>
    <div className="card-static p-8 sm:p-10 text-center">
      <Icon
        className={`w-12 h-12 mx-auto mb-4 ${tone === 'danger' ? 'text-rose-400' : 'text-brand-textMuted'}`}
        aria-hidden="true"
      />
      <h1 className="text-2xl font-bold text-brand-text mb-3">{title}</h1>
      {text && <p className="text-brand-textMuted leading-relaxed">{text}</p>}
      {extra && <p className="mt-4 text-xs text-brand-textMuted leading-relaxed">{extra}</p>}
    </div>
  </Shell>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl bg-brand-dark/70 border border-brand-border">
    <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-300">
      <Icon className="w-5 h-5" aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wider text-brand-textMuted mb-0.5">{label}</div>
      <div className="text-brand-text font-medium leading-snug break-words">{value}</div>
    </div>
  </div>
);

export const PublicEmergency = () => {
  const { identifier } = useParams();
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, active, inactive, notfound, error
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;
    (async () => {
      try {
        if (isMounted) {
          setStatus('loading');
          setError(null);
          setProfile(null);
        }
        const res = await api.get(`/profiles/public/${encodeURIComponent(identifier)}`, {
          signal: controller.signal,
        });
        if (!isMounted) return;
        setProfile(res.data.profile || res.data);
        setStatus(res.data.status || 'active');
      } catch (err) {
        if (!isMounted) return;
        if (axios.isCancel(err) || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
          return;
        }
        if (err.response) {
          if (err.response.status === 410) {
            setStatus('inactive');
            setError('Este identificador ya no está activo.');
          } else if (err.response.status === 404) {
            setStatus('notfound');
            setError('Perfil de emergencia no encontrado.');
          } else {
            setStatus('error');
            setError('No se pudo cargar el perfil. Intenta nuevamente.');
          }
        } else {
          setStatus('error');
          setError('No se pudo conectar con el servidor.');
        }
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [identifier]);

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-brand-dark py-20 px-4" role="status">
        <Seo title="Perfil de emergencia" noindex />
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-brand-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-textMuted text-sm">Cargando información de emergencia...</p>
        </div>
      </main>
    );
  }

  if (status === 'inactive') {
    return (
      <Notice
        icon={AlertCircle}
        tone="danger"
        title="Identificador inactivo"
        text={error}
        extra="Esta página ya no muestra información personal. El propietario desactivó o reemplazó este identificador."
      />
    );
  }

  if (status === 'notfound') {
    return <Notice icon={AlertCircle} title="Perfil no encontrado" text={error} />;
  }

  if (status === 'error') {
    return <Notice icon={AlertCircle} tone="danger" title="No se pudo cargar" text={error} />;
  }

  if (!profile) {
    return <Notice icon={AlertCircle} title="Sin información" text="Este perfil no tiene datos públicos." />;
  }

  const medical = profile.medical || {};
  const contacts = profile.contacts || [];

  return (
    <Shell>
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold tracking-[0.14em]">
          <ShieldAlert className="w-4 h-4" aria-hidden="true" />
          PERFIL DE EMERGENCIA
        </div>
      </div>

      {/* Línea de emergencias de Colombia */}
      <a
        href="tel:123"
        className="flex items-center justify-between gap-4 mb-5 p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/15 transition-colors"
      >
        <span className="flex items-center gap-3">
          <Siren className="w-6 h-6 text-rose-300 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm leading-snug text-brand-text">
            <strong className="block">Si requiere atención inmediata</strong>
            <span className="text-brand-textMuted">Llama primero a la línea de emergencias</span>
          </span>
        </span>
        <span className="flex-shrink-0 rounded-lg bg-rose-500 text-white font-bold px-4 py-2 text-lg">123</span>
      </a>

        <div className="card-static p-6 sm:p-8 space-y-6">
          {profile.photo_url && (
            <img
              src={profile.photo_url}
              alt="Fotografía del titular"
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border border-brand-border"
            />
          )}
          <h1 className="text-3xl font-bold text-brand-text leading-tight break-words text-center">
            {profile.display_name || 'Titular'}
          </h1>

          {(profile.blood_type || medical.allergies || medical.medical_conditions || medical.medications) && (
            <div className="space-y-3">
              {profile.blood_type && <InfoRow icon={Droplet} label="Grupo sanguíneo" value={profile.blood_type} />}
              {medical.allergies && <InfoRow icon={AlertTriangle} label="Alergias" value={medical.allergies} />}
              {medical.medical_conditions && (
                <InfoRow icon={Stethoscope} label="Condiciones médicas" value={medical.medical_conditions} />
              )}
              {medical.medications && <InfoRow icon={Pill} label="Medicamentos" value={medical.medications} />}
            </div>
          )}

          {(profile.additional_info || profile.emergency_note) && (
            <div className="space-y-3">
              {profile.additional_info && (
                <InfoRow icon={FileText} label="Información adicional" value={profile.additional_info} />
              )}
              {profile.emergency_note && (
                <InfoRow icon={FileText} label="Nota de emergencia" value={profile.emergency_note} />
              )}
            </div>
          )}

          {contacts.length > 0 && (
            <section aria-labelledby="contacts-title">
              <h2 id="contacts-title" className="text-lg font-semibold text-brand-text mb-3">
                Contactos de emergencia
              </h2>
              <ul className="space-y-3">
                {contacts.map((c, i) => (
                  <li key={c.id ?? i} className="p-4 rounded-xl bg-brand-dark/70 border border-brand-border">
                    <div className="mb-3">
                      <div className="text-brand-text font-semibold">{c.name}</div>
                      {c.relationship && <div className="text-xs text-brand-textMuted mt-0.5">{c.relationship}</div>}
                    </div>
                    {(c.phone || c.email) && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        {c.phone && (
                          <a
                            href={`tel:${cleanPhone(c.phone)}`}
                            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-lg bg-brand-accent text-brand-dark font-semibold hover:bg-brand-accentHover transition-colors"
                          >
                            <Phone className="w-5 h-5" aria-hidden="true" /> Llamar
                          </a>
                        )}
                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-lg border border-brand-border text-brand-text font-semibold hover:bg-brand-panel transition-colors"
                          >
                            <Mail className="w-5 h-5" aria-hidden="true" /> Correo
                          </a>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

      <p className="mt-5 text-center text-[11px] text-brand-textMuted leading-relaxed">
        Información proporcionada por el propietario. Esta página no sustituye a los servicios oficiales de emergencia.
      </p>
    </Shell>
  );
};

export default PublicEmergency;
