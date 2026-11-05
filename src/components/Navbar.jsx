import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import {
  Menu, X, LogOut, User, Users, LayoutDashboard, ChevronDown, ChevronRight, ShieldCheck, QrCode, Package, Settings, UserPlus, LogIn,
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

const accountLinks = [
  { label: 'Mi panel', to: routes.dashboard, icon: LayoutDashboard },
  { label: 'Perfil', to: routes.dashboardProfile, icon: User },
  { label: 'Contactos', to: routes.dashboardContacts, icon: Users },
  { label: 'Mi privacidad', to: routes.dashboardPrivacy, icon: ShieldCheck },
  { label: 'Mi QR', to: routes.dashboardQr, icon: QrCode },
  { label: 'Pedidos', to: routes.dashboardOrders, icon: Package },
];

const ADMIN_ROUTE = '/admin';
const EASE = [0.22, 1, 0.36, 1];

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.045, delayChildren: 0.08 } } };
const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } },
};

/** Barra fina que muestra cuánto se ha avanzado en la página. */
const ScrollProgress = ({ hidden }) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return (
    <motion.span
      aria-hidden="true"
      style={{ scaleX }}
      className={`absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gradient-to-r from-brand-500 to-brand-400 transition-opacity duration-300 ${
        hidden ? 'opacity-0' : 'opacity-100'
      }`}
    />
  );
};

/** Enlace de navegación reutilizable para desktop y mobile. `pill` activa el indicador deslizante. */
const NavLinkItem = ({ item, isActive, variant = 'desktop', onHero = false, pill = false }) => {
  const active = isActive(item.href);
  const mobile = variant === 'mobile';
  const base = mobile
    ? 'flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium transition-colors'
    : 'relative isolate rounded-lg px-3 py-2 transition-colors';

  let tone;
  if (onHero) {
    tone = active ? 'text-white' : 'text-white/85 hover:bg-white/10 hover:text-white';
    if (active && !pill) tone += ' bg-white/15';
  } else {
    tone = active ? 'text-brand-500' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900';
    if (active && !pill) tone += ' bg-brand-500/10';
  }

  return (
    <Link to={item.href} aria-current={active ? 'page' : undefined} className={`${base} ${tone}`}>
      {pill && active && (
        <motion.span
          layoutId="nav-pill"
          aria-hidden="true"
          className={`absolute inset-0 -z-10 rounded-lg ${onHero ? 'bg-white/15' : 'bg-brand-500/10'}`}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
      <span className="relative">{item.label}</span>
      {mobile && <ChevronRight size={16} className={active ? 'text-brand-500' : 'text-text-secondary/60'} aria-hidden="true" />}
    </Link>
  );
};

/** Enlaces de la cuenta (compartido entre el menú de escritorio y el móvil). */
const AccountLinks = ({ isAdmin, isActive, itemRole, onLogout, animated = false }) => {
  const itemBase = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';
  const toneFor = (active) =>
    active ? 'bg-brand-500/10 text-brand-500' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900';
  const Row = animated ? motion.div : 'div';
  const rowProps = animated ? { variants: rowVariants } : {};

  const links = isAdmin
    ? [{ label: 'Panel administrativo', to: ADMIN_ROUTE, icon: Settings }]
    : accountLinks;

  return (
    <>
      {links.map(({ label, to, icon: Icon }) => {
        const active = isActive(to);
        return (
          <Row key={to} {...rowProps}>
            <Link
              role={itemRole}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`${itemBase} ${toneFor(active)}`}
            >
              <Icon size={18} aria-hidden="true" /> {label}
            </Link>
          </Row>
        );
      })}
      <Row {...rowProps}>
        <button
          type="button"
          role={itemRole}
          onClick={onLogout}
          className={`${itemBase} text-rose-700 hover:bg-rose-50`}
        >
          <LogOut size={18} aria-hidden="true" /> Cerrar sesión
        </button>
      </Row>
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

  // Cierra el menú de usuario al hacer clic fuera o presionar Escape (y devuelve el foco al botón).
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

  // Refuerza el fondo de la barra al hacer scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => (path === ADMIN_ROUTE ? pathname.startsWith(ADMIN_ROUTE) : pathname === path);

  // Solo en el inicio el navbar flota transparente sobre el hero.
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
    main.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
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
        className={`${isHome ? 'fixed inset-x-0 top-0' : 'sticky top-0'} z-50 transition-all duration-300 ${
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
              className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-soft transition-all duration-300 group-hover:rotate-6 group-hover:scale-105 ${
                onHero ? 'bg-white text-brand-500' : 'bg-brand-500 text-white'
              }`}
            >
              <ShieldCheck size={18} strokeWidth={2.4} aria-hidden="true" />
            </span>
            <span className="text-[15px]">Tu QR te Cuida</span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium md:flex" aria-label="Principal">
            {navItems.map((item) => (
              <NavLinkItem key={item.href} item={item} isActive={isActive} variant="desktop" onHero={onHero} pill />
            ))}

            <span className={`mx-2 h-5 w-px ${onHero ? 'bg-white/30' : 'bg-border'}`} aria-hidden="true" />

            {loading && <span className="h-9 w-32 animate-pulse rounded-lg bg-border/60" aria-hidden="true" />}

            {!loading && !isAuthenticated && (
              <>
                <Link
                  to={routes.login}
                  className={`rounded-lg px-3 py-2 transition-colors ${onHero ? 'text-white/90 hover:bg-white/10 hover:text-white' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900'}`}
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
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                    {initial}
                  </span>
                  <span className="max-w-[9rem] truncate">{displayName}</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${drop ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {drop && (
                    <motion.div
                      ref={menuRef}
                      role="menu"
                      aria-label="Menú de usuario"
                      onKeyDown={onMenuKeyDown}
                      initial={reduce ? false : { opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: EASE }}
                      className="absolute right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-border bg-white shadow-[0_24px_60px_-24px_rgba(159,18,57,0.35)]"
                    >
                      <div className="flex items-center gap-3 border-b border-border bg-brand-50/60 px-4 py-3">
                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                          {initial}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-neutral-900">{displayName}</p>
                          <p className="truncate text-xs text-text-secondary">{user?.email}</p>
                          <span
                            className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${
                              isAdmin ? 'bg-rose-50 text-rose-700 ring-rose-600/20' : 'bg-brand-500/10 text-brand-500 ring-brand-500/20'
                            }`}
                          >
                            {isAdmin ? 'Administrador' : 'Usuario'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-0.5 p-1.5">
                        <AccountLinks isAdmin={isAdmin} isActive={isActive} itemRole="menuitem" onLogout={handleLogout} />
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
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden ${
              onHero
                ? 'border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
                : 'border-border bg-white text-neutral-900 hover:bg-brand-50'
            }`}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            aria-controls="menu-movil"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? 'close' : 'open'}
                initial={reduce ? false : { rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex"
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              id="menu-movil"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="overflow-hidden border-t border-border bg-white md:hidden"
            >
              <motion.div
                variants={listVariants}
                initial={reduce ? false : 'hidden'}
                animate="show"
                className="max-h-[calc(100svh-4rem)] space-y-1 overflow-y-auto px-4 py-4"
              >
                {navItems.map((item) => (
                  <motion.div key={item.href} variants={rowVariants}>
                    <NavLinkItem item={item} isActive={isActive} variant="mobile" />
                  </motion.div>
                ))}

                <div className="my-3 h-px bg-border" />

                {!loading && isAuthenticated && (
                  <>
                    <motion.div variants={rowVariants} className="mb-2 flex items-center gap-3 rounded-xl bg-brand-50 p-3">
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                        {initial}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900">{displayName}</p>
                        <p className="truncate text-xs text-text-secondary">{user?.email}</p>
                      </div>
                    </motion.div>
                    <AccountLinks isAdmin={isAdmin} isActive={isActive} onLogout={handleLogout} animated />
                  </>
                )}

                {!loading && !isAuthenticated && (
                  <motion.div variants={rowVariants} className="grid gap-2 pt-1">
                    <Link to={routes.login} className="btn-outline w-full">
                      <LogIn size={18} aria-hidden="true" /> Iniciar sesión
                    </Link>
                    <Link to={routes.register} className="btn-primary w-full">
                      <UserPlus size={18} aria-hidden="true" /> Crear cuenta
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ScrollProgress hidden={onHero} />
      </header>

      {/* Fondo del menú móvil: fuera del header porque su backdrop-filter atraparía el position:fixed. */}
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="Cerrar menú"
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-neutral-950/40 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;