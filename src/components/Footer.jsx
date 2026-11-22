import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ShieldCheck, ArrowUp, ArrowRight, MessageCircle, QrCode, Home, Package, ScanLine, Info, Mail,
  Lock, FileText, LayoutDashboard, ShoppingBag, LogIn, UserPlus, Compass, LifeBuoy, UserRound,
} from 'lucide-react';
import { routes } from '../utils/routes';
import { useAuth } from '../contexts/useAuth';
import { WHATSAPP_URL, WHATSAPP_DISPLAY } from '../data/products';

const EASE = [0.22, 1, 0.36, 1];

const linkClass =
  'group inline-flex min-h-[40px] items-center gap-2 text-white/70 transition-all duration-200 hover:translate-x-0.5 hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:underline';

const Eyebrow = ({ icon: Icon, children }) => (
  <h3 className="mb-3 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white">
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-brand-300">
      <Icon size={14} aria-hidden="true" />
    </span>
    {children}
  </h3>
);

export const Footer = () => {
  const reduce = useReducedMotion();
  const { isAuthenticated, loading } = useAuth();

  // Las columnas cambian según la sesión: invitado vs. con cuenta
  const columns = [
    {
      title: 'Explora',
      icon: Compass,
      wide: true,
      links: [
        { label: 'Inicio', to: routes.home, icon: Home },
        { label: 'Productos', to: routes.products, icon: Package },
        { label: 'Cómo funciona', to: routes.howItWorks, icon: ScanLine },
        { label: 'Preguntas frecuentes', to: routes.faq, icon: Info },
      ],
    },
    {
      title: 'Ayuda y legal',
      icon: LifeBuoy,
      links: [
        { label: 'Contacto', to: routes.contact, icon: Mail },
        { label: 'Privacidad y seguridad', to: routes.privacy, icon: ShieldCheck },
        { label: 'Términos y condiciones', to: routes.terms, icon: FileText },
        { label: 'Política de privacidad', to: routes.privacyPolicy, icon: Lock },
      ],
    },
    {
      title: 'Tu cuenta',
      icon: UserRound,
      links:
        !loading && isAuthenticated
          ? [
              { label: 'Mi panel', to: routes.dashboard, icon: LayoutDashboard },
              { label: 'Mi QR', to: routes.dashboardQr, icon: QrCode },
              { label: 'Mis pedidos', to: routes.dashboardOrders, icon: ShoppingBag },
            ]
          : [
              { label: 'Iniciar sesión', to: routes.login, icon: LogIn },
              { label: 'Crear cuenta', to: routes.register, icon: UserPlus },
            ],
    },
  ];

  const reveal = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.6, delay, ease: EASE },
  });

  const toTop = () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });

  return (
    <footer className="relative isolate overflow-hidden bg-neutral-950 pb-8 pt-12 text-white sm:pt-16 lg:pt-20">
      {/* Atmósfera de marca: mismos degradados y glow que el Hero */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-900/60 via-transparent to-transparent" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-900/30 via-transparent to-transparent" aria-hidden="true" />
      <div className="absolute -top-32 left-1/2 -z-10 h-64 w-[40rem] max-w-full -translate-x-1/2 animate-float rounded-full bg-brand-500/15 blur-3xl" aria-hidden="true" />
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/70 to-transparent" />

      <div className="container-page">
        {/* Llamada principal: cambia según la sesión */}
        <motion.div
          {...reveal(0)}
          className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-6 shadow-glow ring-1 ring-white/10 sm:p-8 md:flex md:items-center md:justify-between md:gap-8"
        >
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="relative flex items-start gap-4">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <QrCode size={22} className="text-brand-300" aria-hidden="true" />
            </span>
            <div>
              <h2 className="mb-1 text-lg font-bold leading-snug sm:text-xl">
                {!loading && isAuthenticated ? 'Tu información, siempre a la mano' : 'Si no puedes hablar, tu información habla por ti'}
              </h2>
              <p className="text-sm leading-relaxed text-white/75">
                {!loading && isAuthenticated ? 'Gestiona tu perfil, tu QR y tus pedidos.' : 'Crea tu perfil y llévalo en un sticker.'}
              </p>
            </div>
          </div>
          <Link
            to={!loading && isAuthenticated ? routes.dashboard : routes.register}
            className="relative mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-brand-600 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:mt-0 md:w-auto md:flex-none"
          >
            {!loading && isAuthenticated ? 'Ir a mi panel' : 'Crear cuenta gratis'}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </motion.div>

        {/* Marca + navegación */}
        <motion.div {...reveal(0.1)} className="mb-10 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to={routes.home} className="group inline-flex items-center gap-2.5 font-bold tracking-tight">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
                <ShieldCheck size={20} strokeWidth={2.4} aria-hidden="true" />
              </span>
              <span className="text-lg">Tu QR te Cuida</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Perfil de emergencia con código QR para motociclistas, familias y mascotas.
            </p>
            {WHATSAPP_URL && (
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-[44px] items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-medium text-white/90 transition-all duration-200 hover:border-brand-300/50 hover:bg-white/15 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <MessageCircle size={16} className="text-brand-300" aria-hidden="true" />
                {WHATSAPP_DISPLAY || 'WhatsApp'}
              </a>
            )}
          </div>

          <nav className="grid grid-cols-2 gap-x-6 gap-y-9 text-sm sm:grid-cols-3 sm:gap-x-8 lg:col-span-8" aria-label="Pie de página">
            {columns.map((col) => (
              <div key={col.title} className={col.wide ? 'col-span-2 sm:col-span-1' : ''}>
                <Eyebrow icon={col.icon}>{col.title}</Eyebrow>
                <ul className={col.wide ? 'grid grid-cols-2 gap-x-4 sm:block' : ''}>
                  {col.links.map(({ label, to, icon: Icon }) => (
                    <li key={label}>
                      <Link to={to} className={linkClass}>
                        <Icon size={14} className="flex-none text-brand-300/80 transition-colors group-hover:text-brand-300" aria-hidden="true" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </motion.div>

        {/* Barra inferior */}
        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
            <p>
              © {new Date().getFullYear()}{' '}
              <a
                href="https://mastercodecompany.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:underline"
              >
                MasterCode Company
              </a>
            </p>
            <p className="max-w-md leading-relaxed">Herramienta de apoyo: no sustituye a los servicios oficiales de emergencia.</p>
          </div>

          <button
            type="button"
            onClick={toTop}
            className="group inline-flex min-h-[44px] w-fit items-center gap-2 self-start rounded-full border border-white/25 bg-white/10 px-4 py-2 font-medium text-white/85 backdrop-blur-sm transition-colors hover:bg-white hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:self-auto"
          >
            Volver arriba
            <ArrowUp size={14} className="transition-transform duration-200 group-hover:-translate-y-0.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;