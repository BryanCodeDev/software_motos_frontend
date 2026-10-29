import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../utils/routes';
import {
  ShieldCheck,
  Smartphone,
  QrCode,
  ScanLine,
  Phone,
  HeartPulse,
  UserPlus,
  SlidersHorizontal,
  Download,
  Lock,
  EyeOff,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Button, Card } from '../components/ui';
import Seo from '../components/Seo';
import { Reveal, SectionHeading, Accordion } from '../components/Section';
import { homeFaqs } from '../data/faqs';

const pillars = [
  {
    icon: ScanLine,
    title: 'Acceso inmediato',
    text: 'Quien escanea el código abre tu perfil en segundos desde el navegador del teléfono. Sin cuenta, sin aplicación.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Tú controlas la información',
    text: 'Decides campo por campo qué es público y qué permanece privado, y puedes cambiarlo cuando quieras.',
  },
  {
    icon: Lock,
    title: 'Diseñado con privacidad',
    text: 'El QR contiene solo un identificador aleatorio, nunca tus datos. Puedes desactivarlo o reemplazarlo en cualquier momento.',
  },
];

const steps = [
  { icon: UserPlus, title: 'Crea tu cuenta', text: 'Regístrate gratis con tu correo electrónico.' },
  { icon: HeartPulse, title: 'Completa tu perfil', text: 'Agrega contactos de emergencia y, si lo deseas, datos médicos.' },
  { icon: SlidersHorizontal, title: 'Define la privacidad', text: 'Elige qué información se muestra al escanear el código.' },
  { icon: Download, title: 'Obtén tu identificador', text: 'Descarga tu QR gratuito o solicita un sticker personalizado.' },
  { icon: QrCode, title: 'Colócalo a la vista', text: 'Casco, moto o mochila: en un lugar visible y protegido.' },
  { icon: Smartphone, title: 'Listo para emergencias', text: 'Quien escanee verá únicamente lo que autorizaste.' },
];

const products = [
  {
    name: 'QR digital básico',
    price: 'Gratis',
    desc: 'Perfil de emergencia, generación y descarga de tu código QR, sin costo por escaneo.',
    features: ['Perfil y contactos de emergencia', 'Control de visibilidad', 'Descarga del QR'],
    free: true,
  },
  {
    name: 'Sticker QR personalizado',
    price: 'Consultar precio',
    desc: 'Sticker físico con tu código QR vinculado a tu perfil, listo para colocar en casco o moto.',
    features: ['Diseño personalizado', 'Envío a domicilio', 'Reposición si lo pierdes'],
  },
  {
    name: 'QR + NFC',
    price: 'Próximamente',
    desc: 'Opción futura con tecnología NFC, sujeta a la validación del prototipo físico.',
    features: ['Lectura por proximidad', 'Compatible con tu perfil actual'],
    coming: true,
  },
];

const PhonePreview = () => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-sm"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-brand-deep/20 blur-3xl" aria-hidden="true" />
      <div className={reduce ? '' : 'animate-float'}>
        <div className="relative rounded-[2rem] border border-brand-border bg-brand-panel p-5 shadow-glow">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-brand-accent animate-pulse-ring" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-accent" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-accent">
                Perfil de emergencia
              </span>
            </div>
            <ShieldCheck className="w-4 h-4 text-brand-textMuted" />
          </div>

          <div className="rounded-xl bg-brand-dark/70 border border-brand-border p-4 mb-3">
            <div className="text-[11px] uppercase tracking-wider text-brand-textMuted mb-1">Nombre</div>
            <div className="font-semibold text-brand-text">Nombre del propietario</div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div className="rounded-xl bg-brand-dark/70 border border-brand-border p-4">
              <div className="text-[11px] uppercase tracking-wider text-brand-textMuted mb-1">Grupo sanguíneo</div>
              <div className="font-semibold text-brand-text">Si lo autorizas</div>
            </div>
            <div className="rounded-xl bg-brand-dark/70 border border-brand-border p-4">
              <div className="text-[11px] uppercase tracking-wider text-brand-textMuted mb-1">Alergias</div>
              <div className="font-semibold text-brand-text">Si lo autorizas</div>
            </div>
          </div>

          <div className="rounded-xl bg-brand-dark/70 border border-brand-border p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-brand-textMuted mb-1">Contacto de emergencia</div>
              <div className="font-semibold text-brand-text">Persona de confianza</div>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent text-brand-dark">
              <Phone className="w-4 h-4" />
            </span>
          </div>

          <p className="mt-4 text-[11px] text-brand-textMuted text-center">
            Ejemplo ilustrativo. Los datos reales los define el propietario.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export const Home = () => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  return (
    <main className="min-h-screen flex flex-col">
      <Seo
        title="Inicio"
        description="Perfil digital de emergencia con código QR para motociclistas. Si tú no puedes hablar, tu información importante puede hacerlo por ti."
      />

      {/* HERO */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-28 lg:pb-32">
        <div className="bg-grid absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div className="container-page relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="eyebrow mb-5">Identificación de emergencia</span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] mb-6">
                <span className="text-brand-accent">Si tú no puedes hablar,</span>
                <br />
                <span className="text-brand-text">tu información lo hará por ti.</span>
              </h1>
              <p className="text-brand-textMuted text-lg lg:text-xl mb-9 max-w-xl leading-relaxed">
                Crea un perfil digital de emergencia, decide qué datos compartir y vincúlalo a un código
                QR que cualquier persona puede escanear, sin instalar aplicaciones.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => navigate(routes.register)}>
                  Crear perfil gratuito <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate(routes.products)}>
                  Conocer el sticker
                </Button>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-textMuted">
                {['Sin costo por escaneo', 'Sin aplicaciones', 'Privacidad bajo tu control'].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-accent" /> {t}
                  </li>
                ))}
              </ul>
            </motion.div>

            <PhonePreview />
          </div>
        </div>
      </section>

      {/* PILARES */}
      <section className="section section-alt">
        <div className="container-page">
          <SectionHeading
            eyebrow="Por qué Identificación de Emergencia"
            title="Información clave, disponible cuando más importa"
            subtitle="En un accidente, cada minuto cuenta. Quienes auxilian pueden saber a quién llamar y qué necesitas, solo con la información que decidiste compartir."
          />
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <Card className="p-7 h-full">
                  <div className="w-11 h-11 rounded-lg bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center mb-5 text-brand-accent">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-brand-text mb-2">{title}</h3>
                  <p className="text-brand-textMuted text-sm leading-relaxed">{text}</p>
                </Card>
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
            title="De tu perfil a tu casco en seis pasos"
            subtitle="Un proceso claro y rápido. Sin aplicaciones, sin costos ocultos."
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={(i % 3) * 0.1}>
                <Card className="p-6 h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-lg bg-brand-accent text-brand-dark flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-3xl font-bold text-brand-border">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="font-semibold text-brand-text mb-1.5">{title}</h3>
                  <p className="text-brand-textMuted text-sm leading-relaxed">{text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-sm text-brand-textMuted text-center">
            Se necesita conexión a internet para consultar el perfil web vinculado al código QR.
          </p>
        </div>
      </section>

      {/* PRIVACIDAD DESTACADA */}
      <section className="section section-alt">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <span className="eyebrow mb-4">Privacidad y seguridad</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-brand-text leading-tight mb-5">
                Tus datos, bajo tus reglas
              </h2>
              <p className="text-brand-textMuted leading-relaxed mb-6">
                Tratamos la información de emergencia con el máximo cuidado. El código QR nunca
                contiene datos personales: solo apunta a tu perfil, y este responde únicamente con los
                campos que marcaste como públicos.
              </p>
              <Link to={routes.privacy} className="inline-flex items-center gap-2 text-brand-accent font-semibold hover:text-brand-accentHover transition-colors">
                Conocer nuestra política de privacidad <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: EyeOff, t: 'Campos privados protegidos', d: 'Los datos no públicos nunca se incluyen en la página de emergencia.' },
                { icon: QrCode, t: 'Identificadores aleatorios', d: 'Códigos únicos y difíciles de adivinar.' },
                { icon: ShieldCheck, t: 'Desactivación inmediata', d: 'Si pierdes tu sticker, lo inhabilitas desde tu cuenta.' },
                { icon: Lock, t: 'Acceso controlado', d: 'Roles separados para usuarios y administradores.' },
              ].map(({ icon: Icon, t, d }, i) => (
                <Reveal key={t} delay={i * 0.08}>
                  <div className="card-static p-5 h-full">
                    <Icon className="w-5 h-5 text-brand-accent mb-3" />
                    <h3 className="font-semibold text-brand-text text-sm mb-1">{t}</h3>
                    <p className="text-brand-textMuted text-xs leading-relaxed">{d}</p>
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
            title="Elige cómo llevar tu identificación"
            subtitle="Empieza gratis con tu QR digital y añade un sticker físico cuando lo necesites."
          />
          <div className="grid md:grid-cols-3 gap-6">
            {products.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.1}>
                <Card className={`p-7 h-full flex flex-col ${p.free ? 'border-brand-accent/40 shadow-glow' : ''}`}>
                  <div className="h-6 mb-3">
                    {p.free && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-[11px] font-semibold uppercase tracking-wider">
                        Más elegido
                      </span>
                    )}
                    {p.coming && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full border border-brand-gold/40 text-brand-gold text-[11px] font-semibold uppercase tracking-wider">
                        Próximamente
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg text-brand-text mb-1">{p.name}</h3>
                  <div className="text-2xl font-bold text-brand-text mb-3">{p.price}</div>
                  <p className="text-brand-textMuted text-sm leading-relaxed mb-5">{p.desc}</p>
                  <ul className="space-y-2 mb-7 text-sm text-brand-textMuted">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 text-brand-accent flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    {p.coming ? (
                      <span className="text-xs text-brand-textMuted">No disponible para compra aún</span>
                    ) : p.free ? (
                      <Link to={routes.register} className="btn-primary w-full">Obtener QR gratis</Link>
                    ) : (
                      <Link to={routes.products} className="btn-outline w-full">Solicitar sticker</Link>
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
          <div className="max-w-3xl mx-auto">
            <Accordion items={homeFaqs} />
            <div className="mt-8 text-center">
              <Link to={routes.faq} className="inline-flex items-center gap-2 text-brand-accent font-semibold hover:text-brand-accentHover transition-colors">
                Ver todas las preguntas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section">
        <div className="container-page">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl border border-brand-accent/30 bg-gradient-to-br from-brand-panel via-brand-navy to-brand-dark p-10 lg:p-16 text-center shadow-glow">
              <div className="bg-grid absolute inset-0 pointer-events-none opacity-60" aria-hidden="true" />
              <div className="relative">
                <h2 className="text-3xl lg:text-4xl font-bold text-brand-text mb-4">
                  Prepárate hoy, en menos de dos minutos
                </h2>
                <p className="text-brand-textMuted mb-8 max-w-xl mx-auto leading-relaxed">
                  Crea tu perfil gratuito, configura tu privacidad y descarga tu código QR.
                </p>
                <Link to={routes.register} className="btn-primary">
                  Crear mi perfil gratuito <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="mt-6 text-xs text-brand-textMuted max-w-lg mx-auto">
                  Herramienta de apoyo: no sustituye a los servicios oficiales de emergencia.
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
