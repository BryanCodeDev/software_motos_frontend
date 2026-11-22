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
  ListChecks,
  HelpCircle,
  MessageCircle,
  Clock,
  User,
  Droplet,
  AlertTriangle,
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

/* Rutas para explorar el sitio */
const explore = [
  { icon: Package, t: 'Productos', d: 'Stickers y planes', to: routes.products },
  { icon: ListChecks, t: 'Cómo funciona', d: 'Del registro al sticker', to: routes.howItWorks },
  { icon: ShieldCheck, t: 'Privacidad', d: 'Cómo cuidamos tus datos', to: routes.privacy },
  { icon: HelpCircle, t: 'Preguntas', d: 'Resuelve tus dudas', to: routes.faq },
  { icon: MessageCircle, t: 'Contacto', d: 'Escríbenos', to: routes.contact },
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
    <Card className={`group relative h-full overflow-hidden ${className}`} onMouseMove={onMove}>
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

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export const Home = () => {
  const reduce = useReducedMotion();
  const { isAuthenticated } = useAuth();
  const ctaRef = useRef(null);
  const [pastHero, setPastHero] = useState(false);
  const [ctaSeen, setCtaSeen] = useState(false);

  // Barra de acción fija en móvil: aparece al salir del hero y se oculta al llegar al cierre.
  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([e]) => setCtaSeen(e.isIntersecting || e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const showBar = pastHero && !ctaSeen;
  const primaryHref = isAuthenticated ? routes.dashboard : routes.register;
  const primaryLabel = isAuthenticated ? 'Ir a mi panel' : 'Crear mi perfil';

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

      {/* CIFRAS */}
      <section className="border-b border-border/60 bg-white" aria-label="Por qué confiar">
        <div className="container-page">
          <ul className="grid grid-cols-2 divide-x divide-y divide-border/60 lg:grid-cols-4 lg:divide-y-0">
            {stats.map(({ icon: Icon, to, prefix, suffix, t, d }, i) => (
              <Reveal as="li" key={t} delay={i * 0.07} y={14} className="group p-5 lg:p-7">
                <div className="mb-2 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white">
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

      {/* POR QUÉ */}
      <section className="section section-alt">
        <div className="container-page">
          <SectionHeading
            eyebrow="Qué incluye"
            title="Todo lo que necesitas para estar preparado"
            subtitle="Un perfil, un QR y stickers para llevarlo contigo."
          />
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {pillars.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <SpotlightCard className="p-4 sm:p-7">
                  <div className="flex items-start gap-4 lg:block">
                    <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 lg:mb-5">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-base font-bold text-neutral-900 md:mb-2 md:text-lg">{title}</h3>
                      <p className="text-sm leading-relaxed text-text-secondary">{text}</p>
                    </div>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* QUÉ PASA EN UNA EMERGENCIA */}
      <section className="section">
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
                  <h3 className="mb-1 font-bold text-neutral-900 md:mb-1.5 md:text-lg">{title}</h3>
                  <p className="max-w-xs text-sm leading-relaxed text-text-secondary">{text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <p className="mt-10 text-center text-xs text-text-secondary">
            Requiere internet. Herramienta de apoyo: no reemplaza a los servicios oficiales de emergencia.
          </p>
        </div>
      </section>

      {/* PARA QUIÉN ES */}
      <section className="section section-alt">
        <div className="container-page">
          <SectionHeading
            eyebrow="Para quién es"
            title="Para ti, tu familia y tu mascota"
            subtitle="Cada perfil tiene su propio QR."
          />
          <div className="grid gap-3 sm:gap-6 md:grid-cols-3">
            {audiences.map(({ icon: Icon, title, text, plan }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <Link to={routes.products} className="group block h-full rounded-2xl focus-ring">
                  <SpotlightCard className="p-5 sm:p-7">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 transition-all duration-300 group-hover:bg-brand-500 group-hover:text-white">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </span>
                      {priceOf(plan) && (
                        <span className="rounded-full border border-brand-500/30 px-3 py-1 text-xs font-semibold text-brand-500">
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
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="section">
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
      <section className="section relative overflow-hidden bg-brand-900 text-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl animate-float" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-brand-700/40 blur-3xl" aria-hidden="true" />
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="container-page relative">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
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

          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {privacyPoints.map(({ icon: Icon, t, d }, i) => (
              <Reveal key={t} delay={i * 0.08}>
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
      <section className="section">
        <div className="container-page">
          <SectionHeading
            eyebrow="Productos"
            title="Pon tu QR a la vista"
            subtitle="Elige tu pack y el diseño de tus stickers."
          />
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
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
      <section className="section section-alt">
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

      {/* EXPLORA */}
      <section className="section pb-0 lg:pb-0" aria-label="Explora el sitio">
        <div className="container-page">
          <SectionHeading
            eyebrow="Explora"
            title="Sigue explorando"
            subtitle="Todo sobre el servicio, a un clic."
          />
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            {explore.map(({ icon: Icon, t, d, to }, i) => (
              <Reveal as="li" key={t} delay={i * 0.06} y={14} className={i === explore.length - 1 ? 'col-span-2 lg:col-span-1' : ''}>
                <Link
                  to={to}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-card focus-ring sm:p-5"
                >
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 transition-all duration-300 group-hover:bg-brand-500 group-hover:text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="flex items-center justify-between gap-2 text-sm font-bold text-neutral-900">
                    {t}
                    <ArrowRight className="h-4 w-4 text-brand-500 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true" />
                  </span>
                  <span className="mt-0.5 text-xs text-text-secondary">{d}</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA FINAL */}
      <section ref={ctaRef} className="section">
        <div className="container-page">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-8 text-center shadow-glow sm:p-10 lg:p-16">
              <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-float" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-black/25 blur-3xl" aria-hidden="true" />
              <div className="relative">
                <span className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center">
                  <span aria-hidden="true" className="absolute inset-0 rounded-full bg-white/30 animate-pulse-ring" />
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-500 shadow-soft">
                    <QrCode className="h-7 w-7" aria-hidden="true" />
                  </span>
                </span>
                <h2 className="mb-4 text-3xl font-bold text-white [text-wrap:balance] lg:text-4xl">
                  Prepárate hoy, en menos de dos minutos
                </h2>
                <p className="mx-auto mb-8 max-w-xl leading-relaxed text-white/80">
                  Crea tu perfil, elige qué mostrar y pide tus stickers.
                </p>
                <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                  <Link
                    to={primaryHref}
                    className="btn group relative inline-flex overflow-hidden bg-white px-6 py-3 text-brand-500 shadow-soft hover:-translate-y-0.5 hover:bg-brand-50"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-brand-500/10 to-transparent transition-transform duration-700 group-hover:translate-x-full motion-reduce:hidden"
                    />
                    {primaryLabel}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Barra de acción fija (solo móvil) */}
      <div
        aria-hidden={!showBar}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-4 pt-3 backdrop-blur transition-transform duration-300 md:hidden ${
          showBar ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <Link to={primaryHref} tabIndex={showBar ? 0 : -1} className="btn-primary w-full py-3 text-sm">
          {primaryLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};

export default Home;