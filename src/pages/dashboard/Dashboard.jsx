import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  LogOut, User, Users, ShieldCheck, QrCode, Package, LayoutDashboard, Menu, X, ArrowLeft, Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { routes } from '../../utils/routes';

const navItems = [
  { label: 'Resumen', href: routes.dashboard, icon: LayoutDashboard, end: true },
  { label: 'Perfil', href: routes.dashboardProfile, icon: User },
  { label: 'Contactos', href: routes.dashboardContacts, icon: Users },
  { label: 'Privacidad', href: routes.dashboardPrivacy, icon: ShieldCheck },
  { label: 'Mi QR', href: routes.dashboardQr, icon: QrCode },
  { label: 'Pedidos', href: routes.dashboardOrders, icon: Package },
];

const EASE = [0.22, 1, 0.36, 1];

const Brand = () => (
  <Link to={routes.home} className="flex items-center gap-2.5 font-bold tracking-tight text-brand-text">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent text-white shadow-soft">
      <ShieldCheck size={18} strokeWidth={2.4} aria-hidden="true" />
    </span>
    <span className="text-sm">Tu QR te Cuida</span>
  </Link>
);

const linkBase = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';

const SidebarContent = ({ displayName, email, initial, isAdmin, onNavigate, onLogout }) => (
  <div className="flex h-full flex-col">
    <div className="flex items-center gap-3 rounded-xl bg-brand-dark p-3">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-accent text-sm font-bold text-white">
        {initial}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-brand-text">{displayName}</p>
        {email && email !== displayName && <p className="truncate text-xs text-brand-textMuted">{email}</p>}
      </div>
    </div>

    <nav className="mt-5 space-y-1" aria-label="Panel">
      {navItems.map(({ label, href, icon: Icon, end }) => (
        <NavLink
          key={href}
          to={href}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? 'bg-brand-accent text-white shadow-soft'
                : 'text-brand-textMuted hover:bg-brand-dark hover:text-brand-text'
            }`
          }
        >
          <Icon size={18} aria-hidden="true" /> {label}
        </NavLink>
      ))}
    </nav>

    <div className="mt-auto space-y-1 border-t border-brand-border pt-4">
      {isAdmin && (
        <Link to="/admin" onClick={onNavigate} className={`${linkBase} text-brand-accent hover:bg-brand-accent/10`}>
          <Settings size={18} aria-hidden="true" /> Panel administrativo
        </Link>
      )}
      <Link to={routes.home} onClick={onNavigate} className={`${linkBase} text-brand-textMuted hover:bg-brand-dark hover:text-brand-text`}>
        <ArrowLeft size={18} aria-hidden="true" /> Volver al sitio
      </Link>
      <button type="button" onClick={onLogout} className={`${linkBase} text-rose-700 hover:bg-rose-50`}>
        <LogOut size={18} aria-hidden="true" /> Cerrar sesión
      </button>
    </div>
  </div>
);

export const Dashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cierra el menú móvil al navegar.
  useEffect(() => {
    setTimeout(() => setSidebarOpen(false), 0);
  }, [pathname]);

  // Cierra el menú móvil con Escape.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  if (!isAuthenticated) return null;

  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();
  const isAdmin = user?.role === 'admin';

  const clean = pathname.replace(/\/$/, '') || '/';
  const current = navItems.find((n) => (n.end ? clean === n.href : clean.startsWith(n.href))) || navItems[0];

  const handleLogout = async () => {
    setSidebarOpen(false);
    await logout();
    navigate(routes.home, { replace: true });
  };

  const sidebarProps = { displayName, email: user?.email, initial, isAdmin, onLogout: handleLogout };

  return (
    <div className="flex min-h-screen bg-brand-dark">
      {/* Sidebar escritorio */}
      <aside className="hidden flex-none lg:block lg:w-64">
        <div className="sticky top-0 flex h-screen flex-col gap-6 border-r border-brand-border bg-white p-5">
          <Brand />
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
            <SidebarContent {...sidebarProps} />
          </div>
        </div>
      </aside>

      {/* Menú móvil */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-white p-5 shadow-2xl lg:hidden"
              initial={reduce ? false : { x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: EASE }}
              aria-label="Menú del panel"
            >
              <div className="mb-5 flex items-center justify-between">
                <Brand />
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-textMuted hover:bg-brand-dark hover:text-brand-text"
                  aria-label="Cerrar menú"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
                <SidebarContent {...sidebarProps} onNavigate={() => setSidebarOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-brand-border bg-brand-dark/85 px-4 backdrop-blur-md sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-lg text-brand-text hover:bg-white lg:hidden"
              aria-label="Abrir menú"
              aria-expanded={sidebarOpen}
            >
              <Menu size={22} />
            </button>
            <div>
              <p className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-textMuted lg:block">
                Panel de usuario
              </p>
              <p className="text-sm font-bold text-brand-text">{current.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden flex-col items-end leading-tight sm:flex">
              <span className="max-w-[14rem] truncate text-sm font-medium text-brand-text">{displayName}</span>
              {user?.email && user.email !== displayName && (
                <span className="max-w-[14rem] truncate text-xs text-brand-textMuted">{user.email}</span>
              )}
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-accent text-sm font-bold text-white">
              {initial}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          <motion.div
            key={pathname}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="mx-auto max-w-5xl"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;