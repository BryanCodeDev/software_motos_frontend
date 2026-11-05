import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import api from '../../api/client';
import {
  Phone, Mail, ShieldAlert, ShieldCheck, AlertCircle, Droplet, AlertTriangle,
  FileText, Bell, Stethoscope, Pill, MessageCircle, User, Users,
  Share2, Check, PhoneCall, Calendar, Ruler, Scale, Baby, Settings, Shield, IdCard, Heart,
} from 'lucide-react';
import Seo from '../../components/Seo';

const EMERGENCY_NUMBER = '123';

const cleanPhone = (phone) => String(phone).replace(/[^\d+]/g, '');

/* Clases estáticas: Tailwind no compila nombres armados dinámicamente (text-${x}). */
const TONES = {
  rose: 'bg-rose-50 text-rose-600 border-rose-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  sky: 'bg-sky-50 text-sky-600 border-sky-200',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  pink: 'bg-pink-50 text-pink-600 border-pink-200',
  gray: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

const Shell = ({ children, title = 'Perfil de emergencia' }) => (
  <main className="min-h-screen bg-brand-50 px-4 py-6 sm:py-10">
    <Seo title={title} description="Información de contacto de emergencia" noindex />
    <div className="mx-auto max-w-3xl animate-slide-up">
      <div className="mb-5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold tracking-tight text-neutral-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            <ShieldCheck size={16} strokeWidth={2.4} aria-hidden="true" />
          </span>
          Tu QR te Cuida
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-rose-600">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" /> Perfil de emergencia
        </span>
      </div>
      {children}
    </div>
    <p className="mx-auto mt-10 max-w-3xl text-center text-[11px] leading-relaxed text-text-secondary">
      Tu QR te Cuida · Desarrollado por{' '}
      <a
        href="https://mastercodecompany.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium transition-colors hover:text-brand-500"
      >
        MasterCode Company
      </a>
    </p>
  </main>
);

const Notice = ({ icon: Icon, tone = 'muted', title, text, extra }) => (
  <Shell title={title}>
    <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-glow sm:p-10">
      <div
        className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
          tone === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-neutral-100 text-text-secondary'
        }`}
      >
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="mb-3 text-2xl font-bold text-neutral-900">{title}</h1>
      {text && <p className="leading-relaxed text-text-secondary">{text}</p>}
      {extra && <p className="mt-4 text-xs leading-relaxed text-text-secondary">{extra}</p>}
      <a
        href={`tel:${EMERGENCY_NUMBER}`}
        className="btn mt-8 border border-rose-500/40 bg-rose-50 px-5 py-2.5 text-sm text-rose-700 hover:bg-rose-100"
      >
        <PhoneCall className="h-4 w-4" aria-hidden="true" /> Llamar al {EMERGENCY_NUMBER}
      </a>
    </div>
  </Shell>
);

/* Dato vital (grande) o secundario (compacto) */
const StatItem = ({ icon: Icon, label, value, tone = 'gray', wide = false }) => (
  <div
    className={`flex items-start gap-3 rounded-xl border border-border bg-white p-3.5 ${wide ? 'sm:col-span-2' : ''}`}
  >
    <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${TONES[tone]}`}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{label}</div>
      <div className="break-words text-sm font-semibold leading-snug text-neutral-900">{value}</div>
    </div>
  </div>
);

const SectionTitle = ({ icon: Icon, children, aside }) => (
  <div className="mb-4 flex items-center justify-between gap-3">
    <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
      <Icon className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
      {children}
    </h2>
    {aside}
  </div>
);

const ContactCard = ({ c, displayName }) => {
  const phone = c.phone ? cleanPhone(c.phone) : '';
  const hasPhone = Boolean(phone);
  const hasEmail = Boolean(c.email);
  const message = `Hola ${c.name}, te escribo de parte de ${displayName}. Estás registrado como contacto de emergencia en Tu QR te Cuida (${window.location.origin}). Por favor, atiende lo antes posible. Gracias.`;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 transition-all duration-300 hover:border-brand-500/50 hover:shadow-card">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/20">
          <User className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-900">{c.name}</p>
          {c.relationship && <p className="text-xs font-medium text-text-secondary">{c.relationship}</p>}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {hasPhone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-600"
          >
            <Phone className="h-4 w-4" aria-hidden="true" /> Llamar
          </a>
        )}
        {hasPhone && (
          <a
            href={`https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-emerald-50 py-3 text-sm font-semibold text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-100"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
          </a>
        )}
        {hasEmail && (
          <a
            href={`mailto:${c.email}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white py-2.5 text-xs font-medium text-neutral-900 transition-all hover:border-brand-500/50 hover:bg-brand-50 sm:col-span-2"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Enviar correo
          </a>
        )}
        {!hasPhone && !hasEmail && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-brand-50/50 py-3 text-xs font-medium text-text-secondary sm:col-span-2">
            <AlertCircle className="h-4 w-4" aria-hidden="true" /> Sin datos de contacto
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
  const [copied, setCopied] = useState(false);

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
            setError('No encontramos este perfil de emergencia. Revisa que el QR esté completo.');
          } else {
            setStatus('error');
            setError('No pudimos cargar el perfil. Intenta de nuevo.');
          }
        } else {
          setStatus('error');
          setError('No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.');
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
      <main className="flex min-h-screen items-center justify-center bg-brand-50 px-4 py-20" role="status">
        <Seo title="Perfil de emergencia" noindex />
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-brand-500 border-t-transparent" />
          <p className="text-sm text-text-secondary">Cargando información de emergencia…</p>
        </div>
      </main>
    );
  }

  if (status === 'inactive') {
    return (
      <Notice
        icon={AlertCircle}
        tone="danger"
        title="Este QR ya no está activo"
        text={error}
        extra="Esta página ya no muestra información personal: el propietario desactivó o reemplazó este identificador."
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
  const displayName = profile.display_name || 'Titular';

  const hasCritical = Boolean(
    profile.blood_type ||
      medical.allergies ||
      medical.medical_conditions ||
      medical.medications ||
      medical.medical_devices ||
      medical.is_pregnant ||
      profile.is_organ_donor
  );
  const hasOther = Boolean(
    profile.date_of_birth ||
      profile.document_number ||
      profile.insurance_company ||
      profile.insurance_policy_number ||
      profile.primary_doctor_name ||
      profile.primary_doctor_phone ||
      medical.height_cm ||
      medical.weight_kg
  );
  const hasNotes = Boolean(profile.additional_info || profile.emergency_note);
  const hasContacts = contacts.length > 0;
  const isEmpty = !hasCritical && !hasOther && !hasNotes && !hasContacts;

  const primaryPhone = contacts.find((c) => c.phone && c.display_phone)?.phone;

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: displayName, text: 'Perfil de emergencia de Tu QR te Cuida', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* El usuario canceló o el navegador lo bloqueó: no hay nada que mostrar. */
    }
  };

  return (
    <Shell>
      {/* LLAMADA A EMERGENCIAS */}
      <a
        href={`tel:${EMERGENCY_NUMBER}`}
        className="mb-5 flex items-center justify-between gap-4 rounded-2xl bg-rose-600 p-4 text-white shadow-[0_16px_40px_-16px_rgba(225,29,72,0.7)] transition-all hover:bg-rose-700 sm:p-5"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
            <PhoneCall className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <strong className="block text-base font-extrabold leading-tight">Llamar a la línea de emergencias</strong>
            <span className="text-xs text-white/85">Toca para marcar el {EMERGENCY_NUMBER}</span>
          </div>
        </div>
        <span className="text-3xl font-extrabold tabular-nums" aria-hidden="true">{EMERGENCY_NUMBER}</span>
      </a>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-glow">
        {/* IDENTIDAD */}
        <div className="bg-gradient-to-br from-brand-500 via-brand-700 to-brand-900 p-6 text-white sm:p-8">
          <div className="flex items-center gap-4">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt="Fotografía del titular"
                className="h-20 w-20 flex-shrink-0 rounded-full border-4 border-white/90 object-cover shadow-lg sm:h-24 sm:w-24"
              />
            ) : (
              <span className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/25 sm:h-24 sm:w-24">
                <User className="h-9 w-9" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">Titular</p>
              <h1 className="break-words text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                {displayName}
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm text-white/80">
            Información compartida por el titular a través de su código QR.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {primaryPhone && (
              <a
                href={`tel:${cleanPhone(primaryPhone)}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-500 transition-all hover:-translate-y-0.5 hover:bg-brand-50"
                aria-label="Llamar al contacto principal"
              >
                <PhoneCall className="h-4 w-4" aria-hidden="true" /> Llamar contacto principal
              </a>
            )}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10"
              aria-label="Compartir perfil"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
              {copied ? 'Enlace copiado' : 'Compartir'}
            </button>
          </div>
        </div>

        <div className="space-y-8 p-6 sm:p-8">
          {/* NOTA DE EMERGENCIA: lo primero que debe leerse */}
          {profile.emergency_note && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-300/70 bg-amber-50 p-4">
              <Bell className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" aria-hidden="true" />
              <div>
                <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">Nota importante</p>
                <p className="text-sm leading-relaxed text-neutral-900">{profile.emergency_note}</p>
              </div>
            </div>
          )}

          {/* DATOS VITALES */}
          {hasCritical && (
            <section>
              <SectionTitle icon={Droplet}>Datos vitales</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                {profile.blood_type && (
                  <StatItem icon={Droplet} label="Grupo sanguíneo" value={profile.blood_type} tone="rose" />
                )}
                {medical.allergies && (
                  <StatItem icon={AlertTriangle} label="Alergias" value={medical.allergies} tone="amber" />
                )}
                {medical.medical_conditions && (
                  <StatItem icon={Stethoscope} label="Condiciones médicas" value={medical.medical_conditions} tone="sky" />
                )}
                {medical.medications && (
                  <StatItem icon={Pill} label="Medicamentos" value={medical.medications} tone="emerald" />
                )}
                {medical.medical_devices && (
                  <StatItem icon={Settings} label="Dispositivos médicos" value={medical.medical_devices} tone="gray" />
                )}
                {medical.is_pregnant && <StatItem icon={Baby} label="Embarazo" value="Sí" tone="pink" />}
                {profile.is_organ_donor && (
                  <StatItem icon={Heart} label="Donante de órganos" value="Sí" tone="rose" />
                )}
              </div>
            </section>
          )}

          {/* CONTACTOS */}
          {hasContacts && (
            <section>
              <SectionTitle
                icon={Users}
                aside={
                  <span className="rounded bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-500">
                    {contacts.length} contacto{contacts.length === 1 ? '' : 's'}
                  </span>
                }
              >
                Contactos de emergencia
              </SectionTitle>
              <div className="space-y-3">
                {contacts.map((c, i) => (
                  <ContactCard key={c.id ?? i} c={c} displayName={displayName} />
                ))}
              </div>
            </section>
          )}

          {/* INFORMACIÓN ADICIONAL */}
          {profile.additional_info && (
            <section>
              <SectionTitle icon={FileText}>Información adicional</SectionTitle>
              <div className="rounded-xl border border-border bg-brand-50/50 p-4 text-sm leading-relaxed text-neutral-900">
                {profile.additional_info}
              </div>
            </section>
          )}

          {/* OTROS DATOS */}
          {hasOther && (
            <section>
              <SectionTitle icon={IdCard}>Otros datos del titular</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                {profile.date_of_birth && (
                  <StatItem icon={Calendar} label="Fecha de nacimiento" value={profile.date_of_birth} />
                )}
                {profile.document_number && (
                  <StatItem icon={IdCard} label="Documento" value={profile.document_number} />
                )}
                {profile.insurance_company && (
                  <StatItem icon={Shield} label="Seguro médico" value={profile.insurance_company} tone="blue" />
                )}
                {profile.insurance_policy_number && (
                  <StatItem icon={IdCard} label="Póliza de seguro" value={profile.insurance_policy_number} tone="blue" />
                )}
                {profile.primary_doctor_name && (
                  <StatItem icon={User} label="Médico tratante" value={profile.primary_doctor_name} tone="emerald" />
                )}
                {profile.primary_doctor_phone && (
                  <StatItem icon={Phone} label="Teléfono del médico" value={profile.primary_doctor_phone} tone="emerald" />
                )}
                {medical.height_cm && (
                  <StatItem icon={Ruler} label="Estatura" value={`${medical.height_cm} cm`} tone="blue" />
                )}
                {medical.weight_kg && (
                  <StatItem icon={Scale} label="Peso" value={`${medical.weight_kg} kg`} tone="indigo" />
                )}
              </div>
            </section>
          )}

          {isEmpty && (
            <div className="rounded-2xl border border-border/50 bg-brand-50/50 p-8 text-center text-sm text-text-secondary">
              <AlertCircle className="mx-auto mb-3 h-6 w-6 opacity-50" aria-hidden="true" />
              <p>El titular no ha compartido información pública.</p>
              <p className="mt-2 text-xs">Si es una emergencia, llama al {EMERGENCY_NUMBER}.</p>
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-center text-[11px] leading-relaxed text-text-secondary">
        Información proporcionada por el propietario. Esta página no sustituye a los servicios oficiales de
        emergencia.
      </p>
    </Shell>
  );
};

export default PublicEmergency;