import { useState, useEffect, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Import Pages
import Login from './pages/Login';
import CreerPV from './pages/agent/CreerPV';
import MesPVs from './pages/agent/MesPVs';
import TousLesPVs from './pages/superviseur/TousLesPVs';
import ListeUsers from './pages/admin/ListeUsers';
import CreerUser from './pages/admin/CreerUser';
import ConsulterPVs from './pages/citoyen/ConsulterPVs';

// Router component that maps the current window.location.hash to the proper components
const AppRouter = () => {
  const [route, setRoute] = useState(window.location.hash || '#/login');
  const { isAuthenticated, role, loading } = useContext(AuthContext);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/login');
    };
    window.addEventListener('hashchange', handleHashChange);
    
    // Ensure we direct to correct page on load if already logged in
    if (window.location.hash === '' || window.location.hash === '#/') {
      if (isAuthenticated && role) {
        if (role === 'admin') {
          window.location.hash = '#/admin/users';
        } else if (role === 'superviseur') {
          window.location.hash = '#/superviseur/pvs';
        } else if (role === 'agent') {
          window.location.hash = '#/agent/pvs';
        }
      } else {
        window.location.hash = '#/login';
      }
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAuthenticated, role]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0B0D12' }}>
        <div className="animate-pulse-sec" style={{ fontFamily: 'Outfit', color: '#9CA3AF' }}>Chargement de l'application...</div>
      </div>
    );
  }

  // Parse path without '#'
  const currentRoute = route.substring(1) || '/login';

  // Render correct components based on route string matches
  switch (true) {
    // 1. Agent Pages
    case currentRoute === '/agent/pvs':
      return (
        <ProtectedRoute allowedRoles={['agent']}>
          <Layout currentRoute={currentRoute} title="Mes Procès-Verbaux">
            <MesPVs />
          </Layout>
        </ProtectedRoute>
      );
      
    case currentRoute === '/agent/creer-pv':
      return (
        <ProtectedRoute allowedRoles={['agent']}>
          <Layout currentRoute={currentRoute} title="Nouveau Procès-Verbal">
            <CreerPV />
          </Layout>
        </ProtectedRoute>
      );

    // 2. Superviseur Pages
    case currentRoute === '/superviseur/pvs':
      return (
        <ProtectedRoute allowedRoles={['superviseur']}>
          <Layout currentRoute={currentRoute} title="Supervision Globale">
            <TousLesPVs />
          </Layout>
        </ProtectedRoute>
      );

    // Citizen Pages
    case currentRoute === '/citoyen/consulter':
      return <ConsulterPVs />;

    // 3. Admin Pages
    case currentRoute === '/admin/users':
      return (
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout currentRoute={currentRoute} title="Gestion des Utilisateurs">
            <ListeUsers />
          </Layout>
        </ProtectedRoute>
      );

    case currentRoute === '/admin/creer-user':
      return (
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout currentRoute={currentRoute} title="Ajouter un Utilisateur">
            <CreerUser />
          </Layout>
        </ProtectedRoute>
      );

    // 4. Fallbacks / Public Login Page
    case currentRoute === '/login':
    default:
      // If user is authenticated, redirect them to their respective home dashboard instead of login
      if (isAuthenticated && role) {
        if (role === 'admin') {
          window.location.hash = '#/admin/users';
        } else if (role === 'superviseur') {
          window.location.hash = '#/superviseur/pvs';
        } else if (role === 'agent') {
          window.location.hash = '#/agent/pvs';
        }
        return null;
      }
      return <Login />;
  }
};

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
