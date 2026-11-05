import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/useAuth';
import { routes } from '../utils/routes';
import {
  LayoutDashboard, LogOut, ShieldCheck, Settings, HelpCircle, ClipboardList, Package, Users, User, QrCode,
} from 'lucide-react';
import {
  SidebarDesktop,
  SidebarMobile,
  SidebarHeaderMobile,
  SidebarContent,
} from '../components/Sidebar';

const ROLE_LABEL = { user: 'Usuario', admin: 'Administrador' };

const adminNav = [
  { label: 'Resumen', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Usuarios', to: '/admin/usuarios', icon: Users },
  { label: 'Pedidos', to: '/admin/pedidos', icon: Package },
  { label: 'Auditoría', to: '/admin/auditoria', icon: ClipboardList },
  { label: 'Privacidad', to: routes.dashboardPrivacy, icon: ShieldCheck },
  { label: 'Ayuda', to: '/admin/ayuda', icon: HelpCircle },
];

const userNav = [
  { label: 'Resumen', to: routes.dashboard, icon: LayoutDashboard, end: true },
  { label: 'Perfil', to: routes.dashboardProfile, icon: User },
  { label: 'Contactos', to: routes.dashboardContacts, icon: Users },
  { label: 'Privacidad', to: routes.dashboardPrivacy, icon: ShieldCheck },
  { label: 'Mi QR', to: routes.dashboardQr, icon: QrCode },
  { label: 'Pedidos', to: routes.dashboardOrders, icon: Package },
];

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
  const isAdmin = role === 'admin';
  const items = isAdmin ? adminNav : userNav;

  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

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

  const sidebarProps = {
    items,
    displayName,
    email: user?.email,
    initial,
    role,
    onLogout: handleLogout,
  };

  return (
    <div className="flex min-h-screen flex-col bg-brand-50">
      <Navbar />

      {isAuthenticated ? (
        <div className="flex flex-1">
          <SidebarDesktop {...sidebarProps} />

          {sidebarOpen && (
            <div
              className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
          <SidebarMobile
            {...sidebarProps}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <SidebarHeaderMobile
              role={role}
              currentLabel={current.label}
              onOpen={() => setSidebarOpen(true)}
            />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
              <div className={`mx-auto ${isAdmin ? 'max-w-7xl' : 'max-w-6xl'}`}>
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      ) : (
        <main className="flex flex-1 items-center justify-center p-10">
          <div className="flex items-center gap-3 text-sm text-text-secondary" role="status">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-border shadow-soft">
              <svg className="h-6 w-6 animate-spin text-brand-500" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </span>
            Verificando tu sesión…
          </div>
        </main>
      )}
    </div>
  );
};

export default AppLayout;


