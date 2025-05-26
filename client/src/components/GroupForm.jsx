import React, { useState, useContext } from 'react';
import { createGroup } from '../services/groupService';
import { AuthContext } from '../contexts/AuthContext';
import {
  Heart,
  Users,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';

const OnboardingGroupForm = ({ onSuccess }) => {
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdGroup, setCreatedGroup] = useState(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setMessage('');

    try {
      const group = await createGroup({
        name: name.trim(),
        description: 'Our shared expenses',
      });

      setCreatedGroup(group);
      setMessageType('success');
      setMessage('Your shared expense account is ready!');
      setStep(3); // Move to invite step
    } catch (error) {
      console.error('Error creating group:', error);
      setMessageType('error');
      setMessage('Failed to create your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!createdGroup?.inviteToken) return;

    const inviteLink = `${window.location.origin}/join/${createdGroup.inviteToken}`;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleFinish = () => {
    if (onSuccess && createdGroup) {
      onSuccess(createdGroup);
    }
  };

  const suggestions = [
    'Our Expenses',
    'Joint Account',
    `${user?.username || 'Our'} & Partner`,
    'Shared Budget',
    'Together',
    'Home & Life',
  ];

  const styles = {
    container: {
      maxWidth: '500px',
      margin: '0 auto',
      padding: '40px 24px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
      minHeight: '100vh',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    card: {
      background: 'white',
      borderRadius: '20px',
      padding: '40px',
      boxShadow:
        '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      border: '1px solid #f3f4f6',
      textAlign: 'center',
    },
    progressBar: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '32px',
      gap: '8px',
    },
    progressDot: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      transition: 'all 0.3s ease',
    },
    progressDotActive: {
      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    },
    progressDotInactive: {
      background: '#e5e7eb',
    },
    icon: {
      width: '80px',
      height: '80px',
      margin: '0 auto 24px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#111827',
      margin: '0 0 16px 0',
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280',
      margin: '0 0 32px 0',
      lineHeight: '1.5',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      marginTop: '32px',
    },
    input: {
      padding: '16px 20px',
      borderRadius: '12px',
      border: '1px solid #d1d5db',
      fontSize: '18px',
      textAlign: 'center',
      transition: 'all 0.2s ease',
      outline: 'none',
      background: 'white',
      fontWeight: '500',
    },
    inputFocus: {
      borderColor: '#2563eb',
      boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
    },
    suggestions: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: '12px',
      marginTop: '20px',
    },
    suggestion: {
      padding: '12px 16px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#475569',
      transition: 'all 0.2s ease',
      fontWeight: '500',
    },
    suggestionHover: {
      background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
      borderColor: '#bfdbfe',
      color: '#2563eb',
    },
    button: {
      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      color: 'white',
      padding: '16px 32px',
      borderRadius: '12px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    buttonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
    buttonDisabled: {
      background: '#9ca3af',
      cursor: 'not-allowed',
      transform: 'none',
    },
    inviteSection: {
      background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '24px',
    },
    inviteTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#92400e',
      margin: '0 0 12px 0',
    },
    inviteText: {
      color: '#92400e',
      fontSize: '14px',
      marginBottom: '16px',
      lineHeight: '1.5',
    },
    inviteLink: {
      background: 'rgba(255, 255, 255, 0.8)',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #d97706',
      fontSize: '12px',
      color: '#92400e',
      wordBreak: 'break-all',
      marginBottom: '12px',
      fontFamily: 'monospace',
    },
    copyButton: {
      background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      width: '100%',
    },
    copyButtonSuccess: {
      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
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
    skipButton: {
      background: 'transparent',
      color: '#6b7280',
      border: 'none',
      fontSize: '14px',
      cursor: 'pointer',
      textDecoration: 'underline',
      marginTop: '16px',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '32px',
    },
  };

  // Step 1: Welcome
  if (step === 1) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.progressBar}>
            <div
              style={{ ...styles.progressDot, ...styles.progressDotActive }}
            ></div>
            <div
              style={{ ...styles.progressDot, ...styles.progressDotInactive }}
            ></div>
            <div
              style={{ ...styles.progressDot, ...styles.progressDotInactive }}
            ></div>
          </div>

          <div style={styles.icon}>
            <Heart size={40} color="#f59e0b" />
          </div>

          <p style={styles.subtitle}>
            The easiest way for couples to track shared expenses. Let's set up
            your accounts!
          </p>

          <div style={{ ...styles.buttonContainer }}>
            <button
              onClick={() => setStep(2)}
              style={styles.button}
              onMouseEnter={(e) =>
                Object.assign(e.target.style, styles.buttonHover)
              }
              onMouseLeave={(e) => Object.assign(e.target.style, styles.button)}
            >
              Let's Get Started
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Create Account
  if (step === 2) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.progressBar}>
            <div
              style={{ ...styles.progressDot, ...styles.progressDotActive }}
            ></div>
            <div
              style={{ ...styles.progressDot, ...styles.progressDotActive }}
            ></div>
            <div
              style={{ ...styles.progressDot, ...styles.progressDotInactive }}
            ></div>
          </div>

          <div style={styles.icon}>
            <Users size={40} color="#f59e0b" />
          </div>

          <h1 style={styles.title}>Name Your Group</h1>
          <p style={styles.subtitle}>
            What would you like to call your shared expense account? You can
            always change this later.
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              placeholder="Our Expenses"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, styles.input)}
              disabled={isLoading}
              required
              autoFocus
            />

            <div style={styles.suggestions}>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setName(suggestion)}
                  style={styles.suggestion}
                  onMouseEnter={(e) =>
                    Object.assign(e.target.style, styles.suggestionHover)
                  }
                  onMouseLeave={(e) =>
                    Object.assign(e.target.style, styles.suggestion)
                  }
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              style={{
                ...styles.button,
                ...(isLoading || !name.trim() ? styles.buttonDisabled : {}),
              }}
              onMouseEnter={(e) => {
                if (!isLoading && name.trim()) {
                  Object.assign(e.target.style, {
                    ...styles.button,
                    ...styles.buttonHover,
                  });
                }
              }}
              onMouseLeave={(e) => Object.assign(e.target.style, styles.button)}
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Create Our Group
                </>
              )}
            </button>

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
          </form>
        </div>
      </div>
    );
  }

  // Step 3: Invite Partner
  if (step === 3) {
    const inviteLink = createdGroup?.inviteToken
      ? `${window.location.origin}/join/${createdGroup.inviteToken}`
      : '';

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.progressBar}>
            <div
              style={{ ...styles.progressDot, ...styles.progressDotActive }}
            ></div>
            <div
              style={{ ...styles.progressDot, ...styles.progressDotActive }}
            ></div>
            <div
              style={{ ...styles.progressDot, ...styles.progressDotActive }}
            ></div>
          </div>

          <div style={styles.icon}>
            <CheckCircle size={40} color="#16a34a" />
          </div>

          <h1 style={styles.title}>Perfect! Now Invite Your Partner</h1>
          <p style={styles.subtitle}>
            Share this link with your partner so they can join "
            {createdGroup?.name}" and start tracking expenses together.
          </p>

          <div style={styles.inviteSection}>
            <h3 style={styles.inviteTitle}>Invite Your Partner</h3>
            <p style={styles.inviteText}>
              Send this link via text, email, or however you usually share
              things:
            </p>

            <div style={styles.inviteLink}>{inviteLink}</div>

            <button
              onClick={handleCopyInvite}
              style={{
                ...styles.copyButton,
                ...(inviteCopied ? styles.copyButtonSuccess : {}),
              }}
            >
              {inviteCopied ? <Check size={16} /> : <Copy size={16} />}
              {inviteCopied ? 'Copied!' : 'Copy Invite Link'}
            </button>
          </div>

          <div style={{ ...styles.buttonContainer }}>
            <button
              onClick={handleFinish}
              style={styles.button}
              onMouseEnter={(e) =>
                Object.assign(e.target.style, styles.buttonHover)
              }
              onMouseLeave={(e) => Object.assign(e.target.style, styles.button)}
            >
              Start Tracking Expenses
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  return null;
};

export default OnboardingGroupForm;
