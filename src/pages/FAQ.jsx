import React, { useEffect, useState } from 'react';
import { routes } from '../utils/routes';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import api from '../api/client';
import { ArrowRight, Mail, ShieldCheck, Package, UserPlus, QrCode, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card } from '../components/ui';
import Seo from '../components/Seo';
import { Reveal, PageHeader, Accordion } from '../components/Section';
import { faqs } from '../data/faqs';

const quickLinks = [
  { icon: UserPlus, label: 'Cómo funciona', to: routes.howItWorks },
  { icon: ShieldCheck, label: 'Privacidad y seguridad', to: routes.privacy },
  { icon: Package, label: 'Productos y precios', to: routes.products },
];

// Preguntas adicionales según el estado del usuario.
const loggedOutFaqs = [
  {
    q: '¿Necesito crear cuenta para usar el QR?',
    a: 'No. Quien escanea tu QR no necesita cuenta ni aplicación. Solo tú necesitas una cuenta para administrar tu perfil, tus contactos y tu privacidad.',
  },
  {
    q: '¿El QR digital tiene costo?',
    a: 'No. El QR digital es gratuito una vez que creas tu cuenta. Los stickers físicos tienen un costo único de $30.000 COP por 2 unidades.',
  },
];

const loggedInNoQrFaqs = [
  {
    q: '¿Cómo obtengo mi primer QR?',
    a: 'Entra a la página de productos, elige el diseño de tus stickers y confirma el pago. Al aprobarse el pago se genera tu identificador QR permanente y se vincula a tu cuenta.',
  },
  {
    q: '¿El QR tiene costo?',
    a: 'Tu QR digital es gratuito. Solo pagas si quieres los stickers físicos ($30.000 COP por 2, pago único, sin suscripción).',
  },
];

const loggedInHasQrFaqs = [
  {
    q: '¿Puedo comprar más stickers con mi mismo QR?',
    a: 'Sí. Cada compra adicional reutiliza tu identificador QR actual; no se genera uno nuevo. Solo elige un nuevo diseño para los stickers.',
  },
  {
    q: '¿Puedo cambiar el diseño sin cambiar mi QR?',
    a: 'Sí. El diseño del sticker es solo una preferencia visual; tu identificador y enlace permanente /e/:identifier nunca cambian.',
  },
  {
    q: '¿Qué hago si pierdo un sticker?',
    a: 'Desactiva el identificador perdido desde tu cuenta para que deje de mostrar tu información, y pide uno nuevo. Tu perfil sigue vinculado a tu cuenta.',
  },
];

export const FAQ = () => {
  const { isAuthenticated } = useAuth();
  const [hasQr, setHasQr] = useState(null);

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

  // Elegir preguntas adicionales según estado.
  let extraFaqs = [];
  if (!isAuthenticated) {
    extraFaqs = loggedOutFaqs;
  } else if (hasQr === false) {
    extraFaqs = loggedInNoQrFaqs;
  } else {
    extraFaqs = loggedInHasQrFaqs;
  }

  const allFaqs = [...faqs, ...extraFaqs];

  return (
    <main className="min-h-screen">
      <Seo
        title="Preguntas frecuentes"
        description="Respuestas claras sobre el QR de emergencia, tu privacidad, los stickers y los pagos."
      />
      <PageHeader
        eyebrow="Preguntas frecuentes"
        title="Todo lo que necesitas saber"
        subtitle="Así funciona Tu QR te Cuida, cómo protegemos tu privacidad y qué productos ofrecemos, explicado sin tecnicismos."
      />
      <section className="pb-20">
        <div className="container-page">
          <div className="grid items-start gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Accordion items={allFaqs} />
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24">
              <Reveal>
                <div className="rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-7 text-white shadow-glow">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                    <Mail className="h-5 w-5" />
                  </span>
                  <h2 className="mb-2 text-lg font-bold">¿No encuentras tu respuesta?</h2>
                  <p className="mb-5 text-sm leading-relaxed text-white/80">
                    Escríbenos tu duda y te respondemos al correo que nos dejes.
                  </p>
                  <Link to={routes.contact} className="btn bg-white px-5 py-2.5 text-sm text-brand-500 hover:bg-brand-50">
                    Contáctanos <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <Card className="p-6">
                  <h2 className="mb-4 text-sm font-semibold text-neutral-900">También te puede interesar</h2>
                  <ul className="space-y-1">
                    {quickLinks.map(({ icon: Icon, label, to }) => (
                      <li key={to}>
                        <Link
                          to={to}
                          className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-text-secondary transition-colors hover:bg-brand-50 hover:text-brand-500"
                        >
                          <Icon className="h-4 w-4 text-brand-500" />
                          {label}
                          <ArrowRight className="ml-auto h-3.5 w-3.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
};

export default FAQ;