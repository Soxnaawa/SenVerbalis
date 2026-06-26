import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  BarChart2, 
  TrendingUp, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';


const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    setError('');
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Erreur lors de la récupération des statistiques.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 0', gap: '16px' }}>
        <div className="animate-pulse-sec" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
        <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Génération des indicateurs de performance...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-accent-red)' }}>
        {error}
      </div>
    );
  }

  // Format currency in FCFA
  const formatFCFA = (val) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val).replace('XOF', 'FCFA');
  };

  const getPercent = (subset, total) => {
    if (!total) return '0%';
    return `${Math.round((subset / total) * 100)}%`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title / Refresh */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-8px' }}>
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

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* Total PVs */}
        <div className="glass-panel glow-emerald" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(0, 107, 63, 0.12)', color: 'var(--color-primary)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>Procès-Verbaux Générés</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'Outfit', marginTop: '4px' }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* Settled PVs */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>PVs Réglés / Payés</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'Outfit', marginTop: '4px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              {stats.regles}
              <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '500' }}>({getPercent(stats.regles, stats.total)})</span>
            </div>
          </div>
        </div>

        {/* Contested PVs */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(210, 16, 52, 0.12)', color: 'var(--color-accent-red)' }}>
            <XCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>PVs Contestés</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'Outfit', marginTop: '4px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              {stats.contestes}
              <span style={{ fontSize: '14px', color: 'var(--color-accent-red)', fontWeight: '500' }}>({getPercent(stats.contestes, stats.total)})</span>
            </div>
          </div>
        </div>

        {/* Pending PVs */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(254, 203, 0, 0.12)', color: 'var(--color-accent-yellow)' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>En Attente</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'Outfit', marginTop: '4px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              {stats.en_attente}
              <span style={{ fontSize: '14px', color: 'var(--color-accent-yellow)', fontWeight: '500' }}>({getPercent(stats.en_attente, stats.total)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {/* Money overview */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingUp size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '16px', color: '#ffffff', fontWeight: '600' }}>Bilan Financier des Amendes</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Total fine pool */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-glass)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Montant Total Émis</span>
              <strong style={{ color: '#ffffff', fontSize: '16px' }}>{formatFCFA(stats.montant_total)}</strong>
            </div>

            {/* Collected */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-glass)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', color: '#ffffff' }}>Montant Recouvré</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Frais réglés par les citoyens</span>
              </div>
              <strong style={{ color: '#10b981', fontSize: '16px' }}>{formatFCFA(stats.montant_regle)}</strong>
            </div>

            {/* Uncollected */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Reste à Recouvrer</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>En attente ou contesté</span>
              </div>
              <strong style={{ color: 'var(--color-accent-yellow)', fontSize: '16px' }}>{formatFCFA(stats.montant_total - stats.montant_regle)}</strong>
            </div>
          </div>
        </div>

        {/* Infraction distribution */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BarChart2 size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '16px', color: '#ffffff', fontWeight: '600' }}>Répartition des Infractions</h3>
          </div>

          <div style={{ overflowY: 'auto', maxH: '200px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.keys(stats.infraction_distribution).length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px 0', fontSize: '14px' }}>
                Aucune infraction enregistrée.
              </div>
            ) : (
              Object.entries(stats.infraction_distribution).map(([type, count]) => (
                <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#ffffff', fontWeight: '500' }}>{type}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>{count} ({getPercent(count, stats.total)})</span>
                  </div>
                  {/* Visual Bar representation */}
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: getPercent(count, stats.total), 
                      height: '100%', 
                      backgroundColor: 'var(--color-primary)', 
                      borderRadius: '3px'
                    }}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardStats;
