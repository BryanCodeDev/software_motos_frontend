import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { routes } from '../utils/routes';

const EASE = [0.22, 1, 0.36, 1];

/** Línea de latido (ECG) que se dibuja en bucle; solo cuando no hay imagen de fondo. */
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

/** Línea del titular que sube desde una máscara (igual que en el Hero). */
const HeadlineLine = ({ children, delay, className = '', reduce }) => (
  <span className="-mx-3 -my-1 block overflow-hidden px-3 py-1">
    <motion.span
      className={`block ${className}`}
      initial={reduce ? false : { y: '110%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.span>
  </span>
);

/**
 * Layout compartido de las pantallas de acceso (login, registro, recuperación).
 * Mismo lenguaje visual que el HeroSection: fondo oscuro con imagen + opacidad negra,
 * eyebrow con línea, titular enmascarado y tarjeta tipo "teléfono" con glow.
 * aside: { badge, line1, accent, text, items: [{ icon, title, desc }] }
 * (showFooter se mantiene por compatibilidad, pero ya no se muestra ningún pie.)
 */
export const AuthShell = ({ aside, children, bgImage }) => {
  const reduce = useReducedMotion();
  const hasImage = !!bgImage;

  const fade = (delay) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE },
  });

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-neutral-950">
      {/* Fondo: imagen como textura + opacidad negra, como el Hero */}
      {hasImage ? (
        <img
          src={bgImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full select-none object-cover object-center"
          decoding="async"
          draggable="false"
        />
      ) : (
        <>
          <div aria-hidden="true" className="absolute inset-0 -z-20 bg-gradient-to-br from-brand-700 via-brand-900 to-neutral-950" />
          <Heartbeat reduce={reduce} className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 w-full -translate-y-1/2 text-white/10" />
        </>
      )}
      <div className="absolute inset-0 -z-10 bg-black/75" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/50 via-transparent to-black/60" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-900/40 via-transparent to-transparent" aria-hidden="true" />

      <main id="contenido" className="container-page relative z-10 flex min-h-screen w-full items-center py-10 sm:py-14">
        <div className="grid w-full items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ───────── Mensaje (izquierda, desde lg) ───────── */}
          <aside className="relative z-20 hidden lg:block">
            <motion.div {...fade(0)} className="mb-12">
              <Link to={routes.home} className="group flex w-fit items-center gap-3" aria-label="Tu QR te Cuida, ir al inicio">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/25 backdrop-blur transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
                  <ShieldCheck size={20} strokeWidth={2.4} />
                </span>
                <span className="text-lg font-bold tracking-tight text-white">Tu QR te Cuida</span>
              </Link>
            </motion.div>

            <motion.span
              {...fade(0.05)}
              className="mb-5 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/90"
            >
              <span className="h-px w-8 bg-brand-400" aria-hidden="true" />
              {aside.badge}
            </motion.span>

            <p className="mb-6 text-5xl font-extrabold leading-[1.08] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.45)] [text-wrap:balance] xl:text-6xl">
              <HeadlineLine delay={0.1} reduce={reduce} className="text-brand-400">
                {aside.line1}
              </HeadlineLine>
              <HeadlineLine delay={0.25} reduce={reduce}>
                {aside.accent}
              </HeadlineLine>
            </p>

            <motion.p
              {...fade(0.45)}
              className="mb-8 max-w-xl text-lg leading-relaxed text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.5)]"
            >
              {aside.text}
            </motion.p>

            <ul className="max-w-md space-y-4">
              {aside.items.map(({ icon: Icon, title, desc }, i) => (
                <motion.li key={title} {...fade(0.6 + i * 0.1)} className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-white/20 bg-white/10 text-brand-400 backdrop-blur-sm">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{title}</span>
                    <span className="block text-sm text-white/75">{desc}</span>
                  </span>
                </motion.li>
              ))}
            </ul>
          </aside>

          {/* ───────── Formulario (derecha) ───────── */}
          <section className="w-full">
            <Link
              to={routes.home}
              className="mb-6 flex items-center justify-center gap-2 lg:hidden"
              aria-label="Tu QR te Cuida, ir al inicio"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
                <ShieldCheck size={18} strokeWidth={2.4} />
              </span>
              <span className="text-base font-bold tracking-tight text-white">Tu QR te Cuida</span>
            </Link>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
              className="relative mx-auto w-full max-w-md lg:ml-auto lg:mr-0"
            >
              <div className="absolute -inset-6 rounded-[2.5rem] bg-brand-500/25 blur-3xl" aria-hidden="true" />
              <div className="relative rounded-[2rem] border border-white/40 bg-neutral-50 p-6 shadow-glow ring-1 ring-black/5 sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-brand-500 animate-pulse-ring" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-500">Tu QR te Cuida</span>
                  </div>
                  <ShieldCheck className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                </div>
                {children}
              </div>
            </motion.div>

            {/* En móvil el panel lateral no se muestra: resumimos sus puntos clave. */}
            <ul className="mt-6 flex flex-wrap justify-center gap-2 lg:hidden">
              {aside.items.map(({ icon: Icon, title }) => (
                <li
                  key={title}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm"
                >
                  <Icon size={14} className="text-brand-400" aria-hidden="true" /> {title}
                </li>
              ))}
            </ul>

            <Link
              to={routes.home}
              className="group mx-auto mt-6 hidden w-fit items-center justify-center gap-2 text-sm text-white/90 transition-colors hover:text-white lg:ml-auto lg:mr-auto lg:flex lg:max-w-md"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" /> Volver al sitio
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AuthShell;