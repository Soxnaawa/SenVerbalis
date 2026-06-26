import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  Users, 
  UserPlus, 
  Search, 
  RefreshCw, 
  UserMinus, 
  ShieldCheck, 
  UserCheck, 
  ShieldAlert, 
  UserX,
  Plus
} from 'lucide-react';

const ListeUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState(null); // stores user object to deactivate
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchUsers = async () => {
    setError('');
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des utilisateurs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const openDeactivateModal = (user) => {
    setDeactivatingUser(user);
    setModalOpen(true);
  };

  const closeDeactivateModal = () => {
    setDeactivatingUser(null);
    setModalOpen(false);
  };

  const confirmDeactivateUser = async () => {
    if (!deactivatingUser) return;

    try {
      await api.deactivateUser(deactivatingUser.username);
      // Update local state is_active to false
      setUsers(prev => prev.map(u => u.username === deactivatingUser.username ? { ...u, is_active: false } : u));
      showNotification(`Le compte de ${deactivatingUser.username} a été désactivé avec succès.`, 'success');
    } catch (err) {
      showNotification(`Erreur : ${err.message}`, 'danger');
    } finally {
      closeDeactivateModal();
    }
  };

  const handleReactivateUser = async (username) => {
    try {
      await api.reactivateUser(username);
      setUsers(prev => prev.map(u => u.username === username ? { ...u, is_active: true } : u));
      showNotification(`Le compte de ${username} a été réactivé avec succès.`, 'success');
    } catch (err) {
      showNotification(`Erreur : ${err.message}`, 'danger');
    }
  };


  // Stats calculations
  const totalCount = users.length;
  const activeCount = users.filter(u => u.is_active).length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const superviseurCount = users.filter(u => u.role === 'superviseur').length;
  const agentCount = users.filter(u => u.role === 'agent').length;

  const filteredUsers = users.filter(user => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
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
          {notification.type === 'success' ? <UserCheck size={20} /> : <ShieldAlert size={20} />}
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{notification.text}</span>
        </div>
      )}

      {/* Stats Cards Dashboard */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        {/* Total Users */}
        <div className="glass-panel glow-emerald" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(0, 107, 63, 0.15)', color: 'var(--color-primary)' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>Total Comptes</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'Outfit' }}>
              {loading ? '...' : totalCount}
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>Comptes Actifs</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'Outfit' }}>
              {loading ? '...' : activeCount}
            </div>
          </div>
        </div>

        {/* Admins */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(210, 16, 52, 0.15)', color: 'var(--color-accent-red)' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>Administrateurs</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'Outfit' }}>
              {loading ? '...' : adminCount}
            </div>
          </div>
        </div>

        {/* Superviseurs & Agents */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(254, 203, 0, 0.15)', color: 'var(--color-accent-yellow)' }}>
            <UserPlus size={22} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>Agents & Superv.</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'Outfit' }}>
              {loading ? '...' : (agentCount + superviseurCount)}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar & Action Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '320px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Rechercher par identifiant, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px' }}
          />
        </div>

        {/* Right buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="#/admin/creer-user" className="btn btn-primary" style={{ height: '40px' }}>
            <Plus size={16} />
            <span>Nouvel Utilisateur</span>
          </a>
          
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
      </div>

      {/* Users List Grid */}
      <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '16px' }}>
            <div className="animate-pulse-sec" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
            <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Chargement de la liste des utilisateurs...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-accent-red)' }}>
            {error}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Users size={40} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: '15px' }}>Aucun utilisateur trouvé.</span>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nom d'utilisateur</th>
                  <th>Adresse e-mail</th>
                  <th>Rôle</th>
                  <th>Créateur</th>
                  <th>Date de création</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userObj) => (
                  <tr key={userObj.id}>
                    {/* Username */}
                    <td style={{ fontWeight: '600', color: '#ffffff' }}>
                      {userObj.username}
                    </td>
                    
                    {/* Email */}
                    <td>{userObj.email}</td>
                    
                    {/* Role Badges */}
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        backgroundColor: userObj.role === 'admin' 
                          ? 'rgba(210, 16, 52, 0.1)' 
                          : userObj.role === 'superviseur' 
                            ? 'rgba(254, 203, 0, 0.1)' 
                            : 'rgba(0, 107, 63, 0.1)',
                        color: userObj.role === 'admin' 
                          ? 'var(--color-accent-red)' 
                          : userObj.role === 'superviseur' 
                            ? 'var(--color-accent-yellow)' 
                            : 'var(--color-primary)',
                        border: userObj.role === 'admin'
                          ? '1px solid rgba(210, 16, 52, 0.2)'
                          : userObj.role === 'superviseur'
                            ? '1px solid rgba(254, 203, 0, 0.2)'
                            : '1px solid rgba(0, 107, 63, 0.2)'
                      }}>
                        {userObj.role}
                      </span>
                    </td>
                    
                    {/* Created By */}
                    <td style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {userObj.created_by || 'Système'}
                    </td>
                    
                    {/* Created At */}
                    <td style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {new Date(userObj.created_at).toLocaleString('fr-FR')}
                    </td>
                    
                    {/* Active State */}
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: userObj.is_active ? '#10b981' : 'var(--color-accent-red)'
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: userObj.is_active ? '#10b981' : 'var(--color-accent-red)'
                        }}></span>
                        {userObj.is_active ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'center' }}>
                      {userObj.is_active ? (
                        <button
                          onClick={() => openDeactivateModal(userObj)}
                          className="btn btn-secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            height: '32px',
                            color: 'var(--color-accent-red)',
                            borderColor: 'rgba(210, 16, 52, 0.15)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(210, 16, 52, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <UserX size={13} style={{ marginRight: '4px' }} />
                          Désactiver
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivateUser(userObj.username)}
                          className="btn btn-secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            height: '32px',
                            color: '#10b981',
                            borderColor: 'rgba(16, 185, 129, 0.15)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <UserCheck size={13} style={{ marginRight: '4px' }} />
                          Réactiver
                        </button>
                      )}

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Confirmation Modal for Deactivation */}
      {modalOpen && deactivatingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out forwards'
        }}>
          <div className="glass-panel" style={{
            width: '90%',
            maxWidth: '450px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--color-accent-red)' }}>
              <div style={{ padding: '10px', borderRadius: '50%', backgroundColor: 'rgba(210, 16, 52, 0.1)' }}>
                <UserMinus size={24} />
              </div>
              <h3 style={{ fontSize: '20px', color: '#ffffff' }}>Désactiver le compte</h3>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
              Êtes-vous sûr de vouloir désactiver le compte de l'utilisateur <strong style={{ color: '#ffffff' }}>{deactivatingUser.username}</strong> ? 
              Cette action est réversible par un administrateur système, mais l'utilisateur ne pourra plus se connecter immédiatement.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button onClick={closeDeactivateModal} className="btn btn-secondary">
                Annuler
              </button>
              <button onClick={confirmDeactivateUser} className="btn btn-danger">
                Confirmer la désactivation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ListeUsers;
