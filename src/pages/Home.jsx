import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { routes } from '../utils/routes';
import {
  ScanLine,
  SlidersHorizontal,
  Lock,
  UserPlus,
  HeartPulse,
  Download,
  QrCode,
  Smartphone,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Globe,
  BadgeDollarSign,
  Phone,
} from 'lucide-react';
import { Card } from '../components/ui';
import Seo from '../components/Seo';
import { HeroSection } from '../components/HeroSection';
import { Reveal, SectionHeading, Accordion } from '../components/Section';
import { homeFaqs } from '../data/faqs';
import { productPlans } from '../data/products';
import { PlanCard } from '../components/PlanCard';

const EASE = [0.22, 1, 0.36, 1];

/* Banda de confianza justo debajo del hero */
const trust = [
  { icon: Smartphone, t: 'Sin apps ni cuenta', d: 'Se abre directo desde la cámara del teléfono' },
  { icon: BadgeDollarSign, t: 'Escanear es gratis', d: 'Quien te auxilia no paga ni se registra' },
  { icon: SlidersHorizontal, t: 'Privacidad campo por campo', d: 'Tú decides qué se ve y qué no' },
  { icon: ShieldCheck, t: 'QR sin datos personales', d: 'Solo contiene un código aleatorio' },
];

const pillars = [
  {
    icon: ScanLine,
    title: 'Acceso inmediato',
    text: 'Quien te auxilia escanea el QR y ve tu perfil en segundos, sin cuenta y sin instalar nada.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Tú controlas la información',
    text: 'Decides, dato por dato, qué se muestra al escanear y qué queda solo para ti. Lo cambias cuando quieras.',
  },
  {
    icon: Lock,
    title: 'Privacidad desde el diseño',
    text: 'Tu QR no lleva tus datos, solo un código aleatorio. Si lo pierdes, lo desactivas o lo reemplazas desde tu cuenta.',
  },
];

/* Qué pasa en una emergencia real */
const scene = [
  { icon: ScanLine, title: 'Escanean tu QR', text: 'Con la cámara de cualquier teléfono, sin descargar nada.' },
  { icon: HeartPulse, title: 'Ven lo que autorizaste', text: 'Tu nombre, datos médicos clave o solo lo que tú decidas mostrar.' },
  { icon: Phone, title: 'Llaman a tu contacto', text: 'Con un toque llaman o escriben a la persona que elegiste.' },
];

const steps = [
  { icon: UserPlus, title: 'Crea tu cuenta', text: 'Es gratis y solo necesitas tu correo.' },
  { icon: HeartPulse, title: 'Completa tu perfil', text: 'Agrega contactos de emergencia y, si quieres, datos médicos útiles.' },
  { icon: SlidersHorizontal, title: 'Define tu privacidad', text: 'Elige qué se muestra al escanear.' },
  { icon: Download, title: 'Obtén tu QR', text: 'Descárgalo gratis o pide tus stickers.' },
  { icon: QrCode, title: 'Ponlo a la vista', text: 'En tu casco, tu moto, tu mochila o donde quieras.' },
  { icon: Smartphone, title: 'Listo para salir', text: 'Quien escanee verá solo lo que autorizaste.' },
];

const privacyPoints = [
  { icon: EyeOff, t: 'Datos privados protegidos', d: 'Lo que no marcas como público nunca aparece en la página de emergencia.' },
  { icon: QrCode, t: 'Códigos aleatorios', d: 'Cada QR es único y muy difícil de adivinar.' },
  { icon: ShieldCheck, t: 'Desactivación inmediata', d: 'Si pierdes un sticker, lo bloqueas o lo reemplazas desde tu cuenta.' },
  { icon: Lock, t: 'Acceso controlado', d: 'Roles separados para usuarios y administradores, con registro de las acciones sensibles.' },
];

/* Datos estructurados: las preguntas frecuentes pueden aparecer como resultado enriquecido en Google. */
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: homeFaqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

/** Tarjeta con un reflejo suave que sigue al cursor. */
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
            'radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(159,18,57,0.09), transparent 70%)',
        }}
      />
      <div className="relative">{children}</div>
    </Card>
  );
};

export const Home = () => {
  const reduce = useReducedMotion();

  return (
    <main id="contenido" className="flex min-h-screen flex-col">
      <Seo
        title="Inicio"
        description="Perfil de emergencia con código QR para motociclistas en Colombia. Si no puedes hablar, tu información importante habla por ti."
        jsonLd={faqJsonLd}
      />

      <HeroSection />

      {/* BANDA DE CONFIANZA */}
      <section className="border-b border-border/60 bg-white" aria-label="Por qué confiar">
        <div className="container-page">
          <ul className="grid grid-cols-2 divide-x divide-y divide-border/60 lg:grid-cols-4 lg:divide-y-0">
            {trust.map(({ icon: Icon, t, d }, i) => (
              <Reveal as="li" key={t} delay={i * 0.07} y={14} className="group flex items-start gap-3 p-5 lg:p-6">
                <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{t}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{d}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* POR QUÉ */}
      <section className="section section-alt">
        <div className="container-page">
          <SectionHeading
            eyebrow="Por qué Tu QR te Cuida"
            title="En un accidente, cada minuto cuenta"
            subtitle="Si estás inconsciente o no puedes hablar, quien te auxilia no sabe a quién llamar. Tu QR se lo dice, solo con lo que tú decidiste compartir."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <SpotlightCard className="p-7">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-500 transition-all duration-300 group-hover:rotate-6 group-hover:bg-brand-500 group-hover:text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900">{title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{text}</p>
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
            eyebrow="En el momento clave"
            title="Así te ayuda tu QR en tres pasos"
            subtitle="Pensado para que cualquier persona pueda actuar rápido, incluso sin conocerte."
          />
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-6">
            {/* La línea se dibuja al entrar en pantalla */}
            <motion.span
              aria-hidden="true"
              className="absolute left-[16%] right-[16%] top-7 hidden h-px origin-left bg-gradient-to-r from-brand-500/20 via-brand-500/50 to-brand-500/20 md:block"
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1.1, delay: 0.2, ease: EASE }}
            />
            {scene.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={i * 0.18} className="relative flex flex-col items-center text-center">
                <span className="relative mb-5 flex h-14 w-14 items-center justify-center">
                  <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand-500/40 animate-pulse-ring" />
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-glow ring-8 ring-brand-50 transition-transform duration-300 hover:scale-110">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </span>
                <h3 className="mb-1.5 font-semibold text-neutral-900">{title}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-text-secondary">{text}</p>
              </Reveal>
            ))}
          </ol>
          <p className="mt-10 text-center text-xs text-text-secondary">
            Se necesita conexión a internet para abrir el perfil vinculado al QR. Es una herramienta de apoyo y
            no reemplaza a los servicios oficiales de emergencia.
          </p>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="section section-alt">
        <div className="container-page">
          <SectionHeading
            eyebrow="Cómo funciona"
            title="De tu perfil a tu casco en seis pasos"
            subtitle="Un proceso corto y claro. Crear tu perfil y descargar tu QR es gratis."
          />
          <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={(i % 3) * 0.1} className="list-none">
                <Card className="group h-full p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span
                      className="text-3xl font-bold tabular-nums text-brand-200 transition-colors duration-300 group-hover:text-brand-500"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mb-1.5 font-semibold text-neutral-900">
                    <span className="sr-only">Paso {i + 1}: </span>
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{text}</p>
                </Card>
              </Reveal>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Link
              to={routes.howItWorks}
              className="group inline-flex items-center gap-2 font-semibold text-brand-500 transition-colors hover:text-brand-600"
            >
              Ver el proceso completo
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* PRIVACIDAD (sección oscura) */}
      <section className="section relative overflow-hidden bg-brand-900 text-white">
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl animate-float"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-brand-700/40 blur-3xl"
          aria-hidden="true"
        />
        <div className="container-page relative">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <span className="mb-4 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
                <span className="h-px w-6 bg-brand-300" aria-hidden="true" />
                Privacidad y seguridad
              </span>
              <h2 className="mb-5 text-3xl font-bold leading-tight [text-wrap:balance] lg:text-4xl">
                Tus datos, bajo tus reglas
              </h2>
              <p className="mb-6 leading-relaxed text-white/80">
                Tu QR nunca contiene datos personales ni médicos: solo apunta a tu perfil, y el perfil muestra
                únicamente los campos que marcaste como públicos. Todo lo demás se queda contigo.
              </p>
              <Link
                to={routes.privacy}
                className="group inline-flex items-center gap-2 font-semibold text-brand-300 transition-colors hover:text-white"
              >
                Leer cómo protegemos tu información
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2">
              {privacyPoints.map(({ icon: Icon, t, d }, i) => (
                <Reveal key={t} delay={i * 0.08}>
                  <div className="group h-full rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-300/40 hover:bg-white/10">
                    <Icon
                      className="mb-3 h-5 w-5 text-brand-300 transition-transform duration-300 group-hover:scale-110"
                      aria-hidden="true"
                    />
                    <h3 className="mb-1 text-sm font-semibold">{t}</h3>
                    <p className="text-xs leading-relaxed text-white/70">{d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTOS */}
      <section className="section">
        <div className="container-page">
          <SectionHeading
            eyebrow="Productos"
            title="Empieza gratis, suma tus stickers cuando quieras"
            subtitle="Tu QR digital te acompaña desde el primer día. Los stickers lo ponen a la vista en tu casco, tu moto o donde prefieras."
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {productPlans.map((p, i) => (
              <Reveal key={p.name} delay={(i % 4) * 0.1}>
                <PlanCard plan={p} />
              </Reveal>
            ))}
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
              <Link
                to={routes.faq}
                className="group inline-flex items-center gap-2 font-semibold text-brand-500 transition-colors hover:text-brand-600"
              >
                Ver todas las preguntas
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section">
        <div className="container-page">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-10 text-center shadow-glow lg:p-16">
              <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-float"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-black/25 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative">
                <Globe className="mx-auto mb-5 h-8 w-8 text-brand-300" aria-hidden="true" />
                <h2 className="mb-4 text-3xl font-bold text-white [text-wrap:balance] lg:text-4xl">
                  Prepárate hoy, en menos de dos minutos
                </h2>
                <p className="mx-auto mb-8 max-w-xl leading-relaxed text-white/80">
                  Crea tu perfil gratuito, elige qué compartir y descarga tu QR. La próxima vez que salgas a
                  la carretera, irás con una protección más.
                </p>
                <Link
                  to={routes.register}
                  className="btn group relative inline-flex overflow-hidden bg-white px-6 py-3 text-brand-500 shadow-soft hover:-translate-y-0.5 hover:bg-brand-50"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-brand-500/10 to-transparent transition-transform duration-700 group-hover:translate-x-full motion-reduce:hidden"
                  />
                  Crear mi perfil gratuito
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <p className="mx-auto mt-6 max-w-lg text-xs text-white/60">
                  Herramienta de apoyo: no sustituye a los servicios oficiales de emergencia ni garantiza que
                  alguien escanee el código.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default Home;