import { createContext } from 'react';

/** Contexto de notificaciones. Lo provee <ToastProvider /> (Toast.jsx) y se consume con useToast(). */
const ToastContext = createContext(null);
ToastContext.displayName = 'ToastContext';

export { ToastContext };