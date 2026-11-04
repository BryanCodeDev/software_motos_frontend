import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export const PublicLayout = () => {
  const { pathname, hash } = useLocation();

  // Al cambiar de página vuelve arriba, salvo que la URL apunte a un ancla (#seccion).
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-brand-50">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido" className="flex-1 focus:outline-none" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
