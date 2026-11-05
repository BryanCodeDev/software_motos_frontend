import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const PublicLayout = () => {
  const { pathname, hash } = useLocation();
  const barRef = useRef(null);
  const [showTop, setShowTop] = useState(false);

  // Al cambiar de página vuelve arriba; si la URL trae un ancla, baja suavemente hasta ella.
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return undefined;
    }
    const id = decodeURIComponent(hash.slice(1));
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash]);

  // Barra de progreso de lectura y botón de volver arriba.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const progress = max > 0 ? Math.min(el.scrollTop / max, 1) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      setShowTop(el.scrollTop > 640);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-brand-50">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5" aria-hidden="true">
        <div
          ref={barRef}
          className="h-full origin-left bg-gradient-to-r from-brand-400 to-brand-500"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Saltar al contenido
      </a>
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
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Volver arriba"
        tabIndex={showTop ? 0 : -1}
        className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-50 ${
          showTop ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-3 opacity-0'
        }`}
      >
        <ArrowUp className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
};

export default PublicLayout;