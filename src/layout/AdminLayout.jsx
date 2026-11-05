import { DashboardShell } from '../components/DashboardShell';

export const AdminLayout = () => <DashboardShell requiredRole="admin" maxWidth="max-w-7xl" />;

export default AdminLayout;