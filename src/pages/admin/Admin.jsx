import { Routes, Route, NavLink, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, QrCode, Users, ScrollText, HelpCircle, ExternalLink, LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import Help from './help';
import AdminHome from './AdminHome';
import AdminOrders from './Orders';
import AdminQrs from './QrAdmin';
import AdminUsers from './Users';
import AdminAudit from './Audit';

const GROUPS = [
  {
    label: 'Operación',
    items: [
      { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
      { to: '/admin/pedidos', label: 'Pedidos', icon: Package },
      { to: '/admin/qrs', label: 'Códigos QR', icon: QrCode },
      { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/admin/auditoria', label: 'Auditoría', icon: ScrollText },
      { to: '/admin/ayuda', label: 'Ayuda', icon: HelpCircle },
    ],
  },
];
const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

const sideLink = ({ isActive }) =>
  `focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
    isActive
      ? 'bg-brand-500/10 font-semibold text-brand-700'
      : 'font-medium text-text-secondary hover:bg-brand-50 hover:text-neutral-900'
  }`;

const pill = (active) =>
  `focus-ring flex flex-none items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
    active
      ? 'border-brand-500 bg-brand-500 text-white'
      : 'border-border bg-white text-text-secondary hover:border-brand-500/40 hover:text-neutral-900'
  }`;

const Admin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  const display = user?.name || user?.email || 'Administrador';

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      {/* Móvil: navegación siempre visible, sin menú que abrir */}
      <nav aria-label="Administración" className="custom-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
        {ALL_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => pill(isActive)}>
            <Icon size={16} aria-hidden="true" /> {label}
          </NavLink>
        ))}
        <Link to="/" className={pill(false)}>
          <ExternalLink size={16} aria-hidden="true" /> Ver sitio
        </Link>
        <button type="button" onClick={handleLogout} className={`${pill(false)} !text-rose-700`}>
          <LogOut size={16} aria-hidden="true" /> Salir
        </button>
      </nav>

      {/* Escritorio */}
      <aside
        aria-label="Administración"
        className="sticky top-24 hidden max-h-[calc(100vh-7rem)] w-60 flex-none flex-col self-start rounded-2xl border border-border bg-white p-3 lg:flex"
      >
        <div className="mb-3 flex items-center gap-3 border-b border-border px-2 pb-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
            {display.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">{display}</p>
            <p className="text-xs text-text-secondary">Administrador</p>
          </div>
        </div>

        <nav aria-label="Secciones" className="custom-scrollbar flex-1 space-y-4 overflow-y-auto">
          {GROUPS.map((g) => (
            <div key={g.label}>
              <p className="px-3 pb-1 text-xs font-medium text-text-secondary">{g.label}</p>
              <div className="space-y-0.5">
                {g.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink key={to} to={to} end={end} className={sideLink}>
                    <Icon size={18} aria-hidden="true" /> {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-3 space-y-0.5 border-t border-border pt-3">
          <Link to="/" className={sideLink({ isActive: false })}>
            <ExternalLink size={18} aria-hidden="true" /> Ver sitio
          </Link>
          <button type="button" onClick={handleLogout} className={`${sideLink({ isActive: false })} w-full !text-rose-700 hover:!bg-rose-50`}>
            <LogOut size={18} aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div key={pathname} className="min-w-0 flex-1 animate-fade-in">
        <Routes>
          <Route index element={<AdminHome />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="qrs" element={<AdminQrs />} />
          <Route path="usuarios" element={<AdminUsers />} />
          <Route path="auditoria" element={<AdminAudit />} />
          <Route path="ayuda" element={<Help />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default Admin;