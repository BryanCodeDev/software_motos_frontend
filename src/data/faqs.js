// Preguntas frecuentes compartidas entre Home y la página de FAQ.
export const faqs = [
  {
    q: '¿Qué pasa cuando alguien escanea mi QR?',
    a: 'Se abre una página pública en el navegador del teléfono, con únicamente la información que tú hayas autorizado. No se requiere cuenta ni aplicación.',
  },
  {
    q: '¿Necesito instalar una aplicación?',
    a: 'No. Tanto quien escanea el código como tú, al administrar tu perfil, usan el navegador web.',
  },
  {
    q: '¿El QR funciona sin conexión a internet?',
    a: 'No. El código enlaza a tu perfil web, por lo que el teléfono que escanea necesita conexión a internet para consultarlo.',
  },
  {
    q: '¿Qué información se muestra públicamente?',
    a: 'Solo los campos que marques como públicos en tus controles de privacidad. Puedes cambiar la visibilidad de cada dato en cualquier momento.',
  },
  {
    q: '¿Puedo modificar mis datos después de generar el QR?',
    a: 'Sí. Editas tu perfil desde tu cuenta cuando quieras, sin necesidad de generar un código nuevo.',
  },
  {
    q: '¿El código QR digital tiene costo?',
    a: 'No. El QR digital básico es gratuito y se descarga desde tu cuenta. Solo el sticker físico personalizado tiene un precio, que se confirma antes de pagar.',
  },
  {
    q: '¿Cómo solicito el sticker físico?',
    a: 'Desde la página de productos selecciona el sticker, configura las opciones y confirma el pedido. El pago en línea estará disponible cuando la integración esté habilitada.',
  },
  {
    q: '¿Cómo funcionan las alertas?',
    a: 'Un escaneo por sí solo no genera alertas automáticas. Las alertas requieren una acción explícita de quien escanea y se envían por correo (disponible en una fase posterior).',
  },
  {
    q: '¿Qué hago si pierdo mi sticker?',
    a: 'Desactiva el identificador perdido desde tu cuenta y solicita uno nuevo. Tu perfil permanece vinculado a tu cuenta.',
  },
  {
    q: '¿Puedo desactivar mi identificador?',
    a: 'Sí. Al desactivarlo, su dirección mostrará un aviso de inactivo sin exponer ningún dato personal. Puedes reactivarlo cuando lo necesites.',
  },
  {
    q: '¿La plataforma reemplaza a los servicios de emergencia?',
    a: 'No. Es una herramienta de apoyo: no sustituye a los servicios oficiales de emergencia, no garantiza que alguien escanee el código ni asegura una respuesta inmediata. Ante una emergencia, llama siempre a las líneas oficiales.',
  },
];

// Selección para la página de inicio.
export const homeFaqs = [faqs[0], faqs[3], faqs[2], faqs[5], faqs[8], faqs[10]];
