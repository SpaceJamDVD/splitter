import React, { useState } from 'react';
import authService from '../services/authService';
import { AuthContext } from '../contexts/AuthContext';
import { useContext } from 'react';
import { User, Save, Check, AlertCircle, Loader } from 'lucide-react';

const ProfileSettings = ({ user }) => {
  const [formData, setFormData] = useState({
    firstName: user.fullName?.split(' ')[0] || '',
    lastName: user.fullName?.split(' ')[1] || '',
    username: user.username || '',
    currency: user.profile?.currency || 'USD',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { updateUser } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await authService.updateProfile(formData);

      if (res.success) {
        updateUser(res.user); // Update user in context
        setMessage('Profile updated successfully!');
      } else {
        setMessage(res.error);
      }
    } catch (err) {
      setMessage('An error occurred while updating.');
    } finally {
      setSaving(false);
    }
  };

  const styles = {
    formCard: {
      background: 'white',
      borderRadius: '16px',
      boxShadow:
        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: '1px solid #f3f4f6',
      overflow: 'hidden',
      maxWidth: '600px',
      width: '100%',
    },
    formHeader: {
      padding: '24px',
      borderBottom: '1px solid #f3f4f6',
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
    },
    formTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      margin: 0,
    },
    formBody: {
      padding: '32px',
    },
    formGrid: {
      display: 'grid',
      gap: '24px',
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
    },
    input: {
      padding: '12px 16px',
      fontSize: '15px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: '#f9fafb',
      transition: 'all 0.2s ease',
      outline: 'none',
      width: '100%',
      fontFamily: 'inherit',
    },
    select: {
      padding: '12px 16px',
      fontSize: '15px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: '#f9fafb',
      transition: 'all 0.2s ease',
      outline: 'none',
      width: '100%',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    formFooter: {
      padding: '24px 32px',
      borderTop: '1px solid #f3f4f6',
      background: '#f9fafb',
    },
    buttonGroup: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
    },
    saveButton: {
      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      color: 'white',
      padding: '12px 32px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    saveButtonDisabled: {
      background: '#9ca3af',
      cursor: 'not-allowed',
    },
    message: {
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flex: 1,
      minWidth: '200px',
    },
    successMessage: {
      backgroundColor: '#dcfce7',
      color: '#16a34a',
      border: '1px solid #bbf7d0',
    },
    errorMessage: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca',
    },
  };

  const isSuccessMessage = message && message.toLowerCase().includes('success');

  return (
    <div style={styles.formCard}>
      <div style={styles.formHeader}>
        <h2 style={styles.formTitle}>
          <User size={24} color="#2563eb" />
          Profile Settings
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={styles.formBody}>
          <div style={styles.formGrid}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  First Name:
                  <input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    style={styles.input}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow =
                        '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </label>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Last Name:
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    style={styles.input}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow =
                        '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </label>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Username:
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  style={styles.input}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.boxShadow =
                      '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </label>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Currency:
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  style={styles.select}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.boxShadow =
                      '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="USD">USD – $</option>
                  <option value="EUR">EUR – €</option>
                  <option value="GBP">GBP – £</option>
                  <option value="CAD">CAD – $</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div style={styles.formFooter}>
          <div style={styles.buttonGroup}>
            {message && (
              <div
                style={{
                  ...styles.message,
                  ...(isSuccessMessage
                    ? styles.successMessage
                    : styles.errorMessage),
                }}
              >
                {isSuccessMessage ? (
                  <Check size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.saveButton,
                ...(saving ? styles.saveButtonDisabled : {}),
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.boxShadow =
                    '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              {saving ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
