import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { routes } from '../utils/routes';
import { Compass, ArrowRight, Home, Package, MessageCircle } from 'lucide-react';
import { Card } from '../components/ui';
import Seo from '../components/Seo';

const links = [
  { icon: Package, label: 'Ver productos y precios', to: routes.products },
  { icon: Compass, label: 'Cómo funciona', to: routes.howItWorks },
  { icon: MessageCircle, label: 'Escribir a soporte', to: routes.contact },
];

export const NotFound = () => {
  const reduce = useReducedMotion();
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-20 text-center">
      <Seo title="Página no encontrada" noindex />
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="container-page relative"
      >
        <Card className="mx-auto max-w-lg p-10">
          <div className="text-gradient mb-2 text-8xl font-extrabold leading-none">404</div>
          <h1 className="mb-2 mt-4 text-2xl font-bold text-neutral-900">Esta página no existe</h1>
          <p className="mb-8 leading-relaxed text-text-secondary">
            Es posible que el enlace esté mal escrito o que la página ya no esté disponible. Vuelve al
            inicio o elige una de estas opciones.
          </p>
          <Link to={routes.home} className="btn-primary mb-6">
            <Home className="h-4 w-4" /> Volver al inicio
          </Link>
          <ul className="space-y-1 border-t border-border pt-5 text-left">
            {links.map(({ icon: Icon, label, to }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-text-secondary transition-colors hover:bg-brand-50 hover:text-brand-500"
                >
                  <Icon className="h-4 w-4 text-brand-500" />
                  {label}
                  <ArrowRight className="ml-auto h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>
    </main>
  );
};

export default NotFound;