import React from 'react';
import { routes } from '../utils/routes';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  UserPlus,
  HeartPulse,
  SlidersHorizontal,
  Download,
  QrCode,
  ScanLine,
  Wifi,
  Smartphone,
  Eye,
} from 'lucide-react';
import { Card } from '../components/ui';
import Seo from '../components/Seo';
import { Reveal, PageHeader } from '../components/Section';

const steps = [
  {
    icon: UserPlus,
    title: 'Crea tu cuenta',
    text: 'Regístrate con tu correo y una contraseña segura. Es gratis y toma menos de un minuto.',
  },
  {
    icon: HeartPulse,
    title: 'Completa tu perfil de emergencia',
    text: 'Agrega tu nombre y tus contactos de emergencia. Si quieres, suma datos médicos útiles, como alergias o grupo sanguíneo.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Elige qué se muestra',
    text: 'Para cada dato decides si es público (se ve al escanear) o privado (solo lo ves tú). Puedes cambiarlo cuando quieras.',
  },
  {
    icon: Download,
    title: 'Descarga tu QR o pide un sticker',
    text: 'Obtén tu código QR digital o solicita un sticker personalizado para llevarlo contigo.',
  },
  {
    icon: QrCode,
    title: 'Colócalo a la vista',
    text: 'Pégalo en tu casco, moto o mochila, en un lugar visible y protegido del desgaste.',
  },
  {
    icon: ScanLine,
    title: 'Listo para una emergencia',
    text: 'Quien escanee el código abre tu perfil desde el navegador, sin cuenta ni aplicación, y ve solo lo que autorizaste.',
  },
];

const notes = [
  { icon: Wifi, text: 'Se necesita conexión a internet para abrir el perfil vinculado al QR.' },
  { icon: Smartphone, text: 'Quien escanea no necesita crear cuenta ni instalar ninguna aplicación.' },
  { icon: Eye, text: 'Tú decides qué información se ve, y puedes cambiarlo en cualquier momento.' },
];

export const HowItWorks = () => (
  <main className="min-h-screen">
    <Seo
      title="Cómo funciona"
      description="Seis pasos para crear tu perfil de emergencia, generar tu QR y permitir el acceso autorizado a tu información."
    />
    <PageHeader
      eyebrow="Cómo funciona"
      title="Tu red de seguridad, lista en minutos"
      subtitle="Seis pasos sencillos para que tu información importante esté disponible cuando haga falta."
    />

    <section className="pb-20">
      <div className="container-page">
        <div className="grid items-start gap-12 lg:grid-cols-5">
          <ol className="relative lg:col-span-3">
            <span
              className="absolute bottom-2 left-6 top-2 w-px bg-gradient-to-b from-brand-500/60 via-border to-transparent"
              aria-hidden="true"
            />
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative pb-8 pl-20 last:pb-0">
                <Reveal delay={0.05}>
                  <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full border border-brand-500/60 bg-brand-50 text-brand-500 shadow-glow">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Card className="p-6">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-500">
                      Paso {i + 1}
                    </span>
                    <h3 className="mb-1.5 text-lg font-semibold text-neutral-900">{title}</h3>
                    <p className="text-sm leading-relaxed text-text-secondary">{text}</p>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ol>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-2">
            <Reveal>
              <Card className="p-7">
                <h2 className="mb-5 font-semibold text-neutral-900">Antes de empezar, ten en cuenta</h2>
                <ul className="space-y-4 text-sm text-text-secondary">
                  {notes.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-3">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="pt-1 leading-relaxed">{text}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-7 text-white shadow-glow">
                <h2 className="mb-2 text-xl font-bold">¿Listo para empezar?</h2>
                <p className="mb-6 text-sm leading-relaxed text-white/80">
                  Crea tu perfil gratuito y ten tu QR en minutos.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                  <Link
                    to={routes.register}
                    className="btn bg-white px-5 py-2.5 text-sm text-brand-500 hover:bg-brand-50"
                  >
                    Crear perfil gratuito <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to={routes.products}
                    className="btn border border-white/40 px-5 py-2.5 text-sm text-white hover:bg-white/10"
                  >
                    Conocer el sticker
                  </Link>
                </div>
              </div>
            </Reveal>
          </aside>
        </div>
      </div>
    </section>
  </main>
);

export default HowItWorks;