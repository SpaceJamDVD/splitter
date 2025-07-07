import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Mail,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Heart,
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import authService from '../services/authService'; // Import authService

function RegisterForm({
  onSuccess = null,
  error = null,
  onNavigateToLogin = null,
  groupName = null,
  onJoinGroup = null,
  mode = null,
  inviteToken = null,
}) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Get login function from AuthContext
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

  const handleRegister = async () => {
    // Enhanced validation
    if (!formData.username || !formData.password || !formData.email) {
      setMessage('Username, email, and password are required');
      setMessageType('error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    // Password strength validation
    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);

      if (mode === 'join' && onJoinGroup) {
        await onJoinGroup({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
        return;
      }

      // Use authService instead of direct API call
      const result = await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      if (result.success) {
        setMessage('Account created successfully!');
        setMessageType('success');

        await authLogin(result.user);

        // Call onSuccess callback or navigate
        if (onSuccess) {
          // Updated callback - no token parameter
          onSuccess(result.user);
        } else {
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        }
      } else {
        // Handle registration failure
        console.error('Registration failed:', result.error);
        setMessage(result.error);
        setMessageType('error');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setMessage('Registration failed. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your styles object remains the same ...
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
    nameRow: {
      display: 'flex',
      gap: '8px',
      width: '100%',
    },
    nameInput: {
      flex: 1,
      minWidth: 0,
      padding: '12px 12px',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      outline: 'none',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
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
      boxSizing: 'border-box',
    },
    successMessage: {
      background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)',
      color: '#166534',
      border: '1px solid #bbf7d0',
    },
    errorMessage: {
      background: 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)',
      color: '#dc2626',
      border: '1px solid #fecaca',
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
        <h1 style={styles.title}>
          {groupName ? 'Join the Group' : 'Create Account'}
        </h1>
        <p style={styles.subtitle}>
          {groupName
            ? `You've been invited to join the group "${groupName}". Create an account to continue.`
            : 'Start tracking your shared expenses'}
        </p>
      </div>

      <div style={styles.form}>
        <div style={styles.inputGroup}>
          <User size={20} style={styles.inputIcon} />
          <input
            type="text"
            placeholder="Username"
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
          <Mail size={20} style={styles.inputIcon} />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange('email')}
            style={styles.input}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => Object.assign(e.target.style, styles.input)}
            disabled={loading}
            autoComplete="email"
            required
          />
        </div>

        <div style={styles.nameRow}>
          <input
            type="text"
            placeholder="First Name (optional)"
            value={formData.firstName}
            onChange={handleInputChange('firstName')}
            style={styles.nameInput}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => Object.assign(e.target.style, styles.nameInput)}
            disabled={loading}
            autoComplete="given-name"
          />
          <input
            type="text"
            placeholder="Last Name (optional)"
            value={formData.lastName}
            onChange={handleInputChange('lastName')}
            style={styles.nameInput}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => Object.assign(e.target.style, styles.nameInput)}
            disabled={loading}
            autoComplete="family-name"
          />
        </div>

        <div style={styles.inputGroup}>
          <Lock size={20} style={styles.inputIcon} />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={formData.password}
            onChange={handleInputChange('password')}
            style={styles.input}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => Object.assign(e.target.style, styles.input)}
            disabled={loading}
            autoComplete="new-password"
          />
        </div>

        <button
          type="button"
          onClick={handleRegister}
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
              Creating account...
            </>
          ) : (
            <>
              <UserPlus size={16} />
              {groupName ? 'Join Group' : 'Create Account'}
            </>
          )}
        </button>

        <div style={styles.toggleText}>
          Already have an account?{' '}
          <span style={styles.toggleLink} onClick={onNavigateToLogin}>
            Sign in
          </span>
        </div>
      </div>

      {message && (
        <div
          style={{
            ...styles.message,
            ...(messageType === 'success'
              ? styles.successMessage
              : styles.errorMessage),
          }}
        >
          {messageType === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
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

export default RegisterForm;
