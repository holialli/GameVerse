import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import ServerWakeNotice from '../ServerWakeNotice/ServerWakeNotice';

// Ensures the Header and Footer are on every page
const Layout = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      {/* Wakes the free-tier API on first load and explains a cold start. */}
      <ServerWakeNotice />
    </div>
  );
};

export default Layout;