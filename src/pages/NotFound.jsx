import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { routes } from '../utils/routes';
import { Compass, ArrowRight, Home, Package, MessageCircle, SearchX } from 'lucide-react';
import { Card } from '../components/ui';
import Seo from '../components/Seo';

const links = [
  { icon: Package, label: 'Ver productos y precios', hint: 'Stickers y paquetes', to: routes.products },
  { icon: Compass, label: 'Cómo funciona', hint: 'El proceso paso a paso', to: routes.howItWorks },
  { icon: MessageCircle, label: 'Escribir a soporte', hint: 'Te ayudamos', to: routes.contact },
];

export const NotFound = () => {
  const reduce = useReducedMotion();
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-0 py-16 text-center sm:py-20">
      <Seo title="Página no encontrada" noindex />
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 animate-float rounded-full bg-brand-500/10 blur-3xl" aria-hidden="true" />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="container-page relative"
      >
        <Card className="mx-auto max-w-lg p-6 sm:p-10">
          <span className="mx-auto mb-4 flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
            <SearchX className="h-7 w-7" aria-hidden="true" />
          </span>
          <div className="text-gradient mb-1 text-7xl font-extrabold leading-none sm:text-8xl">404</div>
          <h1 className="mb-2 mt-4 text-xl font-bold text-neutral-900 sm:text-2xl">Esta página no existe</h1>
          <p className="mb-7 leading-relaxed text-text-secondary">
            Es posible que el enlace esté mal escrito o que la página ya no esté disponible. Vuelve al inicio o elige una de estas opciones.
          </p>
          <Link to={routes.home} className="btn-primary mb-6 min-h-[52px] w-full sm:w-auto">
            <Home className="h-4 w-4" aria-hidden="true" /> Volver al inicio
          </Link>
          <ul className="space-y-1 border-t border-border pt-4 text-left">
            {links.map(({ icon: Icon, label, hint, to }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="group flex min-h-[56px] items-center gap-3 rounded-xl px-2 transition-colors hover:bg-brand-50 active:scale-[0.99]"
                >
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-neutral-900">{label}</span>
                    <span className="block text-xs text-text-secondary">{hint}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-brand-500 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
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