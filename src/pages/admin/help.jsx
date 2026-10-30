import React, { useState, useEffect } from 'react';
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
import { Reveal } from '../../components/Section';

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

const SECTION_IDS = SECTIONS.map((s) => s.id);

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
  { icon: Plug, name: 'Integraciones', tech: 'Mercado Pago · Resend', detail: 'Pagos con preferencia y webhook; correos transaccionales desde el backend.', host: 'Servicios externos' },
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
  { role: 'Público', tone: 'badge-neutral', access: 'Sin cuenta', can: 'Consulta la página pública de emergencia al escanear un QR activo. Solo ve los campos autorizados.' },
  { role: 'user', tone: 'badge-info', access: 'Autenticado', can: 'Gestiona su perfil, contactos, privacidad, QR y pedidos.' },
  { role: 'admin', tone: 'badge-warning', access: 'Autenticado + rol', can: 'Accede a /admin: métricas, gestión de pedidos y registro de auditoría.' },
];

const ENDPOINTS = [
  ['GET', '/api/health', 'Estado del servicio', 'Pública'],
  ['POST', '/api/auth/register', 'Crear cuenta', 'Pública'],
  ['POST', '/api/auth/login', 'Iniciar sesión', 'Pública'],
  ['POST', '/api/auth/logout', 'Cerrar sesión', 'Sesión'],
  ['GET', '/api/auth/me', 'Usuario autenticado', 'Sesión'],
  ['*', '/api/emergency-profiles', 'Perfil de emergencia y privacidad', 'Sesión'],
  ['*', '/api/contacts', 'Contactos de emergencia', 'Sesión'],
  ['*', '/api/identifiers', 'Identificadores QR', 'Sesión'],
  ['*', '/api/products', 'Catálogo de productos', 'Variable'],
  ['*', '/api/orders', 'Pedidos', 'Sesión'],
  ['*', '/api/payments', 'Preferencia y webhook de pago', 'Sesión / Webhook'],
  ['*', '/api/admin/*', 'Panel administrativo', 'Solo admin'],
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
/* Piezas de UI                                                        */
/* ------------------------------------------------------------------ */

// Los nombres de clase van completos (no interpolados) para que Tailwind
// no los elimine al compilar para producción.
const CALLOUT_CLASS = {
  info: 'callout-info',
  warning: 'callout-warning',
};

const methodBadge = (m) =>
  m === 'GET' ? 'badge-success' : m === 'POST' ? 'badge-info' : 'badge-neutral';

const Section = ({ id, icon: Icon, title, lead, children }) => (
  <section id={id} className="scroll-mt-24">
    <Reveal>
      <div className="mb-5 flex items-start gap-3">
        <span className="icon-box shrink-0"><Icon size={20} aria-hidden="true" /></span>
        <div>
          <h3 className="text-xl font-semibold text-brand-text">{title}</h3>
          {lead && <p className="mt-1 text-sm text-brand-textMuted">{lead}</p>}
        </div>
      </div>
      {children}
    </Reveal>
  </section>
);

const Callout = ({ tone = 'info', icon: Icon = Info, children }) => (
  <div className={CALLOUT_CLASS[tone] || CALLOUT_CLASS.info} role="note">
    <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
    <div>{children}</div>
  </div>
);

/** Resalta en el índice la sección que se está leyendo. */
const useActiveSection = (ids) => {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
};

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

const Help = () => {
  const active = useActiveSection(SECTION_IDS);

  return (
    <div className="space-y-10">
      {/* Encabezado */}
      <header className="space-y-3">
        <span className="eyebrow">Documentación</span>
        <h2 className="text-3xl lg:text-4xl font-bold text-brand-text">Tu QR te Cuida</h2>
        <p className="prose-doc max-w-3xl">
          Plataforma de <a href="https://mastercodecompany.com/" target="_blank" rel="noopener noreferrer" className="text-brand-text hover:text-brand-accent transition-colors">MasterCode Company</a> pensada para
          motociclistas en Colombia. Conecta un QR físico (calcomanía en la moto, el casco u otro lugar
          visible) con una página web de emergencia que muestra únicamente la información que el propietario
          autorizó compartir.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="badge-info">React + Vite</span>
          <span className="badge-info">Node.js + Express</span>
          <span className="badge-info">MySQL 8</span>
          <span className="badge-neutral">Netlify · Railway</span>
        </div>
      </header>

      {/* Índice móvil */}
      <nav aria-label="Índice de la documentación" className="lg:hidden -mx-4 px-4 overflow-x-auto">
        <ul className="flex gap-2 pb-1">
          {SECTIONS.map(({ id, label }) => (
            <li key={id} className="shrink-0">
              <a
                href={`#${id}`}
                className={`block whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active === id
                    ? 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent'
                    : 'border-brand-border text-brand-textMuted hover:text-brand-text'
                }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* Índice lateral */}
        <nav aria-label="Índice de la documentación" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={active === id ? 'true' : undefined}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    active === id
                      ? 'border-brand-accent/30 bg-brand-accent/10 text-brand-accent'
                      : 'border-transparent text-brand-textMuted hover:bg-white/5 hover:text-brand-text'
                  }`}
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
                <p className="prose-doc">
                  En un accidente la persona puede estar inconsciente y no poder indicar a quién contactar.
                  El QR permite a quienes auxilian consultar los datos que ella decidió compartir.
                </p>
              </div>
              <div className="card-static p-5">
                <h4 className="mb-2 text-sm font-semibold text-brand-text">Propuesta de valor</h4>
                <ul className="prose-doc list-disc space-y-1 pl-5">
                  <li>Acceso inmediato, sin cuenta ni app.</li>
                  <li>Privacidad configurable por campo.</li>
                  <li>Control total: desactivar o reemplazar el QR.</li>
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <Callout tone="warning" icon={AlertTriangle}>
                <strong className="text-brand-text">Herramienta de apoyo.</strong> No reemplaza los servicios
                de emergencia, no garantiza que alguien escanee el código ni asegura una respuesta inmediata.
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
                    <p className="prose-doc mt-0.5">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="prose-doc mt-4">
              Además, el usuario puede comprar productos físicos con QR mediante Mercado Pago. El modelo
              contempla un identificador digital básico gratuito y productos físicos personalizados; NFC
              queda como evolución futura, una vez validado el prototipo físico.
            </p>
          </Section>

          {/* Arquitectura */}
          <Section id="arquitectura" icon={Layers} title="Arquitectura" lead="Tecnologías y servicios previstos; su puesta en producción debe verificarse.">
            <div className="grid gap-4 sm:grid-cols-2">
              {STACK.map(({ icon: Icon, name, tech, detail, host }) => (
                <article key={name} className="card p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="icon-box"><Icon size={20} aria-hidden="true" /></span>
                    <span className="badge-neutral">{host}</span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-textFaint">{name}</p>
                  <h4 className="mt-0.5 text-base font-semibold text-brand-text">{tech}</h4>
                  <p className="prose-doc mt-2">{detail}</p>
                </article>
              ))}
            </div>
          </Section>

          {/* Módulos */}
          <Section id="modulos" icon={Server} title="Módulos del backend" lead="Cada dominio encapsula su lógica de negocio.">
            <div className="table-wrap">
              <table className="table-base">
                <thead>
                  <tr><th scope="col">Módulo</th><th scope="col">Responsabilidad</th></tr>
                </thead>
                <tbody>
                  {MODULES.map(([name, desc]) => (
                    <tr key={name}>
                      <td className="whitespace-nowrap"><code className="code-inline">{name}</code></td>
                      <td>{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Roles */}
          <Section id="roles" icon={Users} title="Roles y permisos">
            <div className="table-wrap">
              <table className="table-base">
                <thead>
                  <tr><th scope="col">Rol</th><th scope="col">Acceso</th><th scope="col">Puede</th></tr>
                </thead>
                <tbody>
                  {ROLES.map((r) => (
                    <tr key={r.role}>
                      <td><span className={r.tone}>{r.role}</span></td>
                      <td className="whitespace-nowrap">{r.access}</td>
                      <td>{r.can}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* API */}
          <Section id="api" icon={Plug} title="Endpoints clave" lead="Prefijo común /api. Los marcados como CRUD agrupan varios métodos.">
            <div className="table-wrap">
              <table className="table-base">
                <thead>
                  <tr><th scope="col">Método</th><th scope="col">Ruta</th><th scope="col">Descripción</th><th scope="col">Acceso</th></tr>
                </thead>
                <tbody>
                  {ENDPOINTS.map(([method, path, desc, access]) => (
                    <tr key={path}>
                      <td><span className={methodBadge(method)}>{method === '*' ? 'CRUD' : method}</span></td>
                      <td className="whitespace-nowrap"><code className="code-inline">{path}</code></td>
                      <td>{desc}</td>
                      <td className="whitespace-nowrap">{access}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <Callout tone="info">
                Antes de comercializar, confirma que estas medidas estén correctamente implementadas y revisa
                el tratamiento de datos personales conforme a la normativa colombiana, incluidas las
                obligaciones sobre datos sensibles.
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
                      <li key={v}><code className="code-inline">{v}</code></li>
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
                  <CheckCircle2 size={16} className="text-status-success" aria-hidden="true" />
                  Verificaciones reportadas
                </h4>
                <ul className="space-y-2 text-sm text-brand-textMuted">
                  {CHECKS.map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="mt-1 shrink-0 text-status-success" aria-hidden="true" />
                      {c}
                    </li>
                  ))}
                </ul>
                <p className="field-hint mt-3">
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
                      <Circle size={14} className="mt-1 shrink-0 text-brand-textFaint" aria-hidden="true" />
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
};

export default Help;
