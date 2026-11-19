import { useState, useCallback, useMemo } from 'react';
import { AdminSyncContext } from './AdminSyncContext';

export const AdminSyncProvider = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const value = useMemo(
    () => ({ refreshKey, refresh }),
    [refreshKey, refresh],
  );

  return <AdminSyncContext.Provider value={value}>{children}</AdminSyncContext.Provider>;
};

export default AdminSyncProvider;
