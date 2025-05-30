import React, { useState } from 'react';
import { DollarSign, ArrowRight, Menu, X } from 'lucide-react';
import HeroSection from '../components/HeroSection';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const styles = {
    container: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: '1.6',
      color: '#111827',
    },

    // Header Styles
    header: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #e5e7eb',
      zIndex: 1000,
      padding: '16px 0',
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '24px',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textDecoration: 'none',
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
    },
    navLink: {
      color: '#6b7280',
      textDecoration: 'none',
      fontWeight: '500',
      transition: 'color 0.2s ease',
      cursor: 'pointer',
    },
    ctaButton: {
      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    mobileMenuButton: {
      display: window.innerWidth <= 768 ? 'block' : 'none',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
    },

    // Mobile Menu
    mobileMenu: {
      position: 'fixed',
      top: '80px',
      left: 0,
      right: 0,
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '20px 24px',
      display: mobileMenuOpen ? 'block' : 'none',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
    mobileNavLink: {
      display: 'block',
      padding: '12px 0',
      color: '#6b7280',
      textDecoration: 'none',
      fontWeight: '500',
      borderBottom: '1px solid #f3f4f6',
    },
  };

  // Hide nav on mobile, show menu button
  if (window.innerWidth <= 768) {
    styles.nav.display = 'none';
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <a href="/" style={styles.logo}>
            OurExpenses
          </a>

          <nav style={styles.nav}>
            <a
              href="/register"
              style={styles.ctaButton}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow =
                  '0 10px 15px -3px rgba(124, 58, 237, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Get Started
              <ArrowRight size={16} />
            </a>
          </nav>

          <button
            style={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div style={styles.mobileMenu}>
          <a href="/register" style={styles.mobileNavLink}>
            Get Started
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />
    </div>
  );
};

export default LandingPage;
