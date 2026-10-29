import { useContext } from 'react';
import { ToastContext } from './ToastContext';

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
};
