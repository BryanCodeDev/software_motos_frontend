import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import {
  User, Users, ShieldCheck, QrCode, Package, LayoutDashboard, LogOut, ArrowLeft,
  X as XIcon, Menu as MenuIcon, Settings,
} from 'lucide-react';
import { routes } from '../../utils/routes';
import { useAuth } from '../../contexts/useAuth';

const ROLE_LABEL = { user: 'Usuario', admin: 'Administrador' };

const userNav = [
  { label: 'Resumen', to: routes.dashboard, icon: LayoutDashboard, end: true },
  { label: 'Perfil', to: routes.dashboardProfile, icon: User },
  { label: 'Contactos', to: routes.dashboardContacts, icon: Users },
  { label: 'Privacidad', to: routes.dashboardPrivacy, icon: ShieldCheck },
  { label: 'Mi QR', to: routes.dashboardQr, icon: QrCode },
  { label: 'Pedidos', to: routes.dashboardOrders, icon: Package },
];

const linkBase = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';

const Brand = () => (
  <Link to={routes.home} className="flex items-center gap-2.5 font-bold tracking-tight text-brand-text">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent text-white shadow-soft">
      <ShieldCheck size={18} strokeWidth={2.4} aria-hidden="true" />
    </span>
    <span className="text-sm">Emergencia ID</span>
  </Link>
);

const SidebarContent = ({ items, displayName, email, initial, role, onNavigate, onLogout }) => (
  <div className="flex h-full flex-col">
    <div className="flex items-center gap-3 rounded-xl bg-brand-dark p-3">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-accent text-sm font-bold text-white">
        {initial}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-brand-text">{displayName}</p>
        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-accent">{ROLE_LABEL[role]}</p>
        {email && email !== displayName && <p className="truncate text-xs text-brand-textMuted">{email}</p>}
      </div>
    </div>

    <nav className="mt-5 space-y-1" aria-label="Panel">
      {items.map(({ label, to, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
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
      {role === 'admin' && (
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

export const DashboardLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  if (!isAuthenticated) return null;

  const role = user?.role || 'user';
  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();

  const clean = pathname.replace(/\/$/, '') || '/';
  const current = userNav.find((n) => (n.end ? clean === n.to : clean.startsWith(n.to))) || userNav[0];

  const handleLogout = () => {
    setSidebarOpen(false);
    logout();
  };

  const props = { items: userNav, displayName, email: user?.email, initial, role, onLogout: handleLogout };

  return (
    <div className="flex min-h-screen bg-brand-dark">
      {/* Sidebar escritorio */}
      <aside className="hidden flex-none lg:block lg:w-64">
        <div className="sticky top-0 flex h-screen flex-col gap-6 border-r border-brand-border bg-white p-5">
          <Brand />
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
            <SidebarContent {...props} />
          </div>
        </div>
      </aside>

      {/* Menú móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        aria-label="Menú del panel"
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-white p-5 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-5 flex items-center justify-between">
          <Brand />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-textMuted hover:bg-brand-dark hover:text-brand-text"
            aria-label="Cerrar menú"
          >
            <XIcon size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          <SidebarContent {...props} onNavigate={() => setSidebarOpen(false)} />
        </div>
      </aside>

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
              <MenuIcon size={22} aria-hidden="true" />
            </button>
            <div>
              <p className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-textMuted lg:block">
                Panel de {ROLE_LABEL[role]}
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
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;