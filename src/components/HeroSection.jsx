import { useEffect, useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Lock, Phone, ScanLine, ShieldCheck } from 'lucide-react';
import { routes } from '../utils/routes';

const EASE = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ */
/* QR de ejemplo (determinista, no codifica nada real)                 */
/* ------------------------------------------------------------------ */

const QR_SIZE = 21;
const FINDERS = [
  [0, 0],
  [QR_SIZE - 7, 0],
  [0, QR_SIZE - 7],
];

const buildQrCells = () => {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const inFinder = (x, y) =>
    (x < 8 && y < 8) || (x >= QR_SIZE - 8 && y < 8) || (x < 8 && y >= QR_SIZE - 8);
  const cells = [];
  for (let y = 0; y < QR_SIZE; y += 1) {
    for (let x = 0; x < QR_SIZE; x += 1) {
      if (!inFinder(x, y) && rnd() > 0.52) cells.push([x, y]);
    }
  }
  return cells;
};

const QR_CELLS = buildQrCells();

const QrGlyph = () => (
  <svg
    viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`}
    className="h-full w-full text-brand-900"
    shapeRendering="crispEdges"
    role="img"
    aria-label="Código QR de ejemplo"
  >
    {FINDERS.map(([x, y]) => (
      <g key={`${x}-${y}`}>
        <rect x={x} y={y} width="7" height="7" fill="currentColor" />
        <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
        <rect x={x + 2} y={y + 2} width="3" height="3" fill="currentColor" />
      </g>
    ))}
    {QR_CELLS.map(([x, y]) => (
      <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />
    ))}
  </svg>
);

const CORNERS = [
  'left-1.5 top-1.5 border-l-2 border-t-2 rounded-tl-lg',
  'right-1.5 top-1.5 border-r-2 border-t-2 rounded-tr-lg',
  'bottom-1.5 left-1.5 border-b-2 border-l-2 rounded-bl-lg',
  'bottom-1.5 right-1.5 border-b-2 border-r-2 rounded-br-lg',
];

/* ------------------------------------------------------------------ */
/* Vista 1: se escanea el QR                                           */
/* ------------------------------------------------------------------ */

const ScanView = ({ reduce }) => (
  <motion.div
    key="scan"
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.04 }}
    transition={{ duration: 0.35, ease: EASE }}
    className="flex min-h-[272px] flex-col items-center justify-center"
  >
    <div className="relative h-44 w-44 rounded-2xl bg-white p-3 ring-1 ring-border">
      <QrGlyph />
      {CORNERS.map((c) => (
        <span key={c} aria-hidden="true" className={`absolute h-5 w-5 border-brand-500 ${c}`} />
      ))}
      {!reduce && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-x-1 h-0.5 rounded-full bg-brand-500 shadow-[0_0_16px_4px_rgba(159,18,57,0.45)]"
          initial={{ top: '6%' }}
          animate={{ top: '94%' }}
          transition={{ duration: 1.3, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
      )}
    </div>
    <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-neutral-900">
      <ScanLine className="h-4 w-4 text-brand-500" aria-hidden="true" /> Apunta la cámara al QR
    </p>
    <p className="mt-1 text-xs text-text-secondary">No necesitas instalar nada</p>
  </motion.div>
);

/* ------------------------------------------------------------------ */
/* Vista 2: perfil que se revela, solo con lo que el dueño autorizó   */
/* ------------------------------------------------------------------ */

const profileList = { hidden: {}, show: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } } };
const profileRow = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

const ProfileView = ({ reduce }) => (
  <motion.div
    key="profile"
    variants={profileList}
    initial={reduce ? false : 'hidden'}
    animate="show"
    exit={{ opacity: 0, transition: { duration: 0.25 } }}
    className="min-h-[272px]"
  >
    <motion.div variants={profileRow} className="mb-3 rounded-xl border border-border bg-brand-50/70 p-4">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-text-secondary">Nombre</div>
      <div className="font-semibold text-neutral-900">Nombre del propietario</div>
    </motion.div>

    <div className="mb-3 grid gap-3 sm:grid-cols-2">
      {['Grupo sanguíneo', 'Alergias'].map((label) => (
        <motion.div key={label} variants={profileRow} className="rounded-xl border border-border bg-brand-50/70 p-4">
          <div className="mb-1 text-[11px] uppercase tracking-wider text-text-secondary">{label}</div>
          <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
            <Lock className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" /> Si lo autorizas
          </div>
        </motion.div>
      ))}
    </div>

    <motion.div
      variants={profileRow}
      className="flex items-center justify-between rounded-xl border border-border bg-brand-50/70 p-4"
    >
      <div>
        <div className="mb-1 text-[11px] uppercase tracking-wider text-text-secondary">Contacto de emergencia</div>
        <div className="font-semibold text-neutral-900">Persona de confianza</div>
      </div>
      <span className="relative inline-flex h-10 w-10 flex-none">
        <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand-500/60 animate-pulse-ring" />
        <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white">
          <Phone className="h-4 w-4" aria-hidden="true" />
        </span>
      </span>
    </motion.div>
  </motion.div>
);

/* ------------------------------------------------------------------ */
/* Teléfono: alterna entre escanear y ver el perfil, con tilt al mouse */
/* ------------------------------------------------------------------ */

const PhonePreview = () => {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(reduce ? 'profile' : 'scan');

  useEffect(() => {
    if (reduce) {
      const id = setTimeout(() => setPhase('profile'), 0);
      return () => clearTimeout(id);
    }
    const t = setTimeout(
      () => setPhase((p) => (p === 'scan' ? 'profile' : 'scan')),
      phase === 'scan' ? 2800 : 7000
    );
    return () => clearTimeout(t);
  }, [phase, reduce]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 120, damping: 18 });

  const onPointerMove = (e) => {
    if (reduce || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onPointerLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      className="relative mx-auto w-full max-w-sm"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-brand-900/20 blur-3xl" aria-hidden="true" />
      <div className={reduce ? '' : 'animate-float'}>
        <div className="relative rounded-[2rem] border border-border bg-neutral-50 p-5 shadow-glow">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-brand-500 animate-pulse-ring" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                {phase === 'scan' ? 'Escaneando QR' : 'Perfil de emergencia'}
              </span>
            </div>
            <ShieldCheck className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          </div>

          <div aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {phase === 'scan' ? <ScanView key="scan" reduce={reduce} /> : <ProfileView key="profile" reduce={reduce} />}
            </AnimatePresence>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden="true">
            {['scan', 'profile'].map((p) => (
              <span
                key={p}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  phase === p ? 'w-5 bg-brand-500' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-text-secondary">
            Ejemplo ilustrativo. Los datos reales los define el propietario.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

/** Línea del titular que sube desde una máscara. */
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

export const HeroSection = () => {
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);

  const fade = (delay) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE },
  });

  const scrollNext = () => {
    const h = sectionRef.current?.offsetHeight ?? window.innerHeight;
    window.scrollTo({ top: h, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex w-full items-center overflow-hidden min-h-[640px] lg:min-h-0 lg:aspect-video lg:max-h-[100svh] pt-24 pb-16 lg:pt-20 lg:pb-0 bg-[url('/herosection-movil.webp')] bg-contain bg-center md:bg-[url('/herosection.webp')] md:bg-cover"
    >
      {/* Degradado superior: asegura legibilidad del navbar transparente */}
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-black/60 to-transparent" aria-hidden="true" />
      {/* Degradado lateral: legibilidad del texto sin tapar la moto/QR a la derecha */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/45 to-black/10" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-black/40 to-transparent" aria-hidden="true" />

      <div className="container-page relative z-10 w-full">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div className="relative z-20">
            <motion.span
              {...fade(0)}
              className="mb-5 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/90"
            >
              <span className="h-px w-8 bg-brand-400" aria-hidden="true" />
              Identificación de emergencia
            </motion.span>

            <h1 className="mb-6 text-4xl font-extrabold leading-[1.08] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.45)] sm:text-5xl xl:text-6xl">
              <HeadlineLine delay={0.1} reduce={reduce} className="text-brand-400">
                Si tú no puedes hablar,
              </HeadlineLine>
              <HeadlineLine delay={0.25} reduce={reduce}>
                tu información lo hará por ti.
              </HeadlineLine>
            </h1>

            <motion.p
              {...fade(0.45)}
              className="mb-8 max-w-xl text-base leading-relaxed text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.5)] lg:text-lg xl:text-xl"
            >
              Crea un perfil digital de emergencia, decide qué datos compartir y vincúlalo a un código
              QR que cualquier persona puede escanear, sin instalar aplicaciones.
            </motion.p>

            <motion.div {...fade(0.6)} className="flex flex-col gap-3 sm:flex-row">
              <Link to={routes.register} className="btn-primary group px-6 py-3 text-sm lg:text-base">
                Crear perfil gratuito
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                to={routes.products}
                className="btn border border-white/50 bg-white/10 px-6 py-3 text-sm text-white backdrop-blur-sm hover:bg-white hover:text-neutral-900 active:scale-[0.98] lg:text-base"
              >
                Conocer el sticker
              </Link>
            </motion.div>

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
              {['Sin costo por escaneo', 'Sin aplicaciones', 'Privacidad bajo tu control'].map((t, i) => (
                <motion.li key={t} {...fade(0.8 + i * 0.1)} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-brand-400" aria-hidden="true" /> {t}
                </motion.li>
              ))}
            </ul>
          </div>

          <PhonePreview />
        </div>
      </div>

      <motion.button
        type="button"
        onClick={scrollNext}
        aria-label="Ir a la siguiente sección"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="absolute bottom-5 left-1/2 z-10 hidden h-11 w-7 -translate-x-1/2 items-start justify-center rounded-full border border-white/40 pt-2 text-white/80 transition-colors hover:border-white hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:flex"
      >
        <motion.span
          aria-hidden="true"
          className="h-2 w-1 rounded-full bg-current"
          animate={reduce ? undefined : { y: [0, 12, 0], opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.button>
    </section>
  );
};