import React, { useState } from 'react';
import { routes } from '../utils/routes';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail, Phone, Send, MapPin, MessageCircle, ArrowRight, AlertTriangle, CheckCircle2, Loader2, LifeBuoy } from 'lucide-react';
import { Button, Input, Label, Card } from '../components/ui';
import { useToast } from '../components/useToast';
import api from '../api/client';
import { showApiError } from '../utils/errors';
import Seo from '../components/Seo';
import { Reveal, PageHeader } from '../components/Section';
import { WHATSAPP_URL, WHATSAPP_DISPLAY } from '../data/products';

// Datos de contacto configurables mediante variables de entorno de Vite.
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL;
const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_PHONE;
const SUPPORT_OFFICE = import.meta.env.VITE_SUPPORT_OFFICE;

const channels = [
  { icon: MessageCircle, label: 'WhatsApp · stickers personalizados', value: WHATSAPP_DISPLAY, href: WHATSAPP_URL },
  { icon: Mail, label: 'Correo de soporte', value: SUPPORT_EMAIL, href: SUPPORT_EMAIL && `mailto:${SUPPORT_EMAIL}` },
  { icon: Phone, label: 'Teléfono', value: SUPPORT_PHONE, href: SUPPORT_PHONE && `tel:${SUPPORT_PHONE.replace(/\s/g, '')}` },
  { icon: MapPin, label: 'Oficina', value: SUPPORT_OFFICE },
];

const topics = ['Mi cuenta', 'Mi QR o mis stickers', 'Un pedido', 'Sticker personalizado', 'Privacidad de mis datos', 'Otro tema'];

/** Fila de contacto: toda la fila es tocable cuando tiene enlace. */
const ChannelRow = ({ icon: Icon, label, value, href }) => {
  const body = (
    <>
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 transition-colors duration-300 group-hover:bg-brand-500 group-hover:text-white">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{label}</span>
        <span className={`block truncate text-sm font-semibold ${value ? 'text-neutral-900' : 'text-text-secondary'}`}>
          {value || 'Disponible próximamente'}
        </span>
      </span>
      {href && value && <ArrowRight className="h-4 w-4 flex-none text-brand-500 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />}
    </>
  );
  const cls = 'group flex min-h-[64px] items-center gap-3 rounded-xl border border-border bg-white p-3 transition-all duration-200';
  if (href && value) {
    const external = href.startsWith('http');
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={`${cls} hover:border-brand-500/50 hover:shadow-soft active:scale-[0.99] focus-ring`}
      >
        {body}
      </a>
    );
  }
  return <div className={cls}>{body}</div>;
};

export const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const toast = useToast();
  const reduce = useReducedMotion();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contacts', form);
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      toast.success('Mensaje enviado correctamente');
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'No pudimos enviar tu mensaje. Revisa tu conexión e inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="relative flex min-h-screen items-center py-16 sm:py-20">
        <Seo title="Contacto" />
        <div className="container-page text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="mx-auto max-w-md p-7 sm:p-10">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-brand-500/40 bg-brand-500/10 text-brand-500">
                <CheckCircle2 size={30} />
              </div>
              <h1 className="mb-3 text-2xl font-bold text-neutral-900">¡Mensaje enviado!</h1>
              <p className="mb-8 leading-relaxed text-text-secondary">
                Gracias por escribirnos. Ya recibimos tu mensaje y te responderemos lo antes posible
                al correo que nos dejaste.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link to={routes.home} className="btn-primary min-h-[48px]">Volver al inicio</Link>
                <Link to={routes.faq} className="btn-outline min-h-[48px]">Ver preguntas frecuentes</Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Seo
        title="Contacto"
        description="Escríbenos para resolver tus dudas sobre tu cuenta, tu QR, tus stickers, tus pedidos o la privacidad de tus datos."
      />
      <PageHeader
        eyebrow="Contacto"
        title="Estamos para ayudarte"
        subtitle="¿Dudas sobre tu cuenta, tu QR, tus stickers o tus pedidos? Escríbenos y te respondemos."
      />

      <section className="pb-16 sm:pb-20">
        <div className="container-page">
          <Reveal>
            <div role="note" className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 sm:mb-8">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <p className="leading-relaxed">
                <strong>¿Es una emergencia?</strong> Este canal es solo de soporte y no se atiende en tiempo real. Si
                alguien necesita ayuda ahora, llama a las líneas oficiales de emergencia.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
            {/* Formulario: primero en móvil, que es a lo que se viene */}
            <Reveal className="order-1 lg:order-2 lg:col-span-3" delay={0.05}>
              <Card className="p-5 sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
                    <Send className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Envíanos un mensaje</h2>
                    <p className="text-sm text-text-secondary">Todos los campos son obligatorios.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nombre completo</Label>
                      <Input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre y apellido" />
                    </div>
                    <div className="space-y-2">
                      <Label>Correo electrónico</Label>
                      <Input type="email" required autoComplete="email" inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tucorreo@ejemplo.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Asunto</Label>
                    <Input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Elige un tema o escribe el tuyo" />
                    {/* Temas como chips: un toque en vez de escribir en el celular */}
                    <div className="-mx-1 flex flex-wrap gap-2 pt-1" role="group" aria-label="Temas frecuentes">
                      {topics.map((t) => {
                        const on = form.subject === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setForm({ ...form, subject: t })}
                            className={`min-h-[40px] rounded-full border px-3.5 text-xs font-semibold transition-all duration-200 active:scale-95 focus-ring ${
                              on ? 'border-brand-500 bg-brand-500 text-white shadow-soft' : 'border-border bg-brand-50 text-neutral-900 hover:border-brand-500/50 hover:text-brand-500'
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Mensaje</Label>
                    <textarea
                      required
                      className="input resize-y"
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Cuéntanos con detalle en qué podemos ayudarte"
                    />
                  </div>

                  <Button type="submit" variant="primary" disabled={loading} className="min-h-[52px] w-full sm:w-auto">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                    {loading ? 'Enviando...' : 'Enviar mensaje'}
                  </Button>
                </form>
              </Card>
            </Reveal>

            {/* Otros canales */}
            <Reveal className="order-2 lg:order-1 lg:col-span-2">
              <Card className="h-full p-5 sm:p-7">
                <h2 className="mb-4 flex items-center gap-2.5 font-semibold text-neutral-900">
                  <LifeBuoy className="h-5 w-5 text-brand-500" aria-hidden="true" />
                  Otras formas de contactarnos
                </h2>
                <div className="space-y-3">
                  {channels.map((c) => (
                    <ChannelRow key={c.label} {...c} />
                  ))}
                </div>
                <div className="mt-6 rounded-xl bg-brand-100/70 p-4">
                  <p className="mb-2 text-sm text-text-secondary">¿Prefieres una respuesta inmediata?</p>
                  <Link to={routes.faq} className="inline-flex min-h-[40px] items-center gap-2 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-600">
                    Revisa las preguntas frecuentes <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;