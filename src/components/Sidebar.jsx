import { useEffect, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  ShieldCheck, QrCode, LogOut, ArrowLeft, ArrowRight, Loader2,
  X as XIcon, Menu as MenuIcon, ChevronUp,
} from 'lucide-react';
import { routes } from '../utils/routes';
import { ROLE_LABEL, PANEL_LABEL } from '../utils/dashboardNav';

const linkBase =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';

/* Tarjeta de perfil con degradado de marca */
const ProfileCard = ({ displayName, email, initial, role }) => (
  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-4 text-white shadow-card">
    <div
      className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-400/30 blur-2xl"
      aria-hidden="true"
    />
    <div className="relative flex items-center gap-3">
      <span className="relative flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white/15 text-base font-bold ring-1 ring-white/30">
        {initial}
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-brand-800"
          title="Sesión activa"
        />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{displayName}</p>
        {email && email !== displayName && (
          <p className="truncate text-xs text-white/70">{email}</p>
        )}
      </div>
    </div>
    <span className="relative mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-inset ring-white/20">
      <ShieldCheck size={12} aria-hidden="true" />
      {ROLE_LABEL[role]}
    </span>
  </div>
);

/** Barra de navegación inferior tipo WhatsApp (solo móvil).
 * Muestra los primeros `visible` ítems y un botón "Más" que abre el drawer. */
export const MobileBottomNav = ({ items, onOpenDrawer }) => {
  const VISIBLE = 4;
  const visibleItems = items.slice(0, VISIBLE);
  const hasMore = items.length > VISIBLE;

  return (
    <nav
      aria-label="Navegación rápida"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-xl items-center justify-around gap-1">
        {visibleItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand-500' : 'text-text-secondary hover:text-neutral-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                    isActive ? 'bg-brand-500/10 text-brand-500' : 'text-text-secondary'
                  }`}
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
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium text-brand-500 transition-colors hover:bg-brand-50"
            aria-label="Más opciones de navegación"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
              <ChevronUp size={20} aria-hidden="true" />
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

    <nav className="mt-6 space-y-1" aria-label={PANEL_LABEL[role]}>
      {items.map(({ label, to, icon: Icon, end }, index) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          style={{ animationDelay: `${index * 45}ms` }}
          className={({ isActive }) =>
            `group animate-slide-up opacity-0 ${linkBase} ${
              isActive
                ? 'bg-brand-500 text-white shadow-[0_10px_24px_-10px_rgba(159,18,57,0.6)]'
                : 'text-text-secondary hover:bg-brand-500/5 hover:text-neutral-900'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg transition-all duration-200 group-hover:scale-105 ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'bg-brand-500/5 text-brand-500 group-hover:bg-brand-500/10'
                }`}
              >
                <Icon size={17} aria-hidden="true" />
              </span>
              <span className="flex-1 truncate">{label}</span>
              {isActive && (
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-white" aria-hidden="true" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>

    {role === 'user' && (
      <Link
        to={routes.dashboardQr}
        onClick={onNavigate}
        className="group mt-6 block rounded-xl border border-brand-500/20 bg-brand-50 p-4 transition-all duration-200 hover:border-brand-500/40 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-500 text-white">
            <QrCode size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900">Tu QR de emergencia</p>
            <p className="text-xs text-text-secondary">Descárgalo o compártelo</p>
          </div>
        </div>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-500">
          Abrir mi QR
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </Link>
    )}

    <div className="mt-auto space-y-1 border-t border-border/60 pt-5">
      <Link
        to={routes.home}
        onClick={onNavigate}
        className={`group ${linkBase} text-text-secondary hover:bg-brand-500/5 hover:text-neutral-900`}
      >
        <ArrowLeft size={18} className="transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
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

  // Al abrir el menú, el foco pasa al botón de cierre.
  useEffect(() => {
    if (open) closeRef.current?.focus();
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
      <div className="flex items-center justify-between border-b border-border/60 p-5">
        <Link
          to={routes.home}
          onClick={onClose}
          className="flex items-center gap-2.5 font-bold tracking-tight text-neutral-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-soft">
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
      <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
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
  <aside className="fixed top-16 inset-x-0 bottom-0 left-0 z-40 hidden h-[calc(100vh-4rem)] w-72 flex-none border-r border-border/60 bg-white lg:block">
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