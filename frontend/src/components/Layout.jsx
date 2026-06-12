import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, currentRoute, title }) => {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-void)',
      gap: '24px',
    }}>
      {/* Navigation Sidebar */}
      <Sidebar currentRoute={currentRoute} />

      {/* Main Content Pane */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 32px 32px 0',
        minWidth: 0, // prevents flex overflow
      }}>
        {/* Top Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'between',
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--color-border-glass)'
        }}>
          <div>
            <h1 style={{ fontSize: '28px', color: '#ffffff', fontFamily: 'Outfit' }}>{title}</h1>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              SenVerbalis — République du Sénégal
            </span>
          </div>
        </header>

        {/* Dashboard Page Content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }} className="animate-slide-up">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
