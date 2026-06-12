import { useState } from 'react';
import { api } from '../../api/client';
import { encryptLicense, hashLicense } from '../../crypto/aes';
import { PlusCircle, ShieldAlert, CheckCircle, FileText, MapPin, CreditCard } from 'lucide-react';

const INFRACTION_TYPES = [
  { label: "Excès de vitesse", defaultAmount: 10000 },
  { label: "Non-port de la ceinture de sécurité", defaultAmount: 3000 },
  { label: "Usage du téléphone au volant", defaultAmount: 5000 },
  { label: "Défaut de contrôle technique", defaultAmount: 15000 },
  { label: "Brûlage de feu rouge", defaultAmount: 6000 },
  { label: "Surcharge de bagages / passagers", defaultAmount: 10000 },
];

const CreerPV = () => {
  const [numPermis, setNumPermis] = useState('');
  const [plaque, setPlaque] = useState('');
  const [typeInfraction, setTypeInfraction] = useState(INFRACTION_TYPES[0].label);
  const [lieu, setLieu] = useState('');
  const [montant, setMontant] = useState(INFRACTION_TYPES[0].defaultAmount);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdPV, setCreatedPV] = useState(null);
  const [error, setError] = useState('');

  const handleInfractionChange = (e) => {
    const val = e.target.value;
    setTypeInfraction(val);
    const found = INFRACTION_TYPES.find(i => i.label === val);
    if (found) {
      setMontant(found.defaultAmount);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation basique
    if (!numPermis.trim() || !plaque.trim() || !lieu.trim() || montant <= 0) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);
    try {
      // 1. Chiffrement local Zero-Knowledge & Hashing du permis
      // Le serveur ne reçoit jamais "numPermis" en clair !
      const encrypted = await encryptLicense(numPermis.trim());
      const hashed = await hashLicense(numPermis.trim());

      const pvPayload = {
        num_permis_chiffre: encrypted.ciphertext_b64,
        iv: encrypted.iv_b64,
        num_permis_hash: hashed,
        plaque: plaque.trim().toUpperCase(),
        type_infraction: typeInfraction,
        lieu: lieu.trim(),
        montant: parseFloat(montant)
      };

      // 2. Envoi des données chiffrées à l'API
      const response = await api.creerPV(pvPayload);
      
      setCreatedPV(response);
      setSuccess(true);
      // Réinitialiser le formulaire
      setNumPermis('');
      setPlaque('');
      setLieu('');
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du PV.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', width: '100%', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '32px', position: 'relative' }}>
        
        {/* Header formulaire */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 107, 63, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}>
            <PlusCircle size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', color: '#ffffff' }}>Enregistrer une Infraction</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Les informations de permis sont chiffrées de bout en bout.
            </p>
          </div>
        </div>

        {/* Alerte succès */}
        {success && createdPV && (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 107, 63, 0.1)',
            border: '1px solid rgba(0, 107, 63, 0.2)',
            color: '#10b981',
            marginBottom: '24px',
            display: 'flex',
            gap: '12px'
          }}>
            <CheckCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontWeight: '600', fontSize: '14px' }}>Procès-Verbal créé avec succès !</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Référence PV : <code style={{ color: '#ffffff' }}>{createdPV.id}</code>
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Index de recherche (Hash SHA-256) : <code style={{ fontSize: '10px' }}>{createdPV.num_permis_hash.substring(0, 16)}...</code>
              </p>
            </div>
          </div>
        )}

        {/* Alerte erreur */}
        {error && (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(210, 16, 52, 0.1)',
            border: '1px solid rgba(210, 16, 52, 0.2)',
            color: 'var(--color-accent-red)',
            marginBottom: '24px',
            display: 'flex',
            gap: '12px'
          }}>
            <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '14px' }}>{error}</div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label htmlFor="numPermis">Numéro de Permis du Conducteur *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                <FileText size={16} />
              </span>
              <input
                id="numPermis"
                type="text"
                placeholder="Ex: 12345/DK/2026"
                value={numPermis}
                onChange={(e) => setNumPermis(e.target.value)}
                disabled={loading}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }} className="animate-pulse-sec">
              🔒 Chiffrement local Zero-Knowledge (AES-GCM) actif
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label htmlFor="plaque">Plaque d'Immatriculation *</label>
              <input
                id="plaque"
                type="text"
                placeholder="Ex: DK-1234-A"
                value={plaque}
                onChange={(e) => setPlaque(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label htmlFor="lieu">Lieu de l'Infraction *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                  <MapPin size={16} />
                </span>
                <input
                  id="lieu"
                  type="text"
                  placeholder="Ex: VDN Dakar"
                  value={lieu}
                  onChange={(e) => setLieu(e.target.value)}
                  disabled={loading}
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="infraction">Type d'Infraction</label>
            <select
              id="infraction"
              value={typeInfraction}
              onChange={handleInfractionChange}
              disabled={loading}
            >
              {INFRACTION_TYPES.map((type, idx) => (
                <option key={idx} value={type.label}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="montant">Montant de l'Amende (FCFA) *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                <CreditCard size={16} />
              </span>
              <input
                id="montant"
                type="number"
                value={montant}
                onChange={(e) => setMontant(parseFloat(e.target.value))}
                disabled={loading}
                style={{ paddingLeft: '40px' }}
                min="500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
            disabled={loading}
            style={{ width: '100%', height: '44px', marginTop: '12px' }}
          >
            {loading ? (
              <span className="animate-pulse-sec">Chiffrement & Signature en cours...</span>
            ) : (
              <span>Enregistrer et Signer le PV</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default CreerPV;
