import React from 'react';
import { routes } from '../utils/routes';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Database, EyeOff, Trash2, AlertTriangle, ArrowRight, SlidersHorizontal, QrCode } from 'lucide-react';
import { Card } from '../components/ui';
import Seo from '../components/Seo';
import { Reveal, PageHeader } from '../components/Section';

const principles = [
  { icon: SlidersHorizontal, t: 'Tú decides', d: 'Cada dato es público o privado, campo por campo.' },
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
      'Estamos validando la durabilidad del material del sticker físico; colócalo en un lugar visible y protegido del desgaste.',
    ],
  },
];

export const Privacy = () => (
  <main className="min-h-screen">
    <Seo
      title="Privacidad y seguridad"
      description="Qué datos se almacenan, quién puede verlos, cómo configurar la visibilidad y cómo eliminar tu información."
    />
    <PageHeader
      eyebrow="Privacidad y seguridad"
      title="Tú decides qué compartes"
      subtitle="Tu información está bajo tu control. Aquí te explicamos, sin tecnicismos, qué guardamos, quién puede verla y cómo gestionarla."
    />

    <section className="pb-20">
      <div className="container-page">
        <ul className="mb-10 grid gap-4 sm:grid-cols-3">
          {principles.map(({ icon: Icon, t, d }, i) => (
            <Reveal key={t} delay={i * 0.08}>
              <li className="flex h-full items-start gap-3 rounded-xl border border-brand-500/20 bg-white p-5 shadow-soft">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-500 text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{t}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{d}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ul>

        <div className="grid gap-6 md:grid-cols-2">
          {sections.map(({ icon: Icon, title, items }, i) => (
            <Reveal key={title} delay={(i % 2) * 0.1}>
              <Card className="h-full p-7">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-500">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="font-semibold text-neutral-900">{title}</h2>
                </div>
                <ul className="space-y-3 text-sm leading-relaxed text-text-secondary">
                  {items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          ))}

          <Reveal delay={0.1}>
            <Card className="h-full border-brand-500/30 p-7">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-500">
                  <Lock className="h-5 w-5" />
                </span>
                <h2 className="font-semibold text-neutral-900">Seguridad de tu cuenta y registros</h2>
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">
                Tu sesión se protege con cookies seguras, limitamos las solicitudes repetidas y confirmamos
                los pagos desde nuestro servidor. También registramos las acciones sensibles para poder
                auditarlas, sin guardar copias innecesarias de datos médicos ni de información privada.
              </p>
            </Card>
          </Reveal>
        </div>

        <Reveal className="mt-12">
          <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-8 text-white shadow-glow sm:flex-row sm:items-center">
            <div>
              <h2 className="mb-1 text-xl font-bold">¿Tienes dudas sobre tus datos?</h2>
              <p className="text-sm text-white/80">Escríbenos y te ayudamos a resolverlas.</p>
            </div>
            <Link to={routes.contact} className="btn flex-shrink-0 bg-white px-5 py-2.5 text-sm text-brand-500 hover:bg-brand-50">
              Contactar con soporte <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  </main>
);

export default Privacy;