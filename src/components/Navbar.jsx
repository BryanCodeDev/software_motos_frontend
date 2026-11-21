import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Menu, X, LogOut, LayoutDashboard, ChevronDown, ChevronRight, ShieldCheck, QrCode, Settings,
  UserPlus, LogIn, ArrowRight,
} from 'lucide-react';
import { routes } from '../utils/routes';
import { useAuth } from '../contexts/useAuth';

const EASE = [0.22, 1, 0.36, 1];

/* Los documentos legales viven en el pie de página; el panel tiene su propio menú lateral. */
const navItems = [
  { label: 'Inicio', href: routes.home },
  { label: 'Productos', href: routes.products },
  { label: 'Cómo funciona', href: routes.howItWorks },
  { label: 'Preguntas', href: routes.faq },
];

const accountLinks = [
  { label: 'Mi panel', to: routes.dashboard, icon: LayoutDashboard },
  { label: 'Mi QR', to: routes.dashboardQr, icon: QrCode },
];

const ADMIN_ROUTE = '/admin';

/** Enlace de escritorio: texto claro con subrayado de marca que "viaja" entre secciones. */
const DesktopLink = ({ item, active, reduce, onHero }) => (
  <Link
    to={item.href}
    aria-current={active ? 'page' : undefined}
    className={`relative rounded-lg px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 ${
      onHero
        ? `hover:bg-white/10 hover:text-white focus-visible:ring-white/60 ${active ? 'text-white' : 'text-white/80'}`
        : `hover:bg-brand-50 hover:text-neutral-900 focus-visible:ring-brand-500 ${active ? 'text-brand-500' : 'text-text-secondary'}`
    }`}
  >
    {item.label}
    {active && (
      <motion.span
        layoutId="nav-active"
        aria-hidden="true"
        className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full ${onHero ? 'bg-brand-400' : 'bg-brand-500'}`}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
      />
    )}
  </Link>
);

/** Enlace del menú móvil: fila grande con barra de marca cuando está activo. */
const MobileLink = ({ item, active }) => (
  <Link
    to={item.href}
    aria-current={active ? 'page' : undefined}
    className={`group flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold transition-colors ${
      active ? 'bg-brand-500/10 text-brand-500' : 'text-neutral-900/80 hover:bg-brand-50 hover:text-neutral-900'
    }`}
  >
    <span className="flex items-center gap-3">
      <span className={`h-5 w-1 rounded-full transition-colors ${active ? 'bg-brand-500' : 'bg-transparent'}`} aria-hidden="true" />
      {item.label}
    </span>
    <ChevronRight
      size={16}
      className={`transition-transform duration-200 group-hover:translate-x-0.5 ${active ? 'text-brand-500' : 'text-text-secondary/60'}`}
      aria-hidden="true"
    />
  </Link>
);

/** Enlaces de la cuenta, compartidos por el menú de escritorio (claro) y el móvil (oscuro). */
const AccountLinks = ({ isAdmin, isActive, itemRole, onLogout, dark = false }) => {
  const itemBase = 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors';
  const links = isAdmin
    ? [
        { label: 'Panel administrativo', to: ADMIN_ROUTE, icon: Settings },
        { label: 'Mi panel', to: routes.dashboard, icon: LayoutDashboard },
        { label: 'Mi QR', to: routes.dashboardQr, icon: QrCode },
      ]
    : accountLinks;

  const activeCls = dark ? 'bg-white/10 text-white' : 'bg-brand-500/10 text-brand-500';
  const idleCls = dark
    ? 'text-white/80 hover:bg-white/10 hover:text-white'
    : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900';
  const logoutCls = dark ? 'text-rose-300 hover:bg-rose-500/10' : 'text-rose-700 hover:bg-rose-50';

  return (
    <>
      {links.map(({ label, to, icon: Icon }) => {
        const active = isActive(to);
        return (
          <Link
            key={to}
            role={itemRole}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={`${itemBase} ${active ? activeCls : idleCls}`}
          >
            <Icon size={18} aria-hidden="true" /> {label}
          </Link>
        );
      })}
      <button type="button" role={itemRole} onClick={onLogout} className={`${itemBase} ${logoutCls}`}>
        <LogOut size={18} aria-hidden="true" /> Cerrar sesión
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
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

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

  // Cierra el menú de usuario al hacer clic fuera o con Escape (y devuelve el foco al botón).
  useEffect(() => {
    const onMouseDown = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDrop(false);
    };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (menuRef.current) triggerRef.current?.focus();
      setDrop(false);
      setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Al abrir el menú de usuario, el foco pasa a su primer elemento.
  useEffect(() => {
    if (drop) menuRef.current?.querySelector('[role="menuitem"]')?.focus();
  }, [drop]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Menú móvil abierto: bloquea el scroll del fondo y se cierra si la pantalla pasa a escritorio.
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e) => e.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    return () => {
      document.body.style.overflow = prev;
      mq.removeEventListener('change', onChange);
    };
  }, [open]);

  const isActive = (path) => (path === ADMIN_ROUTE ? pathname.startsWith(ADMIN_ROUTE) : pathname === path);

  // Solo en el inicio la barra flota transparente sobre el hero.
  const isHome = pathname === routes.home;
  const onHero = isHome && !scrolled && !open;

  const handleLogout = async () => {
    setDrop(false);
    setOpen(false);
    await logout();
    navigate(routes.home, { replace: true });
  };

  const onMenuKeyDown = (e) => {
    const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') || []);
    if (!items.length) return;
    const idx = items.indexOf(document.activeElement);
    let next = null;
    if (e.key === 'ArrowDown') next = (idx + 1) % items.length;
    else if (e.key === 'ArrowUp') next = (idx - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else if (e.key === 'Tab') setDrop(false);
    if (next !== null) {
      e.preventDefault();
      items[next].focus();
    }
  };

  const skipToContent = (e) => {
    e.preventDefault();
    const main = document.querySelector('main');
    if (!main) return;
    main.setAttribute('tabindex', '-1');
    main.style.outline = 'none';
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: 'start' });
  };

  return (
    <>
      <a
        href="#contenido"
        onClick={skipToContent}
        className="fixed left-4 top-3 z-[120] -translate-y-24 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-transform focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Saltar al contenido
      </a>

      <header
        className={`${isHome ? 'fixed inset-x-0 top-0' : 'sticky top-0'} z-50 transition-[background-color,border-color,box-shadow] duration-300 ${
          onHero
            ? 'border-b border-transparent bg-transparent'
            : 'border-b border-border bg-white/95 shadow-soft backdrop-blur-md'
        }`}
      >
        <div className="container-page flex h-16 items-center justify-between">
          <Link
            to={routes.home}
            className={`group flex items-center gap-2.5 font-bold tracking-tight transition-colors ${onHero ? 'text-white' : 'text-neutral-900'}`}
            aria-label="Tu QR te Cuida, ir al inicio"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105 ${
                onHero ? 'bg-white text-brand-500 shadow-soft' : 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow'
              }`}
            >
              <ShieldCheck size={18} strokeWidth={2.4} aria-hidden="true" />
            </span>
            <span className="text-[15px]">Tu QR te Cuida</span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium md:flex" aria-label="Principal">
            {navItems.map((item) => (
              <DesktopLink key={item.href} item={item} active={isActive(item.href)} reduce={reduce} onHero={onHero} />
            ))}

            <span className={`mx-3 h-5 w-px ${onHero ? 'bg-white/30' : 'bg-border'}`} aria-hidden="true" />

            {loading && <span className={`h-9 w-32 animate-pulse rounded-lg ${onHero ? 'bg-white/20' : 'bg-border/60'}`} aria-hidden="true" />}

            {!loading && !isAuthenticated && (
              <>
                <Link
                  to={routes.login}
                  className={`rounded-lg px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                    onHero
                      ? 'text-white/90 hover:bg-white/10 hover:text-white focus-visible:ring-white/60'
                      : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900 focus-visible:ring-brand-500'
                  }`}
                >
                  Iniciar sesión
                </Link>
                <Link to={routes.register} className="btn-primary group !px-4 !py-2 !text-sm">
                  Crear cuenta
                  <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </>
            )}

            {!loading && isAuthenticated && (
              <div className="relative" ref={dropRef}>
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={() => setDrop((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={drop}
                  className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    onHero
                      ? 'border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
                      : 'border-border bg-white text-neutral-900 hover:border-brand-500/50'
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                    {initial}
                  </span>
                  <span className="max-w-[9rem] truncate">{displayName}</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${drop ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {drop && (
                  <div
                    ref={menuRef}
                    role="menu"
                    aria-label="Menú de usuario"
                    onKeyDown={onMenuKeyDown}
                    className="absolute right-0 mt-3 w-64 animate-fade-in overflow-hidden rounded-2xl border border-white/40 bg-neutral-50 shadow-glow ring-1 ring-black/5"
                  >
                    <div className="flex items-center gap-3 border-b border-border bg-brand-50/70 px-4 py-3.5">
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                        {initial}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900">{displayName}</p>
                        <p className="truncate text-xs text-text-secondary">{user?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-0.5 p-1.5">
                      <AccountLinks isAdmin={isAdmin} isActive={isActive} itemRole="menuitem" onLogout={handleLogout} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden ${
              onHero
                ? 'border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
                : 'border-border bg-white text-neutral-900 hover:bg-brand-50'
            }`}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            aria-controls="menu-movil"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="menu-movil"
              key="menu-movil"
              initial={reduce ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="border-t border-border bg-white md:hidden"
            >
              <div className="max-h-[calc(100svh-4rem)] space-y-1 overflow-y-auto px-4 pb-6 pt-4">
                <p className="mb-2 flex items-center gap-3 px-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">
                  <span className="h-px w-6 bg-brand-400" aria-hidden="true" />
                  Menú
                </p>

                {navItems.map((item) => (
                  <MobileLink key={item.href} item={item} active={isActive(item.href)} />
                ))}

                <div className="my-4 h-px bg-border" />

                {!loading && isAuthenticated && (
                  <>
                    <div className="mb-2 flex items-center gap-3 rounded-2xl bg-brand-50 p-3">
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                        {initial}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900">{displayName}</p>
                        <p className="truncate text-xs text-text-secondary">{user?.email}</p>
                      </div>
                    </div>
                    <AccountLinks isAdmin={isAdmin} isActive={isActive} onLogout={handleLogout} />
                  </>
                )}

                {!loading && !isAuthenticated && (
                  <div className="grid gap-3 pt-1">
                    <Link to={routes.register} className="btn-primary h-12 w-full">
                      <UserPlus size={18} aria-hidden="true" /> Crear cuenta gratis
                    </Link>
                    <Link to={routes.login} className="btn-outline h-12 w-full">
                      <LogIn size={18} aria-hidden="true" /> Iniciar sesión
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Fondo del menú móvil: fuera del header porque su backdrop-filter atraparía el position:fixed. */}
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 animate-fade-in cursor-default bg-neutral-950/40 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
};

export default Navbar;