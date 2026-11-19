import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import api from '../../api/client';
import { useToast } from '../../components/useToast';
import { Button, Input, Label, Select, Checkbox } from '../../components/ui';
import { PageTitle, PageLoader } from '../../components/DashPage';
import { User, Dog, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const TYPE_OPTIONS = [
  { value: 'person', label: 'Persona', icon: User, desc: 'Para ti, un familiar o cualquier persona adulta.' },
  { value: 'pet', label: 'Mascota', icon: Dog, desc: 'Para tu perro, gato u otro animal.' },
  { value: 'managed_person', label: 'Persona gestionada', icon: User, desc: 'Hijo, adulto mayor o familiar que necesitas asistir.' },
];

const CreateProfilePage = () => {
  const { user } = useAuth();
  const [type, setType] = useState('person');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    display_name: '',
    relationship: '',
    is_managed_by_third_party: false,
    consent_accepted: false,
    // persona
    blood_type: '', date_of_birth: '', height_cm: '', weight_kg: '', is_pregnant: false,
    medical_devices: '', primary_doctor_name: '', primary_doctor_phone: '',
    insurance_company: '', insurance_policy_number: '', document_number: '', is_organ_donor: false,
    allergies: '', medical_conditions: '', medications: '', additional_info: '', emergency_note: '',
    // mascota
    pet_species: '', pet_breed: '', pet_age: '', pet_sex: 'no_especificado', pet_weight: '',
    pet_color: '', pet_characteristics: '', pet_microchip: '', pet_sterilized: false,
    pet_vaccines: '', pet_allergies: '', pet_medications: '', pet_conditions: '',
    pet_vet_name: '', pet_vet_phone: '', pet_owner_name: '', pet_owner_phone: '',
    pet_alternate_contacts: '', pet_care_instructions: '', pet_lost: false, pet_reward: '',
  });
  const toast = useToast();
  const navigate = useNavigate();

  const typeConfig = TYPE_OPTIONS.find((t) => t.value === type) || TYPE_OPTIONS[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, profile_type: type };
      await api.post('/profiles/me/profiles', payload);
      toast.success(`Perfil de ${typeConfig.label} creado`);
      navigate('/panel/perfiles');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'No se pudo crear el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Agregar perfil" subtitle="¿Para quién es este QR?" />
      <Link to="/panel/perfiles" className="btn-ghost inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Volver a mis perfiles
      </Link>

      <section className={panel + " p-6"}>
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Selecciona el tipo de perfil</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {TYPE_OPTIONS.map((t) => {
            const active = type === t.value;
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${
                  active
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-border bg-white hover:border-brand-300'
                } transition-colors`}
              >
                <Icon size={24} aria-hidden="true" />
                <span className="font-medium">{t.label}</span>
                <span className="text-xs text-text-secondary text-center">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </section>

      {type === 'managed_person' && !form.is_managed_by_third_party && false}

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className={panel + " p-5"}>
          <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <User size={16} aria-hidden="true" /> Datos básicos
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="col-span-2">
              <Label>Nombre para mostrar</Label>
              <Input
                required
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Ej.: María Gómez / Firulais"
              />
            </div>
            <div>
              <Label>Relación con la cuenta</Label>
              <Input
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                placeholder="Ej.: esposa, hijo, perro"
              />
            </div>
          </div>
        </section>

        {type === 'person' || type === 'managed_person' ? (
          <section className={panel + " p-5"}>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Información personal</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Tipo de sangre</Label>
                <Select
                  value={form.blood_type}
                  onChange={(e) => setForm({ ...form, blood_type: e.target.value })}
                  placeholder="Selecciona"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </Select>
              </div>
              <div>
                <Label>Fecha de nacimiento</Label>
                <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
              </div>
              <div>
                <Label>Documento</Label>
                <Input value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} placeholder="Cédula" />
              </div>
              <div className="col-span-2">
                <Label>Alergias</Label>
                <Input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="Ej.: penicilina" />
              </div>
              <div className="col-span-2">
                <Label>Condiciones médicas</Label>
                <Input value={form.medical_conditions} onChange={(e) => setForm({ ...form, medical_conditions: e.target.value })} placeholder="Ej.: diabetes" />
              </div>
              <div className="col-span-2">
                <Label>Medicamentos</Label>
                <Input value={form.medications} onChange={(e) => setForm({ ...form, medications: e.target.value })} placeholder="Ej.: insulina" />
              </div>
              <div className="col-span-2">
                <Label>Teléfono médico tratante</Label>
                <Input value={form.primary_doctor_phone} onChange={(e) => setForm({ ...form, primary_doctor_phone: e.target.value })} placeholder="+57 300 000 0000" />
              </div>
            </div>
          </section>
        ) : null}

        {type === 'pet' ? (
          <section className={panel + " p-5"}>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Información de la mascota</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Especie</Label>
                <Input value={form.pet_species} onChange={(e) => setForm({ ...form, pet_species: e.target.value })} placeholder="Perro, gato..." />
              </div>
              <div>
                <Label>Raza</Label>
                <Input value={form.pet_breed} onChange={(e) => setForm({ ...form, pet_breed: e.target.value })} placeholder="Labrador, siamés..." />
              </div>
              <div>
                <Label>Edad</Label>
                <Input value={form.pet_age} onChange={(e) => setForm({ ...form, pet_age: e.target.value })} placeholder="3 años" />
              </div>
              <div>
                <Label>Sexo</Label>
                <Select value={form.pet_sex} onChange={(e) => setForm({ ...form, pet_sex: e.target.value })}>
                  <option value="macho">Macho</option>
                  <option value="hembra">Hembra</option>
                  <option value="no_especificado">No especificado</option>
                </Select>
              </div>
              <div>
                <Label>Peso (kg)</Label>
                <Input type="number" value={form.pet_weight} onChange={(e) => setForm({ ...form, pet_weight: e.target.value })} placeholder="12" />
              </div>
              <div>
                <Label>Color</Label>
                <Input value={form.pet_color} onChange={(e) => setForm({ ...form, pet_color: e.target.value })} placeholder="Café, negro..." />
              </div>
              <div>
                <Label>Microchip</Label>
                <Input value={form.pet_microchip} onChange={(e) => setForm({ ...form, pet_microchip: e.target.value })} placeholder="Número de microchip" />
              </div>
              <div className="col-span-2">
                <Label>Veterinario</Label>
                <Input value={form.pet_vet_name} onChange={(e) => setForm({ ...form, pet_vet_name: e.target.value })} placeholder="Nombre del veterinario" />
              </div>
              <div>
                <Label>Teléfono veterinario</Label>
                <Input value={form.pet_vet_phone} onChange={(e) => setForm({ ...form, pet_vet_phone: e.target.value })} placeholder="+57 300 000 0000" />
              </div>
              <div className="col-span-2">
                <Label>Nombre del propietario</Label>
                <Input value={form.pet_owner_name} onChange={(e) => setForm({ ...form, pet_owner_name: e.target.value })} placeholder="Tu nombre" />
              </div>
              <div>
                <Label>Teléfono del propietario</Label>
                <Input value={form.pet_owner_phone} onChange={(e) => setForm({ ...form, pet_owner_phone: e.target.value })} placeholder="+57 300 000 0000" />
              </div>
              <div className="col-span-2">
                <Label>Instrucciones de cuidado</Label>
                <Input value={form.pet_care_instructions} onChange={(e) => setForm({ ...form, pet_care_instructions: e.target.value })} placeholder="Alimentación, paseos, medicación" />
              </div>
            </div>
          </section>
        ) : null}

        {type === 'managed_person' && (
          <section className={panel + " p-5 bg-amber-50 border-amber-100"}>
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5" aria-hidden="true" />
              <span className="text-sm text-amber-800 font-medium">Autorización para gestionar datos de un tercero</span>
            </div>
            <p className="text-sm text-amber-700 mb-3">
              Al crear este perfil declaras que tienes autorización para administrar los datos de esta persona. El consentimiento queda registrado con fecha y responsable.
            </p>
            <Checkbox
              checked={form.consent_accepted}
              onCheckedChange={(checked) => setForm({ ...form, consent_accepted: checked })}
            >
              Declaro tener autorización para gestionar los datos de esta persona.
            </Checkbox>
          </section>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" asChild>
            <Link to="/panel/perfiles">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : 'Crear perfil'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateProfilePage;
