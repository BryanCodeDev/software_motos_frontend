export const PENDING = 'PENDIENTE DE CONFIGURAR';

const env = import.meta.env;

export const COMPANY = {
  name: env.VITE_COMPANY_NAME || PENDING,
  nit: env.VITE_COMPANY_NIT || PENDING,
  address: env.VITE_COMPANY_ADDRESS || PENDING,
  email: env.VITE_COMPANY_EMAIL || PENDING,
  phone: env.VITE_COMPANY_PHONE || PENDING,
  privacyEmail: env.VITE_PRIVACY_EMAIL || PENDING,
};

export const isPending = (value) => !value || value === PENDING;

/** Panel base, igual al de la documentación y el resto del sitio. */
export const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';
