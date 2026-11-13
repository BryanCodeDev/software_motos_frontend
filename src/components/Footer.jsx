import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { routes } from '../utils/routes';

const columns = [
  {
    title: 'Servicio',
    links: [
      { label: 'Productos', to: routes.products },
      { label: 'Cómo funciona', to: routes.howItWorks },
      { label: 'Privacidad y seguridad', to: routes.privacy },
      { label: 'Preguntas frecuentes', to: routes.faq },
      { label: 'Contacto', to: routes.contact },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Términos y condiciones', to: routes.terms },
      { label: 'Política de privacidad', to: routes.privacyPolicy },
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

const linkClass =
  'text-white/70 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:underline';

export const Footer = () => (
  <footer className="bg-brand-900 pb-8 pt-12 text-white lg:pt-16">
    <div className="container-page">
      <div className="mb-10 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Link to={routes.home} className="inline-flex items-center gap-2.5 font-bold tracking-tight">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-500">
              <ShieldCheck size={20} strokeWidth={2.4} aria-hidden="true" />
            </span>
            <span className="text-lg">Tu QR te Cuida</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            Si no puedes hablar, tu información importante habla por ti.
          </p>
        </div>

        <nav className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 lg:col-span-7" aria-label="Pie de página">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 font-semibold text-white">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className={linkClass}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()}{' '}
          <a
            href="https://mastercodecompany.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:underline"
          >
            MasterCode Company
          </a>
        </p>
        <p>Herramienta de apoyo: no sustituye a los servicios oficiales de emergencia.</p>
      </div>
    </div>
  </footer>
);

export default Footer;