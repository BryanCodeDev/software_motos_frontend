import { useContext } from 'react';
import { AdminSyncContext } from './AdminSyncContext';

export const useAdminSync = () => {
  const ctx = useContext(AdminSyncContext);
  if (!ctx) return { refreshKey: 0, refresh: () => {} };
  return ctx;
};

export default useAdminSync;
