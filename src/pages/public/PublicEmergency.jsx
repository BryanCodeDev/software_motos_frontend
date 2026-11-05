import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import axios from 'axios';
import api from '../../api/client';
import {
  Phone, Mail, ShieldAlert, ShieldCheck, AlertCircle, Droplet, AlertTriangle,
  FileText, Bell, Stethoscope, Pill, MessageCircle, User, Users,
  Share2, Check, PhoneCall, Calendar, Ruler, Scale, Baby, Settings, Shield, IdCard, Heart, RefreshCw,
} from 'lucide-react';
import Seo from '../../components/Seo';

const EMERGENCY_NUMBER = '123';

/* ───────── Constantes de diseño (alineadas con Home y Admin) ───────── */
const EASE = [0.22, 1, 0.36, 1];
const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const cleanPhone = (phone) => String(phone).replace(/[^\d+]/g, '');

/** Fecha legible + edad. Si la fecha no se puede leer, se muestra tal cual. */
const parseDob = (value) => {
  if (!value) return { text: '', age: null };
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { text: String(value), age: null };
  const text = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return { text, age: age >= 0 && age < 130 ? age : null };
};

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

/* ───────── Estructura común ───────── */
const Shell = ({ children, title = 'Perfil de emergencia', withBar = false }) => (
  <MotionConfig reducedMotion="user">
    <main className={`min-h-screen bg-brand-50 px-4 pt-5 sm:pt-8 ${withBar ? 'pb-28 sm:pb-10' : 'pb-8 sm:pb-10'}`}>
      <Seo title={title} description="Información de contacto de emergencia" noindex />
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-bold tracking-tight text-neutral-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
              <ShieldCheck size={16} strokeWidth={2.4} aria-hidden="true" />
            </span>
            Tu QR te Cuida
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600">
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
          className="focus-ring rounded font-medium transition-colors hover:text-brand-500"
        >
          MasterCode Company
        </a>
      </p>
    </main>
  </MotionConfig>
);

const Notice = ({ icon: Icon, tone = 'muted', title, text, extra, onRetry, showHome = false }) => (
  <Shell title={title}>
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={`${panel} p-8 text-center shadow-glow sm:p-10`}
      role="alert"
    >
      <div
        className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${
          tone === 'danger' ? 'bg-rose-50 text-rose-600 ring-rose-600/15' : 'bg-brand-500/10 text-brand-500 ring-brand-500/15'
        }`}
      >
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="mb-3 text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
      {text && <p className="mx-auto max-w-md leading-relaxed text-text-secondary">{text}</p>}
      {extra && <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-text-secondary">{extra}</p>}
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn-primary px-5 py-2.5 text-sm">
            <RefreshCw size={16} aria-hidden="true" /> Reintentar
          </button>
        )}
        <a
          href={`tel:${EMERGENCY_NUMBER}`}
          className="btn border border-rose-500/40 bg-rose-50 px-5 py-2.5 text-sm text-rose-700 hover:bg-rose-100"
        >
          <PhoneCall className="h-4 w-4" aria-hidden="true" /> Llamar al {EMERGENCY_NUMBER}
        </a>
        {showHome && (
          <Link to="/" className="btn-outline px-5 py-2.5 text-sm">
            Ir al inicio
          </Link>
        )}
      </div>
    </motion.div>
  </Shell>
);

const LoadingSkeleton = () => (
  <Shell>
    <div className="animate-pulse space-y-4" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando información de emergencia…</span>
      <div className="h-44 rounded-2xl bg-border/60" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-16 rounded-2xl bg-border/60" />
        <div className="h-16 rounded-2xl bg-border/60" />
      </div>
      <div className="h-40 rounded-2xl bg-border/60" />
      <div className="h-32 rounded-2xl bg-border/60" />
    </div>
  </Shell>
);

/* ───────── Piezas ───────── */

/** Dato vital: el valor va grande, la etiqueta pequeña. */
const StatItem = ({ icon: Icon, label, value, tone = 'gray', wide = false }) => (
  <div className={`flex items-start gap-3 rounded-xl border border-border bg-white p-4 ${wide ? 'sm:col-span-2' : ''}`}>
    <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${TONES[tone]}`}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className="mt-0.5 break-words text-base font-semibold leading-snug text-neutral-900">{value}</p>
    </div>
  </div>
);

const SectionCard = ({ icon: Icon, title, aside, children, className = '' }) => (
  <motion.section variants={item} className={`${panel} p-5 sm:p-6 ${className}`} aria-label={title}>
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 text-base font-semibold text-neutral-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        {title}
      </h2>
      {aside}
    </div>
    {children}
  </motion.section>
);

const ContactCard = ({ c, displayName, isPrimary }) => {
  const phone = c.phone ? cleanPhone(c.phone) : '';
  const hasPhone = Boolean(phone);
  const hasEmail = Boolean(c.email);
  const message = `Hola ${c.name}, te escribo de parte de ${displayName}. Estás registrado como contacto de emergencia en Tu QR te Cuida (${window.location.origin}). Por favor, atiende lo antes posible. Gracias.`;

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 hover:border-brand-500/50 hover:shadow-card ${
        isPrimary ? 'border-brand-500/30 bg-brand-500/5' : 'border-border bg-white'
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/20">
          <User className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-neutral-900">{c.name}</p>
          <p className="truncate text-xs text-text-secondary">
            {[c.relationship, hasPhone ? c.phone : null].filter(Boolean).join(' · ')}
          </p>
        </div>
        {isPrimary && (
          <span className="flex-none rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-500">
            Principal
          </span>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {hasPhone && (
          <a
            href={`tel:${phone}`}
            className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-600 active:scale-[0.98]"
          >
            <Phone className="h-4 w-4" aria-hidden="true" /> Llamar
          </a>
        )}
        {hasPhone && (
          <a
            href={`https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-emerald-500 bg-emerald-50 py-3.5 text-sm font-semibold text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-100 active:scale-[0.98]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
          </a>
        )}
        {hasEmail && (
          <a
            href={`mailto:${c.email}`}
            className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-border bg-white py-2.5 text-xs font-medium text-neutral-900 transition-all hover:border-brand-500/50 hover:bg-brand-50 sm:col-span-2"
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

/* ───────── Página ───────── */
export const PublicEmergency = () => {
  const { identifier } = useParams();
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [showBar, setShowBar] = useState(false);
  const quickRef = useRef(null);

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
  }, [identifier, attempt]);

  /* En móvil, cuando las acciones rápidas salen de pantalla aparece una barra fija abajo */
  useEffect(() => {
    const el = quickRef.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [status, profile]);

  if (status === 'loading') return <LoadingSkeleton />;

  if (status === 'inactive') {
    return (
      <Notice
        icon={AlertCircle}
        tone="danger"
        title="Este QR ya no está activo"
        text={error}
        extra="Esta página ya no muestra información personal: el propietario desactivó o reemplazó este identificador."
        showHome
      />
    );
  }

  if (status === 'notfound') {
    return <Notice icon={AlertCircle} title="Perfil no encontrado" text={error} showHome />;
  }

  if (status === 'error') {
    return (
      <Notice
        icon={AlertCircle}
        tone="danger"
        title="No se pudo cargar"
        text={error}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    );
  }

  if (!profile) {
    return <Notice icon={AlertCircle} title="Sin información" text="Este perfil no tiene datos públicos." />;
  }

  const medical = profile.medical || {};
  const contacts = profile.contacts || [];
  const displayName = profile.display_name || 'Titular';
  const dob = parseDob(profile.date_of_birth);

  const hasVitals = Boolean(
    medical.allergies ||
      medical.medical_conditions ||
      medical.medications ||
      medical.medical_devices ||
      medical.is_pregnant
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
  const isEmpty =
    !hasVitals && !hasOther && !hasNotes && !hasContacts && !profile.blood_type && !profile.is_organ_donor;

  const primaryContact = contacts.find((c) => c.phone && c.display_phone);
  const primaryPhone = primaryContact?.phone;

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
    <Shell withBar>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 sm:space-y-5">
        {/* IDENTIDAD */}
        <motion.section
          variants={item}
          aria-label="Titular del perfil"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-700 to-brand-900 p-5 text-white shadow-glow sm:p-8"
        >
          <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl animate-float" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-4">
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
                <p className="mb-0.5 text-sm font-medium text-white/75">Titular</p>
                <h1 className="break-words text-2xl font-extrabold leading-tight tracking-tight [text-wrap:balance] sm:text-4xl">
                  {displayName}
                </h1>
                {dob.age !== null && <p className="mt-1 text-sm text-white/80">{dob.age} años</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={handleShare}
              aria-label={copied ? 'Enlace copiado' : 'Compartir perfil'}
              className="focus-ring flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-white/30 text-white transition-all hover:bg-white/10 active:scale-95"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>

          {(profile.blood_type || profile.is_organ_donor) && (
            <div className="relative mt-5 flex flex-wrap gap-2.5">
              {profile.blood_type && (
                <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 text-brand-500 shadow-soft">
                  <Droplet className="h-5 w-5" aria-hidden="true" />
                  <div className="leading-none">
                    <p className="text-[11px] font-medium text-text-secondary">Grupo sanguíneo</p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight">{profile.blood_type}</p>
                  </div>
                </div>
              )}
              {profile.is_organ_donor && (
                <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm">
                  <Heart className="h-4 w-4" aria-hidden="true" /> Donante de órganos
                </div>
              )}
            </div>
          )}

          <p className="relative mt-4 text-xs text-white/70">
            Información compartida por el titular a través de su código QR.
          </p>
        </motion.section>

        {/* ACCIONES RÁPIDAS */}
        <motion.div variants={item} ref={quickRef} className="grid gap-3 sm:grid-cols-2">
          <a
            href={`tel:${EMERGENCY_NUMBER}`}
            className={`focus-ring group flex items-center justify-between gap-3 rounded-2xl bg-rose-600 p-4 text-white shadow-[0_16px_40px_-16px_rgba(225,29,72,0.7)] transition-all hover:-translate-y-0.5 hover:bg-rose-700 active:scale-[0.99] ${
              primaryPhone ? '' : 'sm:col-span-2'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
                <PhoneCall className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <strong className="block text-base font-extrabold leading-tight">Llamar al {EMERGENCY_NUMBER}</strong>
                <span className="text-xs text-white/85">Línea de emergencias</span>
              </span>
            </span>
            <span className="text-3xl font-extrabold tabular-nums" aria-hidden="true">{EMERGENCY_NUMBER}</span>
          </a>

          {primaryPhone && (
            <a
              href={`tel:${cleanPhone(primaryPhone)}`}
              aria-label={`Llamar al contacto principal${primaryContact?.name ? `: ${primaryContact.name}` : ''}`}
              className="focus-ring group flex items-center gap-3 rounded-2xl bg-brand-500 p-4 text-white shadow-[0_16px_40px_-16px_rgba(159,18,57,0.7)] transition-all hover:-translate-y-0.5 hover:bg-brand-600 active:scale-[0.99]"
            >
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
                <Phone className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <strong className="block text-base font-extrabold leading-tight">Llamar contacto principal</strong>
                <span className="block truncate text-xs text-white/85">
                  {[primaryContact?.name, primaryContact?.relationship].filter(Boolean).join(' · ') || primaryPhone}
                </span>
              </span>
            </a>
          )}
        </motion.div>

        {/* NOTA DE EMERGENCIA: lo primero que debe leerse */}
        {profile.emergency_note && (
          <motion.div
            variants={item}
            role="note"
            className="flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 sm:p-5"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="mb-0.5 text-sm font-bold text-amber-800">Nota importante</p>
              <p className="text-base leading-relaxed text-neutral-900">{profile.emergency_note}</p>
            </div>
          </motion.div>
        )}

        {/* DATOS VITALES */}
        {hasVitals && (
          <SectionCard icon={Stethoscope} title="Datos médicos clave">
            <div className="grid gap-3 sm:grid-cols-2">
              {medical.allergies && (
                <StatItem icon={AlertTriangle} label="Alergias" value={medical.allergies} tone="amber" wide />
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
            </div>
          </SectionCard>
        )}

        {/* CONTACTOS */}
        {hasContacts && (
          <SectionCard
            icon={Users}
            title="Contactos de emergencia"
            aside={
              <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-500">
                {contacts.length} contacto{contacts.length === 1 ? '' : 's'}
              </span>
            }
          >
            <div className="space-y-3">
              {contacts.map((c, i) => (
                <ContactCard key={c.id ?? i} c={c} displayName={displayName} isPrimary={c === primaryContact} />
              ))}
            </div>
          </SectionCard>
        )}

        {/* INFORMACIÓN ADICIONAL */}
        {profile.additional_info && (
          <SectionCard icon={FileText} title="Información adicional">
            <p className="rounded-xl border border-border bg-brand-50/50 p-4 text-sm leading-relaxed text-neutral-900">
              {profile.additional_info}
            </p>
          </SectionCard>
        )}

        {/* OTROS DATOS */}
        {hasOther && (
          <SectionCard icon={IdCard} title="Otros datos del titular">
            <div className="grid gap-3 sm:grid-cols-2">
              {profile.date_of_birth && (
                <StatItem icon={Calendar} label="Fecha de nacimiento" value={dob.text} />
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
          </SectionCard>
        )}

        {isEmpty && (
          <motion.div variants={item} className={`${panel} p-8 text-center text-sm text-text-secondary`}>
            <AlertCircle className="mx-auto mb-3 h-6 w-6 opacity-50" aria-hidden="true" />
            <p>El titular no ha compartido información pública.</p>
            <p className="mt-2 text-xs">Si es una emergencia, llama al {EMERGENCY_NUMBER}.</p>
          </motion.div>
        )}

        <motion.p variants={item} className="pt-2 text-center text-[11px] leading-relaxed text-text-secondary">
          Información proporcionada por el propietario. Esta página no sustituye a los servicios oficiales de
          emergencia.
        </motion.p>
      </motion.div>

      {/* Barra fija en móvil: aparece cuando las acciones rápidas ya no se ven */}
      <AnimatePresence>
        {showBar && (
          <motion.div
            role="region"
            aria-label="Acciones de emergencia"
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-4 pt-3 backdrop-blur sm:hidden"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto flex max-w-3xl gap-2">
              <a
                href={`tel:${EMERGENCY_NUMBER}`}
                className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white active:scale-[0.98]"
              >
                <PhoneCall className="h-4 w-4" aria-hidden="true" /> Llamar al {EMERGENCY_NUMBER}
              </a>
              {primaryPhone && (
                <a
                  href={`tel:${cleanPhone(primaryPhone)}`}
                  className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white active:scale-[0.98]"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" /> Contacto
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Shell>
  );
};

export default PublicEmergency;