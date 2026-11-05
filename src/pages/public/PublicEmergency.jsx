import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import api from '../../api/client';
import {
  Phone, Mail, ShieldAlert, AlertCircle, Droplet, AlertTriangle,
  FileText, Bell, Stethoscope, Pill, MessageCircle, User, CheckCircle2,
  Share2, Send, PhoneCall, Edit3, QrCode, ArrowUpRight,
} from 'lucide-react';
import Seo from '../../components/Seo';
import { Button } from '../../components/ui';
import { Badge } from '../../components/ui-kit';

const cleanPhone = (phone) => String(phone).replace(/[^\d+]/g, '');

const Shell = ({ children, title = 'Perfil de emergencia' }) => (
  <main className="min-h-screen bg-brand-50 py-8 px-4 sm:py-12">
    <Seo title={title} description="Información de contacto de emergencia" noindex />
    <div className="max-w-4xl mx-auto animate-slide-up">{children}</div>
    <p className="max-w-4xl mx-auto mt-12 text-center text-[11px] text-text-secondary leading-relaxed">
      Tu QR te Cuida by · <a href="https://mastercodecompany.com/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 transition-colors font-medium">MasterCode Company</a>
    </p>
  </main>
);

const Notice = ({ icon: Icon, tone = 'muted', title, text, extra }) => (
  <Shell title={title}>
    <div className="card-static p-8 sm:p-10 text-center rounded-2xl border border-border bg-brand-50 shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-full mx-auto mb-5 text-text-secondary">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-3">{title}</h1>
      {text && <p className="text-text-secondary leading-relaxed">{text}</p>}
      {extra && <p className="mt-4 text-xs text-text-secondary leading-relaxed">{extra}</p>}
    </div>
  </Shell>
);

const ContactCard = ({ c, displayName }) => {
  const phone = cleanPhone(c.phone);
  const hasPhone = Boolean(c.phone);
  const hasEmail = Boolean(c.email);

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-border bg-white shadow-[0_8px_24px_-12px_rgba(159,18,57,0.25)] hover:border-brand-500/50 hover:shadow-brand transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-neutral-900 truncate">{c.name}</span>
            <Badge tone={c.is_public ? 'success' : 'neutral'} size="sm">
              {c.is_public ? <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-600"></span> Público</span> : <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-400"></span> Privado</span>}
            </Badge>
          </div>
          {c.relationship && <div className="text-[11px] font-medium text-text-secondary">{c.relationship}</div>}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/20">
          <User className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {hasPhone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-brand-500 bg-brand-500 text-white font-semibold text-sm py-3 hover:bg-brand-600 hover:-translate-y-0.5 transition-all"
          >
            <Phone className="w-4 h-4" aria-hidden="true" /> Llamar
          </a>
        )}
        {hasEmail && (
          <a
            href={`mailto:${c.email}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white text-neutral-900 font-semibold text-sm py-3 hover:bg-brand-50/50 hover:border-brand-500/50 transition-all"
          >
            <Mail className="w-4 h-4" aria-hidden="true" /> Correo
          </a>
        )}
        {hasPhone && (
          <a
            href={'https://wa.me/' + phone.replace('+', '') + '?text=' + encodeURIComponent(`Hola ${c.name}, te escribo de parte de ${displayName}. Estas registrado como contacto de emergencia en Tu QR te Cuida (https://software-motos.netlify.app). Por favor, atiende lo antes posible. Gracias.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold text-sm py-3 hover:bg-emerald-100 hover:-translate-y-0.5 transition-all"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" /> WhatsApp
          </a>
        )}
        {!hasPhone && !hasEmail && (
          <div className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-brand-50/50 text-text-secondary text-xs font-medium py-3">
            <AlertCircle className="w-4 h-4" aria-hidden="true" /> Sin datos de contacto
          </div>
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
      <main className="min-h-screen flex items-center justify-center bg-brand-50 py-20 px-4" role="status">
        <Seo title="Perfil de emergencia" noindex />
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary text-sm">Cargando información de emergencia…</p>
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

  const primaryPhone = contacts.find((c) => c.phone && c.display_phone)?.phone;
  const primaryEmail = contacts.find((c) => c.email && c.display_email)?.email;

  return (
    <Shell>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-bold tracking-[0.14em] uppercase">
          <ShieldAlert className="w-4 h-4" aria-hidden="true" />
          Perfil de emergencia
        </div>
        <p className="mt-2 text-sm text-text-secondary text-center">
          Información compartida por el titular a través de su código QR
        </p>
      </div>

      <a
        href="tel:123"
        className="flex items-center justify-between gap-4 mb-8 p-5 rounded-2xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/15 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
            <PhoneCall className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="text-left">
            <strong className="block text-base font-extrabold text-neutral-900">Si requiere atención inmediata</strong>
            <span className="block mt-1 text-sm font-bold text-text-secondary">Haz clic para llamar a la línea de emergencias</span>
          </div>
        </div>
      </a>

      <div className="rounded-2xl border border-border bg-white shadow-[0_20px_50px_-20px_rgba(159,18,57,0.35)] overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-1">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 leading-tight break-words">
                {displayName}
              </h1>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white ring-1 ring-brand-500/20 ml-2 mt-2 sm:ml-0 sm:mt-0">
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              </span>
            </div>
            <div className="flex gap-2 sm:ml-4">
              {primaryPhone && (
                <a
                  href={`tel:${cleanPhone(primaryPhone)}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-brand-500 bg-brand-500 text-white font-semibold text-sm py-3 px-4 hover:bg-brand-600 hover:-translate-y-0.5 transition-all"
                  aria-label="Llamar al titular"
                >
                  <PhoneCall className="w-4 h-4" aria-hidden="true" /> Llamar
                </a>
              )}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: displayName, text: 'Perfil de emergencia de Tu QR te Cuida', url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
                className="rounded-xl p-3 text-text-secondary hover:bg-brand-50 hover:text-neutral-900 transition-all"
                aria-label="Compartir perfil"
                title="Compartir"
              >
                <Share2 className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {profile.photo_url && (
            <div className="mt-6 flex justify-center">
              <img
                src={profile.photo_url}
                alt="Fotografía del titular"
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg ring-4 ring-brand-500/20"
              />
            </div>
          )}

          {hasMedicalData && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                  <Droplet className="w-3 h-3 text-brand-500" aria-hidden="true" />
                  Información médica
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Datos de salud</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            </div>
          )}

          {hasAdditionalData && (
            <div className="mt-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-2">
                <FileText className="w-3 h-3 text-brand-500" aria-hidden="true" />
                Información adicional
              </h2>
              {profile.additional_info && (
                <div className="p-4 rounded-xl border border-border bg-brand-50/50 mb-3">
                  <div className="flex items-start gap-2 mb-1">
                    <FileText className="w-4 h-4 shrink-0 text-brand-500" aria-hidden="true" />
                    <span className="text-sm text-neutral-900 leading-relaxed">{profile.additional_info}</span>
                  </div>
                </div>
              )}
              {profile.emergency_note && (
                <div className="p-4 rounded-xl border border-border bg-brand-50/50">
                  <div className="flex items-start gap-2 mb-1">
                    <Bell className="w-4 h-4 shrink-0 text-brand-500" aria-hidden="true" />
                    <span className="text-sm text-neutral-900 leading-relaxed">{profile.emergency_note}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {hasContacts && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-brand-500" aria-hidden="true" />
                  Contactos de emergencia
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-brand-50/10 px-2 py-0.5 rounded">
                  {contacts.length} contacto{contacts.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="space-y-3">
                {contacts.map((c, i) => (
                  <ContactCard key={c.id ?? i} c={c} displayName={displayName} />
                ))}
              </div>
            </div>
          )}

          {!hasMedicalData && !hasAdditionalData && !hasContacts && (
            <div className="mt-8 p-8 rounded-2xl border border-border/50 bg-brand-50/50 text-center text-text-secondary text-sm">
              <AlertCircle className="w-6 h-6 mx-auto mb-3 opacity-50" aria-hidden="true" />
              <p>No hay información adicional registrada públicamente.</p>
              <p className="mt-2 text-xs">El titular puede completar sus datos desde su panel.</p>
            </div>
          )}
        </div>
      </div>

      <p className="mt-10 text-center text-[11px] text-text-secondary leading-relaxed">
        Información proporcionada por el propietario. Esta página no sustituye a los servicios oficiales de emergencia.
      </p>
    </Shell>
  );
};

const StatItem = ({ icon: Icon, label, value, accent = 'brand-accent' }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-50/50 border border-border/50">
    <span className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-${accent} bg-${accent}/10 border border-${accent}/20`}>
      <Icon className="w-5 h-5" aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-text-secondary font-bold">{label}</div>
      <div className="text-sm font-semibold text-neutral-900 leading-tight break-words">{value}</div>
    </div>
  </div>
);

const UsersIcon = ({ className = '' }) => (
  <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M23 21v-2a4 4 0 00-3-3.87M7 11V7a4 4 0 014-4h4a4 4 0 014 4v10" />
  </svg>
);

export default PublicEmergency;
