import React from 'react';
import { Link } from 'react-router-dom';
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
  Check,
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

/* Banda de confianza justo debajo del hero */
const trust = [
  { icon: Smartphone, t: 'Sin aplicaciones', d: 'Se abre desde el navegador del teléfono' },
  { icon: BadgeDollarSign, t: 'Sin costo por escaneo', d: 'Quien te auxilia no paga ni se registra' },
  { icon: SlidersHorizontal, t: 'Tú decides qué se ve', d: 'Privacidad campo por campo' },
  { icon: ShieldCheck, t: 'QR sin datos personales', d: 'Solo contiene un código aleatorio' },
];

const pillars = [
  {
    icon: ScanLine,
    title: 'Acceso inmediato',
    text: 'Quien te ayuda escanea el QR y ve tu perfil en segundos. No necesita cuenta ni instalar nada.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Tú controlas la información',
    text: 'Eliges qué mostrar y qué guardar en privado, dato por dato. Puedes cambiarlo cuando quieras.',
  },
  {
    icon: Lock,
    title: 'Privacidad desde el diseño',
    text: 'El QR no lleva tus datos: solo un código aleatorio. Si lo pierdes, lo desactivas desde tu cuenta.',
  },
];

/* Qué pasa en una emergencia real */
const scene = [
  { icon: ScanLine, title: 'Escanean tu QR', text: 'Con la cámara de cualquier teléfono, sin descargar nada.' },
  { icon: HeartPulse, title: 'Ven lo que autorizaste', text: 'Nombre, datos médicos clave o lo que tú decidas mostrar.' },
  { icon: Phone, title: 'Llaman a tu contacto', text: 'Un toque y avisan a la persona que elegiste.' },
];

const steps = [
  { icon: UserPlus, title: 'Crea tu cuenta', text: 'Gratis y con solo tu correo.' },
  { icon: HeartPulse, title: 'Completa tu perfil', text: 'Contactos de emergencia y, si quieres, datos médicos.' },
  { icon: SlidersHorizontal, title: 'Define tu privacidad', text: 'Elige qué se muestra al escanear.' },
  { icon: Download, title: 'Obtén tu QR', text: 'Descárgalo gratis o pide un sticker.' },
  { icon: QrCode, title: 'Ponlo a la vista', text: 'En el casco, la moto o la mochila.' },
  { icon: Smartphone, title: 'Listo', text: 'Quien escanee verá solo lo que autorizaste.' },
];

const privacyPoints = [
  { icon: EyeOff, t: 'Datos privados protegidos', d: 'Lo que no marcas como público nunca aparece en la página de emergencia.' },
  { icon: QrCode, t: 'Códigos aleatorios', d: 'Cada QR es único y difícil de adivinar.' },
  { icon: ShieldCheck, t: 'Desactivación inmediata', d: 'Si pierdes tu sticker, lo bloqueas desde tu cuenta.' },
  { icon: Lock, t: 'Acceso controlado', d: 'Roles separados para usuarios y administradores.' },
];

const products = [
  {
    name: 'QR digital',
    price: 'Gratis',
    desc: 'Tu perfil de emergencia y tu código QR listo para descargar.',
    features: ['Perfil y contactos de emergencia', 'Control de visibilidad', 'Descarga de tu QR'],
    free: true,
  },
  {
    name: 'Sticker QR personalizado',
    price: 'Consultar precio',
    desc: 'Sticker físico vinculado a tu perfil, listo para pegar en el casco o la moto.',
    features: ['Diseño personalizado', 'Envío a domicilio', 'Reposición si lo pierdes'],
  },
  {
    name: 'QR + NFC',
    price: 'Próximamente',
    desc: 'Lectura por proximidad, en evaluación con un prototipo físico.',
    features: ['Lectura sin escanear', 'Compatible con tu perfil'],
    coming: true,
  },
];

export const Home = () => (
  <main className="min-h-screen flex flex-col">
    <Seo
      title="Inicio"
      description="Perfil digital de emergencia con código QR para motociclistas. Si tú no puedes hablar, tu información importante puede hacerlo por ti."
    />

    <HeroSection />

    {/* BANDA DE CONFIANZA */}
    <section className="border-b border-border/60 bg-white">
      <div className="container-page">
        <ul className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border/60">
          {trust.map(({ icon: Icon, t, d }) => (
            <li key={t} className="flex items-start gap-3 p-5 lg:p-6">
              <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{t}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{d}</p>
              </div>
            </li>
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
          subtitle="Quien te auxilia necesita saber a quién llamar y qué debe tener en cuenta. Tu QR se lo dice, solo con lo que tú decidiste compartir."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.1}>
              <Card className="h-full p-7">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-500">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">{title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{text}</p>
              </Card>
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
        <ol className="relative grid gap-6 md:grid-cols-3">
          <span
            className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-gradient-to-r from-brand-500/10 via-brand-500/40 to-brand-500/10 md:block"
            aria-hidden="true"
          />
          {scene.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.12}>
              <li className="relative flex flex-col items-center text-center">
                <span className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-glow ring-8 ring-brand-50">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mb-1.5 font-semibold text-neutral-900">{title}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-text-secondary">{text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
        <p className="mt-10 text-center text-xs text-text-secondary">
          Se necesita conexión a internet para abrir el perfil vinculado al QR.
        </p>
      </div>
    </section>

    {/* CÓMO FUNCIONA */}
    <section className="section section-alt">
      <div className="container-page">
        <SectionHeading
          eyebrow="Cómo funciona"
          title="De tu perfil a tu casco en seis pasos"
          subtitle="Un proceso corto, claro y sin costos ocultos."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={(i % 3) * 0.1}>
              <Card className="h-full p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-3xl font-bold text-brand-200">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="mb-1.5 font-semibold text-neutral-900">{title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to={routes.howItWorks}
            className="inline-flex items-center gap-2 font-semibold text-brand-500 transition-colors hover:text-brand-600"
          >
            Ver el proceso completo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>

    {/* PRIVACIDAD (sección oscura) */}
    <section className="section relative overflow-hidden bg-brand-900 text-white">
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl"
        aria-hidden="true"
      />
      <div className="container-page relative">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="mb-4 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
              <span className="h-px w-6 bg-brand-300" aria-hidden="true" />
              Privacidad y seguridad
            </span>
            <h2 className="mb-5 text-3xl font-bold leading-tight lg:text-4xl">Tus datos, bajo tus reglas</h2>
            <p className="mb-6 leading-relaxed text-white/80">
              Tu QR nunca contiene datos personales: solo apunta a tu perfil, y el perfil muestra
              únicamente los campos que marcaste como públicos. Lo demás se queda contigo.
            </p>
            <Link
              to={routes.privacy}
              className="inline-flex items-center gap-2 font-semibold text-brand-300 transition-colors hover:text-white"
            >
              Leer cómo protegemos tu información <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {privacyPoints.map(({ icon: Icon, t, d }, i) => (
              <Reveal key={t} delay={i * 0.08}>
                <div className="h-full rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <Icon className="mb-3 h-5 w-5 text-brand-300" />
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
          title="Empieza gratis, suma el sticker cuando quieras"
          subtitle="Tu QR digital te acompaña desde el primer día. El sticker físico lo pone a la vista en tu casco o moto."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {products.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.1}>
              <Card className={`flex h-full flex-col p-7 ${p.free ? 'border-brand-500/40 shadow-glow' : ''}`}>
                <div className="mb-3 h-6">
                  {p.free && (
                    <span className="inline-block rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-500">
                      Más elegido
                    </span>
                  )}
                  {p.coming && (
                    <span className="inline-block rounded-full border border-brand-500/40 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-500">
                      Próximamente
                    </span>
                  )}
                </div>
                <h3 className="mb-1 text-lg font-semibold text-neutral-900">{p.name}</h3>
                <div className="mb-3 text-2xl font-bold text-neutral-900">{p.price}</div>
                <p className="mb-5 text-sm leading-relaxed text-text-secondary">{p.desc}</p>
                <ul className="mb-7 space-y-2 text-sm text-text-secondary">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  {p.coming ? (
                    <span className="text-xs text-text-secondary">Aún no está disponible</span>
                  ) : p.free ? (
                    <Link to={routes.register} className="btn-primary w-full">Obtener mi QR gratis</Link>
                  ) : (
                    <Link to={routes.products} className="btn-outline w-full">Quiero el sticker</Link>
                  )}
                </div>
              </Card>
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
          subtitle="Lo esencial antes de crear tu perfil de emergencia."
        />
        <div className="mx-auto max-w-3xl">
          <Accordion items={homeFaqs} />
          <div className="mt-8 text-center">
            <Link
              to={routes.faq}
              className="inline-flex items-center gap-2 font-semibold text-brand-500 transition-colors hover:text-brand-600"
            >
              Ver todas las preguntas <ArrowRight className="h-4 w-4" />
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
            <div className="relative">
              <Globe className="mx-auto mb-5 h-8 w-8 text-brand-300" aria-hidden="true" />
              <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
                Prepárate hoy, en menos de dos minutos
              </h2>
              <p className="mx-auto mb-8 max-w-xl leading-relaxed text-white/80">
                Crea tu perfil gratuito, elige qué compartir y descarga tu QR. Mañana saldrás a la
                carretera con una protección más.
              </p>
              <Link
                to={routes.register}
                className="btn inline-flex bg-white px-6 py-3 text-brand-500 shadow-soft hover:-translate-y-0.5 hover:bg-brand-50"
              >
                Crear mi perfil gratuito <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mx-auto mt-6 max-w-lg text-xs text-white/60">
                Herramienta de apoyo: no sustituye a los servicios oficiales de emergencia.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  </main>
);

export default Home;