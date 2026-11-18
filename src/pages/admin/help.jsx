import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { PageTitle } from '../../components/DashPage';
import { useToast } from '../../components/useToast';
import { Badge } from '../../components/ui-kit';

/* ------------------------------------------------------------------ */
/* Contenido (editar aquí, no en el JSX)                               */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { id: 'flujo', label: 'Cómo funciona' },
  { id: 'roles', label: 'Roles' },
  { id: 'arquitectura', label: 'Arquitectura' },
  { id: 'api', label: 'Endpoints' },
  { id: 'seguridad', label: 'Seguridad' },
  { id: 'entorno', label: 'Variables de entorno' },
  { id: 'pendientes', label: 'Antes de lanzar' },
];

const STEPS = [
  ['Crea su cuenta', 'Se registra y completa su perfil. La cuenta funciona sin QR.'],
  ['Compra y elige diseño', 'Elige un diseño de sticker y paga. El diseño queda guardado en el pedido.'],
  ['Se activa su QR', 'Al confirmarse el pago se genera o reutiliza su único QR. La URL /e/:identifier nunca cambia.'],
  ['Producción', 'El administrador gestiona la impresión. El estado de impresión es independiente del estado del QR.'],
  ['Alguien lo escanea', 'Se abre una página pública sin login, con solo los campos autorizados.'],
];

const STACK = [
  ['Frontend', 'React + Vite, Tailwind, React Router, Axios, Framer Motion', 'Netlify'],
  ['Backend', 'Node.js + Express (API REST, CommonJS)', 'Railway'],
  ['Base de datos', 'MySQL 8.0 (puerto local 3307)', 'Railway'],
  ['Integraciones', 'Mercado Pago (pagos y webhook idempotente), Resend (correos)', 'Externos'],
];

const MODULES = [
  ['auth', 'Registro, login, refresh, logout y recuperación de contraseña (JWT).'],
  ['email', 'Correos transaccionales con Resend.'],
  ['emergency-profiles', 'Perfil de emergencia y privacidad por campo.'],
  ['contacts', 'Contactos de emergencia con prioridad.'],
  ['identifiers', 'QR únicos por usuario: activación, impresión, vinculación y auditoría.'],
  ['products', 'Catálogo de productos y diseños de sticker.'],
  ['orders', 'Pedidos con diseño y estado comercial.'],
  ['payments', 'Preferencia de Mercado Pago y webhook de confirmación.'],
  ['admin', 'Métricas, usuarios, pedidos y auditoría.'],
  ['qr-inventory', 'Administración de QR (/admin/qrs): vinculación, impresión y exportación CSV/ZIP/PDF.'],
];

const ROLES = [
  ['Público', 'neutral', 'Sin cuenta', 'Ve la página de emergencia al escanear un QR activo, solo con los campos autorizados.'],
  ['user', 'info', 'Autenticado', 'Gestiona su perfil, contactos, privacidad, QR y pedidos. Un solo QR por usuario.'],
  ['admin', 'warn', 'Autenticado + rol', 'Accede a /admin: métricas, pedidos, QR, usuarios y auditoría.'],
];

const ENDPOINTS = [
  ['GET', '/api/health', 'Estado del servicio', 'Pública'],
  ['POST', '/api/auth/register', 'Crear cuenta (sin QR)', 'Pública'],
  ['POST', '/api/auth/login', 'Iniciar sesión', 'Pública'],
  ['POST', '/api/auth/logout', 'Cerrar sesión', 'Sesión'],
  ['GET', '/api/auth/me', 'Usuario autenticado', 'Sesión'],
  ['GET', '/api/e/:identifier', 'Página pública de emergencia', 'Pública'],
  ['CRUD', '/api/emergency-profiles', 'Perfil y privacidad', 'Sesión'],
  ['CRUD', '/api/contacts', 'Contactos de emergencia', 'Sesión'],
  ['CRUD', '/api/identifiers', 'QR propio', 'Sesión'],
  ['CRUD', '/api/products', 'Productos y diseños', 'Variable'],
  ['CRUD', '/api/orders', 'Pedidos', 'Sesión'],
  ['CRUD', '/api/payments', 'Pago y webhook', 'Sesión / Webhook'],
  ['CRUD', '/api/admin/*', 'Panel administrativo y QR', 'Solo admin'],
];

const SECURITY = [
  'Un único QR por usuario; no cambia con el diseño, el perfil ni nuevos pedidos.',
  'Identificadores aleatorios, difíciles de adivinar y nunca modificados.',
  'JWT en cookies httpOnly, roles separados, validación de datos y rate limiting.',
  'La respuesta pública excluye siempre los campos privados y médicos.',
  'Webhooks de pago idempotentes: los duplicados se ignoran.',
  'Vincular y desvincular QR es transaccional y queda en auditoría.',
];

const ENV_GROUPS = [
  ['Base de datos', ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']],
  ['Autenticación', ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET']],
  ['Mercado Pago', ['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_PUBLIC_KEY', 'MERCADOPAGO_WEBHOOK_SECRET']],
  ['Correo', ['RESEND_API_KEY', 'EMAIL_FROM']],
  ['Administración', ['ADMIN_BOOTSTRAP_TOKEN']],
];

const DONE = [
  'El frontend compila.',
  'ESLint del backend sin errores.',
  '14 pruebas del sistema QR aprobadas (informe interno, no es una auditoría independiente).',
];

const PENDING = [
  'Probar Mercado Pago en modo de pruebas y luego en producción.',
  'Configurar Resend y verificar el dominio de envío.',
  'Definir variables de entorno y dominios finales en Netlify y Railway.',
  'Crear de forma segura la primera cuenta administradora.',
  'Verificar persistencia, copias de seguridad y restauración de MySQL.',
  'Probar permisos, privacidad, QR desactivados y pagos duplicados.',
  'Validar el prototipo físico y hacer revisión legal y de seguridad.',
];

/* ------------------------------------------------------------------ */
/* Piezas                                                              */
/* ------------------------------------------------------------------ */

const panel = 'rounded-2xl border border-border bg-white';

const Code = ({ children }) => (
  <code className="rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-xs text-brand-700 ring-1 ring-brand-200/70">{children}</code>
);

const EnvVar = ({ name }) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copiar ${name}`}
      className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2 py-1 font-mono text-xs text-neutral-900 transition-colors hover:border-brand-500/40 hover:bg-brand-50"
    >
      {name}
      {copied ? <Check size={12} className="text-emerald-600" aria-hidden="true" /> : <Copy size={12} className="text-text-secondary" aria-hidden="true" />}
    </button>
  );
};

const Section = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-40">
    <h2 className="mb-3 text-base font-semibold text-neutral-900">{title}</h2>
    {children}
  </section>
);

const DocTable = ({ head, children }) => (
  <div className={`${panel} overflow-hidden`}>
    <div className="custom-scrollbar overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-brand-50/70 text-xs font-semibold text-text-secondary">
          <tr>{head.map((h) => <th key={h} scope="col" className="px-4 py-3">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  </div>
);

const methodTone = (m) => (m === 'GET' ? 'success' : m === 'POST' ? 'info' : 'neutral');

const goTo = (e, id) => {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

const Help = () => (
  <div className="space-y-6">
    <PageTitle title="Ayuda" description="Tu QR te Cuida: perfil de emergencia con QR para motociclistas en Colombia." />

    <nav
      aria-label="Índice"
      className="custom-scrollbar sticky top-20 z-10 -mx-4 flex gap-2 overflow-x-auto bg-brand-50/95 px-4 py-2 backdrop-blur lg:top-24 lg:mx-0 lg:px-0"
    >
      {SECTIONS.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={(e) => goTo(e, id)}
          className="focus-ring flex-none whitespace-nowrap rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-brand-500/40 hover:text-neutral-900"
        >
          {label}
        </a>
      ))}
    </nav>

    <div className="space-y-10">
      <Section id="flujo" title="Cómo funciona">
        <ol className={`${panel} divide-y divide-border`}>
          {STEPS.map(([title, text], i) => (
            <li key={title} className="flex gap-3 p-4">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-700">{i + 1}</span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="roles" title="Roles">
        <DocTable head={['Rol', 'Acceso', 'Puede']}>
          {ROLES.map(([role, tone, access, can]) => (
            <tr key={role} className="align-top">
              <td className="px-4 py-3"><Badge tone={tone} size="sm">{role}</Badge></td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-900">{access}</td>
              <td className="px-4 py-3 text-text-secondary">{can}</td>
            </tr>
          ))}
        </DocTable>
      </Section>

      <Section id="arquitectura" title="Arquitectura">
        <div className="space-y-4">
          <DocTable head={['Capa', 'Tecnología', 'Servicio']}>
            {STACK.map(([layer, tech, host]) => (
              <tr key={layer} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">{layer}</td>
                <td className="px-4 py-3 text-text-secondary">{tech}</td>
                <td className="whitespace-nowrap px-4 py-3"><Badge tone="neutral" size="sm">{host}</Badge></td>
              </tr>
            ))}
          </DocTable>
          <DocTable head={['Módulo del backend', 'Responsabilidad']}>
            {MODULES.map(([name, desc]) => (
              <tr key={name} className="align-top">
                <td className="whitespace-nowrap px-4 py-3"><Code>{name}</Code></td>
                <td className="px-4 py-3 text-text-secondary">{desc}</td>
              </tr>
            ))}
          </DocTable>
        </div>
      </Section>

      <Section id="api" title="Endpoints">
        <DocTable head={['Método', 'Ruta', 'Descripción', 'Acceso']}>
          {ENDPOINTS.map(([method, path, desc, access]) => (
            <tr key={path} className="align-top">
              <td className="px-4 py-3"><Badge tone={methodTone(method)} size="sm">{method}</Badge></td>
              <td className="whitespace-nowrap px-4 py-3"><Code>{path}</Code></td>
              <td className="px-4 py-3 text-text-secondary">{desc}</td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-900">{access}</td>
            </tr>
          ))}
        </DocTable>
      </Section>

      <Section id="seguridad" title="Seguridad">
        <ul className={`${panel} list-disc space-y-2 py-4 pl-9 pr-4 text-sm leading-relaxed text-text-secondary marker:text-brand-500`}>
          {SECURITY.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </Section>

      <Section id="entorno" title="Variables de entorno">
        <div className={`${panel} divide-y divide-border`}>
          {ENV_GROUPS.map(([group, vars]) => (
            <div key={group} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4">
              <p className="w-36 flex-none text-sm font-medium text-neutral-900">{group}</p>
              <div className="flex flex-wrap gap-2">{vars.map((v) => <EnvVar key={v} name={v} />)}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="pendientes" title="Antes de lanzar">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className={`${panel} p-4`}>
            <h3 className="mb-2 text-sm font-semibold text-neutral-900">Hecho</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              {DONE.map((d) => (
                <li key={d} className="flex items-start gap-2">
                  <Check size={15} className="mt-0.5 flex-none text-emerald-600" aria-hidden="true" /> {d}
                </li>
              ))}
            </ul>
          </div>
          <div className={`${panel} p-4`}>
            <h3 className="mb-2 text-sm font-semibold text-neutral-900">Pendiente</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-text-secondary marker:text-brand-500">
              {PENDING.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
        </div>
      </Section>
    </div>
  </div>
);

export default Help;