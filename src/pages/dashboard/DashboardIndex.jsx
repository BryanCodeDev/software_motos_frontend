import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  User, Users, ShieldCheck, QrCode, Package, ArrowRight, CheckCircle2, ChevronRight,
} from 'lucide-react';
import { routes } from '../../utils/routes';
import { useAuth } from '../../contexts/useAuth';
import { PageTitle } from '../../components/DashPage';
import api from '../../api/client';
import { useToast } from '../../components/useToast';

const panel = 'rounded-2xl border border-brand-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const shortcuts = [
  { to: routes.dashboardProfile, icon: User, title: 'Perfil', text: 'Datos personales, médicos y fotografía' },
  { to: routes.dashboardContacts, icon: Users, title: 'Contactos', text: 'Personas de confianza para emergencias' },
  { to: routes.dashboardPrivacy, icon: ShieldCheck, title: 'Privacidad', text: 'Visibilidad de cada campo' },
  { to: routes.dashboardQr, icon: QrCode, title: 'Mi QR', text: 'Activar y descargar tu código QR' },
  { to: routes.dashboardOrders, icon: Package, title: 'Pedidos', text: 'Estado de tus activaciones' },
];

export const DashboardIndex = () => {
  const { user } = useAuth();
  const toast = useToast();
  const reduce = useReducedMotion();
  const name = user?.name || user?.email?.split('@')[0];

  const [profileComplete, setProfileComplete] = useState(null);
  const [contactsCount, setContactsCount] = useState(null);
  const [qrActive, setQrActive] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/profiles/me');
        if (!mounted) return;
        const p = res.data.profile || res.data;
        setProfileComplete(!!(p.display_name && p.display_name.trim()));
      } catch {
        setProfileComplete(false);
      }
    })();
    return () => { mounted = false; };
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/contacts');
        if (!mounted) return;
        setContactsCount((res.data.contacts || res.data || []).length);
      } catch {
        setContactsCount(0);
      }
    })();
    return () => { mounted = false; };
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/identifiers/my');
        if (!mounted) return;
        setQrActive((res.data.identifier || res.data).status === 'active');
      } catch (error) {
        if (!(error.response && error.response.status === 404)) {
          toast.error('No se pudo cargar el estado del QR');
        }
        setQrActive(false);
      }
    })();
    return () => { mounted = false; };
  }, [toast]);

  const steps = [
    { to: routes.dashboardProfile, icon: User, title: 'Perfil', text: 'Completa tus datos personales y médicos.', done: profileComplete === true },
    { to: routes.dashboardContacts, icon: Users, title: 'Contactos', text: 'Agrega tus contactos de emergencia.', done: (contactsCount || 0) > 0 },
    { to: routes.dashboardPrivacy, icon: ShieldCheck, title: 'Privacidad', text: 'Define qué compartir públicamente.', done: profileComplete === true },
    { to: routes.dashboardQr, icon: QrCode, title: 'Mi QR', text: 'Activa tu QR con el pago único de $30.000 COP.', done: qrActive === true },
  ];

  const ready = profileComplete !== null && contactsCount !== null && qrActive !== null;
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const next = steps.find((s) => !s.done);

  return (
    <div className="space-y-6">
      <PageTitle
        title={name ? `Hola, ${name}` : 'Mi panel'}
        description="Administra tu perfil de emergencia, contactos, privacidad y código QR desde un solo lugar."
      />

      {/* Progreso */}
      <section
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-accent via-[#7d0f2e] to-[#3f0617] p-6 text-white shadow-[0_24px_60px_-24px_rgba(159,18,57,0.55)] sm:p-8"
        aria-labelledby="progress-title"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Estado de activación</p>
            <h2 id="progress-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {!ready ? 'Cargando tu progreso…' : doneCount === steps.length ? 'Tu perfil está listo' : 'Termina de configurar tu perfil'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              {!ready
                ? 'Estamos revisando el estado de tu cuenta.'
                : next
                  ? `Siguiente paso: ${next.title.toLowerCase()}. ${next.text}`
                  : 'Todo completado. Tu página pública de emergencia está habilitada.'}
            </p>
            {ready && next && (
              <Link
                to={next.to}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-accent transition-transform hover:-translate-y-0.5"
              >
                Continuar con {next.title} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
          <div className="w-full md:w-64">
            <div className="flex items-end justify-between">
              <span className="text-4xl font-extrabold tracking-tight">{ready ? `${pct}%` : '—'}</span>
              <span className="pb-1 text-xs text-white/70">{ready ? `${doneCount} de ${steps.length} pasos` : ''}</span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={ready ? pct : 0} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${ready ? pct : 0}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Pasos */}
      <section className={`${panel} p-5 sm:p-6`} aria-labelledby="steps-title">
        <h2 id="steps-title" className="mb-4 text-base font-semibold text-brand-text">Pasos para activar tu QR</h2>
        <ol className="space-y-2">
          {steps.map((step, i) => (
            <li key={step.title}>
              <Link
                to={step.to}
                className="group flex items-center gap-4 rounded-xl border border-brand-border p-3.5 transition-colors hover:border-brand-accent/30 hover:bg-brand-dark/60 sm:p-4"
              >
                <span
                  className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold ${
                    step.done ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : 'bg-brand-dark text-brand-textMuted ring-1 ring-brand-border'
                  }`}
                >
                  {step.done ? <CheckCircle2 size={18} aria-hidden="true" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-text">{step.title}</p>
                  <p className="truncate text-xs text-brand-textMuted">{step.text}</p>
                </div>
                <span
                  className={`hidden rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset sm:inline-flex ${
                    step.done ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                  }`}
                >
                  {!ready ? '…' : step.done ? 'Completado' : 'Pendiente'}
                </span>
                <ChevronRight size={16} className="flex-none text-brand-textMuted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-accent" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>

        {qrActive === false && (
          <div className="mt-5 flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-brand-textMuted">
              Tu página pública de emergencia solo se habilita tras activar el QR con el pago único de{' '}
              <span className="font-bold text-brand-text">$30.000 COP</span>. Sin suscripción.
            </p>
            <Link to={routes.dashboardQr} className="btn-primary flex-none !px-5 !py-2.5 text-sm">
              Ir a Mi QR <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      {/* Accesos */}
      <section aria-labelledby="shortcuts-title">
        <h2 id="shortcuts-title" className="mb-3 text-base font-semibold text-brand-text">Accesos rápidos</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map(({ to, icon: Icon, title, text }, i) => (
            <motion.div
              key={to}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to={to}
                className={`${panel} group flex h-full items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-accent/40`}
              >
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/15 transition-colors group-hover:bg-brand-accent group-hover:text-white">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-brand-text">{title}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-brand-textMuted">{text}</p>
                </div>
                <ArrowRight size={16} className="flex-none text-brand-textMuted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardIndex;