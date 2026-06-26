import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Lock, User } from 'lucide-react';

const Login = () => {
  const { login, error: authError, isAuthenticated, role } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [expiredMsg, setExpiredMsg] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("sessionExpired") === "true") {
      setExpiredMsg(true);
      localStorage.removeItem("sessionExpired");
    }
  }, []);

  // If already authenticated, redirect to appropriate page
  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === 'admin') {
        window.location.hash = '/admin/users';
      } else if (role === 'superviseur') {
        window.location.hash = '/superviseur/pvs';
      } else if (role === 'agent') {
        window.location.hash = '/agent/pvs';
      }
    }
  }, [isAuthenticated, role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExpiredMsg(false);
    setShake(false);

    if (!username.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      setShake(true);
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Identifiants incorrects.');
      setShake(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-void)',
      padding: '20px'
    }}>
      {/* Login Card */}
      <div 
        className={`glass-panel glow-emerald ${shake ? 'animate-shake' : 'animate-fade-in'}`}
        style={{
          width: '100%',
          maxWidth: '420px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* National Flag Accent Stripes */}
        <div style={{ display: 'flex', height: '4px', width: '100%' }}>
          <div style={{ flex: 1, backgroundColor: '#006B3F' }}></div>
          <div style={{ flex: 1, backgroundColor: '#FECB00' }}></div>
          <div style={{ flex: 1, backgroundColor: '#D21034' }}></div>
        </div>

        <div style={{ padding: '40px 32px' }}>
          {/* Logo / Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(0, 107, 63, 0.1)',
              border: '1px solid rgba(0, 107, 63, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              color: 'var(--color-primary)'
            }}>
              <Shield size={24} />
            </div>
            <h2 style={{ fontSize: '24px', color: '#ffffff', fontFamily: 'Outfit', textAlign: 'center' }}>
              SenVerbalis
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'center' }}>
              Portail sécurisé de verbalisation électronique
            </p>
          </div>

          {/* Session Expired Alert */}
          {expiredMsg && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(254, 203, 0, 0.1)',
              border: '1px solid rgba(254, 203, 0, 0.2)',
              color: 'var(--color-accent-yellow)',
              fontSize: '13px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Votre session a expiré après 15 minutes d'inactivité.
            </div>
          )}

          {/* Form Error */}
          {(error || authError) && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(210, 16, 52, 0.1)',
              border: '1px solid rgba(210, 16, 52, 0.2)',
              color: 'var(--color-accent-red)',
              fontSize: '13px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error || authError}
            </div>
          )}


          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label htmlFor="username">Identifiant (Matricule / Email)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                  <User size={16} />
                </span>
                <input
                  id="username"
                  type="text"
                  placeholder="Ex: agent_01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password">Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                  <Lock size={16} />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
              disabled={loading}
              style={{ width: '100%', height: '44px', marginTop: '8px' }}
            >
              {loading ? (
                <span className="animate-pulse-sec">Connexion sécurisée en cours...</span>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>

          {/* Citizen access link */}
          <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid var(--color-border-glass)', paddingTop: '20px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Vous êtes un citoyen ?{" "}
              <a 
                href="#/citoyen/consulter" 
                style={{ 
                  color: 'var(--color-accent-yellow)', 
                  textDecoration: 'none', 
                  fontWeight: '500',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-accent-yellow)'}
              >
                Consulter vos infractions
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
