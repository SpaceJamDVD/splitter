import React from 'react';
import { ArrowRight, Heart, TrendingUp } from 'lucide-react';

const HeroSection = () => {
  const styles = {
    hero: {
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
      padding: '120px 24px 80px',
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    heroContent: {
      maxWidth: '800px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 2,
    },
    heroTitle: {
      fontSize: window.innerWidth <= 768 ? '40px' : '56px',
      fontWeight: 'bold',
      marginBottom: '24px',
      background: 'linear-gradient(135deg, #1f2937 0%, #7c3aed 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      lineHeight: '1.1',
    },
    heroSubtitle: {
      fontSize: '20px',
      color: '#6b7280',
      marginBottom: '40px',
      maxWidth: '600px',
      margin: '0 auto 40px',
      lineHeight: '1.6',
    },
    heroButtons: {
      display: 'flex',
      gap: '16px',
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginBottom: '60px',
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      color: 'white',
      padding: '16px 32px',
      borderRadius: '12px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.3)',
      textDecoration: 'none',
    },
    secondaryButton: {
      background: 'white',
      color: '#374151',
      padding: '16px 32px',
      borderRadius: '12px',
      border: '2px solid #e5e7eb',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      textDecoration: 'none',
    },
    trustIndicators: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '32px',
      flexWrap: 'wrap',
      opacity: 0.7,
    },
    trustItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#6b7280',
      fontSize: '14px',
      fontWeight: '500',
    },
    // Decorative elements
    floatingHeart: {
      position: 'absolute',
      color: '#fbbf24',
      opacity: 0.3,
      animation: 'float 6s ease-in-out infinite',
    },
    floatingHeart1: {
      top: '20%',
      left: '15%',
      animationDelay: '0s',
    },
    floatingHeart2: {
      top: '60%',
      right: '20%',
      animationDelay: '2s',
    },
    floatingHeart3: {
      bottom: '30%',
      left: '10%',
      animationDelay: '4s',
    },
  };

  // Add keyframes for floating animation
  React.useEffect(() => {
    const styleSheet = document.styleSheets[0];
    const keyframes = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(10deg); }
      }
    `;
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
  }, []);

  // Adjust for mobile
  if (window.innerWidth <= 768) {
    styles.heroButtons.flexDirection = 'column';
    styles.heroButtons.alignItems = 'center';
    styles.trustIndicators.flexDirection = 'column';
    styles.trustIndicators.gap = '16px';
  }

  return (
    <section style={styles.hero}>
      {/* Floating decorative elements */}
      <Heart
        size={42}
        style={{ ...styles.floatingHeart, ...styles.floatingHeart1 }}
      />
      <Heart
        size={36}
        style={{ ...styles.floatingHeart, ...styles.floatingHeart2 }}
      />
      <Heart
        size={34}
        style={{ ...styles.floatingHeart, ...styles.floatingHeart3 }}
      />

      <div style={styles.heroContent}>
        <h1 style={styles.heroTitle}>
          Money Management
          <br />
          Made Simple
          <br />
          <span style={{ color: '#e11d48' }}>for Couples</span>
        </h1>

        <p style={styles.heroSubtitle}>
          Stop arguing about money and start building your future together.
          Track shared expenses and manage your budget as a team with complete
          transparency and trust.
        </p>

        <div style={styles.heroButtons}>
          <a
            href="/login"
            style={styles.primaryButton}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow =
                '0 20px 25px -5px rgba(124, 58, 237, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow =
                '0 10px 15px -3px rgba(124, 58, 237, 0.3)';
            }}
          >
            Start Managing Together
            <ArrowRight size={20} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
