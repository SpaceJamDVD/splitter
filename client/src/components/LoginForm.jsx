import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, AlertCircle, Heart } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import authService from '../services/authService';

function LoginForm({
  onSuccess = null,
  error = null,
  onNavigateToRegister = null,
}) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Get login function from AuthContext (updated signature)
  const { login: authLogin } = useContext(AuthContext);

  // Display error from parent component if provided
  useEffect(() => {
    if (error) {
      setMessage(error);
      setMessageType('error');
    }
  }, [error]);

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (message) setMessage('');
  };

  const handleLogin = async () => {
    // Basic validation
    if (!formData.username || !formData.password) {
      setMessage('Please enter username/email and password');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);

      console.log('🎯 Starting login process...');

      // Use authService instead of direct API call
      const result = await authService.login({
        username: formData.username,
        password: formData.password,
      });

      if (result.success) {
        console.log('✅ Login successful via authService');

        // NEW: authLogin only takes user data (no tokens!)
        // Server already set httpOnly cookies automatically
        await authLogin(result.user);

        console.log('✅ User logged into AuthContext');

        // Call onSuccess callback or navigate
        if (onSuccess) {
          // Updated callback - no token parameter
          onSuccess(result.user);
        } else {
          navigate('/dashboard');
        }
      } else {
        // Handle login failure
        console.error('❌ Login failed:', result.error);

        // Handle specific error cases
        if (result.isLocked) {
          setMessage('Account temporarily locked. Please try again later.');
        } else {
          setMessage(result.error);
        }
        setMessageType('error');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setMessage('Login failed. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto',
      padding: '32px',
      background: 'white',
      borderRadius: '16px',
      boxShadow:
        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      textAlign: 'center',
      marginBottom: '24px',
    },
    icon: {
      width: '60px',
      height: '60px',
      margin: '0 auto 16px',
      background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#111827',
      margin: '0 0 8px 0',
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      margin: 0,
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      gap: '16px',
    },
    inputGroup: {
      position: 'relative',
    },
    input: {
      width: '100%',
      padding: '12px 16px 12px 44px',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      fontSize: '16px',
      transition: 'all 0.2s ease',
      outline: 'none',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
    },
    inputFocus: {
      borderColor: '#7c3aed',
      boxShadow: '0 0 0 3px rgba(124, 58, 237, 0.1)',
    },
    inputIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af',
    },
    button: {
      width: '100%',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: 'inherit',
      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      color: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      marginTop: '8px',
    },
    buttonDisabled: {
      background: '#9ca3af',
      cursor: 'not-allowed',
      transform: 'none',
    },
    message: {
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '16px',
      width: '100%',
      textAlign: 'left',
      background: 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)',
      color: '#dc2626',
      border: '1px solid #fecaca',
      boxSizing: 'border-box',
    },
    toggleText: {
      textAlign: 'center',
      marginTop: '16px',
      fontSize: '14px',
      color: '#6b7280',
    },
    toggleLink: {
      color: '#7c3aed',
      textDecoration: 'none',
      fontWeight: '500',
      cursor: 'pointer',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.icon}>
          <Heart size={24} color="#7c3aed" />
        </div>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to your account</p>
      </div>

      <div style={styles.form}>
        <div style={styles.inputGroup}>
          <User size={20} style={styles.inputIcon} />
          <input
            type="text"
            placeholder="Username or Email"
            value={formData.username}
            onChange={handleInputChange('username')}
            style={styles.input}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => Object.assign(e.target.style, styles.input)}
            disabled={loading}
            autoComplete="username"
          />
        </div>

        <div style={styles.inputGroup}>
          <Lock size={20} style={styles.inputIcon} />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange('password')}
            style={styles.input}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => Object.assign(e.target.style, styles.input)}
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {}),
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow =
                '0 8px 12px -2px rgba(124, 58, 237, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }
          }}
        >
          {loading ? (
            <>
              <div className="spinner" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn size={16} />
              Sign In
            </>
          )}
        </button>

        <div style={styles.toggleText}>
          Don't have an account?{' '}
          <span style={styles.toggleLink} onClick={onNavigateToRegister}>
            Sign up
          </span>
        </div>
      </div>

      {message && (
        <div style={styles.message}>
          <AlertCircle size={16} />
          {message}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default LoginForm;
