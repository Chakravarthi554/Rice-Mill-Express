import React from 'react';

/**
 * 🌿 EnvBadge Component
 * Displays the current active API URL and Environment in development mode.
 * Automatically hidden in production builds.
 */
const EnvBadge = () => {
  // NODE_ENV is automatically 'production' when running 'npm run build'
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 12,
      right: 12,
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.9)',
      color: '#fbbf24',
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '11px',
      fontWeight: '600',
      fontFamily: 'JetBrains Mono, Menlo, monospace',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      border: '1px solid rgba(251, 191, 36, 0.3)',
      backdropFilter: 'blur(4px)',
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      alignItems: 'flex-end'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }}></span>
        DEV MODE
      </div>
      <div style={{ color: '#fff', fontSize: '10px', opacity: 0.8 }}>
        {process.env.REACT_APP_API_URL}
      </div>
    </div>
  );
};

export default EnvBadge;
