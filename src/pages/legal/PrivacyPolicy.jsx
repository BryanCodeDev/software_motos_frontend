import { CreditCard, Database, Eye, EyeOff, HeartPulse, KeyRound, ShieldCheck, User, Users } from 'lucide-react';
import {
  LegalPage,
  Callout,
  CardGrid,
  DefList,
  InfoCard,
  LegalList,
  LegalP,
  LegalSection,
  Note,
  Value,
} from '../../components/LegalPage';
import { COMPANY } from '../../components/legalConstants';

const TITLE = 'Política de Privacidad y Tratamiento de Datos Personales';
const DESCRIPTION =
  'Explicamos qué información recopilamos, para qué la usamos, quién puede acceder, cómo la protegemos y cómo puede el titular ejercer sus derechos.';
const DOC_TYPE = 'Política de Privacidad';
const VERSION = '1.0';
const EFFECTIVE_DATE = 'Por definir';

const SECTIONS = [
  { id: 'responsable', title: 'Identificación del responsable' },
  { id: 'informacion', title: 'Información que recopilamos' },
  { id: 'finalidades', title: 'Finalidades del tratamiento' },
  { id: 'sensibles', title: 'Tratamiento de datos sensibles' },
  { id: 'visibilidad', title: 'Visibilidad de los datos' },
  { id: 'contactos', title: 'Tratamiento de datos de contactos de emergencia' },
  { id: 'qr', title: 'Código QR y URL permanente' },
  { id: 'terceros', title: 'Proveedores tecnológicos y terceros' },
  { id: 'mastercode', title: 'Relación con MasterCode Company' },
  { id: 'conservacion', title: 'Conservación y eliminación' },
  { id: 'derechos', title: 'Derechos de los titulares' },
  { id: 'seguridad', title: 'Seguridad' },
  { id: 'cambios', title: 'Cambios de la política' },
];

const CATEGORIES = [
  { icon: KeyRound, title: 'Datos de cuenta', items: ['Nombre.', 'Correo electrónico.', 'Credenciales protegidas.', 'Datos necesarios para administrar la cuenta.'] },
  { icon: User, title: 'Datos del perfil', items: ['Fotografía opcional.', 'Información de identificación que el usuario decida registrar.'] },
  { icon: Users, title: 'Datos de emergencia', items: ['Contactos.', 'Teléfonos.', 'Correos electrónicos.', 'Relaciones con el usuario.'] },
  { icon: HeartPulse, title: 'Datos sensibles', tone: 'danger', items: ['Alergias.', 'Condiciones médicas.', 'Medicamentos.', 'Información de salud que el usuario decida proporcionar.'] },
  { icon: CreditCard, title: 'Datos comerciales', items: ['Pedidos.', 'Pagos.', 'Historial de transacciones.', 'Información para gestionar la compra y entrega.'] },
  { icon: Database, title: 'Datos técnicos', items: ['Registros de autenticación.', 'Registros de seguridad.', 'Información técnica para proteger y operar el servicio.'] },
];

const VISIBILITY = [
  { icon: Eye, title: 'Perfil público', text: 'Solo contiene la información que el usuario autorizó expresamente para mostrar a quienes escaneen su QR.' },
  { icon: EyeOff, title: 'Perfil privado', text: 'Contiene información que el usuario ha decidido no mostrar públicamente.' },
  { icon: ShieldCheck, title: 'Administración', text: 'El acceso está limitado a personal autorizado y a las funciones necesarias para operar el servicio.' },
];

export const PrivacyPolicy = () => {
  const content = {
    responsable: (
      <>
        <LegalP>
          El responsable del tratamiento de los datos personales es el operador del servicio Tu QR Te Cuida.
        </LegalP>
        <DefList
          items={[
            { label: 'Nombre o razón social', value: <Value value={COMPANY.name} label="Nombre o razón social" /> },
            { label: 'NIT o identificación', value: <Value value={COMPANY.nit} label="NIT" /> },
            { label: 'Domicilio', value: <Value value={COMPANY.address} label="Domicilio" /> },
            { label: 'Correo electrónico para privacidad', value: <Value value={COMPANY.privacyEmail} label="Correo de privacidad" /> },
            { label: 'Teléfono o canal de atención', value: <Value value={COMPANY.phone} label="Canal de atención" /> },
            { label: 'Fecha de entrada en vigor y versión', value: `Versión ${VERSION} — ${EFFECTIVE_DATE}` },
          ]}
        />
        <Note>
          Los datos marcados como «por configurar» son campos configurables. No se inventa información empresarial.
        </Note>
      </>
    ),

    informacion: (
      <>
        <LegalP>
          Tu QR Te Cuida recopila únicamente la información que el usuario proporciona o que se genera por el
          funcionamiento del servicio, organizada en las siguientes categorías:
        </LegalP>
        <CardGrid>
          {CATEGORIES.map(({ icon, title, tone, items }) => (
            <InfoCard key={title} icon={icon} title={title} tone={tone}>
              <LegalList compact items={items} />
            </InfoCard>
          ))}
        </CardGrid>
        <LegalP>No se recopilan datos que el sistema no utilice.</LegalP>
      </>
    ),

    finalidades: (
      <>
        <LegalP>La información se trata para las siguientes finalidades específicas:</LegalP>
        <LegalList
          items={[
            'Crear y administrar cuentas.',
            'Generar identificadores QR únicos.',
            'Mostrar la información que el usuario autoriza.',
            'Gestionar contactos de emergencia.',
            'Facilitar notificaciones cuando estén habilitadas.',
            'Procesar pagos.',
            'Administrar pedidos.',
            'Gestionar la producción y entrega de stickers.',
            'Atender solicitudes de soporte.',
            'Proteger la plataforma.',
            'Cumplir obligaciones legales.',
          ]}
        />
        <LegalP>
          La información médica no se utiliza para publicidad, comercialización ni finalidades ajenas al servicio.
        </LegalP>
      </>
    ),

    sensibles: (
      <>
        <Callout tone="danger" title="Los datos de salud son datos sensibles">
          Bajo la legislación colombiana (Ley Estatutaria 1581 de 2012 y Decreto 1074 de 2015), los datos relativos a
          la salud son datos sensibles y reciben protección especial.
        </Callout>
        <LegalList
          items={[
            'Proporcionar información médica es voluntario.',
            'El usuario no está obligado a responder preguntas sobre su salud.',
            'Se requiere autorización explícita e informada para tratar datos sensibles.',
            'El usuario puede configurar qué información médica desea mostrar públicamente.',
            'La autorización para tratar información médica se distingue de la aceptación general de los términos.',
            'La información médica no se almacena directamente dentro del QR.',
            'La información médica no se incluye en la URL pública.',
            'El acceso interno a datos médicos está restringido.',
          ]}
        />
      </>
    ),

    visibilidad: (
      <>
        <CardGrid>
          {VISIBILITY.map(({ icon, title, text }) => (
            <InfoCard key={title} icon={icon} title={title}>
              <p className="text-[13px] leading-relaxed">{text}</p>
            </InfoCard>
          ))}
        </CardGrid>
        <LegalP>
          El personal de soporte y mantenimiento debe contar con permisos mínimos y acceso restringido. No debe
          consultar datos médicos por simple conveniencia o curiosidad.
        </LegalP>
      </>
    ),

    contactos: (
      <>
        <LegalP>
          Los datos de contactos de emergencia son datos de terceros que el usuario registra en su cuenta. Estos datos
          se tratan para las finalidades informadas y con la autorización o base jurídica que corresponda.
        </LegalP>
        <LegalP>
          No se exponen automáticamente teléfonos ni correos de los contactos a cualquier visitante. Se diferencia
          entre:
        </LegalP>
        <LegalList
          items={[
            'Mostrar información de contacto públicamente (solo si el usuario lo autoriza y configura).',
            'Utilizar un contacto para una notificación autorizada.',
            'Administrar los datos del contacto dentro de la cuenta del usuario.',
          ]}
        />
      </>
    ),

    qr: (
      <LegalList
        items={[
          'El QR contiene un identificador aleatorio.',
          'El identificador permite localizar el perfil correspondiente.',
          'La URL no incorpora directamente datos médicos.',
          'La información mostrada depende de los permisos y la configuración del usuario.',
          'Actualizar el perfil no modifica el identificador del QR.',
          'El usuario puede desactivar su QR según las funcionalidades disponibles.',
        ]}
      />
    ),

    terceros: (
      <>
        <LegalP>
          La operación puede requerir proveedores de infraestructura, alojamiento, correo electrónico, pagos y otros
          servicios tecnológicos.
        </LegalP>
        <LegalP>
          No se inventan proveedores ni se asegura que algún tercero específico intervenga. Los proveedores que
          intervengan deben operar bajo condiciones contractuales, instrucciones y medidas de protección
          correspondientes.
        </LegalP>
      </>
    ),

    mastercode: (
      <>
        <LegalP>
          Tu QR Te Cuida es el servicio que administra la relación con los usuarios. MasterCode Company actúa como
          proveedor de desarrollo o soporte tecnológico, exclusivamente cuando esa sea la relación contractual y
          operativa real.
        </LegalP>
        <LegalP>
          No se afirma que MasterCode Company carezca de responsabilidad legal si los hechos de la operación no
          respaldan esa afirmación.
        </LegalP>
        <LegalList
          items={[
            'Cuando actúe como encargado del tratamiento, operará bajo instrucciones documentadas, confidencialidad, permisos restringidos y obligaciones de seguridad.',
            'No se utilizarán datos de usuarios para proyectos, pruebas, demostraciones, marketing o finalidades propias sin autorización y base jurídica correspondiente.',
          ]}
        />
      </>
    ),

    conservacion: (
      <>
        <LegalP>
          Los criterios de conservación se aplican a cuentas, perfiles, datos médicos, contactos, pedidos, pagos y
          registros de seguridad. No se definen períodos específicos de retención en este documento.
        </LegalP>
        <LegalP>
          Se diferencian los datos que pueden eliminarse de aquellos que deben conservarse por obligaciones legales,
          contractuales o de seguridad.
        </LegalP>
      </>
    ),

    derechos: (
      <>
        <LegalP>Los titulares pueden ejercer los siguientes derechos:</LegalP>
        <LegalList
          items={[
            'Conocer sus datos personales.',
            'Consultar sus datos personales.',
            'Actualizar sus datos personales.',
            'Rectificar sus datos personales.',
            'Solicitar prueba de autorización.',
            'Revocar la autorización cuando proceda.',
            'Solicitar supresión cuando proceda.',
            'Presentar consultas y reclamos.',
          ]}
        />
        <LegalP>
          Los canales y procedimientos para ejercer estos derechos están disponibles desde el centro de privacidad del
          usuario y mediante el correo de privacidad del responsable.
        </LegalP>
      </>
    ),

    seguridad: (
      <>
        <LegalP>Se documentan únicamente los controles realmente implementados o verificados:</LegalP>
        <LegalList
          items={[
            'Control de acceso por roles.',
            'Protección de credenciales.',
            'Conexiones seguras.',
            'Restricción de información sensible.',
            'Registros de auditoría.',
            'Copias de seguridad.',
            'Gestión de incidentes.',
            'Acceso técnico restringido.',
          ]}
        />
        <LegalP>
          No se afirma que exista cifrado de datos en reposo, auditorías externas, certificaciones o mecanismos
          específicos si no están implementados.
        </LegalP>
      </>
    ),

    cambios: (
      <>
        <DefList
          items={[
            { label: 'Versión', value: VERSION },
            { label: 'Fecha de actualización', value: EFFECTIVE_DATE },
          ]}
        />
        <LegalP>
          Los cambios sustanciales se informarán a los usuarios registrados mediante los canales de contacto
          habilitados, y se conservará el historial de versiones.
        </LegalP>
      </>
    ),
  };

  return (
    <LegalPage
      title={TITLE}
      description={DESCRIPTION}
      docType={DOC_TYPE}
      version={VERSION}
      effectiveDate={EFFECTIVE_DATE}
      sections={SECTIONS}
    >
      {SECTIONS.map((s, i) => (
        <LegalSection key={s.id} id={s.id} number={i + 1} title={s.title}>
          {content[s.id]}
        </LegalSection>
      ))}
    </LegalPage>
  );
};

export default PrivacyPolicy;