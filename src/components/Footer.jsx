import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, ArrowUp } from 'lucide-react';
import { routes } from '../utils/routes';
import { useAuth } from '../contexts/useAuth';

const EASE = [0.22, 1, 0.36, 1];

const columns = [
  {
    title: 'Servicio',
    wide: true,
    links: [
      { label: 'Productos', to: routes.products },
      { label: 'Cómo funciona', to: routes.howItWorks },
      { label: 'Privacidad y seguridad', to: routes.privacy },
      { label: 'Preguntas frecuentes', to: routes.faq },
      { label: 'Contacto', to: routes.contact },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Términos y condiciones', to: routes.terms },
      { label: 'Política de privacidad', to: routes.privacyPolicy },
    ],
  },
  {
    title: 'Cuenta',
    links: [
      { label: 'Iniciar sesión', to: routes.login },
      { label: 'Crear cuenta', to: routes.register },
    ],
  },
];

const linkClass =
  'group inline-flex items-center text-white/70 transition-all duration-200 hover:translate-x-0.5 hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:underline';

const Eyebrow = ({ children, className = '' }) => (
  <span
    className={`inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 ${className}`}
  >
    <span className="h-px w-8 bg-brand-400" aria-hidden="true" />
    {children}
  </span>
);

export const Footer = () => {
  const reduce = useReducedMotion();
  const { isAuthenticated, loading } = useAuth();

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
      <div
        className="absolute -top-32 left-1/2 -z-10 h-64 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl"
        aria-hidden="true"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/70 to-transparent"
      />

      <div className="container-page">
        {/* Marca + navegación */}
        <motion.div {...reveal(0.1)} className="mb-10 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link to={routes.home} className="group inline-flex items-center gap-2.5 font-bold tracking-tight">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
                <ShieldCheck size={20} strokeWidth={2.4} aria-hidden="true" />
              </span>
              <span className="text-lg">Tu QR te Cuida</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              {!loading && !isAuthenticated && 'Si no puedes hablar, tu información importante habla por ti.'}
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-6 gap-y-9 text-sm sm:grid-cols-3 sm:gap-x-8 lg:col-span-7" aria-label="Pie de página">
            {columns.map((col) => (
              <div key={col.title} className={col.wide ? 'col-span-2 sm:col-span-1' : ''}>
                <h3 className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                  <span className="h-px w-5 bg-brand-400" aria-hidden="true" />
                  {col.title}
                </h3>
                <ul
                  className={
                    col.wide
                      ? 'grid grid-cols-2 gap-x-6 gap-y-3 sm:block sm:space-y-3'
                      : 'space-y-3'
                  }
                >
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className={linkClass}>
                        {l.label}
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
            <p className="max-w-md leading-relaxed">
              Herramienta de apoyo: no sustituye a los servicios oficiales de emergencia.
            </p>
          </div>

          <button
            type="button"
            onClick={toTop}
            className="group inline-flex w-fit items-center gap-2 self-start rounded-full border border-white/25 bg-white/10 px-4 py-2 font-medium text-white/85 backdrop-blur-sm transition-colors hover:bg-white hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:self-auto"
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