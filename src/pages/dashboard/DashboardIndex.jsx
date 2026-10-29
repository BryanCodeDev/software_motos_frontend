import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { User, Users, ShieldCheck, QrCode, Package, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { routes } from '../../utils/routes';
import { useAuth } from '../../contexts/useAuth';
import { PageTitle } from '../../components/DashPage';
import api from '../../api/client';
import { useToast } from '../../components/useToast';

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

  return (
    <div>
      <PageTitle
        title={name ? `Hola, ${name}` : 'Mi panel'}
        description="Administra tu perfil de emergencia, contactos, privacidad y código QR desde un solo lugar."
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {shortcuts.map(({ to, icon: Icon, title, text }, i) => (
          <motion.div
            key={to}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link to={to} className="card group flex flex-col h-full p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent group-hover:bg-brand-accent group-hover:text-brand-dark transition-colors">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <ArrowRight
                  size={16}
                  className="text-brand-textMuted opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                  aria-hidden="true"
                />
              </div>
              <h2 className="font-semibold text-brand-text">{title}</h2>
              <p className="text-xs text-brand-textMuted mt-1.5 leading-relaxed">{text}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="card-static p-6 lg:p-8">
        <h2 className="font-semibold text-brand-text mb-5">Estado de activación</h2>
        <ol className="space-y-4">
          {steps.map((step, i) => {
            const IconDone = step.done ? CheckCircle2 : Clock;
            return (
              <li key={step.title} className="flex items-center gap-4 text-sm text-brand-textMuted">
                <span className="flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold">
                  {step.done ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className={`flex-1 ${step.done ? 'text-brand-text font-medium' : ''}`}>
                  {step.title}
                </span>
                <span className="text-[11px]">
                  {step.done ? 'Completado' : 'Pendiente'}
                </span>
              </li>
            );
          })}
        </ol>
        {!qrActive && (
          <div className="mt-6 pt-6 border-t border-brand-border">
            <p className="text-sm text-brand-textMuted mb-3">
              Tu página pública de emergencia solo se habilita tras activar el QR con el pago único de{' '}
              <span className="font-bold text-brand-text">$30.000 COP</span>. Sin suscripción.
            </p>
            <Link to={routes.dashboardQr} className="btn-primary inline-flex items-center gap-2 text-sm">
              Ir a Mi QR <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardIndex;
