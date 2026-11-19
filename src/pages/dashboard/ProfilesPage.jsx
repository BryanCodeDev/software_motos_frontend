import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import api from '../../api/client';
import { useToast } from '../../components/useToast';
import { Button, Input, Label } from '../../components/ui';
import { PageTitle, PageLoader } from '../../components/DashPage';
import { User, Plus, Edit2, AlertCircle, CheckCircle, Loader2, QrCode } from 'lucide-react';

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const TYPE_LABEL = {
  person: 'Persona',
  pet: 'Mascota',
  managed_person: 'Persona gestionada',
};
const TYPE_ICON = {
  person: User,
  pet: QrCode,
  managed_person: User,
};

const ProfilesPage = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/profiles/me/profiles');
        if (mounted) setProfiles(data.profiles || []);
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.error || 'No se pudieron cargar los perfiles');
          toast.error(err?.response?.data?.error || 'No se pudieron cargar los perfiles');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [toast]);

  const handleDeactivate = async (id) => {
    if (!window.confirm('¿Desactivar este perfil? No se podrá usar su QR hasta que se reactive.')) return;
    try {
      await api.patch(`/profiles/me/profiles/${id}/deactivate`);
      toast.success('Perfil desactivado');
      // Recargar
      setLoading(true);
      try {
        const { data } = await api.get('/profiles/me/profiles');
        setProfiles(data.profiles || []);
      } finally {
        setLoading(false);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'No se pudo desactivar el perfil');
    }
  };

  const handleReactivate = async (id) => {
    try {
      await api.patch(`/profiles/me/profiles/${id}/reactivate`);
      toast.success('Perfil reactivado');
      setLoading(true);
      try {
        const { data } = await api.get('/profiles/me/profiles');
        setProfiles(data.profiles || []);
      } finally {
        setLoading(false);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'No se pudo reactivar el perfil');
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <div className="text-center py-10 text-text-secondary">{error}</div>;

  return (
    <div className="space-y-6">
      <PageTitle title="Mis perfiles" subtitle="Administra a las personas y mascotas protegidas por tu cuenta" />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Tus perfiles ({profiles.length})</h2>
        <Link to="/panel/perfiles/nuevo" className="btn-primary">
          <Plus size={18} aria-hidden="true" /> Agregar perfil
        </Link>
      </div>

      {profiles.length === 0 && (
        <section className={panel + " p-8 text-center"}>
          <div className="flex flex-col items-center gap-3">
            <Plus size={32} className="text-text-muted" aria-hidden="true" />
            <h3 className="font-medium text-neutral-900">Aún no tienes perfiles</h3>
            <p className="text-sm text-text-secondary">
              Crea un perfil para ti, un familiar o tu mascota. Cada perfil tendrá su propio código QR permanente.
            </p>
          </div>
          <Link to="/panel/perfiles/nuevo" className="btn-primary mt-4">
            Crear primer perfil
          </Link>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => {
          const Icon = TYPE_ICON[profile.profile_type] || User;
          const isActive = profile.is_active;
          const qrCount = profile.qr_count || 0;
          return (
            <article key={profile.id} className={panel + ' p-5 flex flex-col'}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon size={20} className={isActive ? 'text-brand-600' : 'text-text-muted'} aria-hidden="true" />
                  <span className="font-semibold text-neutral-900 truncate max-w-[70%]">{profile.display_name || 'Sin nombre'}</span>
                </div>
                <span className={`text-xs font-semibold rounded-full px-2 py-1 ${
                  isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-text-secondary mb-4 flex-1">
                <p className="flex items-center gap-1">
                  <span className="text-neutral-500">{TYPE_LABEL[profile.profile_type]}</span>
                  {profile.relationship && <span className="text-neutral-400">· {profile.relationship}</span>}
                </p>
                <p className="flex items-center gap-1">
                  <QrCode size={12} aria-hidden="true" />
                  QR: {qrCount > 0 ? `${qrCount} activo${qrCount > 1 ? 's' : ''}` : 'Sin QR'}
                </p>
                <p className="flex items-center gap-1">
                  <User size={12} aria-hidden="true" />
                  Pedidos: {profile.order_count || 0}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-border/50">
                <Button asChild size="sm" outline>
                  <Link to={`/panel/perfiles/${profile.id}`}>Ver</Link>
                </Button>
                {isActive ? (
                  <Button asChild size="sm" variant="danger" onClick={() => handleDeactivate(profile.id)}>
                    Desactivar
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline" onClick={() => handleReactivate(profile.id)}>
                    Reactivar
                  </Button>
                )}
                <Edit2 size={16} className="text-text-muted hover:text-brand-600 cursor-pointer" aria-hidden="true" />
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};

export default ProfilesPage;
