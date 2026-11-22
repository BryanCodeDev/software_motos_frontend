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
import {
  ArrowRight,
  Bike,
  Lock,
  PawPrint,
  Phone,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Users,
  QrCode,
  Package,
} from 'lucide-react';
import { routes } from '../utils/routes';
import { useAuth } from '../contexts/useAuth';

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
    className="flex min-h-[220px] flex-col items-center justify-center sm:min-h-[260px]"
  >
    <div className="relative h-28 w-28 rounded-2xl bg-white p-2.5 ring-1 ring-border sm:h-40 sm:w-40 sm:p-3">
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
    <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-neutral-900 sm:mt-5">
      <ScanLine className="h-4 w-4 text-brand-500" aria-hidden="true" /> Apunta la cámara al QR
    </p>
    <p className="mt-1 text-xs text-text-secondary">Funciona con cualquier teléfono</p>
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
    className="min-h-[220px] sm:min-h-[260px]"
  >
    <motion.div variants={profileRow} className="mb-2 rounded-xl border border-border bg-brand-50/70 p-3 sm:mb-2.5 sm:p-4">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-text-secondary">Nombre</div>
      <div className="font-semibold text-neutral-900">Nombre del propietario</div>
    </motion.div>

    <div className="mb-2 space-y-2 sm:mb-2.5 sm:space-y-2.5">
      {['Grupo sanguíneo', 'Alergias'].map((label) => (
        <motion.div
          key={label}
          variants={profileRow}
          className="flex items-center justify-between gap-2 rounded-xl border border-border bg-brand-50/70 px-3 py-2.5 sm:px-4 sm:py-3"
        >
          <span className="text-[11px] uppercase tracking-wider text-text-secondary">{label}</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900">
            <Lock className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" /> Si lo autoriza
          </span>
        </motion.div>
      ))}
    </div>

    <motion.div
      variants={profileRow}
      className="flex items-center justify-between rounded-xl border border-border bg-brand-50/70 p-3 sm:p-4"
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

export const PhonePreview = () => {
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
      transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      className="relative mx-auto w-full max-w-sm"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-brand-500/25 blur-3xl" aria-hidden="true" />
      <FloatChip icon={ScanLine} reduce={reduce} delay={1.0} className="-left-4 top-16 lg:-left-10">
        Cada escaneo queda registrado
      </FloatChip>
      <FloatChip icon={Phone} reduce={reduce} delay={1.3} className="-right-4 bottom-24 lg:-right-8">
        Llamada con un toque
      </FloatChip>
      <div className={reduce ? '' : 'animate-float'}>
        <div className="relative rounded-[2rem] border border-white/40 bg-neutral-50 p-4 shadow-glow ring-1 ring-black/5 sm:p-5">
          <div className="mb-3 flex items-center justify-between sm:mb-5">
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

          <div className="mt-3 flex items-center justify-center gap-1.5 sm:mt-4" aria-hidden="true">
            {['scan', 'profile'].map((p) => (
              <span
                key={p}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  phase === p ? 'w-5 bg-brand-500' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-center text-[10px] text-text-secondary sm:mt-3 sm:text-[11px]">
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

/** Pastilla con punto "en vivo" y texto que rota entre los públicos del servicio. */
const AUDIENCES = [
  { icon: Bike, text: 'Para tu moto' },
  { icon: Users, text: 'Para tu familia' },
  { icon: PawPrint, text: 'Para tu mascota' },
];

const AudiencePill = ({ reduce }) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % AUDIENCES.length), 2400);
    return () => clearInterval(id);
  }, [reduce]);
  const { icon: Icon, text } = AUDIENCES[i];

  return (
    <span className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 py-1.5 pl-3 pr-4 text-xs font-semibold text-white backdrop-blur-md sm:mb-6 sm:text-sm">
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full rounded-full bg-brand-400 animate-pulse-ring" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
      </span>
      <span className="relative inline-flex h-5 min-w-[9.5rem] items-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={text}
            initial={reduce ? false : { y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="absolute inset-y-0 left-0 flex items-center gap-2 whitespace-nowrap"
          >
            <Icon className="h-4 w-4 text-brand-300" aria-hidden="true" />
            {text}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
};

/** Insignia flotante alrededor del teléfono (solo desde sm). */
const FloatChip = ({ icon: Icon, children, className, delay = 0, reduce }) => (
  <motion.div
    initial={reduce ? false : { opacity: 0, scale: 0.8 }}
    animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: [0, -8, 0] }}
    transition={{
      opacity: { duration: 0.5, delay },
      scale: { duration: 0.5, delay, ease: EASE },
      y: { duration: 5, delay, repeat: Infinity, ease: 'easeInOut' },
    }}
    className={`absolute z-20 hidden items-center gap-2 rounded-xl border border-white/60 bg-white/95 px-3 py-2 text-xs font-semibold text-neutral-900 shadow-card backdrop-blur sm:flex ${className}`}
  >
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
    {children}
  </motion.div>
);

const HERO_POINTS = [
  { icon: Smartphone, text: 'Sin apps ni registro para escanear' },
  { icon: QrCode, text: 'QR permanente, uno por perfil' },
  { icon: Package, text: 'Stickers con seguimiento de envío' },
];

/**
 * La foto es la protagonista: casi sin capa oscura y sin recortes agresivos.
 * - Escritorio (>= lg): foto 16:9, casco a la derecha y zona oscura a la izquierda para el texto.
 * - Móvil y tablet vertical: foto vertical, texto arriba y casco en la mitad inferior.
 * El teléfono animado se muestra a la derecha (debajo del texto en móvil).
 */
export const HeroSection = () => {
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const primaryHref = isAuthenticated ? routes.dashboard : routes.register;
  const primaryLabel = isAuthenticated ? 'Ir a mi panel' : 'Crear mi perfil';

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
      className="relative isolate flex min-h-[100svh] w-full items-start overflow-hidden bg-neutral-950 pb-10 pt-24 sm:pt-28 lg:min-h-[max(720px,100svh)] lg:items-center lg:pb-24"
    >
      {/* FOTO COMPLETA: se aleja suavemente al cargar */}
      <picture>
        <source media="(min-width: 1024px)" srcSet="/herosection.webp" />
        <motion.img
          src="/herosection-movil.webp"
          alt=""
          aria-hidden="true"
          initial={reduce ? false : { scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, ease: EASE }}
          className="absolute inset-0 -z-20 h-full w-full select-none object-cover object-bottom lg:object-right"
          decoding="async"
          draggable="false"
        />
      </picture>

      {/* Capa negra muy sutil solo para que el texto resalte */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/35 to-black/50 lg:hidden"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-black/50 via-black/30 to-transparent lg:block"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-black/55 to-transparent"
        aria-hidden="true"
      />

      <div className="container-page relative z-10 w-full">
        <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-xl">
          <motion.div {...fade(0)}>
            <AudiencePill reduce={reduce} />
          </motion.div>

          <h1 className="mb-4 text-3xl font-extrabold leading-[1.1] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)] [text-wrap:balance] sm:mb-6 sm:text-5xl sm:leading-[1.08] xl:text-6xl">
            <HeadlineLine delay={0.1} reduce={reduce} className="text-brand-400">
              Tu QR de emergencia
            </HeadlineLine>
            <HeadlineLine delay={0.25} reduce={reduce}>
              habla por ti si no puedes.
            </HeadlineLine>
          </h1>

          <motion.p
            {...fade(0.45)}
            className="mb-6 max-w-lg text-sm leading-relaxed text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)] sm:mb-8 sm:text-base lg:text-lg"
          >
            Quien te auxilie escanea tu sticker con el celular y ve tus contactos y los datos que
            autorizaste.
          </motion.p>

          <motion.div {...fade(0.6)} className="flex gap-2.5 sm:gap-3">
            <Link to={primaryHref} className="btn-primary group flex-[1.7] whitespace-nowrap px-4 py-3 text-sm sm:flex-none sm:px-6 lg:text-base">
              {primaryLabel}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              to={routes.products}
              className="btn flex-1 whitespace-nowrap border border-white/50 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-sm hover:bg-white hover:text-neutral-900 active:scale-[0.98] sm:flex-none sm:px-6 lg:text-base"
            >
              <span className="sm:hidden">Planes</span>
              <span className="hidden sm:inline">Ver planes y precios</span>
            </Link>
          </motion.div>

          {/* En móvil se oculta para dejar libre el casco de la foto */}
          <ul className="mt-8 hidden gap-x-6 gap-y-2 text-sm text-white/90 sm:flex sm:flex-wrap">
            {HERO_POINTS.map(({ icon: Icon, text }, i) => (
              <motion.li key={text} {...fade(0.8 + i * 0.1)} className="flex items-center gap-2.5 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-500/30 ring-1 ring-brand-400/50">
                  <Icon className="h-3.5 w-3.5 text-brand-300" aria-hidden="true" />
                </span>
                {text}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Teléfono animado: en móvil va compacto debajo del texto */}
        <div>
          <PhonePreview />
        </div>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={scrollNext}
        aria-label="Ir a la siguiente sección"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="absolute bottom-4 left-1/2 z-10 hidden h-11 w-7 -translate-x-1/2 items-start justify-center rounded-full border border-white/40 pt-2 text-white/80 transition-colors hover:border-white hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:flex"
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