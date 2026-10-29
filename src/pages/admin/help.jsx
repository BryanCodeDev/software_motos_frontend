import React from 'react';
import {
  ShieldCheck,
  Layers,
  Server,
  Database,
  Users,
  KeyRound,
  Workflow,
  Plug,
  Rocket,
  ListChecks,
  AlertTriangle,
  Info,
  Lock,
  CheckCircle2,
  Circle,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Datos de la documentación (editar aquí, no en el JSX)               */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { id: 'resumen', label: 'Resumen', icon: Info },
  { id: 'flujo', label: 'Cómo funciona', icon: Workflow },
  { id: 'arquitectura', label: 'Arquitectura', icon: Layers },
  { id: 'modulos', label: 'Módulos del backend', icon: Server },
  { id: 'roles', label: 'Roles y permisos', icon: Users },
  { id: 'api', label: 'Endpoints clave', icon: Plug },
  { id: 'seguridad', label: 'Seguridad y privacidad', icon: ShieldCheck },
  { id: 'entorno', label: 'Variables de entorno', icon: KeyRound },
  { id: 'estado', label: 'Estado y pendientes', icon: ListChecks },
];

const STEPS = [
  { title: 'Crea su cuenta', text: 'Se registra, completa su perfil y agrega contactos de emergencia.' },
  { title: 'Configura la privacidad', text: 'Decide, campo por campo, qué información puede verse públicamente.' },
  { title: 'Obtiene su QR', text: 'Se genera un identificador único y aleatorio. El QR no contiene datos personales ni médicos.' },
  { title: 'Alguien lo escanea', text: 'El QR abre una página pública, sin login ni instalación de apps.' },
  { title: 'Se consultan los datos', text: 'Se muestra solo lo autorizado, con accesos directos para llamar o escribir a los contactos.' },
];

const STACK = [
  { icon: Layers, name: 'Frontend', tech: 'React + Vite', detail: 'Tailwind CSS, React Router, Axios, Framer Motion, Lucide React.', host: 'Netlify' },
  { icon: Server, name: 'Backend', tech: 'Node.js + Express', detail: 'API REST (CommonJS): autenticación, validaciones, permisos, QR, pedidos y pagos.', host: 'Railway' },
  { icon: Database, name: 'Base de datos', tech: 'MySQL 8.0', detail: 'Usuarios, perfiles, contactos, identificadores, pedidos y pagos (puerto local 3307).', host: 'Railway' },
  { icon: Plug, name: 'Integraciones', tech: 'Mercado Pago · Resend', detail: 'Pagos con preferencia y webhook; correos transaccionales desde el backend.', host: 'Externos' },
];

const MODULES = [
  ['auth', 'Registro, login, refresh, logout, recuperación y reseteo de contraseña (JWT en cookies httpOnly).'],
  ['email', 'Envío de correos transaccionales con Resend.'],
  ['emergency-profiles', 'CRUD del perfil de emergencia y configuración de privacidad por campo.'],
  ['contacts', 'Contactos de emergencia asociados al perfil, con prioridades.'],
  ['identifiers', 'Códigos QR / identificadores vinculados a perfiles; desactivar o reemplazar.'],
  ['products', 'Catálogo de productos (QR físicos, etc.).'],
  ['orders', 'Pedidos de compra y seguimiento de su estado comercial.'],
  ['payments', 'Preferencia de Mercado Pago y webhook de confirmación (verificación en servidor, idempotente).'],
  ['admin', 'Bootstrap del administrador, métricas, gestión de usuarios y pedidos, auditoría.'],
];

const ROLES = [
  { role: 'Público', tone: 'neutral', access: 'Sin cuenta', can: 'Consulta la página pública de emergencia al escanear un QR activo. Solo ve los campos autorizados.' },
  { role: 'user', tone: 'info', access: 'Autenticado', can: 'Gestiona su perfil, contactos, privacidad, QR y pedidos.' },
  { role: 'admin', tone: 'warning', access: 'Autenticado + rol', can: 'Accede a /admin: métricas, gestión de pedidos y registro de auditoría.' },
];

const ENDPOINTS = [
  ['GET', '/api/health', 'Estado del servicio', 'Pública'],
  ['POST', '/api/auth/register', 'Crear cuenta', 'Pública'],
  ['POST', '/api/auth/login', 'Iniciar sesión', 'Pública'],
  ['POST', '/api/auth/logout', 'Cerrar sesión', 'Sesión'],
  ['GET', '/api/auth/me', 'Usuario autenticado', 'Sesión'],
  ['CRUD', '/api/emergency-profiles', 'Perfil de emergencia y privacidad', 'Sesión'],
  ['CRUD', '/api/contacts', 'Contactos de emergencia', 'Sesión'],
  ['CRUD', '/api/identifiers', 'Identificadores QR', 'Sesión'],
  ['CRUD', '/api/products', 'Catálogo de productos', 'Variable'],
  ['CRUD', '/api/orders', 'Pedidos', 'Sesión'],
  ['CRUD', '/api/payments', 'Preferencia y webhook de pago', 'Sesión / Webhook'],
  ['CRUD', '/api/admin/*', 'Panel administrativo', 'Solo admin'],
];

const SECURITY = [
  'Identificadores QR aleatorios, difíciles de adivinar.',
  'Autenticación con JWT en cookies httpOnly.',
  'Roles separados para usuarios y administradores.',
  'Validación de datos y limitación de solicitudes (rate limiting).',
  'La respuesta pública excluye siempre los campos privados.',
  'El propietario puede desactivar o reemplazar su QR.',
  'Registro de auditoría para acciones sensibles.',
  'Pagos verificados desde el servidor y webhooks procesados una sola vez.',
];

const ENV_GROUPS = [
  { group: 'Base de datos', vars: ['DB_HOST', 'DB_PORT (3307 local)', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] },
  { group: 'Autenticación', vars: ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET'] },
  { group: 'Mercado Pago', vars: ['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_PUBLIC_KEY', 'MERCADOPAGO_WEBHOOK_SECRET'] },
  { group: 'Correo (Resend)', vars: ['RESEND_API_KEY', 'EMAIL_FROM'] },
  { group: 'Administración', vars: ['ADMIN_BOOTSTRAP_TOKEN'] },
];

const CHECKS = [
  'Compilación del frontend exitosa.',
  'ESLint del backend sin errores.',
  '13 pruebas automatizadas aprobadas.',
];

const PENDING = [
  'Configurar y probar Mercado Pago en modo de pruebas y luego en producción.',
  'Configurar Resend y verificar el dominio de envío.',
  'Definir variables de entorno y dominios finales de Netlify y Railway.',
  'Crear de forma segura la primera cuenta administradora.',
  'Verificar persistencia, copias de seguridad y restauración de MySQL.',
  'Probar permisos, privacidad de datos, QR desactivados y pagos duplicados.',
  'Validar el prototipo físico y realizar revisión legal y de seguridad.',
];

/* ------------------------------------------------------------------ */
/* Piezas de UI (solo utilidades Tailwind + tokens brand existentes)   */
/* ------------------------------------------------------------------ */

const BADGE_BASE = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap';
const BADGE_TONES = {
  neutral: 'border-brand-border bg-brand-panel text-brand-textMuted',
  info: 'border-brand-accent/30 bg-brand-accent/10 text-brand-accent',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
};

const Badge = ({ tone = 'neutral', children }) => (
  <span className={`${BADGE_BASE} ${BADGE_TONES[tone]}`}>{children}</span>
);

const Code = ({ children }) => (
  <code className="rounded-md border border-brand-border bg-brand-dark/80 px-1.5 py-0.5 font-mono text-[0.85em] text-brand-accentHover">
    {children}
  </code>
);

const IconBox = ({ icon: Icon }) => (
  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-accent/20 bg-brand-accent/10 text-brand-accent">
    <Icon size={20} aria-hidden="true" />
  </span>
);

const Callout = ({ tone = 'info', icon: Icon = Info, children }) => {
  const tones = {
    info: 'border-brand-accent/30 bg-brand-accent/5',
    warning: 'border-amber-400/30 bg-amber-400/5',
  };
  const iconTone = tone === 'warning' ? 'text-amber-300' : 'text-brand-accent';
  return (
    <div role="note" className={`flex gap-3 rounded-xl border p-4 text-sm leading-relaxed text-brand-textMuted ${tones[tone]}`}>
      <Icon size={18} className={`mt-0.5 shrink-0 ${iconTone}`} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
};

const Section = ({ id, icon, title, lead, children }) => (
  <section id={id} className="scroll-mt-24">
    <div className="mb-5 flex items-start gap-3">
      <IconBox icon={icon} />
      <div>
        <h3 className="text-xl font-semibold text-brand-text">{title}</h3>
        {lead && <p className="mt-1 text-sm text-brand-textMuted">{lead}</p>}
      </div>
    </div>
    {children}
  </section>
);

const TableWrap = ({ children }) => (
  <div className="overflow-x-auto rounded-xl border border-brand-border bg-brand-panel/60">
    <table className="w-full text-left text-sm">{children}</table>
  </div>
);

const Th = ({ children }) => (
  <th scope="col" className="whitespace-nowrap border-b border-brand-border bg-brand-navy/80 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-brand-textMuted">
    {children}
  </th>
);

const Td = ({ children, nowrap }) => (
  <td className={`border-b border-brand-border/60 px-4 py-3 align-top text-brand-textMuted ${nowrap ? 'whitespace-nowrap' : ''}`}>
    {children}
  </td>
);

const methodTone = (m) => (m === 'GET' ? 'success' : m === 'POST' ? 'info' : 'neutral');

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

const Help = () => (
  <div className="space-y-10">
    {/* Encabezado */}
    <header className="space-y-3">
      <span className="eyebrow">Documentación</span>
      <h2 className="text-3xl font-bold text-brand-text">Identificación de Emergencia</h2>
      <p className="max-w-3xl text-[15px] leading-7 text-brand-textMuted">
        Plataforma de <strong className="font-semibold text-brand-text">MasterCode Company</strong> pensada para
        motociclistas en Colombia. Conecta un QR físico (calcomanía en la moto, el casco u otro lugar visible)
        con una página web de emergencia que muestra únicamente la información que el propietario autorizó
        compartir.
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Badge tone="info">React + Vite</Badge>
        <Badge tone="info">Node.js + Express</Badge>
        <Badge tone="info">MySQL 8</Badge>
        <Badge>Netlify · Railway</Badge>
      </div>
    </header>

    <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
      {/* Índice lateral */}
      <nav aria-label="Índice de la documentación" className="hidden lg:block">
        <ul className="sticky top-24 space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-brand-textMuted transition-colors hover:bg-black/5 hover:text-brand-text"
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-14">
        {/* Resumen */}
        <Section id="resumen" icon={Info} title="Resumen" lead="Qué problema resuelve y cuáles son sus límites.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card-static p-5">
              <h4 className="mb-2 text-sm font-semibold text-brand-text">Problema</h4>
              <p className="text-sm leading-7 text-brand-textMuted">
                En un accidente la persona puede estar inconsciente y no poder indicar a quién contactar.
                El QR permite a quienes auxilian consultar los datos que ella decidió compartir.
              </p>
            </div>
            <div className="card-static p-5">
              <h4 className="mb-2 text-sm font-semibold text-brand-text">Propuesta de valor</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-7 text-brand-textMuted">
                <li>Acceso inmediato, sin cuenta ni app.</li>
                <li>Privacidad configurable por campo.</li>
                <li>Control total: desactivar o reemplazar el QR.</li>
              </ul>
            </div>
          </div>
          <div className="mt-4">
            <Callout tone="warning" icon={AlertTriangle}>
              <strong className="font-semibold text-brand-text">Herramienta de apoyo.</strong> No reemplaza los
              servicios de emergencia, no garantiza que alguien escanee el código ni asegura una respuesta
              inmediata.
            </Callout>
          </div>
        </Section>

        {/* Flujo */}
        <Section id="flujo" icon={Workflow} title="Cómo funciona" lead="Del registro a la consulta en la página pública.">
          <ol className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card-static flex gap-4 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-sm font-bold text-brand-accent ring-1 ring-brand-accent/30">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-brand-text">{s.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-brand-textMuted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm leading-7 text-brand-textMuted">
            Además, el usuario puede comprar productos físicos con QR mediante Mercado Pago. El modelo
            contempla un identificador digital básico gratuito y productos físicos personalizados; NFC queda
            como evolución futura, una vez validado el prototipo físico.
          </p>
        </Section>

        {/* Arquitectura */}
        <Section id="arquitectura" icon={Layers} title="Arquitectura" lead="Tecnologías y servicios previstos; su puesta en producción debe verificarse.">
          <div className="grid gap-4 sm:grid-cols-2">
            {STACK.map(({ icon, name, tech, detail, host }) => (
              <article key={name} className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <IconBox icon={icon} />
                  <Badge>{host}</Badge>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-textMuted">{name}</p>
                <h4 className="mt-0.5 text-base font-semibold text-brand-text">{tech}</h4>
                <p className="mt-2 text-sm leading-6 text-brand-textMuted">{detail}</p>
              </article>
            ))}
          </div>
        </Section>

        {/* Módulos */}
        <Section id="modulos" icon={Server} title="Módulos del backend" lead="Cada dominio encapsula su lógica de negocio.">
          <TableWrap>
            <thead>
              <tr><Th>Módulo</Th><Th>Responsabilidad</Th></tr>
            </thead>
            <tbody>
              {MODULES.map(([name, desc]) => (
                <tr key={name} className="transition-colors hover:bg-brand-panelHover/50">
                  <Td nowrap><Code>{name}</Code></Td>
                  <Td>{desc}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Section>

        {/* Roles */}
        <Section id="roles" icon={Users} title="Roles y permisos">
          <TableWrap>
            <thead>
              <tr><Th>Rol</Th><Th>Acceso</Th><Th>Puede</Th></tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.role} className="transition-colors hover:bg-brand-panelHover/50">
                  <Td><Badge tone={r.tone}>{r.role}</Badge></Td>
                  <Td nowrap>{r.access}</Td>
                  <Td>{r.can}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Section>

        {/* API */}
        <Section id="api" icon={Plug} title="Endpoints clave" lead="CRUD agrupa los métodos habituales de cada recurso.">
          <TableWrap>
            <thead>
              <tr><Th>Método</Th><Th>Ruta</Th><Th>Descripción</Th><Th>Acceso</Th></tr>
            </thead>
            <tbody>
              {ENDPOINTS.map(([method, path, desc, access]) => (
                <tr key={path} className="transition-colors hover:bg-brand-panelHover/50">
                  <Td><Badge tone={methodTone(method)}>{method}</Badge></Td>
                  <Td nowrap><Code>{path}</Code></Td>
                  <Td>{desc}</Td>
                  <Td nowrap>{access}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Section>

        {/* Seguridad */}
        <Section id="seguridad" icon={ShieldCheck} title="Seguridad y privacidad" lead="El sistema maneja datos personales y relacionados con emergencias.">
          <ul className="grid gap-3 sm:grid-cols-2">
            {SECURITY.map((item) => (
              <li key={item} className="card-static flex items-start gap-3 p-4 text-sm text-brand-textMuted">
                <Lock size={16} className="mt-0.5 shrink-0 text-brand-accent" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Callout>
              Antes de comercializar, confirma que estas medidas estén correctamente implementadas y revisa el
              tratamiento de datos personales conforme a la normativa colombiana, incluidas las obligaciones
              sobre datos sensibles.
            </Callout>
          </div>
        </Section>

        {/* Entorno */}
        <Section id="entorno" icon={KeyRound} title="Variables de entorno (backend)" lead="Nunca las incluyas en el repositorio; configúralas en Railway o en un archivo .env local.">
          <div className="grid gap-4 sm:grid-cols-2">
            {ENV_GROUPS.map(({ group, vars }) => (
              <div key={group} className="card-static p-4">
                <h4 className="mb-2 text-sm font-semibold text-brand-text">{group}</h4>
                <ul className="space-y-1.5">
                  {vars.map((v) => (
                    <li key={v}><Code>{v}</Code></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* Estado */}
        <Section id="estado" icon={ListChecks} title="Estado actual y próximos pasos">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card-static p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-text">
                <CheckCircle2 size={16} className="text-emerald-400" aria-hidden="true" />
                Verificaciones reportadas
              </h4>
              <ul className="space-y-2 text-sm text-brand-textMuted">
                {CHECKS.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="mt-1 shrink-0 text-emerald-400" aria-hidden="true" />
                    {c}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-brand-textMuted/80">
                Resultados del informe interno; no constituyen auditoría independiente ni garantizan que el
                sistema esté listo para producción.
              </p>
            </div>
            <div className="card-static p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-text">
                <Rocket size={16} className="text-brand-accent" aria-hidden="true" />
                Pendiente antes del lanzamiento
              </h4>
              <ul className="space-y-2 text-sm text-brand-textMuted">
                {PENDING.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <Circle size={14} className="mt-1 shrink-0 text-brand-textMuted/60" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      </div>
    </div>
  </div>
);

export default Help;
