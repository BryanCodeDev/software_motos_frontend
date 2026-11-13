import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const PublicLayout = () => {
  const { pathname, hash } = useLocation();
  const [showTop, setShowTop] = useState(false);

  // Al cambiar de página vuelve arriba; si la URL trae un ancla, baja hasta ella.
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return undefined;
    }
    const id = decodeURIComponent(hash.slice(1));
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash]);

  // Botón de volver arriba.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setShowTop(document.documentElement.scrollTop > 640);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-brand-50">
      {/* El enlace "Saltar al contenido" vive en el Navbar */}
      <Navbar />

      <main id="contenido" className="flex-1 focus:outline-none" tabIndex={-1}>
        {/* Solo opacidad: no crea contexto de transformación para elementos fixed de las páginas */}
        <div key={pathname} className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      <Footer />

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0 })}
        aria-label="Volver arriba"
        tabIndex={showTop ? 0 : -1}
        className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white shadow-card transition-all duration-300 hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-50 ${
          showTop ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-3 opacity-0'
        }`}
      >
        <ArrowUp className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
};

export default PublicLayout;