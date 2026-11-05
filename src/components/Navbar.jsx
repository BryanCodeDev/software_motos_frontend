import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Menu, X, LogOut, User, Users, LayoutDashboard, ChevronDown, ShieldCheck, QrCode, Package, Settings, UserPlus, LogIn,
} from 'lucide-react';
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

/** Enlace de navegación reutilizable para desktop y mobile. */
const NavLinkItem = ({ item, isActive, variant = 'desktop', className = '' }) => {
  const active = isActive(item.href);
  const base =
    variant === 'mobile'
      ? 'block rounded-lg px-3 py-3 text-[15px] font-medium transition-colors'
      : 'relative rounded-lg px-3 py-2 transition-colors';
  return (
    <Link
      to={item.href}
      aria-current={active ? 'page' : undefined}
      className={`${base} ${active ? 'bg-brand-500/10 text-brand-500' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900'} ${className}`}
    >
      {item.label}
    </Link>
  );
};

/** Enlaces del panel de usuario (compartido entre desktop y mobile). */
const UserMenuLinks = ({ isAuthenticated, isAdmin, routes, menuItemClass, onLogout }) => {
  const userLinks = [
    { label: 'Mi panel', to: routes.dashboard, icon: LayoutDashboard },
    { label: 'Perfil', to: routes.dashboardProfile, icon: User },
    { label: 'Contactos', to: routes.dashboardContacts, icon: Users },
    { label: 'Privacidad', to: routes.dashboardPrivacy, icon: ShieldCheck },
    { label: 'Mi QR', to: routes.dashboardQr, icon: QrCode },
    { label: 'Pedidos', to: routes.dashboardOrders, icon: Package },
  ];

  return (
    <>
      {!isAdmin && (
        <>
          {userLinks.map(({ label, to, icon: Icon }) => (
            <Link key={to} role="menuitem" to={to} className={`${menuItemClass} rounded-lg px-3`}>
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </>
      )}
      {isAdmin && (
        <Link role="menuitem" to="/admin" className={`${menuItemClass} rounded-lg px-3 text-brand-500`}>
          <Settings size={18} /> Panel administrativo
        </Link>
      )}
      <button
        type="button"
        role="menuitem"
        onClick={onLogout}
        className={`${menuItemClass} rounded-lg px-3 text-rose-700 hover:bg-rose-50 hover:text-rose-700`}
      >
        <LogOut size={18} /> Cerrar sesión
      </button>
    </>
  );
};

export const Navbar = () => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef(null);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();
  const isAdmin = user?.role === 'admin';

  // Cierra los menús al cambiar de ruta.
  useEffect(() => {
    const t = setTimeout(() => {
      setOpen(false);
      setDrop(false);
    }, 0);
    return () => clearTimeout(t);
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

  const handleLogout = async () => {
    setDrop(false);
    setOpen(false);
    await logout();
    navigate(routes.home, { replace: true });
  };

  const menuItem =
    'flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-brand-50 hover:text-neutral-900';

  return (
    <header
      className={`z-40 transition-all duration-300 ${
        scrolled
          ? 'border-b border-border bg-white/95 shadow-soft'
          : 'border-b-transparent bg-transparent'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between">
        <Link to={routes.home} className="flex items-center gap-2.5 font-bold tracking-tight text-neutral-900" aria-label="Tu QR te Cuida, ir al inicio">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-soft">
            <ShieldCheck size={18} strokeWidth={2.4} aria-hidden="true" />
          </span>
          <span className="text-[15px]">Tu QR te Cuida</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium md:flex" aria-label="Principal">
          {navItems.map((item) => (
            <NavLinkItem key={item.href} item={item} isActive={isActive} variant="desktop" />
          ))}

          <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />

          {loading && <span className="h-9 w-32 animate-pulse rounded-lg bg-border/60" aria-hidden="true" />}

          {!loading && !isAuthenticated && (
            <>
              <Link
                to={routes.login}
                className="rounded-lg px-3 py-2 text-text-secondary transition-colors hover:text-neutral-900"
              >
                Iniciar sesión
              </Link>
              <Link to={routes.register} className="btn-primary !px-4 !py-2 !text-sm">
                Crear cuenta
              </Link>
            </>
          )}

          {!loading && isAuthenticated && (
            <div className="relative" ref={dropRef}>
              <button
                type="button"
                onClick={() => setDrop((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={drop}
                className="flex items-center gap-2 rounded-full border border-border bg-white py-1 pl-1 pr-3 text-neutral-900 transition-colors hover:border-brand-500/50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                  {initial}
                </span>
                <span className="max-w-[9rem] truncate">{displayName}</span>
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
                    className="absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl border border-border bg-white py-1 shadow-[0_24px_60px_-24px_rgba(159,18,57,0.35)]"
                  >
                    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                        {initial}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900">{displayName}</p>
                        <p className="truncate text-xs text-text-secondary">{user?.email}</p>
                        <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${
                          isAdmin ? 'bg-rose-50 text-rose-700 ring-rose-600/20' : 'bg-brand-500/10 text-brand-500 ring-brand-500/20'
                        }`}>
                          {isAdmin ? 'Administrador' : 'Usuario'}
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-border">
                      {!isAdmin && (
                        <>
                          {navItems.filter(i => i.label !== 'Inicio' && i.label !== 'Privacidad').map((item) => (
                            <NavLinkItem key={item.href} item={item} isActive={isActive} variant="desktop" className={menuItem} />
                          ))}
                          <UserMenuLinks isAuthenticated isAdmin={isAdmin} routes={routes} menuItemClass={menuItem} onLogout={handleLogout} />
                        </>
                      )}
                      {isAdmin && (
                        <Link role="menuitem" to="/admin" className={`${menuItem} text-brand-500`}>
                          <Settings size={16} /> Panel administrativo
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-neutral-900 transition-colors hover:bg-brand-50 md:hidden"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden border-t border-border bg-white md:hidden"
          >
            <div className="max-h-[calc(100vh-4rem)] space-y-1 overflow-y-auto px-4 py-4">
              {navItems.filter(i => i.label !== 'Privacidad').map((item) => (
                <NavLinkItem key={item.href} item={item} isActive={isActive} variant="mobile" />
              ))}

              <div className="my-3 h-px bg-border" />

              {!loading && isAuthenticated && (
                <>
                  <div className="mb-2 flex items-center gap-3 rounded-xl bg-brand-50 p-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                      {initial}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">{displayName}</p>
                      <p className="truncate text-xs text-text-secondary">{user?.email}</p>
                    </div>
                  </div>
                  <UserMenuLinks isAuthenticated isAdmin={isAdmin} routes={routes} menuItemClass={menuItem} onLogout={handleLogout} />
                </>
              )}

              {!loading && !isAuthenticated && (
                <div className="grid gap-2 pt-1">
                  <Link to={routes.login} className="btn-outline w-full">
                    <LogIn size={18} /> Iniciar sesión
                  </Link>
                  <Link to={routes.register} className="btn-primary w-full">
                    <UserPlus size={18} /> Crear cuenta
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;

