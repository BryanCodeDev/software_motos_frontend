import { motion, useReducedMotion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../utils/routes';
import {
  ArrowRight,
  Check,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/ui';

const PhonePreview = () => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-sm"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-brand-900/20 blur-3xl" aria-hidden="true" />
      <div className={reduce ? '' : 'animate-float'}>
        <div className="relative rounded-[2rem] border border-border bg-neutral-50 p-5 shadow-glow">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-brand-500 animate-pulse-ring" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                Perfil de emergencia
              </span>
            </div>
            <ShieldCheck className="w-4 h-4 text-text-secondary" />
          </div>

          <div className="rounded-xl bg-brand-50/70 border border-border p-4 mb-3">
            <div className="text-[11px] uppercase tracking-wider text-text-secondary mb-1">Nombre</div>
            <div className="font-semibold text-neutral-900">Nombre del propietario</div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div className="rounded-xl bg-brand-50/70 border border-border p-4">
              <div className="text-[11px] uppercase tracking-wider text-text-secondary mb-1">Grupo sanguíneo</div>
              <div className="font-semibold text-neutral-900">Si lo autorizas</div>
            </div>
            <div className="rounded-xl bg-brand-50/70 border border-border p-4">
              <div className="text-[11px] uppercase tracking-wider text-text-secondary mb-1">Alergias</div>
              <div className="font-semibold text-neutral-900">Si lo autorizas</div>
            </div>
          </div>

          <div className="rounded-xl bg-brand-50/70 border border-border p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-secondary mb-1">Contacto de emergencia</div>
              <div className="font-semibold text-neutral-900">Persona de confianza</div>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white">
              <Phone className="w-4 h-4" />
            </span>
          </div>

          <p className="mt-4 text-[11px] text-text-secondary text-center">
            Ejemplo ilustrativo. Los datos reales los define el propietario.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export const HeroSection = () => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  return (
    <section
      className="relative isolate flex w-full items-center overflow-hidden min-h-[640px] lg:min-h-0 lg:aspect-video lg:max-h-[100svh] pt-24 pb-16 lg:pt-20 lg:pb-0"
      style={{
        backgroundImage: "url('/herosection.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Degradado superior: asegura legibilidad del navbar transparente */}
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-black/60 to-transparent" aria-hidden="true" />
      {/* Degradado lateral: legibilidad del texto sin tapar la moto/QR a la derecha */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/45 to-black/10" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-black/40 to-transparent" aria-hidden="true" />
      <div className="container-page relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20"
          >
            <span className="mb-5 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
              <span className="h-px w-8 bg-brand-400" aria-hidden="true" />
              Identificación de emergencia
            </span>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-[1.08] mb-6 text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]">
              <span className="text-brand-400">Si tú no puedes hablar,</span>
              <br />
              <span>tu información lo hará por ti.</span>
            </h1>
            <p className="text-white/90 text-base lg:text-lg xl:text-xl mb-8 max-w-xl leading-relaxed [text-shadow:0_1px_12px_rgba(0,0,0,0.5)]">
              Crea un perfil digital de emergencia, decide qué datos compartir y vincúlalo a un código
              QR que cualquier persona puede escanear, sin instalar aplicaciones.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => navigate(routes.register)}>
                Crear perfil gratuito <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="!bg-white/10 !text-white !border-white/50 backdrop-blur-sm hover:!bg-white hover:!text-neutral-900" onClick={() => navigate(routes.products)}>
                Conocer el sticker
              </Button>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-white/90 text-sm [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
              {['Sin costo por escaneo', 'Sin aplicaciones', 'Privacidad bajo tu control'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-400" /> {t}
                </li>
              ))}
            </ul>
          </motion.div>

          <PhonePreview />
        </div>
      </div>
    </section>
  );
};