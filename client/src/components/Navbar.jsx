import React, { useState, useEffect, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import {
  FaHome,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaPiggyBank,
} from 'react-icons/fa';

const BREAKPOINT_MOBILE = 768;
const NAVBAR_WIDTH_PX = 280;
const ANIMATION_DURATION_MS = 300;

const Navbar = () => {
  // Add debugging and error handling
  const authContext = useContext(AuthContext);
  const { user } = authContext;
  const initialIsMobile = window.innerWidth <= BREAKPOINT_MOBILE;
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [isOpen, setIsOpen] = useState(!initialIsMobile);
  const [showHamburger, setShowHamburger] = useState(
    initialIsMobile && !isOpen
  );

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= BREAKPOINT_MOBILE;
      setIsMobile(newIsMobile);

      if (!newIsMobile) {
        // Desktop
        setIsOpen(true);
        setShowHamburger(false);
      } else {
        // Mobile
        setShowHamburger(!isOpen);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const styles = {
    navbar: {
      position: 'fixed',
      top: 0,
      left: isOpen ? '0' : `-${NAVBAR_WIDTH_PX}px`,
      width: `${NAVBAR_WIDTH_PX}px`,
      height: '100vh',
      background:
        'linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #e0f2fe 100%)',
      color: '#111827',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      boxSizing: 'border-box',
      transition: `left ${ANIMATION_DURATION_MS}ms ease-in-out`,
      zIndex: 1000,
      boxShadow:
        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: '1px solid #f3f4f6',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px',
      background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
      borderBottom: '1px solid #e5e7eb',
      marginBottom: '16px',
    },
    logo: {
      fontSize: '24px',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    toggleButton: {
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      border: '1px solid #d1d5db',
      color: '#6b7280',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      borderRadius: '12px',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
    },
    navigation: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '0 16px',
      flex: 1,
    },
    linkContainer: {
      position: 'relative',
    },
    link: {
      color: '#6b7280',
      textDecoration: 'none',
      fontSize: '16px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 20px',
      borderRadius: '12px',
      transition: 'all 0.2s ease',
      position: 'relative',
      background: 'transparent',
    },
    linkHover: {
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      color: '#374151',
      transform: 'translateX(4px)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    activeLink: {
      background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
      color: '#2563eb',
      fontWeight: '600',
      boxShadow: '0 6px 10px -2px rgba(0, 0, 0, 0.1)',
      border: '1px solid #bfdbfe',
    },
    iconWrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
    },
    hamburgerButton: {
      position: 'fixed',
      top: '20px',
      left: '20px',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      border: '1px solid #e5e7eb',
      color: '#6b7280',
      fontSize: '20px',
      zIndex: 2000,
      cursor: 'pointer',
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 6px 10px -2px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
    },
    hamburgerButtonHover: {
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      transform: 'scale(1.05)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
    footer: {
      padding: '24px',
      borderTop: '1px solid #e5e7eb',
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      marginTop: 'auto',
    },
    footerText: {
      fontSize: '12px',
      color: '#9ca3af',
      textAlign: 'center',
      margin: 0,
    },
  };

  const getNavLinkStyle = ({ isActive }) => {
    const baseStyle = styles.link;
    if (isActive) {
      return { ...baseStyle, ...styles.activeLink };
    }
    return baseStyle;
  };

  const openMobileMenu = () => {
    setIsOpen(true);
    setShowHamburger(false);
  };

  const closeMobileMenu = () => {
    setIsOpen(false);
    setShowHamburger(false);
    setTimeout(() => setShowHamburger(true), ANIMATION_DURATION_MS);
  };

  const handleNavLinkClick = () => {
    if (isMobile) {
      closeMobileMenu();
    }
  };

  const handleLinkHover = (e, isEntering) => {
    const target = e.currentTarget;

    if (target.classList.contains('active-link')) return;

    if (isEntering) {
      target.style.transform = 'translateX(4px)';
      target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      target.style.background =
        'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
      target.style.color = '#374151';
    } else {
      target.style.transform = 'translateX(0)';
      target.style.boxShadow = 'none';
      target.style.background = 'transparent';
      target.style.color = '#6b7280';
    }
  };

  const handleLogout = () => {};

  return (
    <>
      {isMobile && !isOpen && showHamburger && (
        <button
          onClick={openMobileMenu}
          style={styles.hamburgerButton}
          onMouseEnter={(e) =>
            Object.assign(e.target.style, styles.hamburgerButtonHover)
          }
          onMouseLeave={(e) =>
            Object.assign(e.target.style, styles.hamburgerButton)
          }
          aria-label="Open navigation menu"
        >
          <FaBars />
        </button>
      )}

      <nav style={styles.navbar}>
        <div style={styles.header}>
          <div style={styles.logo}>OurExpenses</div>
          {isMobile && isOpen && (
            <button
              onClick={closeMobileMenu}
              style={styles.toggleButton}
              onMouseEnter={(e) => {
                e.target.style.background =
                  'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
                e.target.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                Object.assign(e.target.style, styles.toggleButton);
              }}
              aria-label="Close navigation menu"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div style={styles.navigation}>
          <div style={styles.linkContainer}>
            <NavLink
              to="/dashboard"
              style={getNavLinkStyle}
              onClick={handleNavLinkClick}
              onMouseEnter={(e) => handleLinkHover(e, true)}
              onMouseLeave={(e) => handleLinkHover(e, false)}
              className={({ isActive }) => (isActive ? 'active-link' : '')}
            >
              <div style={styles.iconWrapper}>
                <FaHome />
              </div>
              Our Expenses
            </NavLink>
          </div>

          <div style={styles.linkContainer}>
            <NavLink
              to={user?.groupId ? `/budgets/${user.groupId}` : '/budgets'}
              style={getNavLinkStyle}
              onClick={handleNavLinkClick}
              onMouseEnter={(e) => handleLinkHover(e, true)}
              onMouseLeave={(e) => handleLinkHover(e, false)}
              className={({ isActive }) => (isActive ? 'active-link' : '')}
            >
              <div style={styles.iconWrapper}>
                <FaPiggyBank />
              </div>
              Our Budgets
            </NavLink>
          </div>

          <div style={styles.linkContainer}>
            <NavLink
              to="/settings"
              style={getNavLinkStyle}
              onClick={handleNavLinkClick}
              onMouseEnter={(e) => handleLinkHover(e, true)}
              onMouseLeave={(e) => handleLinkHover(e, false)}
              className={({ isActive }) => (isActive ? 'active-link' : '')}
            >
              <div style={styles.iconWrapper}>
                <FaCog />
              </div>
              Settings
            </NavLink>
          </div>

          <button
            onClick={() => {
              handleLogout(); // properly log out
              handleNavLinkClick(); // close nav if mobile
            }}
            style={{
              ...styles.link,
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              width: '100%',
            }}
            onMouseEnter={(e) => handleLinkHover(e, true)}
            onMouseLeave={(e) => handleLinkHover(e, false)}
          >
            <div style={styles.iconWrapper}>
              <FaSignOutAlt />
            </div>
            Logout
          </button>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>© 2025 OurExpenses</p>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
