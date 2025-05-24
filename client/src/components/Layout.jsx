import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const NAVBAR_WIDTH_PX = 280;
  const BREAKPOINT_MOBILE = 768;

  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= BREAKPOINT_MOBILE
  );
  const [isNavbarOpen, setIsNavbarOpen] = useState(!isMobile);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= BREAKPOINT_MOBILE;
      setIsMobile(newIsMobile);
      setIsNavbarOpen(!newIsMobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const styles = {
    layoutContainer: {
      display: 'flex',
      minHeight: '100vh',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    mainContent: {
      flex: 1,
      marginLeft: !isMobile && isNavbarOpen ? `${NAVBAR_WIDTH_PX}px` : '0',
      transition: 'margin-left 300ms ease-in-out',
      minHeight: '100vh',
      width:
        !isMobile && isNavbarOpen
          ? `calc(100% - ${NAVBAR_WIDTH_PX}px)`
          : '100%',
      overflow: 'auto', // Prevents content from being cut off
    },
  };

  return (
    <div style={styles.layoutContainer}>
      <Navbar onToggle={setIsNavbarOpen} isOpen={isNavbarOpen} />
      <main style={styles.mainContent}>{children}</main>
    </div>
  );
};

export default Layout;
