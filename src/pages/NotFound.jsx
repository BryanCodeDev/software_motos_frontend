import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { routes } from '../utils/routes';
import { Compass } from 'lucide-react';
import { Card } from '../components/ui';
import Seo from '../components/Seo';

export const NotFound = () => {
  const reduce = useReducedMotion();
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center text-center py-20 overflow-hidden">
      <Seo title="Página no encontrada" noindex />
      <div className="bg-grid absolute inset-0 pointer-events-none" aria-hidden="true" />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative container-page"
      >
        <Card className="p-10 max-w-md mx-auto">
          <div className="text-7xl font-extrabold text-gradient mb-4">404</div>
          <Compass className="w-8 h-8 mx-auto mb-4 text-brand-500" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Página no encontrada</h1>
          <p className="text-text-secondary mb-8 leading-relaxed">
            La dirección que buscas no existe o fue movida. Verifica el enlace o regresa al inicio.
          </p>
          <Link to={routes.home} className="btn-primary">
            Volver al inicio
          </Link>
        </Card>
      </motion.div>
    </main>
  );
};

export default NotFound;

