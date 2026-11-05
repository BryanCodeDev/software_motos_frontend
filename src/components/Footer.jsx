import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, ArrowRight, ArrowUp } from 'lucide-react';
import { routes } from '../utils/routes';

const EASE = [0.22, 1, 0.36, 1];

const columns = [
  {
    title: 'Producto',
    links: [
      { label: 'QR digital de emergencia', to: routes.products },
      { label: 'Sticker QR personalizado', to: routes.products },
    ],
  },
  {
    title: 'Plataforma',
    links: [
      { label: 'Cómo funciona', to: routes.howItWorks },
      { label: 'Privacidad y seguridad', to: routes.privacy },
      { label: 'Preguntas frecuentes', to: routes.faq },
      { label: 'Contacto', to: routes.contact },
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
  'relative inline-block text-white/70 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:text-white after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-brand-300 after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100';

export const Footer = () => {
  const reduce = useReducedMotion();
  const toTop = () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });

  return (
    <footer className="relative isolate overflow-hidden bg-brand-900 pb-8 pt-14 text-white lg:pt-20">
      <div
        className="pointer-events-none absolute -left-24 top-0 -z-10 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 right-0 -z-10 h-96 w-96 rounded-full bg-brand-700/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/60 to-transparent"
        aria-hidden="true"
      />

      <div className="container-page">
        <div className="mb-12 grid gap-12 lg:mb-14 lg:grid-cols-12">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, ease: EASE }}
            className="lg:col-span-5"
          >
            <Link to={routes.home} className="group mb-4 inline-flex items-center gap-2.5 font-bold tracking-tight">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-500 shadow-soft transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
                <ShieldCheck size={20} strokeWidth={2.4} aria-hidden="true" />
              </span>
              <span className="text-lg">Tu QR te Cuida</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-white/70">
              Perfil digital de emergencia con código QR. Si tú no puedes hablar, tu información importante
              puede hacerlo por ti.
            </p>
            <Link
              to={routes.register}
              className="btn group mt-6 bg-white px-5 py-2.5 text-sm text-brand-500 shadow-soft hover:-translate-y-0.5 hover:bg-brand-50"
            >
              Crear mi perfil gratis
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </motion.div>

          <nav className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 lg:col-span-7" aria-label="Pie de página">
            {columns.map((col, i) => (
              <motion.div
                key={col.title}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: 0.08 + i * 0.08, ease: EASE }}
                className={i === 0 ? 'col-span-2 sm:col-span-1' : ''}
              >
                <h3 className="mb-4 text-sm font-semibold text-white">{col.title}</h3>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className={linkClass}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
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
            . Todos los derechos reservados.
          </p>
          <p className="leading-relaxed md:max-w-md md:text-right">
            Versión preliminar. Esta plataforma es una herramienta de apoyo y no sustituye a los servicios
            oficiales de emergencia.
          </p>
          <button
            type="button"
            onClick={toTop}
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-white/20 px-4 py-2 font-medium text-white/80 transition-all hover:border-white/50 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            Volver arriba
            <ArrowUp size={14} className="transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;