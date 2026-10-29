import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Menu, X, LogOut, User, LayoutDashboard, ChevronDown, ShieldCheck } from 'lucide-react';
import { routes } from '../utils/routes';
import { useAuth } from '../contexts/useAuth';

const navItems = [
  { label: 'Inicio', href: routes.home },
  { label: 'Productos', href: routes.products },
  { label: 'Cómo funciona', href: routes.howItWorks },
  { label: 'Privacidad', href: routes.privacy },
  { label: 'Preguntas', href: routes.faq },
];

const EASE = [0.22, 1, 0.36, 1];

export const Navbar = () => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef(null);

  // Cierra los menús al cambiar de ruta.
  useEffect(() => {
    setTimeout(() => {
      setOpen(false);
      setDrop(false);
    }, 0);
  }, [pathname]);

  // Cierra el menú de usuario al hacer clic fuera o presionar Escape.
  useEffect(() => {
    const onMouseDown = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDrop(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDrop(false);
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Refuerza el fondo de la barra al hacer scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => pathname === path;

  if (loading) return null;

  const handleLogout = async () => {
    setDrop(false);
    setOpen(false);
    await logout();
    navigate(routes.home);
  };

  const menuItem =
    'flex w-full items-center gap-2 px-4 py-2.5 text-sm text-brand-textMuted hover:text-brand-text hover:bg-black/5 transition-colors';

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
        scrolled ? 'border-brand-border bg-brand-dark/90 shadow-soft' : 'border-brand-border/50 bg-brand-dark/60'
      }`}
    >
      <div className="container-page flex items-center justify-between h-16">
        <Link to={routes.home} className="flex items-center gap-2.5 font-bold text-brand-text tracking-tight">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-accent to-brand-deep flex items-center justify-center text-brand-dark shadow-soft">
            <ShieldCheck size={18} strokeWidth={2.4} />
          </span>
          <span className="hidden sm:inline">Identificación de Emergencia</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium" aria-label="Principal">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`relative px-3 py-2 rounded-lg transition-colors ${
                isActive(item.href) ? 'text-brand-text' : 'text-brand-textMuted hover:text-brand-text'
              }`}
            >
              {isActive(item.href) && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg bg-black/5 border border-brand-border"
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              <span className="relative">{item.label}</span>
            </Link>
          ))}

          <span className="mx-2 h-5 w-px bg-brand-border" aria-hidden="true" />

          {!isAuthenticated && (
            <>
              <Link
                to={routes.login}
                className="px-3 py-2 rounded-lg text-brand-textMuted hover:text-brand-text transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link to={routes.register} className="btn-primary !py-2 !px-4 !text-sm">
                Crear cuenta
              </Link>
            </>
          )}

          {isAuthenticated && (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDrop((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={drop}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-border text-brand-text hover:border-brand-accent/50 hover:bg-brand-panel transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center">
                  <User size={14} />
                </span>
                <span className="max-w-[9rem] truncate">{user?.email?.split('@')[0]}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${drop ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {drop && (
                  <motion.div
                    role="menu"
                    initial={reduce ? false : { opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: EASE }}
                    className="absolute right-0 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-brand-border bg-brand-panel/95 backdrop-blur-md shadow-card py-1"
                  >
                    <div className="px-4 py-3 border-b border-brand-border">
                      <div className="text-[11px] uppercase tracking-wider text-brand-textMuted">Sesión iniciada</div>
                      <div className="text-sm text-brand-text truncate">{user?.email}</div>
                    </div>
                    <Link role="menuitem" to={routes.dashboardProfile} className={menuItem}>
                      <User size={16} /> Perfil
                    </Link>
                    {user?.role === 'admin' && (
                      <Link role="menuitem" to="/admin" className={menuItem}>
                        <LayoutDashboard size={16} /> Dashboard admin
                      </Link>
                    )}
                    <Link role="menuitem" to={routes.dashboardPrivacy} className={menuItem}>
                      <ShieldCheck size={16} /> Privacidad
                    </Link>
                    <button role="menuitem" onClick={handleLogout} className={`${menuItem} border-t border-brand-border`}>
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>

        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden rounded-lg p-2 text-brand-textMuted hover:bg-black/5 hover:text-brand-text transition-colors"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="md:hidden overflow-hidden border-t border-brand-border bg-brand-dark/95"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={`block px-3 py-2.5 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-black/5 text-brand-accent'
                      : 'text-brand-textMuted hover:text-brand-text hover:bg-black/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-brand-border" />
              {isAuthenticated ? (
                <>
<Link to={routes.dashboardProfile} className="block px-3 py-2.5 rounded-lg text-brand-textMuted hover:text-brand-text hover:bg-black/5">
                        Mi perfil
                      </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="block px-3 py-2.5 rounded-lg text-brand-textMuted hover:text-brand-text hover:bg-black/5">
                      Dashboard admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-brand-textMuted hover:text-brand-text hover:bg-black/5"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link to={routes.login} className="block px-3 py-2.5 rounded-lg text-brand-textMuted hover:text-brand-text hover:bg-black/5">
                    Iniciar sesión
                  </Link>
                  <Link to={routes.register} className="btn-primary w-full mt-2">
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;

