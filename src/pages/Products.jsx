import { Link } from 'react-router-dom';
import { ArrowRight, Check, Truck } from 'lucide-react';
import { routes } from '../utils/routes';
import { useAuth } from '../contexts/useAuth';
import { Card } from '../components/ui';
import Seo from '../components/Seo';
import { PageHeader } from '../components/Section';

const formatAmount = (amount) => {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `$${amount}`;
  }
};

const STICKER_PRICE = 30000;

const DESIGNS = [
  { id: 1, name: 'Diseño 1', image_url: '/img/sticker-1.png', description: 'Clásico y discreto' },
  { id: 2, name: 'Diseño 2', image_url: '/img/sticker-2.png', description: 'Moderno y minimalista' },
  { id: 3, name: 'Diseño 3', image_url: '/img/sticker-3.png', description: 'Deportivo y dinámico' },
  { id: 4, name: 'Diseño 4', image_url: '/img/sticker-4.png', description: 'Urbano y actual' },
  { id: 5, name: 'Diseño 5', image_url: '/img/sticker-5.png', description: 'Elegante y sobrio' },
  { id: 6, name: 'Diseño 6', image_url: '/img/sticker-6.png', description: 'Aventurero y resistente' },
];

const INCLUDES = [
  '2 stickers con el mismo diseño, para casco, moto o mochila',
  '1 código QR único y permanente, sin datos personales',
  'Tu perfil de emergencia, con solo lo que autorices',
  'Sin suscripción; quien escanea no necesita cuenta ni app',
];

const STEPS = [
  'Elige tu diseño',
  'Paga una sola vez',
  'Se activa tu QR',
  'Recibe y pega tus stickers',
];

export const Products = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      <Seo
        title="Tu QR Te Cuida — Stickers QR personalizados"
        description="Paquete de 2 stickers personalizados con tu código QR único de emergencia. Pago único, sin suscripción."
      />
      <PageHeader
        title="Stickers QR de emergencia"
        subtitle="Lleva tu QR siempre a la vista."
        align="center"
      />

      <section className="pb-16">
        <div className="container-page grid items-start gap-8 lg:grid-cols-12">
          {/* Oferta: precio, qué incluye y la única acción de la página */}
          <Card className="p-6 lg:sticky lg:top-24 lg:col-span-5 lg:p-8">
            <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">Paquete de 2 stickers</h2>
            <p className="mt-3 text-4xl font-extrabold tracking-tight text-neutral-900">
              {formatAmount(STICKER_PRICE)}
            </p>
            <p className="mt-1 text-sm text-text-secondary">Pago único</p>

            <ul className="mt-6 space-y-3">
              {INCLUDES.map((text) => (
                <li key={text} className="flex items-start gap-3 text-sm text-neutral-900">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                    <Check size={13} strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span className="leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>

            <Link
              to={isAuthenticated ? routes.dashboard : routes.register}
              className="btn-primary mt-8 w-full px-5 py-3 text-sm"
            >
              {isAuthenticated ? 'Ir a mi panel' : 'Crear cuenta para pedir'}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-text-secondary">
              <Truck size={14} className="mt-0.5 flex-none" aria-hidden="true" />
              El envío a domicilio se confirma antes de pagar.
            </p>
          </Card>

          {/* Diseños */}
          <div className="lg:col-span-7">
            <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-neutral-900">
              Elige entre 6 diseños
            </h2>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {DESIGNS.map((design) => (
                <li
                  key={design.id}
                  className="rounded-2xl border border-border bg-white p-3 transition-colors hover:border-brand-500/40 sm:p-4"
                >
                  <img
                    src={design.image_url}
                    alt={design.name}
                    width="160"
                    height="160"
                    loading="lazy"
                    className="aspect-square w-full rounded-xl bg-neutral-100 object-cover object-center"
                  />
                  <p className="mt-3 text-sm font-semibold text-neutral-900">{design.name}</p>
                  <p className="text-xs text-text-secondary">{design.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-page">
          <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-neutral-900">Cómo funciona</h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-neutral-900">{label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
};

export default Products;