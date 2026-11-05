import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

/**
 * Envuelve las rutas para animar la entrada entre cambios de URL.
 * Usa un motion.div con key={pathname} para disparar la animación
 * en cada navegación sin romper los refs de React Router.
 *
 * Además, en cada navegación:
 *  - lleva el scroll al inicio (o al ancla #id si la URL la trae),
 *  - mueve el foco al contenido para lectores de pantalla y teclado,
 *  - anuncia el título de la nueva página.
 */
export const RouteTransition = ({ children }) => {
  const { pathname, hash } = useLocation();
  const reduce = useReducedMotion();
  const wrapperRef = useRef(null);
  const isFirstRender = useRef(true);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const first = isFirstRender.current;
    isFirstRender.current = false;

    if (hash) {
      let id = hash.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        /* se usa el hash tal cual */
      }
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        return undefined;
      }
    }

    if (first) return undefined;

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    wrapperRef.current?.focus({ preventScroll: true });
    const timer = setTimeout(() => setAnnouncement(document.title), 250);
    return () => clearTimeout(timer);
  }, [pathname, hash, reduce]);

  return (
    <>
      <motion.div
        ref={wrapperRef}
        key={pathname}
        tabIndex={-1}
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
        className="focus:outline-none focus-visible:outline-none"
      >
        {children}
      </motion.div>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </>
  );
};

export default RouteTransition;