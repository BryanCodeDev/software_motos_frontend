import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Package, ScrollText, HelpCircle, Menu, X as XIcon, ShieldCheck, LogOut, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import Help from './help';
import AdminHome from './AdminHome';
import AdminUsers from './Users';
import AdminOrders from './Orders';
import AdminAudit from './Audit';

const EASE = [0.22, 1, 0.36, 1];
const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

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
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-brand-900/60 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        aria-label="Panel administrativo"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white p-4 shadow-2xl transition-transform duration-300 ease-out lg:sticky lg:top-24 lg:z-auto lg:max-h-[calc(100vh-7rem)] lg:w-60 lg:flex-none lg:translate-x-0 lg:self-start lg:rounded-2xl lg:border lg:border-border lg:shadow-card ${
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
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-brand-50 hover:text-neutral-900"
            aria-label="Cerrar menú"
          >
            <XIcon size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Tarjeta de usuario */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-3.5 text-white shadow-soft">
          <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white/15 text-sm font-bold ring-1 ring-white/25">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{display}</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-white/75">
                <ShieldCheck size={11} aria-hidden="true" /> Administrador
              </p>
            </div>
          </div>
        </div>

        <nav className="custom-scrollbar mt-4 flex-1 space-y-1 overflow-y-auto" aria-label="Secciones de administración">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className="focus-ring relative block rounded-lg"
            >
              {({ isActive }) => (
                <span
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="admin-nav-active"
                      className="absolute inset-0 rounded-lg bg-brand-500 shadow-soft"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <n.icon size={18} className="relative" aria-hidden="true" />
                  <span className="relative">{n.label}</span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 space-y-1 border-t border-border pt-4">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-brand-50 hover:text-neutral-900"
          >
            <ExternalLink size={18} aria-hidden="true" /> Ver sitio
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  const clean = pathname.replace(/\/$/, '') || '/';
  const current = NAV.find((n) => (n.end ? clean === n.to : clean.startsWith(n.to))) || NAV[0];

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Barra superior móvil */}
        <div className={`${panel} flex items-center justify-between p-3 lg:hidden`}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
              <current.icon size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium text-text-secondary">Administración</p>
              <p className="text-sm font-bold text-neutral-900">{current.label}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg border border-border text-neutral-900 transition-colors hover:bg-brand-50"
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>

        <Sidebar open={open} setOpen={setOpen} user={user} onLogout={handleLogout} />

        <motion.div
          key={clean}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="min-w-0 flex-1"
        >
          <Routes>
            <Route index element={<AdminHome />} />
            <Route path="usuarios" element={<AdminUsers />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="auditoria" element={<AdminAudit />} />
            <Route path="ayuda" element={<Help />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </motion.div>
      </div>
    </MotionConfig>
  );
};

export default Admin;