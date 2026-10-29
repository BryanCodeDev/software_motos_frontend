import React from 'react';
import { routes } from '../utils/routes';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Seo from '../components/Seo';
import { Reveal, PageHeader, Accordion } from '../components/Section';
import { faqs } from '../data/faqs';

export const FAQ = () => (
  <main className="min-h-screen">
    <Seo
      title="Preguntas frecuentes"
      description="Respuestas sobre cómo funciona el QR de emergencia, privacidad, stickers y pagos."
    />
    <PageHeader
      eyebrow="Preguntas frecuentes"
      title="Todo lo que necesitas saber"
      subtitle="Respuestas claras sobre el funcionamiento, la privacidad y los productos de Identificación de Emergencia."
    />
    <section className="pb-20">
      <div className="container-page">
        <div className="max-w-3xl">
          <Accordion items={faqs} />
        </div>
        <Reveal className="mt-12">
          <Link to={routes.contact} className="btn-outline">
            ¿Tienes otra duda? Contáctanos <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  </main>
);

export default FAQ;
