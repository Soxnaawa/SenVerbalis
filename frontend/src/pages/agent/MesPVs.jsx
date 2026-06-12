import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { decryptLicense } from '../../crypto/aes';
import StatusBadge from '../../components/StatusBadge';
import { FileText, Search, RefreshCw, KeyRound } from 'lucide-react';

const MesPVs = () => {
  const [pvs, setPvs] = useState([]);
  const [decryptedLicenses, setDecryptedLicenses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchPVs = async () => {
    setError('');
    try {
      const data = await api.getMesPVs();
      setPvs(data);
      
      // Decrypt all licenses asynchronously
      decryptAllLicenses(data);
    } catch (err) {
      setError(err.message || 'Erreur lors de la récupération des PVs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const decryptAllLicenses = async (pvList) => {
    const decMap = {};
    for (const pv of pvList) {
      if (pv.num_permis_chiffre && pv.iv) {
        const clearLicense = await decryptLicense(pv.num_permis_chiffre, pv.iv);
        decMap[pv.id] = clearLicense;
      }
    }
    setDecryptedLicenses(decMap);
  };

  useEffect(() => {
    fetchPVs();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPVs();
  };

  // Filter PVs by ID (reference) or Decrypted license number
  const filteredPVs = pvs.filter(pv => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    const pvIdMatch = pv.id.toLowerCase().includes(query);
    const plaqueMatch = pv.plaque.toLowerCase().includes(query);
    
    // Check decrypted license in memory search
    const decLicense = decryptedLicenses[pv.id] || '';
    const licenseMatch = decLicense.toLowerCase().includes(query);

    return pvIdMatch || plaqueMatch || licenseMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* Search bar */}
        <div style={{ position: 'relative', width: '320px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Rechercher par Réf, Plaque, Permis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px' }}
          />
        </div>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          className="btn btn-secondary"
          style={{ height: '40px' }}
          disabled={loading || refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-pulse-sec' : ''} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Main PV table list */}
      <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '16px' }}>
            <div className="animate-pulse-sec" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
            <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Chargement et déchiffrement des procès-verbaux...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-accent-red)' }}>
            {error}
          </div>
        ) : filteredPVs.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <FileText size={40} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: '15px' }}>Aucun procès-verbal trouvé.</span>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Date</th>
                  <th>Plaque</th>
                  <th>Permis (Déchiffré 🔒)</th>
                  <th>Infraction</th>
                  <th>Lieu</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredPVs.map((pv) => (
                  <tr key={pv.id}>
                    <td style={{ fontWeight: '600', color: '#ffffff', fontSize: '13px' }}>
                      <code>{pv.id}</code>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {new Date(pv.date_creation).toLocaleString('fr-FR')}
                    </td>
                    <td style={{ fontWeight: '500' }}>{pv.plaque}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <KeyRound size={12} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                          {decryptedLicenses[pv.id] || "Déchiffrement..."}
                        </span>
                      </div>
                    </td>
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
        )}

      </div>
    </div>
  );
};

export default MesPVs;
