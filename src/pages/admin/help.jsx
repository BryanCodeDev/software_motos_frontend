import { useEffect, useState } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import {
  ShieldCheck, Layers, Server, Database, Users, KeyRound, Workflow, Plug, Rocket, ListChecks,
  AlertTriangle, Info, Lock, CheckCircle2, Circle, Copy, Check, ExternalLink,
} from 'lucide-react';
import { PageTitle } from '../../components/DashPage';
import { useToast } from '../../components/useToast';
import { Badge } from '../../components/ui-kit';

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

// tone: tonos soportados por <Badge>
const ROLES = [
  { role: 'Público', tone: 'neutral', access: 'Sin cuenta', can: 'Consulta la página pública de emergencia al escanear un QR activo. Solo ve los campos autorizados.' },
  { role: 'user', tone: 'info', access: 'Autenticado', can: 'Gestiona su perfil, contactos, privacidad, QR y pedidos.' },
  { role: 'admin', tone: 'warn', access: 'Autenticado + rol', can: 'Accede a /admin: métricas, gestión de usuarios y pedidos y registro de auditoría.' },
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
/* Constantes de diseño (alineadas con Home)                           */
/* ------------------------------------------------------------------ */

const EASE = [0.22, 1, 0.36, 1];
const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const methodTone = (m) => (m === 'GET' ? 'success' : m === 'POST' ? 'info' : 'neutral');

/* ------------------------------------------------------------------ */
/* Piezas de UI                                                        */
/* ------------------------------------------------------------------ */

const Code = ({ children }) => (
  <code className="rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-xs text-brand-700 ring-1 ring-brand-200/70">
    {children}
  </code>
);

/** Variable de entorno: al hacer clic copia solo el nombre. */
const EnvVar = ({ value }) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const name = value.split(' ')[0];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success(`${name} copiado`);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copiar ${name}`}
      className="focus-ring group flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-brand-50/60"
    >
      <Code>{value}</Code>
      <span className="flex-none text-text-muted transition-colors group-hover:text-brand-500">
        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
      </span>
    </button>
  );
};

const Section = ({ id, icon: Icon, title, lead, children }) => (
  <motion.section
    id={id}
    className="scroll-mt-24"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.55, ease: EASE }}
  >
    <div className="mb-5 flex items-start gap-3.5">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-xl font-bold tracking-tight text-neutral-900">{title}</h3>
        {lead && <p className="mt-1 text-sm leading-relaxed text-text-secondary">{lead}</p>}
      </div>
    </div>
    {children}
  </motion.section>
);

const CALLOUT = {
  info: 'border-sky-200 bg-sky-50/70 text-sky-900',
  warning: 'border-amber-200 bg-amber-50/70 text-amber-900',
};

const Callout = ({ tone = 'info', icon: Icon = Info, children }) => (
  <div className={`flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${CALLOUT[tone] || CALLOUT.info}`} role="note">
    <Icon size={18} className="mt-0.5 flex-none" aria-hidden="true" />
    <div>{children}</div>
  </div>
);

const DocTable = ({ head, children }) => (
  <div className={`${panel} overflow-hidden`}>
    <div className="custom-scrollbar overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-brand-50/70 text-xs font-semibold text-text-secondary">
          <tr>
            {head.map((h) => <th key={h} scope="col" className="px-4 py-3.5">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  </div>
);

const Tr = ({ children }) => <tr className="align-top transition-colors hover:bg-brand-50/50">{children}</tr>;

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
      { rootMargin: '-96px 0px -60% 0px', threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
};

const goTo = (e, id) => {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

const Help = () => {
  const active = useActiveSection(SECTION_IDS);

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6 lg:space-y-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          <PageTitle title="Documentación" description="Guía de referencia del panel administrativo y arquitectura del sistema." />
        </motion.div>

        {/* Encabezado */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.08 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-6 text-white shadow-glow sm:p-8 lg:p-10"
        >
          <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
              <Info size={13} aria-hidden="true" /> Documentación
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">Tu QR te Cuida</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
              Plataforma de{' '}
              <a
                href="https://mastercodecompany.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-white underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white"
              >
                MasterCode Company <ExternalLink size={13} aria-hidden="true" />
              </a>{' '}
              pensada para motociclistas en Colombia. Conecta un QR físico (calcomanía en la moto, el casco u otro
              lugar visible) con una página web de emergencia que muestra únicamente la información que el
              propietario autorizó compartir.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['React + Vite', 'Node.js + Express', 'MySQL 8', 'Netlify · Railway'].map((t) => (
                <span key={t} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </motion.header>

        {/* Índice móvil */}
        <nav aria-label="Índice de la documentación" className="custom-scrollbar -mx-4 overflow-x-auto px-4 lg:hidden">
          <ul className="flex gap-2 pb-1">
            {SECTIONS.map(({ id, label }) => (
              <li key={id} className="flex-none">
                <a
                  href={`#${id}`}
                  onClick={(e) => goTo(e, id)}
                  className={`focus-ring block whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active === id
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-border bg-white text-text-secondary hover:text-neutral-900'
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
              {SECTIONS.map(({ id, label, icon: Icon }) => {
                const isActive = active === id;
                return (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      onClick={(e) => goTo(e, id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={`focus-ring relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive ? 'text-brand-500' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="help-toc-active"
                          className="absolute inset-0 rounded-lg border border-brand-500/25 bg-brand-500/10"
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        />
                      )}
                      <Icon size={16} className="relative" aria-hidden="true" />
                      <span className="relative">{label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0 space-y-14">
            {/* Resumen */}
            <Section id="resumen" icon={Info} title="Resumen" lead="Qué problema resuelve y cuáles son sus límites.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className={`${panel} p-5`}>
                  <h4 className="mb-2 text-sm font-semibold text-neutral-900">Problema</h4>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    En un accidente la persona puede estar inconsciente y no poder indicar a quién contactar.
                    El QR permite a quienes auxilian consultar los datos que ella decidió compartir.
                  </p>
                </div>
                <div className={`${panel} p-5`}>
                  <h4 className="mb-2 text-sm font-semibold text-neutral-900">Propuesta de valor</h4>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    {['Acceso inmediato, sin cuenta ni app.', 'Privacidad configurable por campo.', 'Control total: desactivar o reemplazar el QR.'].map((t) => (
                      <li key={t} className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="mt-0.5 flex-none text-brand-500" aria-hidden="true" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4">
                <Callout tone="warning" icon={AlertTriangle}>
                  <strong className="text-neutral-900">Herramienta de apoyo.</strong> No reemplaza los servicios
                  de emergencia, no garantiza que alguien escanee el código ni asegura una respuesta inmediata.
                </Callout>
              </div>
            </Section>

            {/* Flujo */}
            <Section id="flujo" icon={Workflow} title="Cómo funciona" lead="Del registro a la consulta en la página pública.">
              <ol className="space-y-3">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="relative">
                    {i < STEPS.length - 1 && (
                      <span aria-hidden="true" className="absolute left-[31px] top-[52px] -bottom-3 w-px bg-brand-200" />
                    )}
                    <div className={`${panel} flex gap-4 p-4 transition-colors hover:border-brand-500/30`}>
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white shadow-soft">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-neutral-900">{s.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{s.text}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                Además, el usuario puede comprar productos físicos con QR mediante Mercado Pago. El modelo
                contempla un identificador digital básico gratuito y productos físicos personalizados; NFC
                queda como evolución futura, una vez validado el prototipo físico.
              </p>
            </Section>

            {/* Arquitectura */}
            <Section id="arquitectura" icon={Layers} title="Arquitectura" lead="Tecnologías y servicios previstos; su puesta en producción debe verificarse.">
              <div className="grid gap-4 sm:grid-cols-2">
                {STACK.map(({ icon: Icon, name, tech, detail, host }) => (
                  <article key={name} className={`${panel} p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-[0_20px_40px_-12px_rgba(159,18,57,0.2)]`}>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <Badge tone="neutral" size="sm">{host}</Badge>
                    </div>
                    <p className="text-xs font-medium text-text-secondary">{name}</p>
                    <h4 className="mt-0.5 text-base font-semibold text-neutral-900">{tech}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">{detail}</p>
                  </article>
                ))}
              </div>
            </Section>

            {/* Módulos */}
            <Section id="modulos" icon={Server} title="Módulos del backend" lead="Cada dominio encapsula su lógica de negocio.">
              <DocTable head={['Módulo', 'Responsabilidad']}>
                {MODULES.map(([name, desc]) => (
                  <Tr key={name}>
                    <td className="whitespace-nowrap px-4 py-3.5"><Code>{name}</Code></td>
                    <td className="px-4 py-3.5 text-text-secondary">{desc}</td>
                  </Tr>
                ))}
              </DocTable>
            </Section>

            {/* Roles */}
            <Section id="roles" icon={Users} title="Roles y permisos">
              <DocTable head={['Rol', 'Acceso', 'Puede']}>
                {ROLES.map((r) => (
                  <Tr key={r.role}>
                    <td className="px-4 py-3.5"><Badge tone={r.tone} size="sm">{r.role}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-neutral-900">{r.access}</td>
                    <td className="px-4 py-3.5 text-text-secondary">{r.can}</td>
                  </Tr>
                ))}
              </DocTable>
            </Section>

            {/* API */}
            <Section id="api" icon={Plug} title="Endpoints clave" lead="Prefijo común /api. Los marcados como CRUD agrupan varios métodos.">
              <DocTable head={['Método', 'Ruta', 'Descripción', 'Acceso']}>
                {ENDPOINTS.map(([method, path, desc, access]) => (
                  <Tr key={path}>
                    <td className="px-4 py-3.5"><Badge tone={methodTone(method)} size="sm">{method === '*' ? 'CRUD' : method}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3.5"><Code>{path}</Code></td>
                    <td className="px-4 py-3.5 text-text-secondary">{desc}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-neutral-900">{access}</td>
                  </Tr>
                ))}
              </DocTable>
            </Section>

            {/* Seguridad */}
            <Section id="seguridad" icon={ShieldCheck} title="Seguridad y privacidad" lead="El sistema maneja datos personales y relacionados con emergencias.">
              <ul className="grid gap-3 sm:grid-cols-2">
                {SECURITY.map((s) => (
                  <li key={s} className={`${panel} flex items-start gap-3 p-4 text-sm leading-relaxed text-text-secondary`}>
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                      <Lock size={14} aria-hidden="true" />
                    </span>
                    <span className="pt-0.5">{s}</span>
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
            <Section id="entorno" icon={KeyRound} title="Variables de entorno (backend)" lead="Nunca las incluyas en el repositorio; configúralas en Railway o en un archivo .env local. Haz clic en una variable para copiar su nombre.">
              <div className="grid gap-4 sm:grid-cols-2">
                {ENV_GROUPS.map(({ group, vars }) => (
                  <div key={group} className={`${panel} p-4`}>
                    <h4 className="mb-2 px-2 text-sm font-semibold text-neutral-900">{group}</h4>
                    <ul className="space-y-0.5">
                      {vars.map((v) => (
                        <li key={v}><EnvVar value={v} /></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>

            {/* Estado */}
            <Section id="estado" icon={ListChecks} title="Estado actual y próximos pasos">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className={`${panel} p-5`}>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
                    <CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" />
                    Verificaciones reportadas
                  </h4>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    {CHECKS.map((c) => (
                      <li key={c} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="mt-1 flex-none text-emerald-600" aria-hidden="true" />
                        {c}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs leading-relaxed text-text-secondary">
                    Resultados del informe interno; no constituyen auditoría independiente ni garantizan que el
                    sistema esté listo para producción.
                  </p>
                </div>
                <div className={`${panel} p-5`}>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
                    <Rocket size={16} className="text-brand-500" aria-hidden="true" />
                    Pendiente antes del lanzamiento
                  </h4>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    {PENDING.map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <Circle size={14} className="mt-1 flex-none text-text-muted" aria-hidden="true" />
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
    </MotionConfig>
  );
};

export default Help;