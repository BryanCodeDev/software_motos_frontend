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

/**
 * Layout compartido de las pantallas de acceso (login, registro, recuperación).
 * aside: { badge, line1, accent, text, items: [{ icon, title, desc }] }
 * (showFooter se mantiene por compatibilidad, pero ya no se muestra ningún pie.)
 */
// eslint-disable-next-line no-unused-vars
export const AuthShell = ({ aside, children, bgImage, showFooter }) => {
  const reduce = useReducedMotion();
  const hasImage = !!bgImage;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {hasImage && (
        <>
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${bgImage}')` }}
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
        {/* ───────── Panel lateral (izquierda) ───────── */}
        <aside
          className={`relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex xl:p-16 ${
            hasImage ? '' : 'bg-gradient-to-br from-brand-500 via-brand-700 to-brand-900'
          }`}
        >
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-float" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-black/25 blur-3xl" />
          {!hasImage && (
            <>
              <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
              <Heartbeat reduce={reduce} className="pointer-events-none absolute inset-x-0 top-1/2 w-full -translate-y-1/2 text-white/15" />
            </>
          )}

          <motion.div
            initial={reduce ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative"
          >
            <Link to={routes.home} className="group flex w-fit items-center gap-3" aria-label="Tu QR te Cuida, ir al inicio">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
                <ShieldCheck size={20} strokeWidth={2.4} />
              </span>
              <span className="text-lg font-bold tracking-tight">Tu QR te Cuida</span>
            </Link>
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

          <span aria-hidden="true" />
        </aside>

        {/* ───────── Formulario (derecha) ───────── */}
        <section className="flex items-center justify-center px-4 py-10 sm:px-8">
          <motion.div
            className="w-full max-w-md"
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <Link
              to={routes.home}
              className="mb-6 flex items-center justify-center gap-2 lg:hidden"
              aria-label="Tu QR te Cuida, ir al inicio"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
                <ShieldCheck size={18} strokeWidth={2.4} />
              </span>
              <span className={`text-base font-bold tracking-tight ${hasImage ? 'text-white' : 'text-neutral-900'}`}>
                Tu QR te Cuida
              </span>
            </Link>

            <div
              className={`relative rounded-2xl border p-6 shadow-glow sm:p-10 ${
                hasImage ? 'border-white/60 bg-white/90 backdrop-blur-xl' : 'border-border bg-white'
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
              className={`group mt-6 hidden items-center justify-center gap-2 text-sm transition-colors lg:flex ${
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