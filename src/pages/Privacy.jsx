import React, { useState } from 'react';
import { routes } from '../utils/routes';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Lock, Database, EyeOff, Trash2, AlertTriangle, ArrowRight, SlidersHorizontal, QrCode,
  FileText, ChevronDown,
} from 'lucide-react';
import { Card } from '../components/ui';
import Seo from '../components/Seo';
import { Reveal, PageHeader } from '../components/Section';

const principles = [
  { icon: SlidersHorizontal, t: 'Tú decides', d: 'Cada dato es público o privado, campo por campo, desde tu centro de privacidad.' },
  { icon: QrCode, t: 'El QR no guarda datos', d: 'Solo contiene un código aleatorio, nunca datos personales ni médicos.' },
  { icon: Lock, t: 'Control total', d: 'Edita, oculta o elimina tu información cuando quieras.' },
];

const sections = [
  {
    icon: Database,
    title: 'Qué datos puedes guardar',
    items: [
      'Tu nombre, o la forma de identificación que prefieras mostrar.',
      'Una fotografía (opcional).',
      'Datos de contacto de las personas a quienes avisar, con su orden de prioridad.',
      'Información médica opcional: alergias, condiciones médicas y medicamentos.',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Todo lo médico es opcional',
    items: [
      'No te pedimos información que no necesites compartir.',
      'La fotografía y los contactos adicionales también son opcionales.',
    ],
  },
  {
    icon: EyeOff,
    title: 'Quién puede ver tu información',
    items: [
      'Quien escanea tu QR activo ve únicamente los campos que marcaste como públicos, sin crear cuenta.',
      'Los datos privados nunca viajan en el QR ni en la dirección pública.',
      'Cambias la visibilidad de cada campo desde tu cuenta, cuando quieras.',
    ],
  },
  {
    icon: Trash2,
    title: 'Corregir o eliminar tus datos',
    items: [
      'Puedes editar tu perfil en cualquier momento desde tu cuenta.',
      'Puedes solicitar la eliminación de tus datos desde los controles de privacidad.',
      'Desactivar tu QR no borra tu cuenta, y puedes volver a activarlo.',
      'Si pierdes un sticker, lo desactivas o lo reemplazas desde tu cuenta.',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Lo que debes saber',
    items: [
      'Es una herramienta de apoyo: no garantiza atención médica ni sustituye a los servicios oficiales de emergencia.',
      'No podemos asegurar que alguien escanee tu código ni que la respuesta sea inmediata.',
      'Abrir el perfil requiere conexión a internet.',
    ],
  },
];

/** Tarjeta plegable en móvil (menos texto a la vista) y siempre abierta desde md. */
const SectionCard = ({ icon: Icon, title, items, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="h-full overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-[64px] w-full items-center gap-3 p-4 text-left focus-ring md:pointer-events-none md:p-7 md:pb-5"
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-500">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="flex-1 font-semibold text-neutral-900">{title}</h2>
        <ChevronDown className={`h-5 w-5 flex-none text-text-secondary transition-transform duration-300 md:hidden ${open ? 'rotate-180 text-brand-500' : ''}`} aria-hidden="true" />
      </button>
      <ul className={`space-y-3 px-4 pb-5 text-sm leading-relaxed text-text-secondary md:block md:px-7 md:pb-7 ${open ? 'block' : 'hidden'}`}>
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
};

export const Privacy = () => (
  <main className="min-h-screen">
    <Seo
      title="Privacidad y seguridad"
      description="Qué datos se almacenan, quién puede verlos, cómo configurar la visibilidad y cómo gestionar tus derechos de privacidad."
      noindex
    />
    <PageHeader
      eyebrow="Privacidad y seguridad"
      title="Tú decides qué compartes"
      subtitle="Tu información está bajo tu control. Aquí te explicamos, sin tecnicismos, qué guardamos, quién puede verla y cómo gestionarla."
    />

    <section className="pb-16 sm:pb-20">
      <div className="container-page">
        <ul className="mb-8 grid gap-3 sm:grid-cols-3 sm:gap-4 md:mb-10">
          {principles.map(({ icon: Icon, t, d }, i) => (
            <Reveal as="li" key={t} delay={i * 0.08} className="h-full">
              <div className="flex h-full items-start gap-3 rounded-xl border border-brand-500/20 bg-white p-4 shadow-soft sm:p-5">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-brand-500 text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{t}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>

        <div className="grid gap-3 md:grid-cols-2 md:gap-6">
          {sections.map((section, i) => (
            <Reveal key={section.title} delay={(i % 2) * 0.1}>
              <SectionCard {...section} defaultOpen={i === 0} />
            </Reveal>
          ))}

          <Reveal delay={0.1}>
            <Card className="h-full border-brand-500/30 p-5 sm:p-7">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-500">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="font-semibold text-neutral-900">Documentos legales</h2>
              </div>
              <ul className="space-y-2">
                {[
                  { to: routes.terms, t: 'Términos y Condiciones de Uso', d: 'Reglas de uso de la plataforma, compras y responsabilidad.' },
                  { to: routes.privacyPolicy, t: 'Política de Privacidad y Tratamiento de Datos', d: 'Qué datos recopilamos, cómo se protegen y cómo ejercer tus derechos.' },
                ].map(({ to, t, d }) => (
                  <li key={to}>
                    <Link to={to} className="group flex min-h-[64px] items-center gap-3 rounded-xl border border-border bg-brand-50/50 p-3 transition-all duration-200 hover:border-brand-500/50 hover:bg-white active:scale-[0.99]">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neutral-900">{t}</p>
                        <p className="text-xs leading-relaxed text-text-secondary">{d}</p>
                      </div>
                      <ArrowRight size={16} className="flex-none text-brand-500 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>

        <Reveal className="mt-8 md:mt-12">
          <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-6 text-white shadow-glow sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="mb-1 text-xl font-bold">¿Tienes dudas sobre tus datos?</h2>
              <p className="text-sm text-white/80">Escríbenos y te ayudamos a resolverlas.</p>
            </div>
            <Link to={routes.contact} className="btn min-h-[48px] w-full flex-shrink-0 bg-white px-5 text-sm text-brand-500 hover:bg-brand-50 sm:w-auto">
              Contactar con soporte <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  </main>
);

export default Privacy;