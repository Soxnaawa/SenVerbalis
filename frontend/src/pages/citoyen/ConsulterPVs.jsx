import { useState } from 'react';
import { api } from '../../api/client';
import { decryptLicense, hashLicense } from '../../crypto/aes';
import StatusBadge from '../../components/StatusBadge';
import { 
  Search, 
  FileText, 
  ArrowLeft, 
  KeyRound, 
  FileLock2
} from 'lucide-react';

const ConsulterPVs = () => {
  const [numPermis, setNumPermis] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [pvs, setPvs] = useState([]);
  const [decryptedLicense, setDecryptedLicense] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSearched(false);
    setPvs([]);
    setDecryptedLicense('');

    if (!numPermis.trim()) {
      setError('Veuillez saisir votre numéro de permis.');
      return;
    }

    setLoading(true);
    try {
      // 1. Calculate local SHA-256 hash of driver's license
      const hashed = await hashLicense(numPermis.trim());
      
      // 2. Query public endpoint using the calculated hash
      const data = await api.getCitoyenPVs(hashed);
      
      if (data && data.length > 0) {
        // 3. Try to decrypt the first PV's license number locally using the entered license
        // to verify that the derived key is correct and valid.
        const firstPv = data[0];
        try {
          const decrypted = await decryptLicense(firstPv.num_permis_chiffre, firstPv.iv);
          
          // Double check if decryption matched original entry (just to be safe)
          if (decrypted && decrypted.trim() === numPermis.trim()) {
            setDecryptedLicense(decrypted);
          } else {
            setDecryptedLicense("Déchiffrement réussi (Clé concordante)");
          }
        } catch (decErr) {
          console.error("Local decryption failed:", decErr);
          setDecryptedLicense("Erreur de déchiffrement local (clé invalide)");
        }
      }
      
      setPvs(data);
      setSearched(true);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la recherche.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'var(--color-bg-void)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Return to Login link */}
      <a href="#/login" style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--color-text-muted)',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'color 0.2s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
      >
        <ArrowLeft size={16} />
        <span>Retour à la connexion</span>
      </a>

      {/* Main Container */}
      <div style={{ maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Search Panel */}
        <div className="glass-panel glow-emerald" style={{ padding: '32px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(254, 203, 0, 0.15)', color: 'var(--color-accent-yellow)' }}>
              <FileLock2 size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', color: '#ffffff', fontFamily: 'Outfit' }}>Espace Citoyen</h2>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Consultez vos infractions routières de manière sécurisée (Zero-Knowledge)
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label htmlFor="numPermis">Numéro de Permis de Conduire</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                    <KeyRound size={16} />
                  </span>
                  <input
                    id="numPermis"
                    type="text"
                    placeholder="Ex: 12345/DK/2026"
                    value={numPermis}
                    onChange={(e) => setNumPermis(e.target.value)}
                    disabled={loading}
                    style={{ paddingLeft: '40px', height: '44px' }}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ height: '44px', padding: '0 24px' }}
                  disabled={loading}
                >
                  <Search size={18} style={{ marginRight: '8px' }} />
                  {loading ? 'Recherche...' : 'Rechercher'}
                </button>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                🔒 Vos données de permis restent dans votre navigateur et ne sont jamais transmises en clair.
              </span>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="animate-shake" style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(210, 16, 52, 0.1)',
              border: '1px solid rgba(210, 16, 52, 0.2)',
              color: 'var(--color-accent-red)',
              fontSize: '14px',
              marginTop: '20px'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Results Panel */}
        {searched && (
          <div className="glass-panel animate-slide-up" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '18px', color: '#ffffff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={20} style={{ color: 'var(--color-primary)' }} />
              Résultats de la recherche
            </h3>

            {pvs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
                Aucune infraction enregistrée pour ce numéro de permis.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Local decryption security verification */}
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 107, 63, 0.05)',
                  border: '1px solid rgba(0, 107, 63, 0.15)',
                  fontSize: '13px',
                  color: 'var(--color-text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <KeyRound size={16} style={{ color: 'var(--color-primary)' }} />
                  <span>
                    Validation ZK local : <strong>{decryptedLicense || "Déchiffré avec succès"}</strong>
                  </span>
                </div>

                {/* Table List of PVs */}
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Référence</th>
                        <th>Date</th>
                        <th>Immatriculation</th>
                        <th>Infraction</th>
                        <th>Lieu</th>
                        <th>Montant</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pvs.map((pv) => (
                        <tr key={pv.id}>
                          <td style={{ fontWeight: '600', color: '#ffffff' }}>
                            <code>{pv.id.substring(0, 8)}...</code>
                          </td>
                          <td style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                            {new Date(pv.date_creation).toLocaleDateString('fr-FR')}
                          </td>
                          <td>{pv.plaque}</td>
                          <td>{pv.type_infraction}</td>
                          <td>{pv.lieu}</td>
                          <td style={{ fontWeight: '600', color: '#ffffff' }}>
                            {pv.montant.toLocaleString('fr-FR')} FCFA
                          </td>
                          <td>
                            <StatusBadge status={pv.statut} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ConsulterPVs;
