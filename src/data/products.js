import { routes } from '../utils/routes';

/* ------------------------------------------------------------------ */
/* WhatsApp para stickers personalizados                               */
/* ------------------------------------------------------------------ */

export const WHATSAPP_NUMBER = '573212209943';
export const WHATSAPP_DISPLAY = '+57 321 220 9943';
const WHATSAPP_MESSAGE = 'Hola, quiero un sticker QR personalizado de Tu QR te Cuida.';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

/* Precio del pack de stickers (2 stickers por un solo precio) */
export const STICKER_PACK_PRICE = '$30.000 COP';

/* ------------------------------------------------------------------ */
/* Tarjetas de producto                                                */
/* ------------------------------------------------------------------ */

export const productPlans = [
  {
    name: 'Stickers QR',
    price: STICKER_PACK_PRICE,
    priceNote: '2 stickers · pago único',
    desc: 'Llévate dos stickers por el precio de uno. Pégalos en tu casco, tu moto o donde quieras: si ocurre una emergencia, quien los escanee verá la información que tú autorizaste.',
    features: [
      '2 stickers vinculados a tu perfil de emergencia',
      'Para casco, moto, mochila o el lugar que prefieras',
      'Sin suscripción ni costo por escaneo',
      'Si pierdes uno, lo desactivas o lo reemplazas desde tu cuenta',
    ],
    badge: '2 por 1',
    highlight: true,
    action: 'Quiero mis 2 stickers',
    authAction: 'Pedir mis stickers',
    href: routes.register,
    requiresAccount: true,
  },
  {
    name: 'Personalizado',
    price: 'A tu medida',
    priceNote: 'cotiza por WhatsApp',
    desc: 'Un sticker pensado para ti: tu diseño, la cantidad que necesites o una solicitud especial. Escríbenos y lo acordamos.',
    features: [
      'Diseño y cantidad a tu medida',
      'Atención directa por WhatsApp',
      'Vinculado a tu perfil de emergencia',
    ],
    action: 'Comprar por WhatsApp',
    whatsapp: true,
  },
  {
    name: 'QR + NFC',
    price: 'Próximamente',
    desc: 'Identificador QR con tecnología NFC. Próximamente disponible una vez validado el prototipo físico.',
    features: [
      'Lectura por proximidad',
      'Vinculado a tu perfil actual',
    ],
    coming: true,
  },
];

/* Notas que se muestran en "Antes de elegir, ten en cuenta" */
export const productInfoItems = [
  'El QR no guarda datos personales ni médicos: solo contiene un código aleatorio que abre tu perfil.',
  'Quien escanea no necesita cuenta ni aplicación, y solo ve los campos que marcaste como públicos.',
  'Para abrir el perfil se necesita conexión a internet.',
  'Si pierdes un sticker, lo desactivas o lo reemplazas desde tu cuenta.',
  'Estamos validando la durabilidad del sticker físico; colócalo en un lugar visible y protegido del desgaste.',
  'Es una herramienta de apoyo: no reemplaza a los servicios oficiales de emergencia ni garantiza que alguien escanee el código.',
];