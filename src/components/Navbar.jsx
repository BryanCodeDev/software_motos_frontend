import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, LogOut, LayoutDashboard, ChevronDown, ChevronRight, ShieldCheck, QrCode, Settings, UserPlus, LogIn,
} from 'lucide-react';
import { routes } from '../utils/routes';
import { useAuth } from '../contexts/useAuth';

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

const NavLinkItem = ({ item, active, mobile = false, onHero = false }) => {
  const base = mobile
    ? 'flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium transition-colors'
    : 'rounded-lg px-3 py-2 transition-colors';
  const tone = onHero
    ? active ? 'bg-white/15 text-white' : 'text-white/85 hover:bg-white/10 hover:text-white'
    : active ? 'bg-brand-500/10 text-brand-500' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900';

  return (
    <Link to={item.href} aria-current={active ? 'page' : undefined} className={`${base} ${tone}`}>
      {item.label}
      {mobile && <ChevronRight size={16} className={active ? 'text-brand-500' : 'text-text-secondary/60'} aria-hidden="true" />}
    </Link>
  );
};

/** Enlaces de la cuenta, compartidos por el menú de escritorio y el móvil. */
const AccountLinks = ({ isAdmin, isActive, itemRole, onLogout }) => {
  const itemBase = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';
  const links = isAdmin ? [{ label: 'Panel administrativo', to: ADMIN_ROUTE, icon: Settings }] : accountLinks;

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
            className={`${itemBase} ${active ? 'bg-brand-500/10 text-brand-500' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900'}`}
          >
            <Icon size={18} aria-hidden="true" /> {label}
          </Link>
        );
      })}
      <button type="button" role={itemRole} onClick={onLogout} className={`${itemBase} text-rose-700 hover:bg-rose-50`}>
        <LogOut size={18} aria-hidden="true" /> Cerrar sesión
      </button>
    </>
  );
};

export const Navbar = () => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
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
        className={`${isHome ? 'fixed inset-x-0 top-0' : 'sticky top-0'} z-50 transition-colors duration-300 ${
          onHero
            ? 'border-b border-transparent bg-transparent'
            : 'border-b border-border bg-white/95 shadow-soft backdrop-blur-md'
        }`}
      >
        <div className="container-page flex h-16 items-center justify-between">
          <Link
            to={routes.home}
            className={`flex items-center gap-2.5 font-bold tracking-tight transition-colors ${onHero ? 'text-white' : 'text-neutral-900'}`}
            aria-label="Tu QR te Cuida, ir al inicio"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-soft ${
                onHero ? 'bg-white text-brand-500' : 'bg-brand-500 text-white'
              }`}
            >
              <ShieldCheck size={18} strokeWidth={2.4} aria-hidden="true" />
            </span>
            <span className="text-[15px]">Tu QR te Cuida</span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium md:flex" aria-label="Principal">
            {navItems.map((item) => (
              <NavLinkItem key={item.href} item={item} active={isActive(item.href)} onHero={onHero} />
            ))}

            <span className={`mx-2 h-5 w-px ${onHero ? 'bg-white/30' : 'bg-border'}`} aria-hidden="true" />

            {loading && <span className="h-9 w-32 animate-pulse rounded-lg bg-border/60" aria-hidden="true" />}

            {!loading && !isAuthenticated && (
              <>
                <Link
                  to={routes.login}
                  className={`rounded-lg px-3 py-2 transition-colors ${
                    onHero ? 'text-white/90 hover:bg-white/10 hover:text-white' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900'
                  }`}
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
                {drop && (
                  <div
                    ref={menuRef}
                    role="menu"
                    aria-label="Menú de usuario"
                    onKeyDown={onMenuKeyDown}
                    className="absolute right-0 mt-2 w-60 animate-fade-in overflow-hidden rounded-2xl border border-border bg-white shadow-card"
                  >
                    <div className="border-b border-border bg-brand-50/60 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-neutral-900">{displayName}</p>
                      <p className="truncate text-xs text-text-secondary">{user?.email}</p>
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
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden ${
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

        {open && (
          <div id="menu-movil" className="animate-fade-in border-t border-border bg-white md:hidden">
            <div className="max-h-[calc(100svh-4rem)] space-y-1 overflow-y-auto px-4 py-4">
              {navItems.map((item) => (
                <NavLinkItem key={item.href} item={item} active={isActive(item.href)} mobile />
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
                  <AccountLinks isAdmin={isAdmin} isActive={isActive} onLogout={handleLogout} />
                </>
              )}

              {!loading && !isAuthenticated && (
                <div className="grid gap-2 pt-1">
                  <Link to={routes.login} className="btn-outline w-full">
                    <LogIn size={18} aria-hidden="true" /> Iniciar sesión
                  </Link>
                  <Link to={routes.register} className="btn-primary w-full">
                    <UserPlus size={18} aria-hidden="true" /> Crear cuenta
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
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