import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  LogOut,
  User,
  Users,
  ShieldCheck,
  QrCode,
  Package,
  LayoutDashboard,
  Menu,
  X,
  ArrowLeft,
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
  <Link to={routes.home} className="flex items-center gap-2.5 font-bold text-brand-text tracking-tight">
    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-accent to-brand-deep flex items-center justify-center text-brand-dark">
      <ShieldCheck size={18} strokeWidth={2.4} />
    </span>
    <span className="text-sm">Emergencia ID</span>
  </Link>
);

const SidebarNav = ({ onNavigate, onLogout }) => (
  <>
    <nav className="space-y-1" aria-label="Panel">
      {navItems.map(({ label, href, icon: Icon, end }) => (
        <NavLink
          key={href}
          to={href}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              isActive
                ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30'
                : 'border-transparent text-brand-textMuted hover:text-brand-text hover:bg-black/5'
            }`
          }
        >
          <Icon size={18} aria-hidden="true" /> {label}
        </NavLink>
      ))}
    </nav>
    <div className="mt-6 pt-6 border-t border-brand-border space-y-1">
      <Link
        to={routes.home}
        onClick={onNavigate}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-brand-textMuted hover:text-brand-text hover:bg-black/5 transition-colors"
      >
        <ArrowLeft size={18} aria-hidden="true" /> Volver al sitio
      </Link>
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
      >
        <LogOut size={18} aria-hidden="true" /> Cerrar sesión
      </button>
    </div>
  </>
);

export const Dashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
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

  const displayName = user?.name || user?.email || 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    setSidebarOpen(false);
    logout();
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar escritorio */}
      <aside className="hidden lg:flex lg:w-64 flex-shrink-0 flex-col border-r border-brand-border bg-brand-navy/50">
        <div className="sticky top-0 p-6">
          <div className="mb-8">
            <Brand />
          </div>
          <SidebarNav onLogout={handleLogout} />
        </div>
      </aside>

      {/* Menú móvil */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-20 bg-brand-dark/80 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-30 w-72 bg-brand-panel border-r border-brand-border flex flex-col lg:hidden"
              initial={reduce ? false : { x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: EASE }}
              aria-label="Menú del panel"
            >
              <div className="flex items-center justify-between p-6">
                <Brand />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg text-brand-textMuted hover:bg-black/5 hover:text-brand-text"
                  aria-label="Cerrar menú"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                <SidebarNav onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 border-b border-brand-border bg-brand-dark/80 backdrop-blur-md px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-brand-textMuted hover:bg-black/5 hover:text-brand-text"
            aria-label="Abrir menú"
            aria-expanded={sidebarOpen}
          >
            <Menu size={22} />
          </button>
          <div className="hidden lg:block text-xs uppercase tracking-[0.18em] text-brand-textMuted">
            Panel de usuario
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="font-medium text-brand-text text-sm max-w-[14rem] truncate">{displayName}</span>
              {user?.email && user.email !== displayName && (
                <span className="text-xs text-brand-textMuted max-w-[14rem] truncate">{user.email}</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-accent/15 border border-brand-accent/40 flex items-center justify-center text-brand-accent text-sm font-bold">
              {initial}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-12 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="max-w-5xl"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

