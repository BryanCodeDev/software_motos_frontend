import { DashboardShell } from '../components/DashboardShell';
import { AdminSyncProvider } from '../contexts/AdminSyncProvider';

export const AdminLayout = () => (
  <AdminSyncProvider>
    <DashboardShell requiredRole="admin" maxWidth="max-w-[1500px]" />
  </AdminSyncProvider>
);

export default AdminLayout;