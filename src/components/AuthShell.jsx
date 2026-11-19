import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { routes } from '../utils/routes';

const EASE = [0.22, 1, 0.36, 1];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } };
const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** Línea de latido (ECG) que se dibuja en bucle, como la de la imagen de fondo. */
const Heartbeat = ({ reduce, className = '' }) => (
  <svg viewBox="0 0 600 80" fill="none" aria-hidden="true" className={className}>
    <motion.path
      d="M0 40 H170 L190 40 L206 10 L230 70 L248 24 L262 40 H340 L356 40 L370 18 L386 58 L398 40 H600"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={reduce ? false : { pathLength: 0, opacity: 0 }}
      animate={reduce ? undefined : { pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
      transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.6 }}
    />
  </svg>
);

const Logo = ({ light = false, className = '' }) => (
  <Link
    to={routes.home}
    className={`group flex w-fit items-center gap-3 ${className}`}
    aria-label="Tu QR te Cuida, ir al inicio"
  >
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105 ${
        light ? 'bg-white text-brand-500 ring-white/40 shadow-soft' : 'bg-brand-500 text-white ring-brand-500/20'
      }`}
    >
      <ShieldCheck size={20} strokeWidth={2.4} />
    </span>
    <span
      className={`text-lg font-bold tracking-tight ${light ? 'text-white drop-shadow lg:drop-shadow-none' : 'text-neutral-900'}`}
    >
      Tu <span className={light ? 'text-white' : 'text-brand-500'}>QR</span> te Cuida
    </span>
  </Link>
);

/**
 * Layout compartido de las pantallas de acceso (login, registro, recuperación).
 * aside: { badge, line1, accent, text, items: [{ icon, title, desc }] }
 *
 * - Con bgImage: el formulario va sobre la zona roja de la imagen (izquierda) y la
 *   foto queda libre a la derecha, con chips discretos al pie.
 * - Sin bgImage: panel degradado a la izquierda y formulario a la derecha.
 */
export const AuthShell = ({ aside, children, bgImage, showFooter = true }) => {
  const reduce = useReducedMotion();
  const hasImage = !!bgImage;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {hasImage && (
        <>
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 z-0 bg-cover bg-no-repeat"
            style={{ backgroundImage: `url('${bgImage}')`, backgroundPosition: '70% center' }}
            initial={reduce ? false : { scale: 1.08 }}
            animate={reduce ? undefined : { scale: 1 }}
            transition={{ duration: 2.4, ease: EASE }}
          />
          {/* Legibilidad en móvil, donde el formulario cae sobre la foto */}
          <div aria-hidden="true" className="absolute inset-0 z-0 bg-gradient-to-b from-brand-900/70 via-brand-700/40 to-brand-900/70 lg:hidden" />
        </>
      )}

      <main
        id="contenido"
        className={`relative z-10 grid min-h-screen lg:grid-cols-[1.05fr_1fr] ${hasImage ? '' : 'bg-brand-50'}`}
      >
        {/* ───────── Panel lateral ───────── */}
        {hasImage ? (
          <aside className="relative hidden flex-col justify-end p-10 lg:order-2 lg:flex xl:p-14">
            <motion.ul
              variants={stagger}
              initial={reduce ? false : 'hidden'}
              animate="show"
              className="flex flex-wrap gap-3"
            >
              {aside.items.map(({ icon: Icon, title }) => (
                <motion.li
                  key={title}
                  variants={rise}
                  whileHover={reduce ? undefined : { y: -3 }}
                  className="inline-flex items-center gap-2.5 rounded-full bg-brand-900/75 py-2 pl-2 pr-4 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-md"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500">
                    <Icon size={15} />
                  </span>
                  {title}
                </motion.li>
              ))}
            </motion.ul>
          </aside>
        ) : (
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-500 via-brand-700 to-brand-900 p-12 text-white lg:flex xl:p-16">
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-float" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-black/25 blur-3xl" />
            <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
            <Heartbeat reduce={reduce} className="pointer-events-none absolute inset-x-0 top-1/2 w-full -translate-y-1/2 text-white/15" />

            <motion.div
              initial={reduce ? false : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="relative"
            >
              <Logo light />
            </motion.div>

            <motion.div
              variants={stagger}
              initial={reduce ? false : 'hidden'}
              animate="show"
              className="relative max-w-md"
            >
              <motion.span
                variants={rise}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ring-white/20"
              >
                <ShieldCheck size={14} /> {aside.badge}
              </motion.span>
              <motion.p
                variants={rise}
                className="mt-6 text-4xl font-extrabold leading-tight tracking-tight [text-wrap:balance] xl:text-5xl"
              >
                {aside.line1} <span className="text-brand-300">{aside.accent}</span>
              </motion.p>
              <motion.p variants={rise} className="mt-5 text-base leading-relaxed text-white/80">
                {aside.text}
              </motion.p>
              <ul className="mt-10 grid gap-3">
                {aside.items.map(({ icon: Icon, title, desc }) => (
                  <motion.li
                    key={title}
                    variants={rise}
                    whileHover={reduce ? undefined : { x: 6 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="flex items-center gap-4 rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-white/15 hover:ring-white/30"
                  >
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white/15">
                      <Icon size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="text-sm text-white/75">{desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {showFooter ? (
              <p className="relative text-xs text-white/60">
                © {new Date().getFullYear()} Tu QR te Cuida. Herramienta de apoyo: no sustituye a los servicios
                oficiales de emergencia.
              </p>
            ) : (
              <span />
            )}
          </aside>
        )}

        {/* ───────── Formulario ───────── */}
        <section className={`relative flex items-center justify-center px-4 py-10 sm:px-8 ${hasImage ? 'lg:order-1' : ''}`}>
          {hasImage && (
            <motion.div
              className="absolute left-8 top-8 hidden lg:block xl:left-14 xl:top-10"
              initial={reduce ? false : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <Logo light />
            </motion.div>
          )}

          <motion.div
            className="w-full max-w-md"
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <Logo light={hasImage} className="mx-auto mb-6 lg:hidden" />

            <div
              className={`relative rounded-2xl border p-6 shadow-card sm:p-9 ${
                hasImage
                  ? 'border-white/60 bg-white/90 backdrop-blur-xl'
                  : 'border-border bg-white shadow-glow'
              }`}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/70 to-transparent"
              />
              {children}
            </div>

            {/* En móvil el panel lateral no se muestra: resumimos sus puntos clave. */}
            <ul className="mt-6 flex flex-wrap justify-center gap-2 lg:hidden">
              {aside.items.map(({ icon: Icon, title }) => (
                <li
                  key={title}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/90 px-3 py-1.5 text-xs font-medium text-text-secondary shadow-soft"
                >
                  <Icon size={14} className="text-brand-500" aria-hidden="true" /> {title}
                </li>
              ))}
            </ul>

            <Link
              to={routes.home}
              className={`group mt-6 flex items-center justify-center gap-2 text-sm transition-colors ${
                hasImage ? 'text-white/90 hover:text-white' : 'text-text-secondary hover:text-brand-500'
              }`}
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" /> Volver al sitio
            </Link>
          </motion.div>
        </section>
      </main>
    </div>
  );
};

export default AuthShell;