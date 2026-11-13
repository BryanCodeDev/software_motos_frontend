import {
  LayoutDashboard, User, Users, ShieldCheck, QrCode, Package, ClipboardList, HelpCircle, Barcode,
} from 'lucide-react';
import { routes } from './routes';

export const ROLE_LABEL = { user: 'Usuario', admin: 'Administrador' };
export const PANEL_LABEL = { user: 'Mi panel', admin: 'Administración' };

export const userNav = [
  { label: 'Resumen', to: routes.dashboard, icon: LayoutDashboard, end: true },
  { label: 'Perfil', to: routes.dashboardProfile, icon: User },
  { label: 'Contactos', to: routes.dashboardContacts, icon: Users },
  { label: 'Privacidad', to: routes.dashboardPrivacy, icon: ShieldCheck },
  { label: 'Mi QR', to: routes.dashboardQr, icon: QrCode },
  { label: 'Pedidos', to: routes.dashboardOrders, icon: Package },
];

export const adminNav = [
  { label: 'Resumen', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Usuarios', to: '/admin/usuarios', icon: Users },
  { label: 'Pedidos', to: '/admin/pedidos', icon: Package },
  { label: 'Inventario QR', to: routes.adminInventory, icon: Barcode },
  { label: 'Auditoría', to: '/admin/auditoria', icon: ClipboardList },
  { label: 'Ayuda', to: '/admin/ayuda', icon: HelpCircle },
];

export const getNav = (role) => (role === 'admin' ? adminNav : userNav);

/** Devuelve el ítem activo: gana la coincidencia más específica (ruta más larga). */
export const findCurrent = (items, pathname) => {
  const clean = pathname.replace(/\/$/, '') || '/';
  const matches = items.filter((n) =>
    n.end ? clean === n.to : clean === n.to || clean.startsWith(`${n.to}/`),
  );
  matches.sort((a, b) => b.to.length - a.to.length);
  return matches[0] || items[0];
};