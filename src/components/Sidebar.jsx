import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  User, Users, ShieldCheck, QrCode, Package, LayoutDashboard, LogOut,
  ArrowLeft, X as XIcon, Menu as MenuIcon, HelpCircle, ClipboardList,
} from 'lucide-react';
import { routes } from '../utils/routes';

const ROLE_LABEL = { user: 'Usuario', admin: 'Administrador' };
const ROLE_BADGE = {
  user: 'bg-brand-500/10 text-brand-500 ring-brand-500/20',
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

const linkBase =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors';

export const SidebarContent = ({
  items,
  displayName,
  email,
  initial,
  role,
  onNavigate,
  onLogout,
}) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center gap-3 rounded-2xl bg-brand-500/5 p-4 border border-border/50">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-500 text-white shadow-[0_8px_24px_-6px_rgba(159,18,57,0.35)]">
        {initial}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-neutral-900">{displayName}</p>
        {email && email !== displayName && (
          <p className="truncate text-xs text-text-secondary">{email}</p>
        )}
        <span className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${ROLE_BADGE[role]}`}>
          {ROLE_LABEL[role]}
        </span>
      </div>
    </div>

    <nav className="mt-6 space-y-0.5" aria-label="Panel">
      {items.map(({ label, to, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? 'bg-brand-500 text-white shadow-[0_8px_24px_-6px_rgba(159,18,57,0.25)]'
                : 'text-text-secondary hover:bg-brand-500/5 hover:text-neutral-900'
            }`
          }
        >
          <Icon size={18} aria-hidden="true" /> {label}
        </NavLink>
      ))}
    </nav>

    <div className="mt-auto pt-6 space-y-1 border-t border-border/50">
      <Link
        to={routes.home}
        onClick={onNavigate}
        className={`${linkBase} text-text-secondary hover:bg-brand-500/5 hover:text-neutral-900`}
      >
        <ArrowLeft size={18} aria-hidden="true" /> Volver al sitio
      </Link>
      <button type="button" onClick={onLogout} className={`${linkBase} text-rose-700 hover:bg-rose-5/50`}>
        <LogOut size={18} aria-hidden="true" /> Cerrar sesión
      </button>
    </div>
  </div>
);

export const SidebarMobile = ({
  items,
  displayName,
  email,
  initial,
  role,
  open,
  onClose,
  onLogout,
}) => (
  <aside
    aria-label="Menú del panel"
    aria-hidden={!open}
    className={`fixed inset-y-0 left-0 z-[60] flex w-80 max-w-[90vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
      open ? 'translate-x-0' : '-translate-x-full'
    }`}
  >
    <div className="flex items-center justify-between border-b border-border/50 p-5">
      <div className="flex items-center gap-2.5 font-bold tracking-tight text-neutral-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-soft">
          <ShieldCheck size={18} strokeWidth={2.4} aria-hidden="true" />
        </span>
        <span className="text-sm">Tu QR te Cuida</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-brand-500/5 hover:text-neutral-900"
        aria-label="Cerrar menú"
      >
        <XIcon size={20} aria-hidden="true" />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
      <SidebarContent
        items={items}
        displayName={displayName}
        email={email}
        initial={initial}
        role={role}
        onNavigate={onClose}
        onLogout={onLogout}
      />
    </div>
  </aside>
);

export const SidebarDesktop = ({
  items,
  displayName,
  email,
  initial,
  role,
  onNavigate,
  onLogout,
}) => (
  <aside className="hidden w-72 flex-none border-r border-border/50 bg-white lg:block">
    <div className="custom-scrollbar sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto p-6">
      <SidebarContent
        items={items}
        displayName={displayName}
        email={email}
        initial={initial}
        role={role}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
    </div>
  </aside>
);

export const SidebarHeaderMobile = ({
  role,
  currentLabel,
  onOpen,
}) => (
  <div className="flex items-center gap-3 border-b border-border/50 bg-white px-4 py-3 lg:hidden">
    <button
      type="button"
      onClick={onOpen}
      className="-ml-1 flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 text-neutral-900 hover:bg-brand-500/5"
      aria-label="Abrir menú del panel"
      aria-expanded={false}
    >
      <MenuIcon size={20} aria-hidden="true" />
    </button>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
        Panel de {ROLE_LABEL[role].toLowerCase()}
      </p>
      <p className="truncate text-sm font-bold text-neutral-900">{currentLabel}</p>
    </div>
  </div>
);

