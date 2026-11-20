import { useState } from 'react';
import { Copy, Check, AlertTriangle, ShieldCheck, Network, Code2, Users, Mail, CreditCard, Truck, Award, FileText } from 'lucide-react';
import { PageTitle } from '../../components/DashPage';
import { useToast } from '../../components/useToast';
import { Badge } from '../../components/ui-kit';

/* ------------------------------------------------------------------ */
/* Contenido de la documentación (editar aquí)                         */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'como-funciona', label: 'Cómo funciona el producto' },
  { id: 'flujo-usuario', label: 'Flujo del usuario normal' },
  { id: 'flujo-admin', label: 'Flujo del administrador' },
  { id: 'modulos-internos', label: 'Módulos internos del sistema' },
  { id: 'roles', label: 'Roles y permisos' },
  { id: 'arquitectura', label: 'Arquitectura técnica' },
  { id: 'api', label: 'Endpoints de la API' },
  { id: 'seguridad', label: 'Seguridad y privacidad' },
  { id: 'pagos', label: 'Sistema de pagos (Mercado Pago)' },
  { id: 'envio', label: 'Envío de stickers y QRs físicos' },
  { id: 'qr-admin', label: 'Administración de QR (panel admin)' },
  { id: 'entorno', label: 'Variables de entorno' },
  { id: 'checklist', label: 'Checklist antes de lanzar' },
];

/* ────────── Cómo funciona el producto (alto nivel) ────────── */
const HERO_CARDS = [
  {
    icon: Award,
    title: 'Tu QR te Cuida',
    subtitle: 'Perfil de emergencia con código QR para motociclistas.',
    desc: 'Cada usuario registra su perfil de emergencia (médico, contactos, alergias) y recibe un código QR permanente que cualquiera puede escanear para ver la información autorizada.',
  },
  {
    icon: ShieldCheck,
    title: 'Acceso rápido sin login',
    subtitle: 'La página pública se abre al escanear el QR.',
    desc: 'Al escanear el código QR se abre /e/:identificador, una página pública sin necesidad de cuenta ni contraseña, mostrando solo los campos que el usuario autorizó.',
  },
  {
    icon: CreditCard,
    title: 'Stickers físicos',
    subtitle: 'Compra stickers con tu QR impreso.',
    desc: 'Desde el panel de pedidos el usuario compra stickers físicos con su diseño elegido. El administrador gestiona la impresión, el estado del envío y la entrega.',
  },
  {
    icon: Network,
    title: 'Un QR por usuario, para siempre',
    subtitle: 'El identificador nunca cambia.',
    desc: 'El QR se vincula al usuario al activarse (tras el pago) y permanece activo aunque cambie el perfil, el diseño o se hagan nuevos pedidos.',
  },
];

/* ────────── Flujo del usuario normal ────────── */
const USER_FLOW = [
  {
    step: '1',
    title: 'Crear cuenta',
    desc: 'El usuario se registra con correo y contraseña. La cuenta se crea sin QR asociado. Puede completar su perfil de emergencia antes o después de comprar.',
    detail: [
      'Registro con email y contraseña (JWT en cookie httpOnly).',
      'Inicio de sesión y acceso al panel de usuario (/panel).',
      'Perfil de emergencia: datos médicos, alergias, grupo sanguíneo, contacto de emergencia.',
      'Privacidad por campo: el usuario decide qué información es visible en la página pública del QR.',
    ],
  },
  {
    step: '2',
    title: 'Comprar sticker y elegir diseño',
    desc: 'El usuario compra un pack de stickers y selecciona un diseño del catálogo. El diseño queda guardado en el pedido.',
    detail: [
      'Catálogo de productos y diseños disponibles.',
      'Selección de dirección de envío física (nombre, teléfono, dirección, ciudad, departamento, código postal, notas).',
      'Creación del pedido con estado comercial "pendiente de pago".',
      'El diseño elegido se asocia al pedido.',
    ],
  },
  {
    step: '3',
    title: 'Pagar el pedido',
    desc: 'El pago se procesa con Mercado Pago. Al aprobarse, se genera o reutiliza el QR permanente del usuario.',
    detail: [
      'Preferencia de pago creada en Mercado Pago.',
      'Redirección a Mercado Pago para completar el pago.',
      'Webhook idempotente que confirma el pago y activa el QR.',
      'Si el pago es manual (sin Mercado Pago configurado), el pedido queda pendiente y el admin lo confirma manualmente.',
    ],
  },
  {
    step: '4',
    title: 'Activar el QR',
    desc: 'Una vez pagado, el QR se activa. La URL pública /e/:identificador nunca cambia.',
    detail: [
      'El identificador QR se genera al registrar la cuenta como "pendiente de activación".',
      'Al confirmarse el pago, el QR pasa a estado "activo".',
      'El QR puede vincularse a un perfil de emergencia o a un pedido de stickers.',
      'Un usuario tiene un único QR permanente.',
    ],
  },
  {
    step: '5',
    title: 'Alguien escanea el QR',
    desc: 'Cualquier persona con un teléfono puede escanear el código QR y ver la información de emergencia autorizada.',
    detail: [
      'Se abre la página pública /e/:identificador sin login.',
      'Solo se muestran los campos que el usuario marcó como públicos (privacidad por campo).',
      'Los campos privados y médicos nunca se exponen públicamente.',
      'El escaneo queda registrado para auditoría (quién, cuándo, desde dónde).',
    ],
  },
];

/* ────────── Flujo del administrador ────────── */
const ADMIN_FLOW = [
  {
    step: '1',
    title: 'Panel de administración',
    desc: 'El administrador accede a /admin y gestiona usuarios, pedidos, QR y auditoría.',
    detail: [
      'Vista de métricas globales (usuarios, pedidos, ingresos, QRs por estado).',
      'Gestión de usuarios: listar, vincular/desvincular QRs.',
      'Auditoría completa de acciones administrativas.',
    ],
  },
  {
    step: '2',
    title: 'Administración de pedidos',
    desc: 'El admin supervisa todos los pedidos de stickers y sus estados.',
    detail: [
      'Listado paginado con filtros por estado comercial y estado de pago.',
      'Cambio de estado comercial: pagado → preparando → enviado → entregado.',
      'Registro de transportadora, número de guía y URL de seguimiento.',
      'Historial de cambios de estado con quién y cuándo lo modificó.',
      'Cancelación y reembolso de pedidos.',
    ],
  },
  {
    step: '3',
    title: 'Administración de QR',
    desc: 'Gestión completa del inventario de códigos QR.',
    detail: [
      'Listado de todos los QR con estado (pendiente de activación, activo, desactivado, desvinculado).',
      'Selección individual o masiva de QR (una página entera o selección manual).',
      'Asignar diseño de sticker por lote a varios QR a la vez.',
      'Activar, desactivar y eliminar QR (solo si no está vinculado a un usuario).',
      'Exportación masiva a CSV, ZIP y PDF (un solo archivo con todos los QR seleccionados).',
    ],
  },
];

/* ────────── Módulos internos del backend ────────── */
const MODULES = [
  ['auth', 'Autenticación', 'Registro, login, refresh de tokens, logout y recuperación de contraseña. Usa JWT en cookies httpOnly.'],
  ['emergency-profiles', 'Perfiles de emergencia', 'Datos médicos, alergias, grupo sanguíneo, contacto de emergencia y privacidad por campo (qué se muestra públicamente).'],
  ['contacts', 'Contactos de emergencia', 'Lista de contactos con prioridad y relación (familiar, amigo, médico, etc.).'],
  ['identifiers', 'Códigos QR', 'Identificadores únicos por usuario: activación, impresión, vinculación a perfil/pedido y auditoría. Un QR por usuario, identificador permanente.'],
  ['products', 'Catálogo', 'Productos disponibles y diseños de sticker con imagen, nombre, slug y disponibilidad.'],
  ['orders', 'Pedidos', 'Pedidos de stickers con diseño asociado, cantidad, dirección de envío, estado comercial y estado de pago.'],
  ['payments', 'Pagos', 'Preferencias de pago con Mercado Pago y webhook idempotente de confirmación.'],
  ['admin', 'Panel administrativo', 'Métricas, gestión de usuarios, pedidos, QR y registro de auditoría de acciones.'],
  ['qr-inventory', 'Inventario QR', 'Administración de códigos QR: vinculación, estados de impresión, exportación masiva y asignación de diseños por lote.'],
];

/* ────────── Roles y permisos ────────── */
const ROLES = [
  ['Público', 'neutral', 'Sin cuenta', 'Ve la página de emergencia pública al escanear un QR activo. Solo ve los campos autorizados por el usuario. No puede crear cuenta ni acceder al panel.'],
  ['user', 'info', 'Autenticado', 'Gestiona su perfil de emergencia, contactos, privacidad, QR y pedidos. Tiene un único QR permanente. Puede comprar stickers y ver sus pedidos.'],
  ['admin', 'warn', 'Autenticado + rol', 'Accede a /admin: métricas, usuarios, pedidos, QR, auditoría. Puede activar/desactivar/eliminar QR, cambiar estados de pedido y exportar masivamente.'],
];

/* ────────── Endpoints ────────── */
const ENDPOINTS = [
  ['GET', '/api/health', 'Estado del servicio (health check)', 'Pública'],
  ['POST', '/api/auth/register', 'Crear cuenta de usuario (sin QR asociado)', 'Pública'],
  ['POST', '/api/auth/login', 'Iniciar sesión y establecer sesión', 'Pública'],
  ['POST', '/api/auth/logout', 'Cerrar sesión', 'Sesión'],
  ['GET', '/api/auth/me', 'Datos del usuario autenticado', 'Sesión'],
  ['GET', '/api/e/:identifier', 'Página pública de emergencia al escanear QR', 'Pública'],
  ['CRUD', '/api/emergency-profiles', 'Perfil de emergencia y privacidad por campo', 'Sesión (usuario)'],
  ['CRUD', '/api/contacts', 'Contactos de emergencia con prioridad', 'Sesión (usuario)'],
  ['CRUD', '/api/identifiers', 'QR propio del usuario autenticado', 'Sesión (usuario)'],
  ['CRUD', '/api/products', 'Catálogo de productos y diseños de sticker', 'Variable'],
  ['CRUD', '/api/orders', 'Pedidos de stickers del usuario', 'Sesión (usuario)'],
  ['CRUD', '/api/payments', 'Preferencia de pago y webhook de Mercado Pago', 'Sesión / Webhook'],
  ['GET', '/api/admin/stats', 'Métricas globales del sistema', 'Solo admin'],
  ['GET', '/api/admin/users', 'Listado de usuarios', 'Solo admin'],
  ['CRUD', '/api/admin/orders', 'Gestión de todos los pedidos', 'Solo admin'],
  ['CRUD', '/api/admin/qrs', 'Administración de QR (vincular, desvincular, estados)', 'Solo admin'],
  ['PATCH', '/api/admin/qrs/bulk/design', 'Asignar diseño de sticker por lote a QR seleccionados', 'Solo admin'],
  ['POST', '/api/admin/qrs/export/:format', 'Exportación masiva a csv/zip/pdf', 'Solo admin'],
  ['POST', '/api/admin/qrs/:id/activate', 'Activar un QR individual', 'Solo admin'],
  ['POST', '/api/admin/qrs/:id/deactivate', 'Desactivar un QR individual', 'Solo admin'],
  ['DELETE', '/api/admin/qrs/:id', 'Eliminar un QR (solo si no está vinculado)', 'Solo admin'],
];

/* ────────── Seguridad ────────── */
const SECURITY = [
  'Un único QR por usuario; el identificador nunca cambia, ni con nuevos pedidos ni cambios de perfil.',
  'Identificadores QR generados aleatoriamente, difíciles de adivinar y nunca modificados.',
  'JWT almacenado en cookies httpOnly (no accesible desde JavaScript del cliente).',
  'Roles separados (público / user / admin) con validación de permisos en cada endpoint.',
  'Validación de datos de entrada en todos los endpoints (Zod schemas).',
  'Rate limiting para evitar abusos en registro, login y solicitudes de recuperación.',
  'La respuesta pública /e/:identificador excluye siempre los campos privados y médicos.',
  'Privacidad por campo: el usuario decide qué información es visible públicamente.',
  'Webhooks de pago idempotentes: pagos duplicados se ignoran y no se procesan dos veces.',
  'Vincular y desvincular QR es transaccional y queda registrado en auditoría.',
  'Eliminación de QR protegida: no se puede eliminar un QR vinculado a un usuario.',
];

/* ────────── Sistema de pagos ────────── */
const PAYMENTS = [
  {
    title: 'Proveedor',
    desc: 'Mercado Pago se encarga del procesamiento de pagos en línea.',
  },
  {
    title: 'Flujo de pago',
    desc: 'El frontend crea una preferencia de pago, redirige al usuario a Mercado Pago y, al retornar, un webhook confirma el pago y activa el QR.',
  },
  {
    title: 'Webhook idempotente',
    desc: 'El webhook de Mercado Pago es idempotente: si llega el mismo pago dos veces, el segundo se ignora para evitar activaciones o cobros duplicados.',
  },
  {
    title: 'Pago manual',
    desc: 'Si Mercado Pago no está configurado, el pedido queda en estado "pendiente de pago" y el administrador lo confirma manualmente desde el panel.',
  },
  {
    title: 'Estados de pago',
    desc: 'unpaid (sin pagar), pending (en proceso), approved (aprobado), rejected (rechazado), cancelled (cancelado), refunded (reembolsado).',
  },
];

/* ────────── Envío de stickers ────────── */
const ENVIO = [
  {
    title: 'Dirección de envío',
    desc: 'Al comprar stickers, el usuario indica nombre completo, teléfono, dirección, ciudad, departamento, código postal y notas de entrega.',
  },
  {
    title: 'Estado del envío',
    desc: 'El pedido avanza por estados comerciales: pagado → preparando → enviado → entregado. El administrador registra transportadora, número de guía y URL de seguimiento.',
  },
  {
    title: 'Producción de stickers',
    desc: 'Cada sticker lleva impreso el código QR del usuario con el diseño elegido. El administrador puede asignar diseños por lote a varios QR antes de enviarlos a impresión.',
  },
  {
    title: 'Entrega',
    desc: 'Cuando el pedido se marca como "entregado", el usuario recibe notificación y puede ver el historial de su pedido en su panel.',
  },
];

/* ────────── Administración de QR ────────── */
const QR_ADMIN = [
  {
    title: 'Estados de QR',
    desc: 'pendiente de activación → activo → desactivado → desvinculado. Solo un admin puede cambiar estos estados.',
  },
  {
    title: 'Selección masiva',
    desc: 'Se pueden seleccionar QR uno a uno o "Seleccionar esta página" para marcar todos los QR visibles de la página actual.',
  },
  {
    title: 'Asignar diseño por lote',
    desc: 'Se elige un diseño del catálogo y se aplica a todos los QR seleccionados en una sola operación transaccional.',
  },
  {
    title: 'Diseño + PDF',
    desc: 'Asigna el diseño elegido a la selección y genera un solo archivo PDF con todos los códigos QR listos para imprimir.',
  },
  {
    title: 'Eliminación segura',
    desc: 'Solo se pueden eliminar QR que no estén vinculados a ningún usuario. Los QR vinculados solo se pueden desvincular, no eliminar.',
  },
  {
    title: 'Exportación masiva',
    desc: 'Exporta los QR seleccionados a CSV, ZIP o PDF (un solo archivo con todos los QR).',
  },
];

/* ────────── Variables de entorno ────────── */
const ENV_GROUPS = [
  ['Base de datos', ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']],
  ['Autenticación', ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET']],
  ['Mercado Pago', ['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_PUBLIC_KEY', 'MERCADOPAGO_WEBHOOK_SECRET']],
  ['Correo', ['RESEND_API_KEY', 'EMAIL_FROM']],
  ['Administración', ['ADMIN_BOOTSTRAP_TOKEN']],
];

/* ────────── Checklist antes de lanzar ────────── */
const DONE = [
  'Frontend compila sin errores.',
  'ESLint del backend sin errores.',
  'Sistema de QR probado internamente.',
  'Documentación de ayuda actualizada.',
];

const PENDING = [
  'Probar Mercado Pago en modo de pruebas y luego en producción.',
  'Configurar Resend y verificar el dominio de envío de correos.',
  'Definir variables de entorno y dominios finales en Netlify y Railway.',
  'Crear de forma segura la primera cuenta administradora.',
  'Verificar persistencia, copias de seguridad y restauración de MySQL.',
  'Probar permisos, privacidad por campo, QR desactivados y pagos duplicados.',
  'Validar el prototipo físico de los stickers y hacer revisión legal y de seguridad.',
];

/* ------------------------------------------------------------------ */
/* Piezas de interfaz                                                  */
/* ------------------------------------------------------------------ */

const panel = 'rounded-2xl border border-border bg-white shadow-sm';

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
  <section id={id} className="scroll-mt-24">
    <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-neutral-900">
      <FileText size={16} aria-hidden="true" /> {title}
    </h2>
    {children}
  </section>
);

const DocTable = ({ head, children }) => (
  <div className={`${panel} overflow-hidden`}>
    <div className="custom-scrollbar overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-brand-50/70 text-xs font-semibold text-text-secondary">
          <tr>{head.map((h) => <th key={h} scope="col" className="px-4 py-3">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  </div>
);

const methodTone = (m) => (m === 'GET' ? 'success' : m === 'POST' ? 'info' : m === 'PATCH' || m === 'PUT' ? 'warn' : 'neutral');

const goTo = (e, id) => {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const DetailList = ({ items }) => (
  <ul className="space-y-2 text-sm text-text-secondary list-disc pl-6">
    {items.map((t, i) => (
      <li key={i}>{t}</li>
    ))}
  </ul>
);

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

const Help = () => (
  <div className="space-y-6">
    <PageTitle title="Ayuda y documentación" description="Todo lo que necesitas saber sobre Tu QR te Cuida: cómo funciona el producto, módulos internos, seguridad y administración." />

    {/* Índice de navegación */}
    <nav
      aria-label="Índice de documentación"
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

      {/* ─── Inicio ─── */}
      <Section id="inicio" title="Bienvenido a la documentación">
        <div className={`${panel} p-6 lg:p-8`}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {HERO_CARDS.map((c) => (
              <div key={c.title} className="rounded-xl border border-border bg-white p-4">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 mb-3">
                  <c.icon size={18} aria-hidden="true" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-neutral-900">{c.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-text-secondary">
            <span className="font-medium text-neutral-900">Tu QR te Cuida</span> es un sistema de perfiles de emergencia con código QR para motociclistas en Colombia. Permite que cualquier persona escanee un QR y acceda a la información médica y de contacto autorizada por el usuario, sin necesidad de iniciar sesión.
          </p>
        </div>
      </Section>

      {/* ─── Cómo funciona el producto ─── */}
      <Section id="como-funciona" title="Cómo funciona el producto">
        <p className="mb-4 text-sm text-text-secondary">
          Este es el ciclo de vida completo, desde que el usuario se registra hasta que alguien escanea su QR en una emergencia.
        </p>
        <div className={`${panel} divide-y divide-border`}>
          {USER_FLOW.map((s) => (
            <div key={s.step} className="flex gap-4 p-4">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold">{s.step}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">{s.title}</h3>
                  <Badge tone="neutral" size="sm">Paso {s.step}</Badge>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">{s.desc}</p>
                <DetailList items={s.detail} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Flujo usuario ─── */}
      <Section id="flujo-usuario" title="Flujo del usuario normal">
        <p className="mb-4 text-sm text-text-secondary">
          Qué puede hacer un usuario autenticado desde su panel (/panel).
        </p>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className={`${panel} p-4`}>
            <h3 className="mb-2 text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
              <Users size={14} aria-hidden="true" /> Mi perfil
            </h3>
            <ul className="space-y-1 text-xs text-text-secondary list-disc pl-5">
              <li>Datos de emergencia (médico, alergias, grupo sanguíneo).</li>
              <li>Contactos de emergencia con prioridad.</li>
              <li>Privacidad por campo (qué se muestra públicamente).</li>
            </ul>
          </div>
          <div className={`${panel} p-4`}>
            <h3 className="mb-2 text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
              <CreditCard size={14} aria-hidden="true" /> Mis pedidos
            </h3>
            <ul className="space-y-1 text-xs text-text-secondary list-disc pl-5">
              <li>Ver estado de pedidos de stickers.</li>
              <li>Ver dirección de envío y guía.</li>
              <li>Comprar stickers adicionales.</li>
            </ul>
          </div>
          <div className={`${panel} p-4`}>
            <h3 className="mb-2 text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
              <Network size={14} aria-hidden="true" /> Mi QR
            </h3>
            <ul className="space-y-1 text-xs text-text-secondary list-disc pl-5">
              <li>Ver QR permanente y activo.</li>
              <li>Copiar enlace público /e/:id.</li>
              <li>Descargar sticker con QR.</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* ─── Flujo admin ─── */}
      <Section id="flujo-admin" title="Flujo del administrador">
        <p className="mb-4 text-sm text-text-secondary">
          Qué puede hacer un administrador desde /admin.
        </p>
        <div className={`${panel} divide-y divide-border`}>
          {ADMIN_FLOW.map((s) => (
            <div key={s.step} className="flex gap-4 p-4">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-700 text-white text-xs font-bold">{s.step}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">{s.title}</h3>
                  <Badge tone="warn" size="sm">Admin</Badge>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">{s.desc}</p>
                <DetailList items={s.detail} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Módulos internos ─── */}
      <Section id="modulos-internos" title="Módulos internos del sistema">
        <p className="mb-4 text-sm text-text-secondary">
          El backend está organizado en módulos independientes. Cada uno tiene su propia lógica de negocio, rutas y validaciones.
        </p>
        <DocTable head={['Módulo', 'Responsabilidad', 'Detalle']}>
          {MODULES.map(([id, name, desc]) => (
            <tr key={id} className="align-top">
              <td className="whitespace-nowrap px-4 py-3"><Code>{id}</Code></td>
              <td className="px-4 py-3 font-medium text-neutral-900">{name}</td>
              <td className="px-4 py-3 text-text-secondary">{desc}</td>
            </tr>
          ))}
        </DocTable>
      </Section>

      {/* ─── Roles ─── */}
      <Section id="roles" title="Roles y permisos">
        <p className="mb-4 text-sm text-text-secondary">
          Tres niveles de acceso con permisos diferenciados.
        </p>
        <DocTable head={['Rol', 'Tipo de acceso', 'Puede hacer']}>
          {ROLES.map(([role, tone, access, can]) => (
            <tr key={role} className="align-top">
              <td className="px-4 py-3"><Badge tone={tone} size="sm">{role}</Badge></td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-900">{access}</td>
              <td className="px-4 py-3 text-text-secondary">{can}</td>
            </tr>
          ))}
        </DocTable>
      </Section>

      {/* ─── Arquitectura ─── */}
      <Section id="arquitectura" title="Arquitectura técnica">
        <div className="space-y-4">
          <DocTable head={['Capa', 'Tecnología', 'Despliegue']}>
            <tr className="align-top">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">Frontend</td>
              <td className="px-4 py-3 text-text-secondary">React + Vite, Tailwind CSS, React Router, Axios, Framer Motion</td>
              <td className="whitespace-nowrap px-4 py-3"><Badge tone="neutral" size="sm">Netlify</Badge></td>
            </tr>
            <tr className="align-top">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">Backend</td>
              <td className="px-4 py-3 text-text-secondary">Node.js + Express (API REST, CommonJS)</td>
              <td className="whitespace-nowrap px-4 py-3"><Badge tone="neutral" size="sm">Railway</Badge></td>
            </tr>
            <tr className="align-top">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">Base de datos</td>
              <td className="px-4 py-3 text-text-secondary">MySQL 8.0</td>
              <td className="whitespace-nowrap px-4 py-3"><Badge tone="neutral" size="sm">Railway</Badge></td>
            </tr>
            <tr className="align-top">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">Pagos</td>
              <td className="px-4 py-3 text-text-secondary">Mercado Pago (preferencias + webhook idempotente)</td>
              <td className="whitespace-nowrap px-4 py-3"><Badge tone="neutral" size="sm">Externo</Badge></td>
            </tr>
            <tr className="align-top">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">Correo</td>
              <td className="px-4 py-3 text-text-secondary">Resend (correos transaccionales)</td>
              <td className="whitespace-nowrap px-4 py-3"><Badge tone="neutral" size="sm">Externo</Badge></td>
            </tr>
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

      {/* ─── API ─── */}
      <Section id="api" title="Endpoints de la API">
        <p className="mb-4 text-sm text-text-secondary">
          Todos los endpoints están bajo el prefijo <Code>/api</Code>. El acceso depende del rol del usuario autenticado.
        </p>
        <DocTable head={['Método', 'Ruta', 'Descripción', 'Acceso']}>
          {ENDPOINTS.map(([method, path, desc, access]) => (
            <tr key={`${method}-${path}`} className="align-top">
              <td className="px-4 py-3"><Badge tone={methodTone(method)} size="sm">{method}</Badge></td>
              <td className="whitespace-nowrap px-4 py-3"><Code>{path}</Code></td>
              <td className="px-4 py-3 text-text-secondary">{desc}</td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-900">{access}</td>
            </tr>
          ))}
        </DocTable>
      </Section>

      {/* ─── Seguridad ─── */}
      <Section id="seguridad" title="Seguridad y privacidad">
        <p className="mb-4 text-sm text-text-secondary">
          Principios de seguridad aplicados en todo el sistema.
        </p>
        <ul className={`${panel} list-disc space-y-2 py-4 pl-9 pr-4 text-sm leading-relaxed text-text-secondary marker:text-brand-500`}>
          {SECURITY.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </Section>

      {/* ─── Pagos ─── */}
      <Section id="pagos" title="Sistema de pagos (Mercado Pago)">
        <p className="mb-4 text-sm text-text-secondary">
          Cómo se procesan los pagos y qué estados puede tener un pedido.
        </p>
        <div className="space-y-3">
          {PAYMENTS.map((p) => (
            <div key={p.title} className={`${panel} p-4`}>
              <h3 className="mb-1 text-sm font-semibold text-neutral-900">{p.title}</h3>
              <p className="text-sm text-text-secondary">{p.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Envío ─── */}
      <Section id="envio" title="Envío de stickers y QRs físicos">
        <p className="mb-4 text-sm text-text-secondary">
          Proceso de producción y entrega de stickers físicos con QR impreso.
        </p>
        <div className="space-y-3">
          {ENVIO.map((e) => (
            <div key={e.title} className={`${panel} p-4`}>
              <h3 className="mb-1 text-sm font-semibold text-neutral-900">{e.title}</h3>
              <p className="text-sm text-text-secondary">{e.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── QR Admin ─── */}
      <Section id="qr-admin" title="Administración de QR (panel admin)">
        <p className="mb-4 text-sm text-text-secondary">
          Funcionalidades específicas del módulo de administración de QR.
        </p>
        <div className="space-y-3">
          {QR_ADMIN.map((q) => (
            <div key={q.title} className={`${panel} p-4`}>
              <h3 className="mb-1 text-sm font-semibold text-neutral-900">{q.title}</h3>
              <p className="text-sm text-text-secondary">{q.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Entorno ─── */}
      <Section id="entorno" title="Variables de entorno">
        <p className="mb-4 text-sm text-text-secondary">
          Variables necesarias para ejecutar el backend y el frontend.
        </p>
        <div className={`${panel} divide-y divide-border`}>
          {ENV_GROUPS.map(([group, vars]) => (
            <div key={group} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4">
              <p className="w-36 flex-none text-sm font-medium text-neutral-900">{group}</p>
              <div className="flex flex-wrap gap-2">{vars.map((v) => <EnvVar key={v} name={v} />)}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Checklist ─── */}
      <Section id="checklist" title="Checklist antes de lanzar a producción">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={`${panel} p-4`}>
            <h3 className="mb-2 text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
              <Check size={14} className="text-emerald-600" aria-hidden="true" /> Hecho
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              {DONE.map((d) => (
                <li key={d} className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 flex-none text-emerald-600" aria-hidden="true" /> {d}
                </li>
              ))}
            </ul>
          </div>
          <div className={`${panel} p-4`}>
            <h3 className="mb-2 text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" aria-hidden="true" /> Pendiente
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary list-disc pl-5 marker:text-amber-500">
              {PENDING.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

    </div>
  </div>
);

export default Help;
