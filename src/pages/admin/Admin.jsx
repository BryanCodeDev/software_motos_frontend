import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { LayoutDashboard, Users, Package, HelpCircle, Menu, X, ArrowRight, Hourglass } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { PageTitle, PageLoader, EmptyState } from '../../components/DashPage';
import Help from './help';

const EASE = [0.22, 1, 0.36, 1];

const nav = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/pedidos', label: 'Pedidos', icon: Package },
  { to: '/admin/ayuda', label: 'Ayuda', icon: HelpCircle },
];

const shortcuts = [
  { to: '/admin/usuarios', icon: Users, title: 'Usuarios', text: 'Consulta y gestiona las cuentas registradas.' },
  { to: '/admin/pedidos', icon: Package, title: 'Pedidos', text: 'Sigue el estado comercial y de pago de los pedidos.' },
  { to: '/admin/ayuda', icon: HelpCircle, title: 'Ayuda', text: 'Documentación técnica y operativa del sistema.' },
];

const AdminHome = () => (
  <div>
    <PageTitle
      title="Panel administrativo"
      description="Gestiona usuarios, pedidos y configuración del sistema."
    />
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {shortcuts.map(({ to, icon: Icon, title, text }) => (
        <Link key={to} to={to} className="card group flex flex-col h-full p-5">
          <div className="flex items-start justify-between mb-4">
            <span className="icon-box group-hover:bg-brand-accent group-hover:text-brand-dark transition-colors">
              <Icon size={20} aria-hidden="true" />
            </span>
            <ArrowRight
              size={16}
              className="text-brand-textMuted opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
              aria-hidden="true"
            />
          </div>
          <h2 className="font-semibold text-brand-text">{title}</h2>
          <p className="text-xs text-brand-textMuted mt-1.5 leading-relaxed">{text}</p>
        </Link>
      ))}
    </div>
  </div>
);

// Estas secciones aparecen en el menú pero aún no tienen pantalla propia.
const ComingSoon = ({ title }) => (
  <div>
    <PageTitle title={title} />
    <div className="card-static p-6 lg:p-8">
      <EmptyState
        icon={Hourglass}
        title="Sección en desarrollo"
        text="Esta pantalla del panel administrativo aún no está disponible."
      />
    </div>
  </div>
);

const NavList = ({ onNavigate }) => (
  <nav className="space-y-1" aria-label="Administración">
    {nav.map((n) => (
      <NavLink
        key={n.to}
        to={n.to}
        end={n.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
            isActive
              ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30'
              : 'border-transparent text-brand-textMuted hover:text-brand-text hover:bg-white/5'
          }`
        }
      >
        <n.icon size={16} aria-hidden="true" />
        {n.label}
      </NavLink>
    ))}
  </nav>
);

const Admin = () => {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  // Cierra el menú móvil al navegar y con Escape.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Mientras se verifica la sesión no se redirige: evita expulsar al admin al recargar.
  if (loading) return <PageLoader />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className="flex gap-8">
      {/* Menú escritorio */}
      <aside className="hidden md:block w-56 shrink-0">
        <div className="sticky top-24">
          <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-textFaint">
            Administración
          </p>
          <NavList />
        </div>
      </aside>

      {/* Menú móvil */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-4 left-4 z-20 p-3.5 rounded-full bg-brand-accent text-brand-dark shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
        aria-label="Abrir menú de administración"
        aria-expanded={open}
      >
        <Menu size={20} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-30 bg-brand-dark/80 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-40 w-64 bg-brand-panel border-r border-brand-border p-4 md:hidden"
              initial={reduce ? false : { x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: EASE }}
              aria-label="Menú de administración"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-brand-text">Administración</span>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg text-brand-textMuted hover:bg-white/5 hover:text-brand-text"
                  aria-label="Cerrar menú"
                >
                  <X size={18} />
                </button>
              </div>
              <NavList onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0">
        <motion.div
          key={pathname}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <Routes>
            <Route index element={<AdminHome />} />
            <Route path="usuarios" element={<ComingSoon title="Usuarios" />} />
            <Route path="pedidos" element={<ComingSoon title="Pedidos" />} />
            <Route path="ayuda" element={<Help />} />
            <Route path="*" element={<AdminHome />} />
          </Routes>
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
