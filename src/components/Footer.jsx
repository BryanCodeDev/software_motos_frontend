import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { routes } from '../utils/routes';

const columns = [
  {
    title: 'Producto',
    links: [
      { label: 'QR digital de emergencia', to: routes.products },
      { label: 'Sticker QR personalizado', to: routes.products },
    ],
  },
  {
    title: 'Plataforma',
    links: [
      { label: 'Cómo funciona', to: routes.howItWorks },
      { label: 'Privacidad y seguridad', to: routes.privacy },
      { label: 'Preguntas frecuentes', to: routes.faq },
      { label: 'Contacto', to: routes.contact },
    ],
  },
  {
    title: 'Cuenta',
    links: [
      { label: 'Iniciar sesión', to: routes.login },
      { label: 'Crear cuenta', to: routes.register },
    ],
  },
];

export const Footer = () => (
  <footer className="relative border-t border-brand-border bg-white pb-8 pt-12 lg:pt-16">
    <div
      className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/50 to-transparent"
      aria-hidden="true"
    />
    <div className="container-page">
      <div className="mb-10 grid gap-10 lg:mb-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Link to={routes.home} className="mb-4 inline-flex items-center gap-2.5 font-bold tracking-tight text-brand-text">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent text-white shadow-soft">
              <ShieldCheck size={18} strokeWidth={2.4} aria-hidden="true" />
            </span>
            Tu QR te Cuida
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-brand-textMuted">
            Perfil digital de emergencia con código QR. Si tú no puedes hablar, tu información importante
            puede hacerlo por ti.
          </p>
          <Link
            to={routes.register}
            className="group mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent"
          >
            Crear mi perfil gratis
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        <nav className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 lg:col-span-7" aria-label="Pie de página">
          {columns.map((col, i) => (
            <div key={col.title} className={i === 0 ? 'col-span-2 sm:col-span-1' : ''}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-brand-text">{col.title}</h3>
              <ul className="space-y-2.5 text-brand-textMuted">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="transition-colors hover:text-brand-accent">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-3 border-t border-brand-border pt-6 text-xs text-brand-textMuted md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()}{' '}
          <a
            href="https://mastercodecompany.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium transition-colors hover:text-brand-accent"
          >
            MasterCode Company
          </a>
          . Todos los derechos reservados.
        </p>
        <p className="leading-relaxed md:max-w-md md:text-right">
          Versión preliminar. Esta plataforma es una herramienta de apoyo y no sustituye a los servicios
          oficiales de emergencia.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;