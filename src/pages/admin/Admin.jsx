import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, HelpCircle, Menu, X as XIcon, ShieldCheck, LogOut as LogOutIcon } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import Help from './help';
import AdminUsers from './Users';
import AdminOrders from './Orders';

const ROLE_TONE = { admin: 'text-rose-400' };

const AdminHome = () => (
  <div>
    <h2 className="text-2xl font-bold text-brand-text mb-2">Panel administrativo</h2>
    <p className="text-brand-textMuted text-sm">Gestiona usuarios, pedidos y configuración del sistema.</p>
  </div>
);

const Sidebar = ({ open, setOpen, user, logout }) => (
  <>
    {open && (
      <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
    )}
    <aside
      className={`fixed md:static top-0 left-0 z-40 h-full md:h-auto w-60 bg-brand-dark/95 md:bg-transparent border-r border-black/10 md:border-0 p-4 transition-transform ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      aria-label="Panel administrativo"
    >
      <div className="flex items-center justify-between mb-6 md:mb-4 md:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-brand-accent" aria-hidden="true" />
          <span className="font-bold text-brand-text text-sm">Admin</span>
        </div>
        <button onClick={() => setOpen(false)} className="p-1 text-brand-textMuted hover:text-brand-text">
          <XIcon size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="px-2 pb-4 border-b border-black/10 md:border-0 md:pb-0">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center text-brand-accent text-xs font-bold">
            {(user?.name || user?.email?.split('@')[0] || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-semibold text-brand-text">{user?.name || user?.email || 'Administrador'}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${ROLE_TONE.admin}`}>Administrador</span>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 md:pr-0">
        <nav className="space-y-1">
          {[
            { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
            { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
            { to: '/admin/pedidos', label: 'Pedidos', icon: Package },
            { to: '/admin/ayuda', label: 'Ayuda', icon: HelpCircle },
          ].map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-accent/10 text-brand-accent'
                    : 'text-brand-textMuted hover:text-brand-text hover:bg-black/5'
                }`
              }
            >
              <n.icon size={16} aria-hidden="true" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 pt-4 border-t border-black/10 space-y-1">
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOutIcon size={16} aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  </>
);

const Admin = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return (
    <div className="flex gap-6">
      <button onClick={() => setOpen(true)} className="md:hidden fixed bottom-4 left-4 z-20 p-3 rounded-full bg-brand-accent text-brand-dark shadow-lg">
        <Menu size={20} aria-label="Abrir menú" />
      </button>
      <Sidebar open={open} setOpen={setOpen} user={user} logout={logout} />
      <div className="flex-1 min-w-0">
        <Routes>
          <Route index element={<AdminHome />} />
          <Route path="usuarios" element={<AdminUsers />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="ayuda" element={<Help />} />
          <Route path="*" element={<AdminHome />} />
        </Routes>
      </div>
    </div>
  );
};

export default Admin;

