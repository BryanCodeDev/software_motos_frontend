import { DashboardShell } from '../components/DashboardShell';

export const AdminLayout = () => <DashboardShell requiredRole="admin" maxWidth="max-w-[1500px]" />;

export default AdminLayout;