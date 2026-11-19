import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Users, ShieldCheck, QrCode, Package, ArrowRight, Check, ChevronRight, AlertTriangle, Lock,
  RefreshCw,
} from 'lucide-react';
import { routes } from '../../utils/routes';
import { useAuth } from '../../contexts/useAuth';
import { PageTitle } from '../../components/DashPage';
import { useToast } from '../../components/useToast';
import api from '../../api/client';

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

/* Datos que más ayudan a quien auxilia, además del nombre */
const RECOMMENDED = [
  ['blood_type', 'tipo de sangre'],
  ['emergency_note', 'nota de emergencia'],
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const Skeleton = () => (
  <div className="animate-pulse space-y-6" aria-busy="true" aria-live="polite">
    <div className="h-8 w-64 rounded-lg bg-border/60" />
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="h-80 rounded-2xl bg-border/60 lg:col-span-2" />
      <div className="h-56 rounded-2xl bg-border/60" />
    </div>
  </div>
);

export const DashboardIndex = () => {
  const { user } = useAuth();
  const toast = useToast();
  const fullName = user?.name || user?.email?.split('@')[0];
  const firstName = fullName ? fullName.trim().split(' ')[0] : null;

  const [data, setData] = useState({ profile: null, contacts: [], visibleCount: 0, identifier: null });
  const [qrImage, setQrImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [stickerPrice, setStickerPrice] = useState(null);
  const blobRef = useRef(null);

  // Precio de activación del QR desde el catálogo del backend (única fuente de verdad).
  useEffect(() => {
    let mounted = true;
    const loadStickerPrice = async () => {
      try {
        const { data } = await api.get('/products');
        const list = data.products || data || [];
        const sticker = list.find((p) => p.slug === 'sticker-qr-personalizado');
        if (mounted && sticker) setStickerPrice(new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(sticker.price));
      } catch {
        // Sin precio de catálogo.
      }
    };
    loadStickerPrice();
    return () => { mounted = false; };
  }, []);

  useEffect(() => () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        api.get('/profiles/me'),
        api.get('/contacts'),
        api.get('/identifiers/my'),
        api.get('/privacy/me'),
      ]);
      const [profRes, contactsRes, idRes, privRes] = results;

      // Si todo falló es un problema real de red o servidor (un 404 del QR es normal).
      if (results.every((r) => r.status === 'rejected')) {
        setError('No se pudo cargar tu panel');
        return;
      }

      const next = { profile: null, contacts: [], visibleCount: 0, identifier: null };
      if (profRes.status === 'fulfilled') next.profile = profRes.value.data.profile || profRes.value.data || null;
      if (contactsRes.status === 'fulfilled') next.contacts = contactsRes.value.data.contacts || contactsRes.value.data || [];
      if (idRes.status === 'fulfilled') {
        const id = idRes.value.data.identifier || idRes.value.data;
        next.identifier = id?.status === 'active' ? id : null;
      }
      if (privRes.status === 'fulfilled') {
        const list = privRes.value.data.settings || privRes.value.data || [];
        next.visibleCount = Array.isArray(list) ? list.filter((s) => s.is_public === true).length : 0;
      }
      setData(next);

      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
      setQrImage('');
      if (next.identifier) {
        try {
          const qr = await api.get('/identifiers/my/qr', { responseType: 'blob' });
          blobRef.current = URL.createObjectURL(qr.data);
          setQrImage(blobRef.current);
        } catch {
          /* la tarjeta funciona sin imagen */
        }
      }
    } catch {
      setError('No se pudo cargar tu panel');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const { profile, contacts, visibleCount, identifier } = data;
  const publicContacts = contacts.filter((c) => c.is_public).length;
  const missing = profile ? RECOMMENDED.filter(([k]) => !String(profile[k] ?? '').trim()).map(([, label]) => label) : [];
  const profileDone = !!profile?.display_name?.trim();
  const qrActive = !!identifier;

  /* Cada paso se completa con una señal real, no con la de otro paso */
  const steps = [
    {
      key: 'profile',
      label: 'Perfil',
      to: routes.dashboardMiPerfil,
      icon: User,
      done: profileDone,
      desc: !profileDone
        ? 'Tu nombre y datos médicos'
        : missing.length > 0 ? `Te falta: ${missing.join(' y ')}` : 'Datos esenciales completos',
    },
    {
      key: 'contacts',
      label: 'Contactos',
      to: routes.dashboardContacts,
      icon: Users,
      done: publicContacts > 0,
      desc: contacts.length === 0
        ? 'Al menos una persona de confianza'
        : publicContacts === 0
          ? 'Tienes contactos, pero ninguno es visible'
          : `${plural(publicContacts, 'visible', 'visibles')} al escanear`,
    },
    {
      key: 'privacy',
      label: 'Privacidad',
      to: routes.dashboardPrivacy,
      icon: ShieldCheck,
      done: visibleCount > 0,
      desc: visibleCount === 0 ? 'Elige qué ve quien escanea tu QR' : `${plural(visibleCount, 'dato visible', 'datos visibles')}`,
    },
    {
      key: 'qr',
      label: 'Mi QR',
      to: routes.dashboardQr,
      icon: QrCode,
      done: qrActive,
      desc: qrActive ? 'Activo y listo para usarse' : 'Actívalo y descárgalo',
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const next = steps.find((s) => !s.done) || null;

  const qrUrl = identifier ? `${window.location.origin}/e/${encodeURIComponent(identifier.value)}` : '';
  const shareHref = `https://wa.me/?text=${encodeURIComponent(`Mi perfil de emergencia: ${qrUrl}`)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const downloadQr = () => {
    if (!qrImage) return;
    const a = document.createElement('a');
    a.href = qrImage;
    a.download = `qr-emergencia-${identifier.value}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (loading && !profile && contacts.length === 0 && !identifier) return <Skeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center" role="alert">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <AlertTriangle size={22} aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-neutral-900">{error}</h2>
        <p className="mt-1 text-sm text-text-secondary">Revisa tu conexión e inténtalo de nuevo.</p>
        <button type="button" onClick={load} className="btn-primary mt-6 px-5 py-2.5 text-sm">
          <RefreshCw size={16} aria-hidden="true" /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5 lg:space-y-6">
      <PageTitle
        title={firstName ? `${greeting()}, ${firstName}` : 'Mi panel'}
        description={next ? `Te falta: ${next.label.toLowerCase()}.` : 'Tu QR está listo para usarse.'}
      />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* Pasos: es la única lista de navegación del panel */}
        <section className={`${panel} p-5 sm:p-6 lg:col-span-2`} aria-labelledby="steps-title">
          <div className="mb-5">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 id="steps-title" className="text-base font-semibold text-neutral-900">Tu progreso</h2>
              <p className="text-sm text-text-secondary">{doneCount} de {steps.length} pasos</p>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-border/70"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso de activación"
            >
              <div className="h-full rounded-full bg-brand-500 transition-[width] duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <ol className="space-y-2">
            {steps.map((step) => {
              const isNext = next?.key === step.key;
              const Icon = step.icon;
              return (
                <li key={step.key}>
                  <Link
                    to={step.to}
                    className={`group flex items-center gap-3 rounded-xl border p-3.5 transition-colors focus-ring ${
                      isNext
                        ? 'border-brand-500/40 bg-brand-50 hover:border-brand-500/60'
                        : 'border-border bg-white hover:border-brand-500/30 hover:bg-brand-50/50'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${
                        step.done ? 'bg-emerald-100 text-emerald-700' : isNext ? 'bg-brand-500 text-white' : 'bg-brand-50 text-text-secondary'
                      }`}
                    >
                      {step.done ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : <Icon size={17} aria-hidden="true" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-neutral-900">
                        {step.label}
                        {step.done && <span className="sr-only"> (completado)</span>}
                      </span>
                      <span className={`block truncate text-xs ${step.done && step.key === 'profile' && missing.length > 0 ? 'text-amber-700' : 'text-text-secondary'}`}>
                        {step.desc}
                      </span>
                    </span>
                    {isNext && <span className="hidden text-sm font-semibold text-brand-500 sm:inline">Continuar</span>}
                    <ChevronRight size={16} className="flex-none text-text-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Estado del QR y acceso a pedidos */}
        <aside className="space-y-3" aria-label="Estado del QR">
          {!qrActive && (
            <div className={`${panel} p-5 sm:p-6`}>
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                <Lock size={22} aria-hidden="true" />
              </span>
              <h2 className="text-base font-semibold text-neutral-900">Tu QR aún no está activo</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                Se activa con un pago único de <span className="font-bold text-neutral-900">{stickerPrice || 'Consulta el catálogo'}</span>, sin suscripción.
              </p>
              <Link to={routes.dashboardQr} className="btn-primary mt-5 w-full px-5 py-2.5 text-sm">
                Activar mi QR <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}

          <Link
            to={routes.dashboardOrders}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-500/30 hover:bg-brand-50/50 focus-ring"
          >
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
              <Package size={17} aria-hidden="true" />
            </span>
            <span className="flex-1 text-sm font-semibold text-neutral-900">Mis pedidos y stickers</span>
            <ChevronRight size={16} className="text-text-secondary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  );
};

export default DashboardIndex;