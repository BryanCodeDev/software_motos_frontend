import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../components/useToast';
import { PageTitle, PageLoader } from '../../components/DashPage';
import { Box, Button, Input, Label } from '../../components/ui';
import { CreditCard, Truck, ShieldCheck, Package, Loader2 } from 'lucide-react';

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const PackagesPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/packages');
        if (mounted) setPackages(data.packages || []);
      } catch {
        if (mounted) toast.error('No se pudieron cargar los paquetes');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [toast]);

  const formatMoney = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(v);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageTitle title="Paquetes disponibles" subtitle="Elige el plan que mejor se adapte a tu familia y mascotas" />
      <p className="text-sm text-text-secondary">
        Cada perfil incluido recibe su propio código QR permanente y 2 stickers físicos. El precio es fijado por el sistema y no puede ser modificado desde el navegador.
      </p>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.length === 0 && (
          <div className="col-span-full text-center py-10 text-text-secondary">No hay paquetes disponibles en este momento.</div>
        )}
        {packages.map((pkg) => {
          const stickersPerProfile = pkg.profile_count > 0 ? Math.floor((pkg.sticker_count || 0) / pkg.profile_count) : 0;
          const discount = pkg.original_price && pkg.original_price > pkg.price
            ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100)
            : 0;
          return (
            <article key={pkg.id} className={panel + ' p-6 flex flex-col h-full'}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-neutral-900">{pkg.name}</h3>
                  <p className="text-xs text-text-secondary">{pkg.description || ''}</p>
                </div>
                {discount > 0 && (
                  <span className="text-xs font-bold bg-rose-50 text-rose-700 rounded px-2 py-0.5">
                    -{discount}%
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-900">{formatMoney(pkg.price)}</span>
                  {pkg.original_price && pkg.original_price > pkg.price && (
                    <span className="text-sm text-text-muted line-through">{formatMoney(pkg.original_price)}</span>
                  )}
                  <span className="text-xs text-text-secondary">/{pkg.currency}</span>
                </div>
              </div>

              <div className="space-y-2 mb-6 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Package size={14} aria-hidden="true" />
                  <span>{pkg.profile_count} perfil{pkg.profile_count > 1 ? 'es' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={14} aria-hidden="true" />
                  <span>{(pkg.sticker_count || 0)} sticker{(pkg.sticker_count || 0) > 1 ? 's' : ''} físicos ({stickersPerProfile} por perfil)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} aria-hidden="true" />
                  <span>QR permanente por perfil</span>
                </div>
              </div>

              <Button
                asChild
                className="w-full btn-primary"
                onClick={() => navigate(`/panel/checkout?package=${pkg.id}&name=${encodeURIComponent(pkg.name)}&price=${pkg.price}`)}
              >
                <CreditCard size={16} aria-hidden="true" /> Elegir este paquete
              </Button>
            </article>
          );
        })}
      </section>

      <Box title="¿Cómo funciona?" className="p-4">
        <ol className="list-disc list-inside space-y-2 text-sm text-text-secondary">
          <li>Selecciona un paquete y serás redirigido al pago.</li>
          <li>Durante el pago puedes asignar perfiles existentes o crear nuevos.</li>
          <li>Al aprobarse el pago, cada perfil recibe su QR permanente y se inicia la producción de los stickers.</li>
          <li>Puedes consultar el estado de tus pedidos en <Link to="/panel/pedidos">Mis pedidos</Link>.</li>
        </ol>
      </Box>
    </div>
  );
};

export default PackagesPage;
