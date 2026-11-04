import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, ScrollText, HelpCircle, Menu, X as XIcon, ShieldCheck, LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import Help from './help';
import AdminHome from './AdminHome';
import AdminUsers from './Users';
import AdminOrders from './Orders';
import AdminAudit from './Audit';

const NAV = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/pedidos', label: 'Pedidos', icon: Package },
  { to: '/admin/auditoria', label: 'Auditoría', icon: ScrollText },
  { to: '/admin/ayuda', label: 'Ayuda', icon: HelpCircle },
];

const Sidebar = ({ open, setOpen, user, onLogout }) => {
  const display = user?.name || user?.email || 'Administrador';
  const initial = display.charAt(0).toUpperCase();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        aria-label="Panel administrativo"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white p-4 shadow-2xl transition-transform duration-300 lg:sticky lg:top-24 lg:z-auto lg:max-h-[calc(100vh-7rem)] lg:w-60 lg:flex-none lg:translate-x-0 lg:self-start lg:rounded-2xl lg:border lg:border-border lg:shadow-card ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
              <ShieldCheck size={16} aria-hidden="true" />
            </span>
            <span className="text-sm font-bold text-neutral-900">Administración</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-black/5 hover:text-neutral-900"
            aria-label="Cerrar menú"
          >
            <XIcon size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-brand-50 p-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">{display}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-500">Administrador</p>
          </div>
        </div>

        <nav className="custom-scrollbar mt-4 flex-1 space-y-1 overflow-y-auto">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-soft'
                    : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900'
                }`
              }
            >
              <n.icon size={18} aria-hidden="true" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 border-t border-border pt-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
          >
            <LogOut size={18} aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
};

const Admin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  const clean = pathname.replace(/\/$/, '') || '/';
  const current = NAV.find((n) => (n.end ? clean === n.to : clean.startsWith(n.to))) || NAV[0];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      {/* Barra superior móvil */}
      <div className="card-static flex items-center justify-between p-3 lg:hidden">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
            <current.icon size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Administración</p>
            <p className="text-sm font-bold text-neutral-900">{current.label}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-neutral-900 hover:bg-brand-50"
          aria-label="Abrir menú"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>

      <Sidebar open={open} setOpen={setOpen} user={user} onLogout={handleLogout} />

      <div className="min-w-0 flex-1">
        <Routes>
          <Route index element={<AdminHome />} />
          <Route path="usuarios" element={<AdminUsers />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="auditoria" element={<AdminAudit />} />
          <Route path="ayuda" element={<Help />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default Admin;
