import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { User, Users, ShieldCheck, QrCode, Package, LayoutDashboard, LogOut, ArrowLeft, X as XIcon, Menu as MenuIcon } from 'lucide-react';
import { routes } from '../../utils/routes';
import { useAuth } from '../../contexts/useAuth';

const ROLE_LABEL = { user: 'Usuario', admin: 'Administrador' };
const ROLE_TONE = { user: 'text-brand-accent', admin: 'text-rose-400' };

const userNav = [
  { label: 'Resumen', to: routes.dashboard, icon: LayoutDashboard, end: true },
  { label: 'Perfil', to: routes.dashboardProfile, icon: User },
  { label: 'Contactos', to: routes.dashboardContacts, icon: Users },
  { label: 'Privacidad', to: routes.dashboardPrivacy, icon: ShieldCheck },
  { label: 'Mi QR', to: routes.dashboardQr, icon: QrCode },
  { label: 'Pedidos', to: routes.dashboardOrders, icon: Package },
];

const SidebarNav = ({ items, onNavigate, onLogout }) => (
  <>
    <nav className="space-y-1" aria-label="Panel">
      {items.map(({ label, to, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              isActive
                ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30 shadow-sm'
                : 'border-transparent text-brand-textMuted hover:text-brand-text hover:bg-black/5'
            }`
          }
        >
          <Icon size={18} aria-hidden="true" /> {label}
        </NavLink>
      ))}
    </nav>
    <div className="mt-8 pt-6 border-t border-brand-border space-y-1">
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

export const DashboardLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const role = user?.role || 'user';
  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();

  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    setSidebarOpen(false);
    logout();
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar escritorio con scroll independiente */}
      <aside className="hidden lg:flex lg:w-64 flex-shrink-0 flex-col border-r border-brand-border bg-brand-navy/50">
        <div className="sticky top-0 z-10 flex flex-col h-full bg-brand-navy/50">
          <div className="p-6 border-b border-brand-border">
            <div className="flex items-center gap-2.5 font-bold text-brand-text tracking-tight">
              <ShieldCheck size={18} strokeWidth={2.4} className="text-brand-accent" aria-hidden="true" />
              <span className="text-sm">Emergencia ID</span>
            </div>
            <div className="mt-4 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-textFaint">Perfil</span>
              <div className="flex items-center gap-3">
                <span className="font-medium text-brand-text max-w-[14rem] truncate">{displayName}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${ROLE_TONE[role]} bg-black/10 ${ROLE_TONE[role]}/20`}>
                  {ROLE_LABEL[role]}
                </span>
              </div>
              {user?.email && user.email !== displayName && (
                <span className="text-xs text-brand-textMuted max-w-[14rem] truncate">{user.email}</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <SidebarNav items={userNav} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      </aside>

      {/* Menú móvil */}
      <div className="lg:hidden fixed inset-y-0 left-0 z-30 w-72 bg-brand-panel border-r border-brand-border flex flex-col transform transition-transform duration-300 ease-in-out"
           data-state={sidebarOpen ? 'open' : 'closed'}>
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2.5 font-bold text-brand-text tracking-tight">
            <ShieldCheck size={18} strokeWidth={2.4} className="text-brand-accent" aria-hidden="true" />
            <span className="text-sm">Emergencia ID</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-brand-textMuted hover:bg-black/5 hover:text-brand-text"
            aria-label="Cerrar menú"
          >
            <XIcon size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6">
          <SidebarNav items={userNav} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 border-b border-brand-border bg-brand-dark/80 backdrop-blur-md px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-brand-textMuted hover:bg-black/5 hover:text-brand-text"
            aria-label="Abrir menú"
            aria-expanded={sidebarOpen}
          >
            <MenuIcon size={22} aria-hidden="true" />
          </button>
          <div className="hidden lg:block text-xs uppercase tracking-[0.18em] text-brand-textMuted">
            Panel de {ROLE_LABEL[role]}
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
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

