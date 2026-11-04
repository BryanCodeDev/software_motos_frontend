import React from 'react';
import { routes } from '../utils/routes';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Database, EyeOff, Trash2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui';
import Seo from '../components/Seo';
import { Reveal, PageHeader } from '../components/Section';

const sections = [
  {
    icon: Database,
    title: 'Qué datos se pueden almacenar',
    items: [
      'Nombre o forma de identificación que elijas mostrar.',
      'Fotografía opcional.',
      'Datos de contacto pertinentes.',
      'Información médica opcional: alergias, condiciones médicas y medicamentos.',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Datos opcionales',
    items: [
      'Todos los campos médicos son opcionales. No se exige información innecesaria.',
      'La fotografía y los contactos adicionales también son opcionales.',
    ],
  },
  {
    icon: EyeOff,
    title: 'Quién puede ver la información',
    items: [
      'Solo la información que marques como pública se muestra en tu página de emergencia.',
      'Los datos privados nunca se incluyen en el código QR ni en la dirección pública.',
      'Controlas la visibilidad de cada campo desde tu cuenta.',
    ],
  },
  {
    icon: Trash2,
    title: 'Cómo corregir o eliminar tu información',
    items: [
      'Puedes editar tu perfil en cualquier momento desde tu cuenta.',
      'Puedes solicitar la eliminación de tus datos desde los controles de privacidad.',
      'Desactivar tu identificador no borra tu cuenta; puedes volver a activarlo.',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Limitaciones del producto',
    items: [
      'La plataforma no garantiza atención médica ni sustituye a los servicios oficiales de emergencia.',
      'El acceso al perfil requiere conexión a internet.',
      'La durabilidad del material físico del sticker debe validarse por separado.',
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
      subtitle="Tu información permanece bajo tu control. Aquí explicamos qué datos se almacenan, quién puede verlos y cómo gestionarlos."
    />

    <section className="pb-20">
      <div className="container-page">
        <div className="grid md:grid-cols-2 gap-6">
          {sections.map(({ icon: Icon, title, items }, i) => (
            <Reveal key={title} delay={(i % 2) * 0.1}>
              <Card className="p-7 h-full">
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-500">
                    <Icon className="w-5 h-5" />
                  </span>
                  <h2 className="font-semibold text-neutral-900">{title}</h2>
                </div>
                <ul className="space-y-3 text-text-secondary text-sm leading-relaxed">
                  {items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1 w-1 rounded-full bg-brand-500 flex-shrink-0" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          ))}

          <Reveal delay={0.1}>
            <Card className="p-7 h-full border-brand-500/30">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-500">
                  <Lock className="w-5 h-5" />
                </span>
                <h2 className="font-semibold text-neutral-900">Datos sensibles en registros</h2>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                Los registros de auditoría no almacenan copias innecesarias de datos médicos ni información
                privada sensible.
              </p>
            </Card>
          </Reveal>
        </div>

        <Reveal className="mt-12">
          <Link to={routes.contact} className="btn-outline">
            Contactar con soporte <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  </main>
);

export default Privacy;

