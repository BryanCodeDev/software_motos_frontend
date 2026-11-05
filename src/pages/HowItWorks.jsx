import React from 'react';
import { routes } from '../utils/routes';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui';
import Seo from '../components/Seo';
import { Reveal, PageHeader } from '../components/Section';

const steps = [
  {
    n: '01',
    title: 'Crea tu cuenta',
    text: 'Regístrate con tu correo electrónico y una contraseña segura. Es gratis y toma menos de un minuto.',
  },
  {
    n: '02',
    title: 'Completa tu perfil de emergencia',
    text: 'Agrega tu nombre, tus contactos de emergencia y, si lo deseas, la información médica que consideres útil.',
  },
  {
    n: '03',
    title: 'Define qué compartir',
    text: 'Configura la visibilidad de cada campo: qué datos son públicos al escanear el código y cuáles permanecen privados.',
  },
  {
    n: '04',
    title: 'Descarga tu QR o solicita un sticker',
    text: 'Obtén tu código QR digital sin costo o pide un sticker personalizado para llevarlo contigo.',
  },
  {
    n: '05',
    title: 'Colócalo en un lugar visible',
    text: 'Pega el identificador en tu casco, moto o mochila, en una zona visible y protegida del desgaste.',
  },
  {
    n: '06',
    title: 'Acceso autorizado en una emergencia',
    text: 'Quien escanee el código abre tu página pública desde su navegador, sin crear cuenta ni instalar nada, y consulta solo lo que autorizaste.',
  },
];

const notes = [
  'Se necesita conexión a internet para consultar el perfil web vinculado al QR.',
  'Quien escanea no necesita crear cuenta ni instalar ninguna aplicación.',
  'Tú decides qué información se muestra públicamente, en cada momento.',
];

export const HowItWorks = () => (
  <main className="min-h-screen">
    <Seo
      title="Cómo funciona"
      description="Pasos para crear tu perfil de emergencia, generar tu QR y permitir el acceso autorizado a tu información."
    />
    <PageHeader
      eyebrow="Cómo funciona"
      title="Tu red de seguridad, lista en minutos"
      subtitle="Seis pasos sencillos para que tu información importante esté disponible cuando haga falta."
    />

    <section className="pb-20">
      <div className="container-page">
        <ol className="relative max-w-3xl">
          <span className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-brand-500/60 via-border to-transparent" aria-hidden="true" />
          {steps.map((step, i) => (
            <li key={step.n} className="relative pl-20 pb-10 last:pb-0">
              <Reveal delay={0.05}>
                <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-brand-50 border border-brand-500/60 flex items-center justify-center text-brand-500 font-bold shadow-glow">
                  {step.n}
                </div>
                <Card className="p-6">
                  <h3 className="font-semibold text-lg text-neutral-900 mb-1.5">{step.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{step.text}</p>
                </Card>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal className="mt-16 max-w-3xl">
          <Card className="p-8 lg:p-10">
            <h3 className="font-semibold text-neutral-900 mb-5">Es importante que sepas</h3>
            <ul className="space-y-3 text-text-secondary text-sm">
              {notes.map((n) => (
                <li key={n} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-brand-500 flex-shrink-0" />
                  {n}
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal className="mt-12 flex flex-col sm:flex-row gap-4">
          <Link to={routes.register} className="btn-primary">
            Crear perfil gratuito <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to={routes.products} className="btn-outline">
            Conocer el sticker
          </Link>
        </Reveal>
      </div>
    </section>
  </main>
);

export default HowItWorks;



