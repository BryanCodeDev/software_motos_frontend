import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import api from '../../api/client';
import {
  Phone, Mail, ShieldAlert, AlertCircle, Droplet, AlertTriangle,
  FileText, Bell, Stethoscope, Pill, MessageCircle, User, CheckCircle2,
} from 'lucide-react';
import Seo from '../../components/Seo';

const cleanPhone = (phone) => String(phone).replace(/[^\d+]/g, '');

const Shell = ({ children, title = 'Perfil de emergencia' }) => (
  <main className="min-h-screen bg-brand-dark py-8 px-4 sm:py-12">
    <Seo title={title} description="Información de contacto de emergencia" noindex />
    <div className="max-w-2xl mx-auto animate-slide-up">{children}</div>
    <p className="max-w-2xl mx-auto mt-10 text-center text-[11px] text-brand-textMuted">
      Tu QR te Cuida · <a href="https://mastercodecompany.com/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors">MasterCode Company</a>
    </p>
  </main>
);

const Notice = ({ icon: Icon, tone = 'muted', title, text, extra }) => (
  <Shell title={title}>
    <div className="card-static p-8 sm:p-10 text-center rounded-2xl border border-brand-border bg-brand-dark shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-full mx-auto mb-5 text-brand-textMuted">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold text-brand-text mb-3">{title}</h1>
      {text && <p className="text-brand-textMuted leading-relaxed">{text}</p>}
      {extra && <p className="mt-4 text-xs text-brand-textMuted leading-relaxed">{extra}</p>}
    </div>
  </Shell>
);

const StatItem = ({ icon: Icon, label, value, accent = 'brand-accent' }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-dark/50 border border-brand-border/50">
    <span className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-${accent} bg-${accent}/10 border border-${accent}/20`}>
      <Icon className="w-5 h-5" aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-brand-textMuted font-bold">{label}</div>
      <div className="text-sm font-semibold text-brand-text leading-tight break-words">{value}</div>
    </div>
  </div>
);

const ContactCard = ({ c }) => {
  const phone = cleanPhone(c.phone);
  const hasPhone = Boolean(c.phone);
  const hasEmail = Boolean(c.email);

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-brand-border bg-brand-dark shadow-[0_8px_24px_-12px_rgba(159,18,57,0.25)]">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-sm font-semibold text-brand-text truncate">{c.name}</div>
            <span className="px-1.5 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent text-[10px] font-bold">
              Público
            </span>
          </div>
          {c.relationship && <div className="text-[11px] text-brand-textMuted">{c.relationship}</div>}
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/20">
          <User className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {hasPhone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-brand-accent bg-brand-accent text-white font-semibold text-sm py-2.5 hover:bg-brand-accentHover transition-colors"
          >
            <Phone className="w-4 h-4" aria-hidden="true" /> Llamar
          </a>
        )}
        {hasEmail && (
          <a
            href={`mailto:${c.email}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-brand-border text-brand-text font-semibold text-sm py-2.5 hover:bg-brand-dark/50 transition-colors"
          >
            <Mail className="w-4 h-4" aria-hidden="true" /> Correo
          </a>
        )}
        {hasPhone && (
          <a
            href={'https://wa.me/' + phone.replace('+', '') + '?text=' + encodeURIComponent('Hola, soy un contacto de emergencia de Tu QR te Cuida.')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold text-sm py-2.5 hover:bg-emerald-100 transition-colors"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" /> WhatsApp
          </a>
        )}
      </div>
    </div>
  );
};

export const PublicEmergency = () => {
  const { identifier } = useParams();
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading');
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
          <p className="text-brand-textMuted text-sm">Cargando información de emergencia…</p>
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
  const hasMedicalData = Boolean(
    profile.blood_type || medical.allergies || medical.medical_conditions || medical.medications
  );
  const hasAdditionalData = Boolean(profile.additional_info || profile.emergency_note);
  const hasContacts = contacts.length > 0;
  const displayName = profile.display_name || 'Titular';

  return (
    <Shell>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold tracking-[0.14em]">
          <ShieldAlert className="w-4 h-4" aria-hidden="true" />
          PERFIL DE EMERGENCIA
        </div>
        <p className="mt-2 text-sm text-brand-textMuted text-center">
          Información compartida por el titular a través de su código QR
        </p>
      </div>

      <a
        href="tel:123"
        className="flex items-center justify-between gap-4 mb-6 p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/15 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500 text-white shadow-lg">
            <Bell className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="text-left">
            <strong className="block text-sm text-brand-text">Si requiere atención inmediata</strong>
            <span className="text-[11px] text-brand-textMuted">Llama primero a la línea de emergencias</span>
          </div>
        </div>
        <span className="flex-shrink-0 h-10 w-10 items-center justify-center rounded-lg bg-rose-500 text-white font-bold text-lg">123</span>
      </a>

      <div className="rounded-2xl border border-brand-border bg-white shadow-[0_20px_50px_-20px_rgba(159,18,57,0.35)] overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-text leading-tight break-words">
              {displayName}
            </h1>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent text-white ring-1 ring-brand-accent/20">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            </span>
          </div>

          {profile.photo_url && (
            <div className="mt-6 flex justify-center">
              <img
                src={profile.photo_url}
                alt="Fotografía del titular"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {profile.blood_type && (
              <StatItem icon={Droplet} label="Grupo sanguíneo" value={profile.blood_type} accent="rose-500" />
            )}
            {medical.allergies && (
              <StatItem icon={AlertTriangle} label="Alergias" value={medical.allergies} accent="amber-500" />
            )}
            {medical.medical_conditions && (
              <StatItem icon={Stethoscope} label="Condiciones médicas" value={medical.medical_conditions} accent="sky-500" />
            )}
            {medical.medications && (
              <StatItem icon={Pill} label="Medicamentos" value={medical.medications} accent="emerald-500" />
            )}
          </div>

          {hasAdditionalData && (
            <div className="mt-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-textMuted mb-3">
                Información adicional
              </h2>
              {profile.additional_info && (
                <div className="p-4 rounded-xl border border-brand-border bg-brand-dark/50">
                  <FileText className="w-4 h-4 mr-2 text-brand-accent" aria-hidden="true" />
                  <span className="text-sm text-brand-text leading-relaxed">{profile.additional_info}</span>
                </div>
              )}
              {profile.emergency_note && (
                <div className="mt-3 p-4 rounded-xl border border-brand-border bg-brand-dark/50">
                  <FileText className="w-4 h-4 mr-2 text-brand-accent" aria-hidden="true" />
                  <span className="text-sm text-brand-text leading-relaxed">{profile.emergency_note}</span>
                </div>
              )}
            </div>
          )}

          {hasContacts && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-brand-text">Contactos de emergencia</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-textMuted">
                  {contacts.length} contacto{contacts.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="space-y-3">
                {contacts.map((c, i) => (
                  <ContactCard key={c.id ?? i} c={c} />
                ))}
              </div>
            </div>
          )}

          {!hasMedicalData && !hasAdditionalData && !hasContacts && (
            <div className="mt-8 p-8 rounded-2xl border border-brand-border/50 bg-brand-dark/50 text-center text-brand-textMuted text-sm">
              <AlertCircle className="w-5 h-5 mx-auto mb-2 opacity-50" aria-hidden="true" />
              <p>No hay información adicional registrada públicamente.</p>
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-center text-[11px] text-brand-textMuted leading-relaxed">
        Información proporcionada por el propietario. Esta página no sustituye a los servicios oficiales de emergencia.
      </p>
    </Shell>
  );
};

export default PublicEmergency;
