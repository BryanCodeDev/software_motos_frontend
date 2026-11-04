import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

/**
 * Envuelve las rutas para animar la entrada entre cambios de URL.
 * Usa un motion.div con key={pathname} para disparar la animación
 * en cada navegación sin romper los refs de React Router.
 */
export const RouteTransition = ({ children }) => {
  const { pathname } = useLocation();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE }}
      className=""
    >
      {children}
    </motion.div>
  );
};
