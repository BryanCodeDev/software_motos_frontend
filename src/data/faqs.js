import { STICKER_PACK_PRICE, WHATSAPP_DISPLAY } from './products';

// Preguntas frecuentes compartidas entre Home y la página de FAQ.
// Importante: homeFaqs usa posiciones del arreglo; si reordenas, revisa esa selección.
export const faqs = [
  {
    q: '¿Qué pasa cuando alguien escanea mi QR?',
    a: 'Se abre tu página de emergencia en el navegador del teléfono y muestra únicamente la información que tú autorizaste. Quien escanea no necesita cuenta ni aplicación, y desde ahí puede llamar o escribir a tus contactos.',
  },
  {
    q: '¿Necesito instalar una aplicación?',
    a: 'No. Quien escanea el código y tú, cuando administras tu perfil, usan solo el navegador web del teléfono o del computador.',
  },
  {
    q: '¿El QR funciona sin conexión a internet?',
    a: 'No. El código abre tu perfil web, así que el teléfono que escanea necesita conexión a internet para consultarlo.',
  },
  {
    q: '¿Qué información se muestra públicamente?',
    a: 'Solo los campos que marques como públicos. Los datos privados nunca viajan en el QR ni en su dirección. Puedes cambiar la visibilidad de cada dato en cualquier momento desde tu cuenta.',
  },
  {
    q: '¿Puedo modificar mis datos después de generar el QR?',
    a: 'Sí. Editas tu perfil desde tu cuenta cuando quieras y los cambios se reflejan al instante, sin necesidad de generar un código nuevo ni de reemplazar tu sticker.',
  },
  {
    q: '¿El código QR digital tiene costo?',
    a: `No. El QR digital es gratuito y lo descargas desde tu cuenta. Los stickers físicos sí tienen precio: ${STICKER_PACK_PRICE} por 2 stickers, con pago único y sin suscripción. El valor se confirma antes de pagar.`,
  },
  {
    q: '¿Cómo solicito mis stickers?',
    a: 'Entra a la página de productos, elige "Stickers QR" y sigue los pasos para completar tu perfil y confirmar el pedido. El pago en línea estará disponible cuando la integración de pagos esté habilitada.',
  },
  {
    q: '¿Cómo funcionan las alertas?',
    a: 'Escanear tu QR no genera alertas automáticas. Las alertas requieren una acción explícita de quien escanea y se envían por correo; esta función llegará en una fase posterior.',
  },
  {
    q: '¿Qué hago si pierdo mi sticker?',
    a: 'Desactiva el identificador perdido desde tu cuenta para que deje de mostrar tu información, y solicita uno nuevo. Tu perfil sigue vinculado a tu cuenta.',
  },
  {
    q: '¿Puedo desactivar mi identificador?',
    a: 'Sí. Cuando lo desactivas, su dirección muestra un aviso de inactivo sin exponer ningún dato personal. Puedes reactivarlo cuando lo necesites.',
  },
  {
    q: '¿La plataforma reemplaza a los servicios de emergencia?',
    a: 'No. Es una herramienta de apoyo: no sustituye a los servicios oficiales de emergencia, no garantiza que alguien escanee el código ni asegura una respuesta inmediata. Ante una emergencia, llama siempre a las líneas oficiales.',
  },
  {
    q: '¿Dónde puedo pegar el sticker?',
    a: 'En tu casco, tu moto, tu mochila o donde quieras, siempre en un lugar visible y protegido del desgaste. Estamos validando la durabilidad del material del sticker físico, así que evita zonas de fricción constante.',
  },
  {
    q: '¿Puedo pedir un sticker personalizado?',
    a: `Sí. Escríbenos por WhatsApp al ${WHATSAPP_DISPLAY} y cuéntanos qué necesitas: diseño, cantidad o cualquier solicitud especial. Lo acordamos contigo antes de comprar.`,
  },
];

// Selección para la página de inicio (índices de `faqs`).
export const homeFaqs = [faqs[0], faqs[3], faqs[2], faqs[5], faqs[8], faqs[10]];