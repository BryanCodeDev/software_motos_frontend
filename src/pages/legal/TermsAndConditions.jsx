import {
  LegalPage,
  COMPANY,
  Callout,
  DefList,
  Lead,
  LegalList,
  LegalP,
  LegalSection,
  Note,
  Value,
} from '../../components/LegalPage';

const TITLE = 'Términos y Condiciones de Uso';
const DESCRIPTION =
  'Términos que rigen el uso de la plataforma Tu QR Te Cuida. Lee este documento antes de crear una cuenta, configurar tu perfil o adquirir productos.';
const DOC_TYPE = 'Términos y Condiciones de Uso';
const VERSION = '1.0';
const EFFECTIVE_DATE = 'Por definir';

const SECTIONS = [
  { id: 'identificacion', title: 'Identificación del servicio' },
  { id: 'descripcion', title: 'Descripción del servicio' },
  { id: 'registro', title: 'Registro y responsabilidad de la cuenta' },
  { id: 'qr', title: 'Funcionamiento de los códigos QR' },
  { id: 'compras', title: 'Compras, pagos y pedidos' },
  { id: 'obligaciones', title: 'Obligaciones del usuario' },
  { id: 'alcance', title: 'Alcance y limitaciones del servicio' },
  { id: 'disponibilidad', title: 'Disponibilidad y mantenimiento' },
  { id: 'suspension', title: 'Suspensión y cancelación' },
  { id: 'propiedad', title: 'Propiedad intelectual' },
  { id: 'modificaciones', title: 'Modificaciones' },
  { id: 'reclamaciones', title: 'Atención de reclamaciones y contacto' },
  { id: 'legislacion', title: 'Legislación aplicable' },
];

export const TermsAndConditions = () => {
  const content = {
    identificacion: (
      <>
        <LegalP>
          Tu QR Te Cuida es una plataforma de identificación de emergencia que permite a los usuarios configurar un
          perfil de emergencia accesible mediante la lectura de un código QR. El servicio tiene como finalidad
          facilitar que, en caso de emergencia, una persona que escanee el QR pueda acceder a la información que el
          titular haya decidido compartir, como contactos de emergencia y datos médicos voluntarios.
        </LegalP>
        <LegalP>
          La plataforma está operada en Colombia y se rige por la normativa aplicable en materia de protección al
          consumidor, comercio electrónico y protección de datos personales.
        </LegalP>
        <DefList
          items={[
            { label: 'Nombre legal del operador', value: <Value value={COMPANY.name} label="Nombre legal" /> },
            { label: 'Identificación del responsable comercial', value: <Value value={COMPANY.nit} label="NIT" /> },
            { label: 'Domicilio o dirección de contacto', value: <Value value={COMPANY.address} label="Domicilio" /> },
            { label: 'Correo electrónico oficial', value: <Value value={COMPANY.email} label="Correo oficial" /> },
            { label: 'Canal de atención al cliente', value: <Value value={COMPANY.phone} label="Canal de atención" /> },
            { label: 'Fecha de vigencia y versión', value: `Versión ${VERSION} — vigente desde ${EFFECTIVE_DATE}` },
          ]}
        />
        <Note>
          Los campos marcados como «por configurar» deben completarse con la información real del operador antes de
          publicar.
        </Note>
      </>
    ),

    descripcion: (
      <>
        <LegalP>
          Tu QR Te Cuida ofrece un sistema de identificación mediante códigos QR que permite acceder a un perfil de
          emergencia configurado por el usuario. El código QR contiene únicamente un enlace público con un
          identificador aleatorio y no almacena directamente información médica ni datos personales.
        </LegalP>
        <Lead>El servicio puede permitir:</Lead>
        <LegalList
          items={[
            'Crear una cuenta de usuario.',
            'Configurar un perfil de emergencia.',
            'Registrar contactos de emergencia.',
            'Añadir información médica de forma voluntaria.',
            'Configurar la visibilidad de los datos en el perfil público.',
            'Generar un código QR único.',
            'Consultar el perfil mediante el escaneo del QR.',
            'Adquirir stickers físicos personalizados.',
            'Gestionar pedidos y pagos.',
          ]}
        />
      </>
    ),

    registro: (
      <>
        <LegalP>
          Para crear una cuenta se requiere proporcionar un nombre y un correo electrónico válidos, además de una
          contraseña segura. El usuario es responsable de la exactitud de la información que registre y de mantener
          actualizados sus datos de contacto.
        </LegalP>
        <LegalList
          items={[
            'Los datos de acceso son personales e intransferibles.',
            'El usuario debe proteger sus credenciales y no compartirlas con terceros.',
            'La información médica no es un requisito obligatorio para crear una cuenta.',
            'El usuario es responsable de mantener actualizados sus contactos de emergencia.',
            'En caso de olvido de contraseña, el acceso puede recuperarse mediante el procedimiento de restablecimiento disponible en la plataforma.',
          ]}
        />
      </>
    ),

    qr: (
      <>
        <LegalList
          items={[
            'Cada usuario obtiene un identificador único asociado a su cuenta.',
            'El QR contiene una URL pública con un identificador aleatorio.',
            'El QR no almacena directamente información médica ni datos personales.',
            'La información se consulta desde la plataforma al escanear el código.',
            'El usuario puede modificar los datos de su perfil sin modificar su código QR.',
            'La URL está diseñada para ser permanente mientras el servicio se encuentre operativo.',
            'La activación del QR depende del estado de la cuenta y del servicio contratado.',
          ]}
        />
        <LegalP>
          No se promete disponibilidad perpetua o absoluta del servicio. El operador podrá interrumpir o descontinuar
          el servicio en cualquier momento, de conformidad con las condiciones establecidas en estos términos.
        </LegalP>
        <LegalP>
          En caso de pérdida, deterioro, desactivación o reemplazo del sticker físico, el usuario puede solicitar un
          nuevo código QR o reemplazar el identificador existente desde su cuenta o contactando al soporte.
        </LegalP>
      </>
    ),

    compras: (
      <>
        <LegalP>
          El precio del producto de activación de QR digital es de $30.000 COP, sujeto a actualización. El valor
          incluye el acceso al QR digital y, según la oferta comercial vigente, puede incluir un sticker físico
          personalizado.
        </LegalP>
        <Lead>Medios de pago:</Lead>
        <LegalList items={['Mercado Pago.', 'Canales manuales habilitados (por ejemplo, pago por WhatsApp).']} />
        <LegalP>
          Los pagos se confirman una vez la pasarela de pago notifique el estado aprobado o el administrador verifique
          el pago manual. Los estados de pedido incluyen borrador, pendiente de pago, pagado, en preparación, enviado,
          entregado, cancelado y reembolsado.
        </LegalP>
        <LegalP>
          La preparación y producción del sticker físico comienza tras la confirmación del pago. Las condiciones
          logísticas, tiempos de entrega y costos de envío se informan al momento de la compra y no están definidos de
          manera anticipada en este documento.
        </LegalP>
        <Lead>Derechos del consumidor:</Lead>
        <LegalP>
          Se respetan los derechos del consumidor reconocidos por la legislación colombiana, incluyendo el derecho de
          retracto, la reversión del pago, la garantía y las reclamaciones, cuando resulten aplicables. Nada en estos
          términos limita derechos irrenunciables.
        </LegalP>
        <Note>
          No se inventan tiempos de entrega, costos de envío, garantías o políticas de devolución que no estén
          definidos en la oferta comercial vigente.
        </Note>
      </>
    ),

    obligaciones: (
      <>
        <LegalP>
          El usuario debe utilizar el servicio de manera legal y responsable. En particular, se compromete a:
        </LegalP>
        <LegalList
          items={[
            'Proporcionar información veraz y actualizada.',
            'No cargar información de terceros sin contar con la autorización o legitimación correspondiente.',
            'Mantener actualizados sus contactos de emergencia.',
            'Configurar conscientemente los datos que desea compartir públicamente.',
            'No utilizar la plataforma para suplantar a otras personas.',
          ]}
        />
      </>
    ),

    alcance: (
      <>
        <Callout tone="warning" title="Herramienta de apoyo">
          Tu QR Te Cuida es una herramienta tecnológica de apoyo y no ofrece servicios médicos ni de emergencia.
        </Callout>
        <LegalList
          items={[
            'No es un servicio médico.',
            'No es una central de emergencias.',
            'No garantiza que alguien escanee el código QR.',
            'No garantiza la recepción de notificaciones.',
            'No sustituye ambulancias, servicios médicos ni organismos oficiales.',
            'Requiere conexión a internet para consultar el perfil.',
            'No garantiza una respuesta inmediata de los contactos de emergencia.',
          ]}
        />
        <LegalP>
          No se utilizan afirmaciones que puedan generar una falsa sensación de protección o garantía de atención
          médica.
        </LegalP>
      </>
    ),

    disponibilidad: (
      <LegalP>
        Pueden existir interrupciones del servicio por mantenimiento, fallos técnicos, servicios externos o situaciones
        fuera del control razonable del operador. Estas condiciones no se presentan como una exoneración absoluta de
        responsabilidades legales.
      </LegalP>
    ),

    suspension: (
      <>
        <LegalP>
          El operador podrá desactivar una cuenta o un código QR cuando detecte uso indebido, violación de estos
          términos o solicitud del titular. El usuario podrá solicitar la eliminación de su cuenta y sus datos a través
          de los canales de privacidad habilitados.
        </LegalP>
        <LegalP>
          El operador conservará la información que sea necesario mantener por obligaciones legales, contractuales o de
          seguridad, incluso después de la desactivación o eliminación de la cuenta.
        </LegalP>
      </>
    ),

    propiedad: (
      <>
        <LegalP>
          La marca, los diseños, el software, los logotipos, los contenidos y demás elementos de la plataforma son
          propiedad de sus respectivos titulares. El uso de la plataforma no otorga al usuario ningún derecho de
          propiedad intelectual sobre dichos elementos.
        </LegalP>
        <Note>
          Queda prohibido reproducir, distribuir o modificar los contenidos de la plataforma sin autorización expresa.
        </Note>
      </>
    ),

    modificaciones: (
      <>
        <LegalP>
          El operador podrá modificar estos términos en cualquier momento. Los cambios importantes se comunicarán a los
          usuarios registrados a través de los canales de contacto habilitados y entrarán en vigor a partir de la fecha
          indicada en la notificación.
        </LegalP>
        <Note>
          El uso continuado del servicio tras la entrada en vigor de los cambios implica la aceptación de los mismos.
        </Note>
      </>
    ),

    reclamaciones: (
      <LegalP>
        Para solicitudes, consultas, reclamaciones y atención al consumidor, el usuario puede utilizar los canales
        oficiales de contacto indicados en el recuadro de contacto al final de este documento (correo de privacidad y
        canal de atención al cliente).
      </LegalP>
    ),

    legislacion: (
      <>
        <LegalP>
          Estos términos se interpretan conforme a la legislación colombiana aplicable, incluyendo la Ley Estatutaria
          1581 de 2012, el Decreto 1074 de 2015 y las normas de protección al consumidor y comercio electrónico,
          respetando los derechos de los consumidores.
        </LegalP>
        <Note>
          Este documento no es una certificación de cumplimiento legal ni ha sido aprobado por un abogado. Los datos
          empresariales pendientes deben confirmarse con el operador antes de su publicación en producción.
        </Note>
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

export default TermsAndConditions;