import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FileText, PlusCircle, Shield, LogOut, Users, UserPlus, Search } from 'lucide-react';

const Sidebar = ({ currentRoute }) => {
  const { user, role, logout } = useContext(AuthContext);

  const getMenuItems = () => {
    switch (role) {
      case 'agent':
        return [
          {
            label: "Mes PVs",
            route: "#/agent/pvs",
            icon: <FileText size={18} />
          },
          {
            label: "Nouveau PV",
            route: "#/agent/creer-pv",
            icon: <PlusCircle size={18} />
          }
        ];
      case 'superviseur':
        return [
          {
            label: "Tous les PVs",
            route: "#/superviseur/pvs",
            icon: <FileText size={18} />
          }
        ];
      case 'admin':
        return [
          {
            label: "Utilisateurs",
            route: "#/admin/users",
            icon: <Users size={18} />
          },
          {
            label: "Nouvel Utilisateur",
            route: "#/admin/creer-user",
            icon: <UserPlus size={18} />
          }
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="glass-panel" style={{
      width: '260px',
      height: 'calc(100vh - 32px)',
      margin: '16px 0 16px 16px',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      flexShrink: '0',
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingLeft: '8px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: '#ffffff',
          fontFamily: 'Outfit',
          fontSize: '18px'
        }}>
          SV
        </div>
        <div>
          <h2 style={{ fontSize: '18px', color: '#ffffff', lineHeight: '1.2' }}>SenVerbalis</h2>
          <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '600', textTransform: 'uppercase', tracking: '0.1em' }}>
            {role === 'admin' ? 'Administration' : role === 'superviseur' ? 'Superviseur' : 'Agent Verbalisateur'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item, index) => {
          const isActive = currentRoute === item.route.substring(1);
          return (
            <a
              key={index}
              href={item.route}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                backgroundColor: isActive ? 'rgba(0, 107, 63, 0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(0, 107, 63, 0.3)' : '1px solid transparent',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive ? '500' : '400',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ color: isActive ? 'var(--color-primary)' : 'inherit' }}>
                {item.icon}
              </span>
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Connected User Profile info */}
      <div style={{
        padding: '14px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--color-border-glass)',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {user?.username}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {user?.email}
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="btn btn-secondary"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px',
          border: '1px solid rgba(210, 16, 52, 0.2)',
          color: '#ef4444'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(210, 16, 52, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <LogOut size={16} />
        <span>Déconnexion</span>
      </button>
    </aside>
  );
};

export default Sidebar;
