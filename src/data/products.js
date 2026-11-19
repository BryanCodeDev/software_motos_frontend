import { routes } from '../utils/routes';

/* ------------------------------------------------------------------ */
/* WhatsApp para stickers personalizados                               */
/* ------------------------------------------------------------------ */

export const WHATSAPP_NUMBER = '573212209943';
export const WHATSAPP_DISPLAY = '+57 321 220 9943';
const WHATSAPP_MESSAGE = 'Hola, quiero un sticker QR personalizado de Tu QR te Cuida.';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

/* ------------------------------------------------------------------ */
/* Tarjetas de producto                                                */
/* ------------------------------------------------------------------ */
/* Precios obtenidos del catálogo del backend (única fuente de verdad).
   Cada plan tiene su precio oficial en COP. El frontend no debe
   confiar en precios hardcodeados; estos valores se sincronizan con
   la tabla product_packages de MySQL.                                */

export const productPlans = [
  {
    name: 'Perfil individual',
    price: '$29.000',
    priceNote: '1 persona · 1 QR permanente · 2 stickers',
    desc: 'Un perfil de persona con su propio código QR permanente y 2 stickers físicos con ese mismo QR. Ideal para ti o un familiar.',
    features: [
      '1 perfil digital independiente',
      '1 código QR permanente y único',
      '2 stickers físicos con el mismo QR',
      'Página pública con tu información de emergencia',
    ],
    badge: 'Individual',
    highlight: false,
    action: 'Elegir este plan',
    href: routes.register,
    requiresAccount: true,
  },
  {
    name: 'Familiar x3',
    price: '$99.900',
    priceNote: '3 personas · 3 QR · 6 stickers',
    desc: 'Paquete familiar para 3 personas. Cada integrante recibe su propio perfil, QR independiente y 2 stickers.',
    features: [
      '3 perfiles de personas',
      '3 códigos QR independientes',
      '6 stickers físicos (2 por perfil)',
      'Ideal para familias pequeñas',
    ],
    badge: 'Más elegido',
    highlight: true,
    action: 'Elegir este plan',
    href: routes.register,
    requiresAccount: true,
  },
  {
    name: 'Familiar x4',
    price: '$124.900',
    priceNote: '4 personas · 4 QR · 8 stickers',
    desc: 'Paquete familiar para 4 personas. Cada integrante recibe su propio perfil, QR independiente y 2 stickers.',
    features: [
      '4 perfiles de personas',
      '4 códigos QR independientes',
      '8 stickers físicos (2 por perfil)',
      'Ideal para familias',
    ],
    badge: 'Ideal para familias',
    highlight: false,
    action: 'Elegir este plan',
    href: routes.register,
    requiresAccount: true,
  },
  {
    name: 'Familiar x5',
    price: '$149.900',
    priceNote: '5 personas · 5 QR · 10 stickers',
    desc: 'Paquete familiar para 5 personas. Cada integrante recibe su propio perfil, QR independiente y 2 stickers.',
    features: [
      '5 perfiles de personas',
      '5 códigos QR independientes',
      '10 stickers físicos (2 por perfil)',
      'Ideal para familias numerosas',
    ],
    badge: 'Familia completa',
    highlight: false,
    action: 'Elegir este plan',
    href: routes.register,
    requiresAccount: true,
  },
  {
    name: 'Mascota individual',
    price: '$34.900',
    priceNote: '1 mascota · 1 QR · 2 stickers',
    desc: 'Un perfil de mascota con su propio código QR permanente y 2 stickers físicos. Incluye perfil veterinario y contactos del propietario.',
    features: [
      '1 perfil de mascota independiente',
      '1 código QR permanente',
      '2 stickers físicos con el mismo QR',
      'Perfil veterinario y contactos',
    ],
    badge: 'Mascota',
    highlight: false,
    action: 'Elegir este plan',
    href: routes.register,
    requiresAccount: true,
  },
  {
    name: 'Pack mascotas x2',
    price: '$64.900',
    priceNote: '2 mascotas · 2 QR · 4 stickers',
    desc: 'Paquete para 2 mascotas. Cada una recibe su propio perfil, QR independiente y 2 stickers.',
    features: [
      '2 perfiles de mascotas',
      '2 códigos QR independientes',
      '4 stickers físicos (2 por mascota)',
      'Ideal para hogares con varias mascotas',
    ],
    badge: 'Pack de 2',
    highlight: false,
    action: 'Elegir este plan',
    href: routes.register,
    requiresAccount: true,
  },
  {
    name: 'Pack mascotas x3',
    price: '$89.900',
    priceNote: '3 mascotas · 3 QR · 6 stickers',
    desc: 'Paquete para 3 mascotas. Cada una recibe su propio perfil, QR independiente y 2 stickers.',
    features: [
      '3 perfiles de mascotas',
      '3 códigos QR independientes',
      '6 stickers físicos (2 por mascota)',
      'Ideal para refugios o familias con varias mascotas',
    ],
    badge: 'Pack de 3',
    highlight: false,
    action: 'Elegir este plan',
    href: routes.register,
    requiresAccount: true,
  },
  {
    name: 'Familia + mascota',
    price: '$119.900',
    priceNote: '3 personas + 1 mascota · 4 QR · 8 stickers',
    desc: 'Combo familiar: 3 personas y 1 mascota. Cada perfil recibe su propio código QR independiente.',
    features: [
      '3 perfiles de personas',
      '1 perfil de mascota',
      '4 códigos QR independientes',
      '8 stickers físicos (2 por perfil)',
    ],
    badge: 'Combo',
    highlight: false,
    action: 'Elegir este plan',
    href: routes.register,
    requiresAccount: true,
  },
  {
    name: 'Familia + 2 mascotas',
    price: '$139.900',
    priceNote: '3 personas + 2 mascotas · 5 QR · 10 stickers',
    desc: 'Combo familiar: 3 personas y 2 mascotas. Cada perfil recibe su propio código QR independiente.',
    features: [
      '3 perfiles de personas',
      '2 perfiles de mascotas',
      '5 códigos QR independientes',
      '10 stickers físicos (2 por perfil)',
    ],
    badge: 'Combo',
    highlight: false,
    action: 'Elegir este plan',
    href: routes.register,
    requiresAccount: true,
  },
  {
    name: 'Familia completa',
    price: '$164.900',
    priceNote: '4 personas + 2 mascotas · 6 QR · 12 stickers',
    desc: 'Combo familiar completo: 4 personas y 2 mascotas. Cada perfil recibe su propio código QR independiente.',
    features: [
      '4 perfiles de personas',
      '2 perfiles de mascotas',
      '6 códigos QR independientes',
      '12 stickers físicos (2 por perfil)',
    ],
    badge: 'Combo completo',
    highlight: false,
    action: 'Elegir este plan',
    href: routes.register,
    requiresAccount: true,
  },
  {
    name: 'Sticker adicional',
    price: '$9.900',
    priceNote: '1 sticker extra · reutiliza tu QR',
    desc: 'Sticker físico adicional para un perfil que ya tienes. Reutiliza su QR permanente y no genera otro identificador.',
    features: [
      '1 sticker físico adicional',
      'Reutiliza el QR de tu perfil existente',
      'No genera un QR nuevo',
      'Para reemplazo o refuerzo',
    ],
    badge: 'Adicional',
    highlight: false,
    action: 'Comprar sticker extra',
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
