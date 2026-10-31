import { routes } from '../utils/routes';

export const productPlans = [
  {
    name: 'QR digital básico + sticker físico',
    price: '$30.000 COP',
    desc: 'Activación única de tu perfil de emergencia digital con código QR. Incluye sticker físico personalizado con envío gratis a domicilio. Pago único, sin suscripción mensual ni anual.',
    features: ['Perfil y contactos de emergencia', 'Control de visibilidad por campo', 'Descarga del código QR', 'Página pública autorizada', 'Sticker físico personalizado', 'Envío gratis a domicilio'],
    action: 'Activar mi QR',
    href: routes.dashboardQr,
    free: false,
  },
  {
    name: 'QR + NFC',
    price: 'Próximamente',
    desc: 'Identificador QR con tecnología NFC. Próximamente disponible una vez validado el prototipo físico.',
    features: ['Lectura por proximidad', 'Vinculado a tu perfil actual'],
    action: null,
    href: null,
    coming: true,
  },
];

export const productInfoItems = [
  'También puedes completar tu pago por WhatsApp escribiendo al +57 321 220 9943.',
  'La activación del QR digital + sticker físico tiene un pago único de $30.000 COP con envío gratis a domicilio. No hay suscripciones ni cobros automáticos de renovación.',
  'Al activar el QR por $30.000 COP se te envía el sticker físico personalizado sin costo adicional.',
  'Los precios los configura el administrador y se confirman antes del pago.',
  'El QR contiene solo el enlace con tu identificador, nunca datos personales ni médicos.',
  'QR + NFC no está disponible para compra hasta que el prototipo físico sea validado.',
];
