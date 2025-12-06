import React from 'react';
const Header = ({ setThemeMode }) => (
  <header style={{ padding: '1rem', background: '#2e7d32', color: '#fff' }}>
    <h1>Rice Mill App</h1>
    <button onClick={() => setThemeMode(m => (m === 'light' ? 'dark' : 'light'))}>
      Toggle Theme
    </button>
  </header>
);
export default Header;