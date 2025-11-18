import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';

// Ensures the Header and Footer are on every page
const Layout = ({ children }) => {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
};

export default Layout;