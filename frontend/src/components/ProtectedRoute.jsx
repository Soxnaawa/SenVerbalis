import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0B0D12' }}>
        <div className="animate-pulse-sec" style={{ fontFamily: 'Outfit', color: '#9CA3AF' }}>Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page
    window.location.hash = '/login';
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // User role is not authorized. Redirect to dashboard of their own role
    if (role === 'admin') {
      window.location.hash = '/admin/users';
    } else if (role === 'superviseur') {
      window.location.hash = '/superviseur/pvs';
    } else if (role === 'agent') {
      window.location.hash = '/agent/pvs';
    } else {
      window.location.hash = '/login';
    }
    return null;
  }

  return children;
};

export default ProtectedRoute;
