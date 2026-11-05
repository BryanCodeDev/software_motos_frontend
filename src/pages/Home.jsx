import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { Button, Card } from '../components/ui';
import Seo from '../components/Seo';
import { HeroSection } from '../components/HeroSection';
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

export const Home = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen flex flex-col">
      <Seo
        title="Inicio"
        description="Perfil digital de emergencia con código QR para motociclistas. Si tú no puedes hablar, tu información importante puede hacerlo por ti."
      />

      <HeroSection />

      {/* PILARES */}
      <section className="section section-alt">
        <div className="container-page">
          <SectionHeading
            eyebrow="Por qué Tu QR te Cuida"
            title="Información clave, disponible cuando más importa"
            subtitle="En un accidente, cada minuto cuenta. Quienes auxilian pueden saber a quién llamar y qué necesitas, solo con la información que decidiste compartir."
          />
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.1}>
                <Card className="p-7 h-full">
                  <div className="w-11 h-11 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mb-5 text-brand-500">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-neutral-900 mb-2">{title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{text}</p>
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
                    <div className="w-10 h-10 rounded-lg bg-brand-500 text-white flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-3xl font-bold text-border">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-1.5">{title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-sm text-text-secondary text-center">
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
              <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 leading-tight mb-5">
                Tus datos, bajo tus reglas
              </h2>
              <p className="text-text-secondary leading-relaxed mb-6">
                Tratamos la información de emergencia con el máximo cuidado. El código QR nunca
                contiene datos personales: solo apunta a tu perfil, y este responde únicamente con los
                campos que marcaste como públicos.
              </p>
              <Link to={routes.privacy} className="inline-flex items-center gap-2 text-brand-500 font-semibold hover:text-brand-500Hover transition-colors">
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
                    <Icon className="w-5 h-5 text-brand-500 mb-3" />
                    <h3 className="font-semibold text-neutral-900 text-sm mb-1">{t}</h3>
                    <p className="text-text-secondary text-xs leading-relaxed">{d}</p>
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
                <Card className={`p-7 h-full flex flex-col ${p.free ? 'border-brand-500/40 shadow-glow' : ''}`}>
                  <div className="h-6 mb-3">
                    {p.free && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-500 text-[11px] font-semibold uppercase tracking-wider">
                        Más elegido
                      </span>
                    )}
                    {p.coming && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full border border-brand-500/40 text-brand-500 text-[11px] font-semibold uppercase tracking-wider">
                        Próximamente
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg text-neutral-900 mb-1">{p.name}</h3>
                  <div className="text-2xl font-bold text-neutral-900 mb-3">{p.price}</div>
                  <p className="text-text-secondary text-sm leading-relaxed mb-5">{p.desc}</p>
                  <ul className="space-y-2 mb-7 text-sm text-text-secondary">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 text-brand-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    {p.coming ? (
                      <span className="text-xs text-text-secondary">No disponible para compra aún</span>
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
              <Link to={routes.faq} className="inline-flex items-center gap-2 text-brand-500 font-semibold hover:text-brand-500Hover transition-colors">
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
            <div className="relative overflow-hidden rounded-2xl border border-brand-500/30 bg-gradient-to-br from-neutral-50 via-brand-100 to-brand-50 p-10 lg:p-16 text-center shadow-glow">
              <div className="bg-grid absolute inset-0 pointer-events-none opacity-60" aria-hidden="true" />
              <div className="relative">
                <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
                  Prepárate hoy, en menos de dos minutos
                </h2>
                <p className="text-text-secondary mb-8 max-w-xl mx-auto leading-relaxed">
                  Crea tu perfil gratuito, configura tu privacidad y descarga tu código QR.
                </p>
                <Link to={routes.register} className="btn-primary">
                  Crear mi perfil gratuito <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="mt-6 text-xs text-text-secondary max-w-lg mx-auto">
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


