import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Mail,
  Heart,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import API from '../api';

function LoginForm({
  mode = 'both', // "login", "register", "both", "join"
  inviteToken = null,
  groupName = null,
  onSuccess = null,
  onJoinGroup = null, // Add this prop for join mode
  error = null, // Add this prop to receive errors from parent
}) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [currentMode, setCurrentMode] = useState(
    mode === 'both' ? 'login' : mode
  );
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // "success" or "error"
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isJoinMode = mode === 'join';
  const isRegisterMode = currentMode === 'register' || isJoinMode;

  // Display error from parent component if provided
  React.useEffect(() => {
    if (error) {
      setMessage(error);
      setMessageType('error');
    }
  }, [error]);

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (message) setMessage(''); // Clear message when user starts typing
  };

  const handleRegister = async () => {
    if (
      !formData.username ||
      !formData.password ||
      (isRegisterMode && !formData.email)
    ) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        username: formData.username,
        password: formData.password,
        ...(isRegisterMode && { email: formData.email }),
      };

      const res = await API.post('/auth/register', payload);

      setMessage('Account created successfully!');
      setMessageType('success');

      // Auto-login after registration
      setTimeout(() => {
        handleLogin();
      }, 1000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Registration failed');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!formData.username || !formData.password) {
      setMessage('Please enter username and password');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);
      const res = await API.post('/auth/login', {
        username: formData.username,
        password: formData.password,
      });

      const token = res.data.token;
      localStorage.setItem('token', token);

      if (onSuccess) {
        onSuccess(token);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Login failed');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      setMessage('Please fill in all fields to join');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);

      // If onJoinGroup prop is provided (from JoinGroupPage), use it
      if (onJoinGroup) {
        // Pass the form data to the parent component's handler
        await onJoinGroup({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
      } else {
        // Otherwise, handle it directly (backward compatibility)
        const response = await API.post(`/groups/join/${inviteToken}`, {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });

        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          setMessage('Account created and joined group successfully!');
          setMessageType('success');

          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to join group');
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
      background: isJoinMode
        ? 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)'
        : 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
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
    },
    inputFocus: {
      borderColor: '#2563eb',
      boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
    },
    inputIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af',
    },
    buttonGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '100%',
      marginTop: '8px',
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
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      color: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    secondaryButton: {
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      color: '#374151',
      border: '1px solid #d1d5db',
    },
    joinButton: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    buttonDisabled: {
      background: '#9ca3af',
      cursor: 'not-allowed',
      transform: 'none',
    },
    buttonHover: {
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 15px -3px rgba(0, 0, 0, 0.1)',
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
      color: '#2563eb',
      cursor: 'pointer',
      fontWeight: '500',
      textDecoration: 'none',
    },
  };

  const getTitle = () => {
    if (isJoinMode) return `Join ${groupName || 'Shared Expenses'}`;
    if (currentMode === 'register') return 'Create Account';
    return 'Welcome Back';
  };

  const getSubtitle = () => {
    if (isJoinMode)
      return 'Create your account to start tracking expenses together';
    if (currentMode === 'register')
      return 'Start tracking your shared expenses';
    return 'Sign in to your account';
  };

  const getIcon = () => {
    if (isJoinMode) return <Heart size={24} color="#f59e0b" />;
    if (currentMode === 'register')
      return <UserPlus size={24} color="#2563eb" />;
    return <LogIn size={24} color="#2563eb" />;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.icon}>{getIcon()}</div>
        <h1 style={styles.title}>{getTitle()}</h1>
        <p style={styles.subtitle}>{getSubtitle()}</p>
      </div>

      <form style={styles.form} onSubmit={(e) => e.preventDefault()}>
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
          />
        </div>

        {isRegisterMode && (
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
            />
          </div>
        )}

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
          />
        </div>

        <div style={styles.buttonGroup}>
          {isJoinMode ? (
            <button
              type="button"
              onClick={handleJoinGroup}
              disabled={loading}
              style={{
                ...styles.button,
                ...styles.joinButton,
                ...(loading ? styles.buttonDisabled : {}),
              }}
              onMouseEnter={(e) =>
                !loading && Object.assign(e.target.style, styles.buttonHover)
              }
              onMouseLeave={(e) =>
                Object.assign(e.target.style, {
                  ...styles.button,
                  ...styles.joinButton,
                })
              }
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Joining...
                </>
              ) : (
                <>
                  <Heart size={16} />
                  Create Account & Join
                </>
              )}
            </button>
          ) : mode === 'both' ? (
            <>
              <button
                type="button"
                onClick={currentMode === 'login' ? handleLogin : handleRegister}
                disabled={loading}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  ...(loading ? styles.buttonDisabled : {}),
                }}
                onMouseEnter={(e) =>
                  !loading && Object.assign(e.target.style, styles.buttonHover)
                }
                onMouseLeave={(e) =>
                  Object.assign(e.target.style, {
                    ...styles.button,
                    ...styles.primaryButton,
                  })
                }
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    {currentMode === 'login'
                      ? 'Signing in...'
                      : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {currentMode === 'login' ? (
                      <>
                        <LogIn size={16} />
                        Sign In
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Create Account
                      </>
                    )}
                  </>
                )}
              </button>
            </>
          ) : currentMode === 'login' ? (
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              style={{
                ...styles.button,
                ...styles.primaryButton,
                ...(loading ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              style={{
                ...styles.button,
                ...styles.primaryButton,
                ...(loading ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          )}
        </div>

        {mode === 'both' && !isJoinMode && (
          <div style={styles.toggleText}>
            {currentMode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <span
              style={styles.toggleLink}
              onClick={() =>
                setCurrentMode(currentMode === 'login' ? 'register' : 'login')
              }
            >
              {currentMode === 'login' ? 'Sign up' : 'Sign in'}
            </span>
          </div>
        )}
      </form>

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

export default LoginForm;
