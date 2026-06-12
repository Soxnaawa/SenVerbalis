import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { decryptLicense } from '../../crypto/aes';
import StatusBadge from '../../components/StatusBadge';
import { 
  FileText, 
  Search, 
  RefreshCw, 
  KeyRound, 
  ShieldAlert, 
  ShieldCheck, 
  AlertOctagon, 
  BadgeCheck, 
  Clock 
} from 'lucide-react';

const TousLesPVs = () => {
  const [pvs, setPvs] = useState([]);
  const [decryptedLicenses, setDecryptedLicenses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('tous');
  
  // Integrity verification state mapping pvId -> { loading, checked, integre, message }
  const [integrityStates, setIntegrityStates] = useState({});
  // Update status loading state mapping pvId -> boolean
  const [statusUpdating, setStatusUpdating] = useState({});
  const [notification, setNotification] = useState(null);

  const showNotification = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const decryptAllLicenses = useCallback(async (pvList) => {
    const decMap = {};
    for (const pv of pvList) {
      if (pv.num_permis_chiffre && pv.iv) {
        const clearLicense = await decryptLicense(pv.num_permis_chiffre, pv.iv);
        decMap[pv.id] = clearLicense;
      }
    }
    setDecryptedLicenses(prev => ({ ...prev, ...decMap }));
  }, []);

  const fetchPVs = useCallback(async () => {
    setError('');
    try {
      const data = await api.getTousLesPVs();
      setPvs(data);
      
      // Decrypt licenses asynchronously
      decryptAllLicenses(data);
    } catch (err) {
      setError(err.message || 'Erreur lors de la récupération de la liste des PVs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [decryptAllLicenses]);

  useEffect(() => {
    fetchPVs();
  }, [fetchPVs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPVs();
  };

  const handleVerifyIntegrity = async (pvId) => {
    setIntegrityStates(prev => ({
      ...prev,
      [pvId]: { loading: true, checked: false, integre: false, message: '' }
    }));

    try {
      const result = await api.verifierIntegrite(pvId);
      setIntegrityStates(prev => ({
        ...prev,
        [pvId]: {
          loading: false,
          checked: true,
          integre: result.integre,
          message: result.message
        }
      }));
      if (result.integre) {
        showNotification(`L'intégrité du PV ${pvId} a été validée avec succès.`, 'success');
      } else {
        showNotification(`Alerte d'intégrité : Le PV ${pvId} est potentiellement corrompu !`, 'danger');
      }
    } catch (err) {
      setIntegrityStates(prev => ({
        ...prev,
        [pvId]: {
          loading: false,
          checked: true,
          integre: false,
          message: err.message || 'Erreur lors de la vérification.'
        }
      }));
      showNotification(`Échec de la vérification de l'intégrité : ${err.message}`, 'danger');
    }
  };

  const handleStatusChange = async (pvId, newStatut) => {
    setStatusUpdating(prev => ({ ...prev, [pvId]: true }));
    try {
      await api.majStatut(pvId, newStatut);
      // Update local state status
      setPvs(prev => prev.map(pv => pv.id === pvId ? { ...pv, statut: newStatut } : pv));
      showNotification(`Le statut du PV a été mis à jour avec succès.`, 'success');
      
      // If we modified status, clear the integrity check state since the HMAC was re-calculated
      setIntegrityStates(prev => {
        const copy = { ...prev };
        delete copy[pvId];
        return copy;
      });
    } catch (err) {
      showNotification(`Erreur lors de la mise à jour du statut : ${err.message}`, 'danger');
    } finally {
      setStatusUpdating(prev => ({ ...prev, [pvId]: false }));
    }
  };

  // Stat calculations
  const totalCount = pvs.length;
  const pendingCount = pvs.filter(pv => pv.statut === 'en_attente').length;
  const regulatedCount = pvs.filter(pv => pv.statut === 'reglee').length;
  const contestedCount = pvs.filter(pv => pv.statut === 'contestee').length;

  const filteredPVs = pvs.filter(pv => {
    // 1. Status Filter
    if (statusFilter !== 'tous' && pv.statut !== statusFilter) {
      return false;
    }

    // 2. Search Query Filter
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      
      {/* Toast Notification Banner */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 1000,
          background: notification.type === 'success' ? 'rgba(0, 107, 63, 0.95)' : 'rgba(210, 16, 52, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '8px',
          padding: '16px 20px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          color: '#ffffff',
          fontFamily: 'Outfit, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideUp 0.3s ease-out forwards',
          maxWidth: '400px'
        }}>
          {notification.type === 'success' ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{notification.text}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* Card Total */}
        <div className="glass-panel glow-emerald" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(0, 107, 63, 0.15)', color: 'var(--color-primary)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>Total PVs</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'Outfit' }}>
              {loading ? '...' : totalCount}
            </div>
          </div>
        </div>

        {/* Card En Attente */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(254, 203, 0, 0.15)', color: 'var(--color-accent-yellow)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>En Attente</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'Outfit' }}>
              {loading ? '...' : pendingCount}
            </div>
          </div>
        </div>

        {/* Card Reglees */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(0, 107, 63, 0.15)', color: '#10b981' }}>
            <BadgeCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>Réglés / Payés</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'Outfit' }}>
              {loading ? '...' : regulatedCount}
            </div>
          </div>
        </div>

        {/* Card Contestes */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(210, 16, 52, 0.15)', color: 'var(--color-accent-red)' }}>
            <AlertOctagon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>Contestés</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'Outfit' }}>
              {loading ? '...' : contestedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Top Filter and Search Bar Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Left: Search & Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', flex: 1 }}>
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

          {/* Status selector tabs */}
          <div className="glass-panel" style={{ display: 'inline-flex', padding: '4px', borderRadius: '10px', height: '40px' }}>
            {[
              { id: 'tous', label: 'Tous' },
              { id: 'en_attente', label: 'En attente' },
              { id: 'reglee', label: 'Réglés' },
              { id: 'contestee', label: 'Contestés' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '0 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: statusFilter === tab.id ? '#ffffff' : 'var(--color-text-muted)',
                  backgroundColor: statusFilter === tab.id ? 'var(--color-primary)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  height: '100%',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Refresh button */}
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

      {/* Main Table Grid */}
      <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '16px' }}>
            <div className="animate-pulse-sec" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
            <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Chargement des procès-verbaux de la base de données...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-accent-red)' }}>
            {error}
          </div>
        ) : filteredPVs.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <FileText size={40} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: '15px' }}>Aucun procès-verbal ne correspond à ces critères.</span>
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
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Intégrité (HMAC)</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPVs.map((pv) => {
                  const integrity = integrityStates[pv.id];
                  const isUpdating = statusUpdating[pv.id];
                  
                  return (
                    <tr key={pv.id}>
                      {/* PV ID Reference */}
                      <td style={{ fontWeight: '600', color: '#ffffff', fontSize: '13px' }}>
                        <code>{pv.id.substring(0, 8)}...</code>
                      </td>
                      
                      {/* Date */}
                      <td style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        {new Date(pv.date_creation).toLocaleDateString('fr-FR')}
                      </td>
                      
                      {/* Plaque */}
                      <td style={{ fontWeight: '500' }}>{pv.plaque}</td>
                      
                      {/* Permis local decrypt */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <KeyRound size={12} style={{ color: 'var(--color-primary)' }} />
                          <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                            {decryptedLicenses[pv.id] || "Déchiffrement..."}
                          </span>
                        </div>
                      </td>
                      
                      {/* Infraction Type */}
                      <td>
                        <div style={{ fontSize: '14px' }}>{pv.type_infraction}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{pv.lieu}</div>
                      </td>
                      
                      {/* Montant */}
                      <td style={{ fontWeight: '600', color: '#ffffff' }}>
                        {pv.montant.toLocaleString('fr-FR')} FCFA
                      </td>
                      
                      {/* Statut Badge */}
                      <td>
                        <StatusBadge status={pv.statut} />
                      </td>

                      {/* Integrity Check Results */}
                      <td>
                        {!integrity ? (
                          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Non vérifiée</span>
                        ) : integrity.loading ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-accent-yellow)', className: 'animate-pulse-sec' }}>
                            <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            Vérification...
                          </span>
                        ) : integrity.integre ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: '500' }}>
                            <ShieldCheck size={14} />
                            Intègre
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-accent-red)', fontWeight: '500' }} title={integrity.message}>
                            <ShieldAlert size={14} className="animate-pulse-sec" />
                            Corrompu
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                          {/* Verify Integrity Button */}
                          <button
                            onClick={() => handleVerifyIntegrity(pv.id)}
                            className="btn btn-secondary"
                            style={{
                              padding: '6px 10px',
                              fontSize: '12px',
                              height: '32px',
                              border: integrity?.checked 
                                ? (integrity.integre ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(210, 16, 52, 0.3)')
                                : '1px solid var(--color-border-glass)'
                            }}
                            disabled={integrity?.loading}
                          >
                            Vérifier
                          </button>

                          {/* Statut Dropdown Modifier */}
                          <select
                            value={pv.statut}
                            onChange={(e) => handleStatusChange(pv.id, e.target.value)}
                            disabled={isUpdating}
                            style={{
                              padding: '4px 10px',
                              fontSize: '12px',
                              height: '32px',
                              width: '120px',
                              backgroundColor: 'var(--color-bg-void)',
                              border: '1px solid var(--color-border-glass)',
                              borderRadius: '6px',
                              color: '#ffffff',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="en_attente">En attente</option>
                            <option value="reglee">Réglée</option>
                            <option value="contestee">Contestée</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default TousLesPVs;
