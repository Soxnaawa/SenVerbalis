import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { Activity, RefreshCw, ChevronLeft, ChevronRight, Search } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const limit = 20;

  const fetchLogs = useCallback(async (currentPage = page) => {
    setError('');
    try {
      const skip = (currentPage - 1) * limit;
      const data = await api.getAuditLogs(skip, limit);
      setLogs(data);
    } catch (err) {
      setError(err.message || "Erreur lors de la récupération des logs d'audit.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);


  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs(page);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    // If we loaded a full page, allow next page.
    if (logs.length === limit) {
      setPage(prev => prev + 1);
    }
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('FAILED')) return 'rgba(210, 16, 52, 0.1)';
    if (action.includes('SUCCESS') || action.includes('CREATED') || action.includes('ACTIVATED')) return 'rgba(0, 107, 63, 0.1)';
    if (action.includes('DEACTIVATED')) return 'rgba(254, 203, 0, 0.1)';
    return 'rgba(255, 255, 255, 0.05)';
  };

  const getActionTextColor = (action) => {
    if (action.includes('FAILED')) return 'var(--color-accent-red)';
    if (action.includes('SUCCESS') || action.includes('CREATED') || action.includes('ACTIVATED')) return 'var(--color-primary)';
    if (action.includes('DEACTIVATED')) return 'var(--color-accent-yellow)';
    return 'var(--color-text-muted)';
  };

  const filteredLogs = logs.filter(log => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      log.actor.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      (log.target && log.target.toLowerCase().includes(query)) ||
      (log.detail && log.detail.toLowerCase().includes(query)) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(query))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Search and Refresh */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Filtrer par acteur, action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px' }}
          />
        </div>

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

      {/* Logs Table Container */}
      <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '16px' }}>
            <div className="animate-pulse-sec" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
            <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Récupération des journaux système...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-accent-red)' }}>
            {error}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Activity size={40} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: '15px' }}>Aucun log d'audit trouvé.</span>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date & Heure</th>
                  <th>Acteur</th>
                  <th>Événement</th>
                  <th>Cible</th>
                  <th>Détails</th>
                  <th>Adresse IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    {/* Timestamp */}
                    <td style={{ fontSize: '13px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </td>
                    
                    {/* Actor */}
                    <td style={{ fontWeight: '600', color: '#ffffff' }}>
                      {log.actor}
                    </td>

                    {/* Action Badge */}
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: getActionBadgeColor(log.action),
                        color: getActionTextColor(log.action),
                        border: `1px solid ${getActionTextColor(log.action)}33`
                      }}>
                        {log.action}
                      </span>
                    </td>

                    {/* Target */}
                    <td style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                      {log.target || '-'}
                    </td>

                    {/* Details */}
                    <td style={{ fontSize: '13px', color: '#d1d5db', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.detail || '-'}
                    </td>

                    {/* IP */}
                    <td style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && logs.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '24px',
            borderTop: '1px solid var(--color-border-glass)',
            paddingTop: '20px'
          }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Page <strong style={{ color: '#ffffff' }}>{page}</strong>
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handlePrevPage}
                className="btn btn-secondary"
                disabled={page === 1}
                style={{ padding: '8px 12px', height: '36px' }}
              >
                <ChevronLeft size={16} />
                <span>Précédent</span>
              </button>
              <button
                onClick={handleNextPage}
                className="btn btn-secondary"
                disabled={logs.length < limit}
                style={{ padding: '8px 12px', height: '36px' }}
              >
                <span>Suivant</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuditLogs;
