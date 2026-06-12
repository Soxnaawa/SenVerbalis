import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  UserPlus, 
  ShieldCheck, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Info 
} from 'lucide-react';

const CreerUser = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'agent'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Live password validation checks
  const [pwChecks, setPwChecks] = useState({
    length: false,
    upper: false,
    lower: false,
    digit: false,
    special: false
  });

  useEffect(() => {
    const pw = formData.password;
    setPwChecks({
      length: pw.length >= 12,
      upper: /[A-Z]/.test(pw),
      lower: /[a-z]/.test(pw),
      digit: /\d/.test(pw),
      special: /[!@#$%^&*(),.?":{}|<>_\-]/.test(pw)
    });
  }, [formData.password]);

  const isPasswordValid = Object.values(pwChecks).every(Boolean);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!isPasswordValid) {
      setError("Le mot de passe ne respecte pas les critères de sécurité obligatoires.");
      return;
    }

    setLoading(true);
    try {
      await api.createUser({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role
      });
      
      setSuccess(true);
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'agent'
      });
      
      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.hash = '/admin/users';
      }, 2000);

    } catch (err) {
      setError(err.message || "Impossible de créer le compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Return link */}
      <a href="#/admin/users" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--color-text-muted)',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
        alignSelf: 'flex-start',
        transition: 'color 0.2s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
      >
        <ArrowLeft size={16} />
        <span>Retour à la liste des utilisateurs</span>
      </a>

      {/* Main Form Glass Panel */}
      <div className="glass-panel glow-emerald" style={{ padding: '32px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(0, 107, 63, 0.15)', color: 'var(--color-primary)' }}>
            <UserPlus size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', color: '#ffffff' }}>Nouvel Utilisateur</h2>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Enregistrer un nouveau compte avec privilèges RBAC
            </span>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="animate-shake" style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(210, 16, 52, 0.1)',
            border: '1px solid rgba(210, 16, 52, 0.2)',
            color: 'var(--color-accent-red)',
            fontSize: '14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <X size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 107, 63, 0.1)',
            border: '1px solid rgba(0, 107, 63, 0.2)',
            color: '#10b981',
            fontSize: '14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={18} />
            <span>Compte créé avec succès ! Redirection vers la liste...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Username */}
          <div>
            <label htmlFor="username">Identifiant (Nom d'utilisateur)</label>
            <input
              type="text"
              id="username"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="Ex: mamba_diop"
              autoComplete="username"
              disabled={loading || success}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email">Adresse E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Ex: m.diop@senverbalis.sn"
              autoComplete="email"
              disabled={loading || success}
            />
          </div>

          {/* Password Input + Show/Hide */}
          <div>
            <label htmlFor="password">Mot de passe temporaire</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Entrez un mot de passe fort"
                autoComplete="new-password"
                style={{ paddingRight: '44px' }}
                disabled={loading || success}
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
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password security checks display */}
            <div style={{
              marginTop: '12px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--color-border-glass)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={12} style={{ color: 'var(--color-primary)' }} />
                Critères de robustesse du mot de passe
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { key: 'length', label: 'Au moins 12 caractères' },
                  { key: 'upper', label: 'Au moins une lettre majuscule (A-Z)' },
                  { key: 'lower', label: 'Au moins une lettre minuscule (a-z)' },
                  { key: 'digit', label: 'Au moins un chiffre (0-9)' },
                  { key: 'special', label: 'Au moins un caractère spécial (e.g. @, $, !, %, -)' }
                ].map(rule => {
                  const checkPassed = pwChecks[rule.key];
                  return (
                    <li key={rule.key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: checkPassed ? '#10b981' : 'var(--color-text-muted)',
                      transition: 'color 0.2s ease'
                    }}>
                      {checkPassed ? (
                        <Check size={14} style={{ color: '#10b981' }} />
                      ) : (
                        <X size={14} style={{ color: 'var(--color-accent-red)' }} />
                      )}
                      <span>{rule.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label htmlFor="role">Rôle / Habilitation RBAC</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading || success}
              style={{ cursor: 'pointer' }}
            >
              <option value="agent">Agent Verbalisateur (Création & Consultation de PVs)</option>
              <option value="superviseur">Superviseur (Consultation globale, intégrité & statut)</option>
              <option value="admin">Administrateur (Gestion des comptes utilisateurs)</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '12px', height: '44px' }}
            disabled={loading || success || !isPasswordValid}
          >
            {loading ? 'Création du compte...' : 'Créer l\'utilisateur'}
          </button>

        </form>

      </div>
    </div>
  );
};

export default CreerUser;
