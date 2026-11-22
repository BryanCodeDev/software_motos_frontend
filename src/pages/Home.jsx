import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
  animate,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion';
import { routes } from '../utils/routes';
import { useAuth } from '../contexts/useAuth';
import {
  ScanLine,
  SlidersHorizontal,
  Lock,
  HeartPulse,
  Users,
  QrCode,
  EyeOff,
  Eye,
  ShieldCheck,
  ArrowRight,
  Phone,
  Bike,
  PawPrint,
  Backpack,
  Baby,
  Mountain,
  Package,
  Clock,
  User,
  Droplet,
  AlertTriangle,
  Info,
  ChevronsRight,
} from 'lucide-react';
import { Card } from '../components/ui';
import Seo from '../components/Seo';
import { HeroSection } from '../components/HeroSection';
import { Reveal, SectionHeading, Accordion } from '../components/Section';
import { homeFaqs } from '../data/faqs';
import { productPlans } from '../data/products';
import { PlanCard } from '../components/PlanCard';

const EASE = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ */
/* Datos                                                               */
/* ------------------------------------------------------------------ */

/* Solo dos planes en el inicio; el catálogo completo vive en Productos. */
const FEATURED_PLANS = ['Perfil individual', 'Familiar x3'];
const featured = FEATURED_PLANS.map((name) => productPlans.find((p) => p.name === name)).filter(Boolean);
const homePlans = featured.length === FEATURED_PLANS.length ? featured : productPlans.slice(0, 2);

/* Precio "desde" tomado del catálogo: una sola fuente de verdad. */
const priceOf = (name) => productPlans.find((p) => p.name === name)?.price;

/* Cinta de públicos */
const marquee = [
  { icon: Bike, t: 'Motociclistas' },
  { icon: Users, t: 'Familias' },
  { icon: PawPrint, t: 'Mascotas' },
  { icon: Backpack, t: 'Viajeros' },
  { icon: Mountain, t: 'Deportistas' },
  { icon: Baby, t: 'Niños' },
  { icon: HeartPulse, t: 'Adultos mayores' },
];

/* Cifras de la propuesta (sin datos inventados) */
const stats = [
  { icon: QrCode, to: 1, prefix: '', suffix: '', t: 'QR permanente', d: 'Uno por perfil, nunca cambia' },
  { icon: Lock, to: 0, prefix: '', suffix: '', t: 'Datos dentro del QR', d: 'Solo contiene un código aleatorio' },
  { icon: SlidersHorizontal, to: 100, prefix: '', suffix: '%', t: 'Control por campo', d: 'Tú decides qué se muestra' },
  { icon: Clock, to: 2, prefix: '', suffix: ' min', t: 'Para dejarlo listo', d: 'Perfil y contactos' },
];

const pillars = [
  { icon: HeartPulse, title: 'Perfil de emergencia', text: 'Datos médicos, alergias y grupo sanguíneo.' },
  { icon: Users, title: 'Contactos con prioridad', text: 'A quién llamar primero y qué relación tiene contigo.' },
  { icon: QrCode, title: 'QR permanente', text: 'Un código aleatorio que no cambia aunque edites tu perfil.' },
  { icon: Package, title: 'Stickers físicos', text: 'Con tu diseño, para el casco, la moto o la mochila.' },
];

const scene = [
  { icon: ScanLine, title: 'Escanean tu QR', text: 'Con la cámara, sin instalar nada.' },
  { icon: HeartPulse, title: 'Ven tu información', text: 'Solo los campos que marcaste como públicos.' },
  { icon: Phone, title: 'Llaman a tu contacto', text: 'Con un toque, empezando por el prioritario.' },
];

/* Para quién es: cada tarjeta lleva al catálogo */
const audiences = [
  { icon: Bike, title: 'Motociclistas', text: 'Un sticker en el casco o la moto para que quien te auxilie sepa a quién llamar.', plan: 'Perfil individual' },
  { icon: Users, title: 'Familias', text: 'Un perfil y un QR independientes para cada integrante.', plan: 'Familiar x3' },
  { icon: PawPrint, title: 'Mascotas', text: 'Perfil veterinario y contacto del dueño, por si se pierde.', plan: 'Mascota individual' },
];

const steps = [
  { icon: HeartPulse, title: 'Crea tu perfil', text: 'Regístrate y agrega tus datos médicos.' },
  { icon: Users, title: 'Agrega contactos', text: 'Define a quién llamar primero.' },
  { icon: SlidersHorizontal, title: 'Decide qué se ve', text: 'Cada campo, público o privado.' },
  { icon: Package, title: 'Pide tus stickers', text: 'Elige el diseño, activa tu QR y sigue el envío.' },
];

const privacyPoints = [
  { icon: EyeOff, t: 'Lo privado no se muestra', d: 'Lo que no marcas como público nunca aparece.' },
  { icon: QrCode, t: 'QR sin datos', d: 'Cada código es aleatorio y difícil de adivinar.' },
  { icon: ScanLine, t: 'Escaneos registrados', d: 'Cada lectura queda guardada para auditoría.' },
  { icon: ShieldCheck, t: 'Desactívalo al instante', d: 'Si pierdes un sticker, lo bloqueas desde tu cuenta.' },
];

/* Campos del demo interactivo de privacidad */
const demoFields = [
  { id: 'name', icon: User, label: 'Nombre', on: true },
  { id: 'contact', icon: Phone, label: 'Contacto de emergencia', on: true },
  { id: 'blood', icon: Droplet, label: 'Grupo sanguíneo', on: false },
  { id: 'allergy', icon: AlertTriangle, label: 'Alergias', on: false },
];

/* Índice de la landing: en móvil se desliza de lado; cada chip lleva a su sección */
const navItems = [
  { id: 'incluye', icon: Package, label: 'Qué incluye' },
  { id: 'emergencia', icon: ScanLine, label: 'En una emergencia' },
  { id: 'publico', icon: Users, label: 'Para quién' },
  { id: 'como-funciona', icon: SlidersHorizontal, label: 'Cómo funciona' },
  { id: 'privacidad', icon: ShieldCheck, label: 'Privacidad' },
  { id: 'productos', icon: QrCode, label: 'Productos' },
  { id: 'faq', icon: Info, label: 'Preguntas' },
];

/* Datos estructurados para resultados enriquecidos en Google. */
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: homeFaqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

/* ------------------------------------------------------------------ */
/* Piezas reutilizables                                                */
/* ------------------------------------------------------------------ */

/** Barra de progreso de lectura, fija arriba. */
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.3 });
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-brand-400 via-brand-500 to-brand-700"
    />
  );
};

/** Número que cuenta hasta su valor al entrar en pantalla. */
const Counter = ({ to, prefix = '', suffix = '' }) => {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [val, setVal] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return undefined;
    const controls = animate(0, to, { duration: 1.4, ease: EASE, onUpdate: (v) => setVal(Math.round(v)) });
    return () => controls.stop();
  }, [inView, reduce, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {reduce ? to : val}
      {suffix}
    </span>
  );
};

/** Tarjeta con reflejo que sigue al cursor. */
const SpotlightCard = ({ children, className = '' }) => {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <Card className={`group relative h-full overflow-hidden transition-transform duration-200 active:scale-[0.99] ${className}`} onMouseMove={onMove}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(159,18,57,0.10), transparent 70%)',
        }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-brand-500 to-brand-400 transition-transform duration-500 group-hover:scale-x-100"
      />
      <div className="relative">{children}</div>
    </Card>
  );
};

/** Enlace de texto con flecha animada. */
const TextLink = ({ to, children, dark = false }) => (
  <Link
    to={to}
    className={`group inline-flex items-center gap-2 font-semibold transition-colors ${
      dark ? 'text-brand-300 hover:text-white' : 'text-brand-500 hover:text-brand-600'
    }`}
  >
    {children}
    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
  </Link>
);

/** Cinta que se desplaza sola con los públicos del servicio. */
const Marquee = () => {
  const reduce = useReducedMotion();
  const items = [...marquee, ...marquee];
  return (
    <div className="overflow-hidden border-y border-brand-700/40 bg-brand-500 py-3 text-white" aria-label="Para quién es">
      <motion.ul
        className="flex w-max gap-10 pr-10"
        animate={reduce ? undefined : { x: ['0%', '-50%'] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
      >
        {items.map(({ icon: Icon, t }, i) => (
          <li
            key={`${t}-${i}`}
            aria-hidden={i >= marquee.length ? 'true' : undefined}
            className="flex items-center gap-2.5 whitespace-nowrap text-sm font-semibold"
          >
            <Icon className="h-4 w-4 text-brand-200" aria-hidden="true" />
            {t}
            <span className="ml-8 h-1 w-1 rounded-full bg-white/40" aria-hidden="true" />
          </li>
        ))}
      </motion.ul>
    </div>
  );
};

/** Demo: el visitante prueba qué datos mostraría su QR. */
const PrivacyDemo = () => {
  const [fields, setFields] = useState(() => Object.fromEntries(demoFields.map((f) => [f.id, f.on])));
  const count = Object.values(fields).filter(Boolean).length;
  const toggle = (id) => setFields((f) => ({ ...f, [id]: !f[id] }));

  return (
    <div className="rounded-2xl border border-white/15 bg-white p-4 text-neutral-900 shadow-card sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Pruébalo: tú decides</p>
          <p className="mt-0.5 text-xs text-text-secondary">Toca un dato para mostrarlo u ocultarlo.</p>
        </div>
        <span className="flex-none rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-500" aria-live="polite">
          {count} de {demoFields.length} visibles
        </span>
      </div>

      <ul className="space-y-2">
        {demoFields.map(({ id, icon: Icon, label }) => {
          const on = fields[id];
          return (
            <li key={id}>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => toggle(id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  on ? 'border-brand-500/40 bg-brand-50' : 'border-border bg-neutral-50'
                }`}
              >
                <span
                  className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg transition-colors duration-300 ${
                    on ? 'bg-brand-500 text-white' : 'bg-neutral-200 text-text-secondary'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary">
                    {on ? <Eye className="h-3 w-3" aria-hidden="true" /> : <EyeOff className="h-3 w-3" aria-hidden="true" />}
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={on ? 'on' : 'off'}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 6 }}
                        transition={{ duration: 0.18 }}
                      >
                        {on ? 'Lo ve quien escanea' : 'Privado'}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`relative h-6 w-11 flex-none rounded-full transition-colors duration-300 ${on ? 'bg-brand-500' : 'bg-neutral-200'}`}
                >
                  <motion.span
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                    animate={{ left: on ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/** Índice rápido: chips con icono que se deslizan en móvil y se centran en pantallas amplias. */
const QuickNav = () => {
  const go = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <nav aria-label="Secciones de la página" className="border-b border-border/60 bg-white">
      <div className="container-page">
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          {navItems.map(({ id, icon: Icon, label }) => (
            <li key={id} className="flex-none">
              <a
                href={`#${id}`}
                onClick={(e) => go(e, id)}
                className="focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-brand-50 px-4 text-sm font-semibold text-neutral-900 transition-all duration-200 hover:border-brand-500/50 hover:bg-white hover:text-brand-500 active:scale-95"
              >
                <Icon className="h-4 w-4 text-brand-500" aria-hidden="true" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

const hideScrollbar = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export const Home = () => {
  const reduce = useReducedMotion();
  const { isAuthenticated } = useAuth();

  return (
    // El <main id="contenido"> lo aporta PublicLayout.
    <div className="flex min-h-screen flex-col">
      <Seo
        title="Inicio"
        description="Perfil de emergencia con código QR para motociclistas, familias y mascotas en Colombia. Si no puedes hablar, tu información habla por ti."
        jsonLd={faqJsonLd}
      />
      <ScrollProgress />

      <HeroSection />
      <Marquee />
      <QuickNav />

      {/* CIFRAS */}
      <section className="border-b border-border/60 bg-white" aria-label="Por qué confiar">
        <div className="container-page">
          <ul className="grid grid-cols-2 divide-x divide-y divide-border/60 lg:grid-cols-4 lg:divide-y-0">
            {stats.map(({ icon: Icon, to, prefix, suffix, t, d }, i) => (
              <Reveal as="li" key={t} delay={i * 0.07} y={14} className="group p-4 sm:p-5 lg:p-7">
                <div className="mb-2 flex items-center gap-2.5">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-2xl font-extrabold text-neutral-900 sm:text-3xl">
                    <Counter to={to} prefix={prefix} suffix={suffix} />
                  </span>
                </div>
                <p className="text-sm font-semibold text-neutral-900">{t}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{d}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* QUÉ INCLUYE: 2 columnas compactas en móvil para recorrer menos */}
      <section id="incluye" className="section section-alt scroll-mt-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Qué incluye"
            title="Todo lo que necesitas para estar preparado"
            subtitle="Un perfil, un QR y stickers para llevarlo contigo."
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {pillars.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.08} className="h-full">
                <SpotlightCard className="p-4 sm:p-7">
                  <div className="mb-3 flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 sm:mb-5 sm:h-12 sm:w-12">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mb-1 text-sm font-bold leading-snug text-neutral-900 sm:mb-2 sm:text-lg">{title}</h3>
                  <p className="text-xs leading-relaxed text-text-secondary sm:text-sm">{text}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* QUÉ PASA EN UNA EMERGENCIA */}
      <section id="emergencia" className="section scroll-mt-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="En una emergencia"
            title="Así te ayuda tu QR en tres pasos"
            subtitle="Quien te auxilie solo necesita su celular."
          />
          <ol className="relative grid gap-8 md:grid-cols-3 md:gap-6">
            <motion.span
              aria-hidden="true"
              className="absolute left-[16%] right-[16%] top-7 hidden h-px origin-left bg-gradient-to-r from-brand-500/20 via-brand-500/50 to-brand-500/20 md:block"
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1.1, delay: 0.2, ease: EASE }}
            />
            {scene.map(({ icon: Icon, title, text }, i) => (
              <Reveal
                as="li"
                key={title}
                delay={i * 0.18}
                className="relative flex items-start gap-4 text-left md:flex-col md:items-center md:text-center"
              >
                {i < scene.length - 1 && (
                  <span aria-hidden="true" className="absolute left-6 top-14 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-brand-500/40 to-transparent md:hidden" />
                )}
                <span className="relative flex h-12 w-12 flex-none items-center justify-center md:mb-5 md:h-14 md:w-14">
                  <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand-500/40 animate-pulse-ring" />
                  <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-glow ring-4 ring-brand-50 transition-transform duration-300 hover:scale-110 md:h-14 md:w-14 md:ring-8">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </span>
                <div>
                  <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-brand-500 md:hidden">Paso {i + 1}</p>
                  <h3 className="mb-1 font-bold text-neutral-900 md:mb-1.5 md:text-lg">{title}</h3>
                  <p className="max-w-xs text-sm leading-relaxed text-text-secondary">{text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <p className="mt-10 rounded-xl bg-brand-100/70 px-4 py-3 text-center text-xs leading-relaxed text-text-secondary">
            Requiere internet. Herramienta de apoyo: no reemplaza a los servicios oficiales de emergencia.
          </p>
        </div>
      </section>

      {/* PARA QUIÉN ES: en móvil se desliza de lado, en pantallas amplias es una grilla */}
      <section id="publico" className="section section-alt scroll-mt-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Para quién es"
            title="Para ti, tu familia y tu mascota"
            subtitle="Cada perfil tiene su propio QR."
          />
          <div
            className={`-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0 ${hideScrollbar}`}
          >
            {audiences.map(({ icon: Icon, title, text, plan }, i) => (
              <Reveal key={title} delay={i * 0.1} className="w-[82%] flex-none snap-center sm:w-[60%] md:w-auto">
                <Link to={routes.products} className="group block h-full rounded-2xl focus-ring">
                  <SpotlightCard className="p-5 sm:p-7">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 transition-all duration-300 group-hover:bg-brand-500 group-hover:text-white">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </span>
                      {priceOf(plan) && (
                        <span className="rounded-full border border-brand-500/30 bg-white px-3 py-1 text-xs font-semibold text-brand-500">
                          Desde {priceOf(plan)}
                        </span>
                      )}
                    </div>
                    <h3 className="mb-1.5 text-lg font-bold text-neutral-900">{title}</h3>
                    <p className="mb-5 text-sm leading-relaxed text-text-secondary">{text}</p>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-500">
                      Ver plan
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </SpotlightCard>
                </Link>
              </Reveal>
            ))}
          </div>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-text-secondary md:hidden">
            Desliza para ver más
            <ChevronsRight className="h-4 w-4 text-brand-500" aria-hidden="true" />
          </p>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="section scroll-mt-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Cómo funciona"
            title="Cómo empezar en cuatro pasos"
            subtitle="Del registro al sticker en tu casco."
          />
          <ol className="grid gap-5 lg:grid-cols-4 lg:gap-6">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={i * 0.1} className="relative list-none pl-16 lg:pl-0">
                {i < steps.length - 1 && (
                  <span aria-hidden="true" className="absolute left-[1.35rem] top-12 h-[calc(100%+0.5rem)] w-px bg-brand-200 lg:hidden" />
                )}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white shadow-glow ring-4 ring-brand-50 lg:hidden"
                >
                  {i + 1}
                </span>
                <Card className="group h-full p-4 sm:p-6">
                  <div className="mb-3 flex items-center justify-between lg:mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span
                      className="hidden text-3xl font-bold tabular-nums text-brand-200 transition-colors duration-300 group-hover:text-brand-500 lg:block"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mb-1.5 font-bold text-neutral-900">
                    <span className="sr-only">Paso {i + 1}: </span>
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{text}</p>
                </Card>
              </Reveal>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <TextLink to={routes.howItWorks}>Ver el proceso completo</TextLink>
          </div>
        </div>
      </section>

      {/* PRIVACIDAD (sección oscura) */}
      <section id="privacidad" className="section relative scroll-mt-20 overflow-hidden bg-brand-900 text-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl animate-float" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-brand-700/40 blur-3xl" aria-hidden="true" />
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="container-page relative">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
            <Reveal>
              <span className="mb-4 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
                <span className="h-px w-6 bg-brand-300" aria-hidden="true" />
                Privacidad y seguridad
              </span>
              <h2 className="mb-4 text-3xl font-bold leading-tight [text-wrap:balance] lg:text-4xl">
                Tus datos, bajo tus reglas
              </h2>
              <p className="mb-6 leading-relaxed text-white/80">
                Al escanear el QR se abre tu perfil, y este muestra únicamente los campos que marcaste como públicos.
              </p>
              <TextLink to={routes.privacy} dark>
                Cómo protegemos tu información
              </TextLink>
            </Reveal>
            <Reveal delay={0.1}>
              <PrivacyDemo />
            </Reveal>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-4">
            {privacyPoints.map(({ icon: Icon, t, d }, i) => (
              <Reveal key={t} delay={i * 0.08} className="h-full">
                <div className="group h-full rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-300/40 hover:bg-white/10 sm:p-5">
                  <Icon className="mb-3 h-5 w-5 text-brand-300 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  <h3 className="mb-1 text-sm font-semibold">{t}</h3>
                  <p className="text-xs leading-relaxed text-white/70">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTOS */}
      <section id="productos" className="section scroll-mt-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Productos"
            title="Pon tu QR a la vista"
            subtitle="Elige tu pack y el diseño de tus stickers."
          />
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2 md:gap-6">
            {homePlans.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.1}>
                <PlanCard plan={p} isAuthenticated={isAuthenticated} />
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <TextLink to={routes.products}>Ver todos los productos</TextLink>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section section-alt scroll-mt-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Preguntas frecuentes"
            title="Resolvemos tus dudas"
            subtitle="Lo esencial antes de crear tu perfil."
          />
          <div className="mx-auto max-w-3xl">
            <Accordion items={homeFaqs} />
            <div className="mt-8 text-center">
              <TextLink to={routes.faq}>Ver todas las preguntas</TextLink>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;