import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/useAuth';
import { routes } from '../utils/routes';
import {
  User, Users, ShieldCheck, QrCode, Package, LayoutDashboard, LogOut, ArrowLeft,
  X as XIcon, Menu as MenuIcon, HelpCircle, ClipboardList, Loader2,
} from 'lucide-react';

const ROLE_LABEL = { user: 'Usuario', admin: 'Administrador' };
const ROLE_BADGE = {
  user: 'bg-brand-accent/10 text-brand-accent ring-brand-accent/20',
  admin: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

const userNav = [
  { label: 'Resumen', to: routes.dashboard, icon: LayoutDashboard, end: true },
  { label: 'Perfil', to: routes.dashboardProfile, icon: User },
  { label: 'Contactos', to: routes.dashboardContacts, icon: Users },
  { label: 'Privacidad', to: routes.dashboardPrivacy, icon: ShieldCheck },
  { label: 'Mi QR', to: routes.dashboardQr, icon: QrCode },
  { label: 'Pedidos', to: routes.dashboardOrders, icon: Package },
];

const adminNav = [
  { label: 'Resumen', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Usuarios', to: '/admin/usuarios', icon: Users },
  { label: 'Pedidos', to: '/admin/pedidos', icon: Package },
  { label: 'Auditoría', to: '/admin/auditoria', icon: ClipboardList },
  { label: 'Privacidad', to: routes.dashboardPrivacy, icon: ShieldCheck },
  { label: 'Ayuda', to: '/admin/ayuda', icon: HelpCircle },
];

const linkBase = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';

const SidebarContent = ({ items, displayName, email, initial, role, onNavigate, onLogout }) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-3 rounded-xl bg-brand-dark p-3">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-accent text-sm font-bold text-white">
        {initial}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-brand-text">{displayName}</p>
        {email && email !== displayName && (
          <p className="truncate text-xs text-brand-textMuted">{email}</p>
        )}
        <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${ROLE_BADGE[role]}`}>
          {ROLE_LABEL[role]}
        </span>
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

    <div className="mt-6 space-y-1 border-t border-brand-border pt-4">
      <Link
        to={routes.home}
        onClick={onNavigate}
        className={`${linkBase} text-brand-textMuted hover:bg-brand-dark hover:text-brand-text`}
      >
        <ArrowLeft size={18} aria-hidden="true" /> Volver al sitio
      </Link>
      <button type="button" onClick={onLogout} className={`${linkBase} text-rose-700 hover:bg-rose-50`}>
        <LogOut size={18} aria-hidden="true" /> Cerrar sesión
      </button>
    </div>
  </div>
);

export const AppLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(routes.home, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const role = user?.role || 'user';
  const items = role === 'admin' ? adminNav : userNav;
  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();

  // Cierra el menú móvil con Escape.
  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  // Cierra el menú móvil al cambiar de ruta.
  useEffect(() => {
    const t = setTimeout(() => setSidebarOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  const clean = pathname.replace(/\/$/, '') || '/';
  const current = items.find((n) => (n.end ? clean === n.to : clean.startsWith(n.to))) || items[0];

  const handleLogout = async () => {
    setSidebarOpen(false);
    await logout();
    navigate(routes.home, { replace: true });
  };

  const sidebarProps = { items, displayName, email: user?.email, initial, role, onLogout: handleLogout };

  return (
    <div className="flex min-h-screen flex-col bg-brand-dark">
      <Navbar />

      {isAuthenticated ? (
        <div className="flex flex-1">
          {/* Sidebar escritorio: columna completa con contenido fijo al hacer scroll */}
          <aside className="hidden w-64 flex-none border-r border-brand-border bg-white lg:block">
            <div className="custom-scrollbar sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto p-5">
              <SidebarContent {...sidebarProps} />
            </div>
          </aside>

          {/* Menú móvil */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
          <aside
            aria-label="Menú del panel"
            aria-hidden={!sidebarOpen}
            className={`fixed inset-y-0 left-0 z-[60] flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between border-b border-brand-border p-4">
              <div className="flex items-center gap-2.5 font-bold tracking-tight text-brand-text">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent text-white shadow-soft">
                  <ShieldCheck size={18} strokeWidth={2.4} aria-hidden="true" />
                </span>
                <span className="text-sm">Tu QR te Cuida</span>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-textMuted hover:bg-brand-dark hover:text-brand-text"
                aria-label="Cerrar menú"
              >
                <XIcon size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
              <SidebarContent {...sidebarProps} onNavigate={() => setSidebarOpen(false)} />
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Barra del panel (solo móvil) */}
            <div className="flex items-center gap-3 border-b border-brand-border bg-white px-4 py-2.5 lg:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="-ml-1 flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border text-brand-text hover:bg-brand-dark"
                aria-label="Abrir menú del panel"
                aria-expanded={sidebarOpen}
              >
                <MenuIcon size={20} aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-textMuted">
                  Panel de {ROLE_LABEL[role].toLowerCase()}
                </p>
                <p className="truncate text-sm font-bold text-brand-text">{current.label}</p>
              </div>
            </div>

            <main className="flex-1 p-4 sm:p-6 lg:p-10">
              <div className={`mx-auto ${role === 'admin' ? 'max-w-6xl' : 'max-w-5xl'}`}>
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      ) : (
        <main className="flex flex-1 items-center justify-center p-10">
          <div className="flex items-center gap-3 text-sm text-brand-textMuted" role="status">
            <Loader2 size={20} className="animate-spin text-brand-accent" aria-hidden="true" />
            Verificando tu sesión…
          </div>
        </main>
      )}
    </div>
  );
};

export default AppLayout;