import { useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  ShieldCheck, LogOut, ArrowLeft, Loader2, X as XIcon, Menu as MenuIcon, MoreHorizontal,
} from 'lucide-react';
import { routes } from '../utils/routes';
import { ROLE_LABEL, PANEL_LABEL } from '../utils/dashboardNav';

const linkBase =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';

/** Quién eres, en una línea: sin tarjeta de degradado ni insignias. */
const ProfileCard = ({ displayName, email, initial, role }) => (
  <div className="flex items-center gap-3 rounded-xl bg-brand-50 p-3">
    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
      {initial}
    </span>
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-neutral-900">{displayName}</p>
      <p className="truncate text-xs text-text-secondary">
        {email && email !== displayName ? email : ROLE_LABEL[role]}
      </p>
    </div>
  </div>
);

/** Barra inferior (solo móvil): los primeros ítems y "Más" para abrir el menú completo. */
export const MobileBottomNav = ({ items, onOpenDrawer }) => {
  const VISIBLE = 4;
  const visibleItems = items.slice(0, VISIBLE);
  const hasMore = items.length > VISIBLE;

  return (
    <nav
      aria-label="Navegación rápida"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-2 pt-2 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-xl items-center justify-around gap-1">
        {visibleItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-brand-500' : 'text-text-secondary hover:text-neutral-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${isActive ? 'bg-brand-500/10' : ''}`}
                >
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        {hasMore && (
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Más opciones de navegación"
            aria-controls="dashboard-drawer"
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:text-neutral-900"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl">
              <MoreHorizontal size={20} aria-hidden="true" />
            </span>
            <span>Más</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export const SidebarContent = ({
  items,
  displayName,
  email,
  initial,
  role,
  onNavigate,
  onLogout,
  loggingOut = false,
}) => (
  <div className="flex min-h-full flex-col">
    <ProfileCard displayName={displayName} email={email} initial={initial} role={role} />

    <nav className="mt-5 space-y-1" aria-label={PANEL_LABEL[role]}>
      {items.map(({ label, to, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `${linkBase} ${
              isActive
                ? 'bg-brand-500 text-white'
                : 'text-text-secondary hover:bg-brand-500/5 hover:text-neutral-900'
            }`
          }
        >
          <Icon size={18} className="flex-none" aria-hidden="true" />
          <span className="flex-1 truncate">{label}</span>
        </NavLink>
      ))}
    </nav>

    <div className="mt-auto space-y-1 border-t border-border/60 pt-4">
      <Link
        to={routes.home}
        onClick={onNavigate}
        className={`${linkBase} text-text-secondary hover:bg-brand-500/5 hover:text-neutral-900`}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Volver al sitio
      </Link>
      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
        className={`${linkBase} text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {loggingOut ? (
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        ) : (
          <LogOut size={18} aria-hidden="true" />
        )}
        {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
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
  loggingOut,
}) => {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // Al abrir, el foco pasa al botón de cierre; Escape cierra el menú.
  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <aside
      id="dashboard-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Menú del panel"
      className={`fixed inset-y-0 left-0 z-[60] flex w-80 max-w-[88vw] flex-col bg-white shadow-2xl transition-[transform,visibility] duration-300 ease-out lg:hidden ${
        open ? 'visible translate-x-0' : 'invisible -translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between border-b border-border/60 p-4">
        <Link to={routes.home} onClick={onClose} className="flex items-center gap-2.5 font-bold tracking-tight text-neutral-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
            <ShieldCheck size={18} strokeWidth={2.4} aria-hidden="true" />
          </span>
          <span className="text-sm">Tu QR te Cuida</span>
        </Link>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-brand-500/5 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label="Cerrar menú"
        >
          <XIcon size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
        <SidebarContent
          items={items}
          displayName={displayName}
          email={email}
          initial={initial}
          role={role}
          onNavigate={onClose}
          onLogout={onLogout}
          loggingOut={loggingOut}
        />
      </div>
    </aside>
  );
};

export const SidebarDesktop = ({
  items,
  displayName,
  email,
  initial,
  role,
  onNavigate,
  onLogout,
  loggingOut,
}) => (
  <aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-72 flex-none border-r border-border/60 bg-white lg:block">
    <div className="custom-scrollbar h-full overflow-y-auto p-4">
      <SidebarContent
        items={items}
        displayName={displayName}
        email={email}
        initial={initial}
        role={role}
        onNavigate={onNavigate}
        onLogout={onLogout}
        loggingOut={loggingOut}
      />
    </div>
  </aside>
);

export const SidebarHeaderMobile = ({ role, currentLabel, onOpen, open = false }) => (
  <div className="sticky top-16 z-30 flex items-center gap-3 border-b border-border/60 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
    <button
      type="button"
      onClick={onOpen}
      className="-ml-1 flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-border/60 text-neutral-900 transition-colors hover:bg-brand-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-label="Abrir menú del panel"
      aria-controls="dashboard-drawer"
      aria-expanded={open}
    >
      <MenuIcon size={20} aria-hidden="true" />
    </button>
    <div className="min-w-0">
      <p className="text-xs font-medium text-text-secondary">{PANEL_LABEL[role]}</p>
      <p className="truncate text-sm font-bold text-neutral-900">{currentLabel}</p>
    </div>
  </div>
);