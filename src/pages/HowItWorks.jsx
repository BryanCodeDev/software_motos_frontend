import React, { useEffect, useState, useMemo } from 'react';
import { routes } from '../utils/routes';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import api from '../api/client';
import {
  ArrowRight,
  UserPlus,
  HeartPulse,
  SlidersHorizontal,
  Download,
  QrCode,
  ScanLine,
  Wifi,
  Smartphone,
  Eye,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { Card } from '../components/ui';
import Seo from '../components/Seo';
import { Reveal, PageHeader } from '../components/Section';

const notes = [
  { icon: Wifi, text: 'Se necesita conexión a internet para abrir el perfil vinculado al QR.' },
  { icon: Smartphone, text: 'Quien escanea no necesita crear cuenta ni instalar ninguna aplicación.' },
  { icon: Eye, text: 'Tú decides qué información se ve, y puedes cambiarlo en cualquier momento.' },
  { icon: AlertTriangle, text: 'Es una herramienta de apoyo: no reemplaza a los servicios oficiales de emergencia.' },
];

export const HowItWorks = () => {
  const { user, isAuthenticated } = useAuth();
  const [hasQr, setHasQr] = useState(null);

  // Verificar si el usuario autenticado ya tiene un QR vinculado.
  useEffect(() => {
    let mounted = true;
    const checkQr = async () => {
      if (!isAuthenticated) {
        setHasQr(false);
        return;
      }
      try {
        const { data } = await api.get('/api/identifiers/my');
        if (!mounted) return;
        setHasQr(!!data?.identifier);
      } catch {
        if (!mounted) return;
        setHasQr(false);
      }
    };
    checkQr();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  // Pasos según el estado del usuario.
  const steps = useMemo(() => {
    if (!isAuthenticated) {
      return [
        {
          icon: UserPlus,
          title: '1. Crea tu cuenta',
          text: 'Regístrate con tu correo y contraseña. Es gratis y toma menos de un minuto.',
        },
        {
          icon: HeartPulse,
          title: '2. Completa tu perfil',
          text: 'Agrega tus contactos de emergencia y, si quieres, datos médicos útiles.',
        },
        {
          icon: SlidersHorizontal,
          title: '3. Elige qué se muestra',
          text: 'Para cada dato decides si es público o privado. Puedes cambiarlo cuando quieras.',
        },
        {
          icon: Download,
          title: '4. Pide tus stickers',
          text: 'Compra tu paquete de stickers y elige el diseño que quieras.',
        },
        {
          icon: QrCode,
          title: '5. Activa tu QR',
          text: 'Al confirmar el pago se genera tu identificador permanente único.',
        },
        {
          icon: ScanLine,
          title: '6. Colócalo a la vista',
          text: 'Pega tus stickers en el casco, la moto o la mochila. Listo para emergencias.',
        },
      ];
    }

    if (hasQr === false) {
      return [
        {
          icon: HeartPulse,
          title: '1. Completa tu perfil',
          text: 'Ya tienes cuenta. Agrega tus contactos de emergencia y datos médicos si quieres.',
        },
        {
          icon: SlidersHorizontal,
          title: '2. Elige qué se muestra',
          text: 'Decide qué datos se ven al escanear tu QR y qué queda privado.',
        },
        {
          icon: Download,
          title: '3. Pide tus stickers',
          text: 'Compra tu paquete de stickers y selecciona el diseño.',
        },
        {
          icon: QrCode,
          title: '4. Activa tu QR',
          text: 'Al pagar, se genera tu único identificador QR y se vincula a tu cuenta.',
        },
        {
          icon: ScanLine,
          title: '5. Colócalo a la vista',
          text: 'Pega tus stickers en sitios visibles. Quien escanee verá tu perfil autorizado.',
        },
      ];
    }

    // Usuario autenticado con QR
    return [
      {
        icon: HeartPulse,
        title: '1. Tu perfil ya está listo',
        text: 'Tienes cuenta y QR vinculado. Puedes editar tus contactos y privacidad cuando quieras.',
      },
      {
        icon: Download,
        title: '2. Compra stickers adicionales',
        text: 'Selecciona un diseño y paga el paquete de stickers. Reutilizarás tu mismo QR.',
      },
      {
        icon: QrCode,
        title: '3. Tu QR se mantiene',
        text: 'No se genera un código nuevo: tu identificador permanente sigue siendo el mismo.',
      },
      {
        icon: ScanLine,
        title: '4. Coloca tus stickers',
        text: 'Pégalos en casco, moto o mochila. Quien escanee verá tu perfil de emergencia.',
      },
    ];
  }, [isAuthenticated, hasQr]);

  const cta = useMemo(() => {
    if (!isAuthenticated) {
      return {
        label: 'Crear perfil gratuito',
        to: routes.register,
        variant: 'bg-white text-brand-500 hover:bg-brand-50',
      };
    }
    if (hasQr === false) {
      return {
        label: 'Comprar stickers y activar QR',
        to: routes.products,
        variant: 'bg-white text-brand-500 hover:bg-brand-50',
      };
    }
    return {
      label: 'Ir a mi panel',
      to: routes.dashboard,
      variant: 'bg-white text-brand-500 hover:bg-brand-50',
    };
  }, [isAuthenticated, hasQr]);

  return (
    <main className="min-h-screen">
      <Seo
        title="Cómo funciona"
        description="Seis pasos para crear tu perfil de emergencia, obtener tu QR o tus stickers y compartir solo la información que tú autorizas."
      />
      <PageHeader
        eyebrow="Cómo funciona"
        title="Tu red de seguridad, lista en minutos"
        subtitle="Seis pasos sencillos para que tu información importante hable por ti cuando haga falta."
      />

      <section className="pb-20">
        <div className="container-page">
          <div className="grid items-start gap-12 lg:grid-cols-5">
            <ol className="relative lg:col-span-3">
              <span
                className="absolute bottom-2 left-6 top-2 w-px bg-gradient-to-b from-brand-500/60 via-border to-transparent"
                aria-hidden="true"
              />
              {steps.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="relative pb-8 pl-20 last:pb-0">
                  <Reveal delay={0.05}>
                    <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full border border-brand-500/60 bg-brand-50 text-brand-500 shadow-glow">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Card className="p-6">
                      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-500">
                        Paso {i + 1}
                      </span>
                      <h3 className="mb-1.5 text-lg font-semibold text-neutral-900">{title}</h3>
                      <p className="text-sm leading-relaxed text-text-secondary">{text}</p>
                    </Card>
                  </Reveal>
                </li>
              ))}
            </ol>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-2">
              <Reveal>
                <Card className="p-7">
                  <h2 className="mb-5 font-semibold text-neutral-900">Antes de empezar, ten en cuenta</h2>
                  <ul className="space-y-4 text-sm text-text-secondary">
                    {notes.map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-start gap-3">
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="pt-1 leading-relaxed">{text}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-7 text-white shadow-glow">
                  <h2 className="mb-2 text-xl font-bold">¿Listo para empezar?</h2>
                  <p className="mb-6 text-sm leading-relaxed text-white/80">
                    {isAuthenticated && hasQr === true
                      ? 'Tu QR ya está activo. Puedes comprar stickers adicionales o gestionar tu perfil.'
                      : isAuthenticated && hasQr === false
                        ? 'Completa tu perfil y compra stickers para activar tu QR.'
                        : 'Crea tu perfil gratuito y ten tu QR listo en minutos.'}
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                    <Link
                      to={cta.to}
                      className={`btn ${cta.variant} px-5 py-2.5 text-sm`}
                    >
                      {cta.label} <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to={routes.products}
                      className="btn border border-white/40 px-5 py-2.5 text-sm text-white hover:bg-white/10"
                    >
                      Ver los stickers
                    </Link>
                  </div>
                </div>
              </Reveal>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HowItWorks;