import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Globe,
  DollarSign,
  Bell,
  Shield,
  Save,
  Loader,
  Check,
  AlertTriangle,
  Edit3,
} from 'lucide-react';

const ProfileSettings = ({ user, onUpdateUser }) => {
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    timezone: '',
    currency: '',
  });

  const [preferences, setPreferences] = useState({
    notifications: {
      email: {
        budgetAlerts: true,
        transactionUpdates: true,
        weeklyReports: false,
      },
      push: {
        budgetAlerts: true,
        transactionUpdates: false,
      },
    },
    privacy: {
      showProfileToGroupMembers: true,
      shareExpenseDetails: true,
    },
  });

  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [errors, setErrors] = useState({});
  const [activeSection, setActiveSection] = useState('profile');

  // Common timezones
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];

  // Common currencies
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  ];

  // Mock user data for demonstration
  const mockUser = user || {
    email: 'user@example.com',
    isEmailVerified: true,
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      timezone: 'America/New_York',
      currency: 'USD',
    },
    preferences: {
      notifications: {
        email: {
          budgetAlerts: true,
          transactionUpdates: true,
          weeklyReports: false,
        },
        push: {
          budgetAlerts: true,
          transactionUpdates: false,
        },
      },
      privacy: {
        showProfileToGroupMembers: true,
        shareExpenseDetails: true,
      },
    },
  };

  useEffect(() => {
    // Only run on mount or when user prop changes
    if (user) {
      setProfileData({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        timezone: user.profile?.timezone || 'America/New_York',
        currency: user.profile?.currency || 'USD',
      });

      if (user.preferences) {
        setPreferences(user.preferences);
      }
    } else {
      // Set default values if no user
      setProfileData({
        firstName: 'John',
        lastName: 'Doe',
        timezone: 'America/New_York',
        currency: 'USD',
      });
    }
  }, [user]);

  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handlePreferenceChange = (category, subcategory, field, value) => {
    if (subcategory) {
      setPreferences((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [subcategory]: {
            ...prev[category][subcategory],
            [field]: value,
          },
        },
      }));
    } else {
      setPreferences((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value,
        },
      }));
    }
  };

  const validateProfile = () => {
    const newErrors = {};

    if (!profileData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!profileData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    setLoading(true);
    setSaveStatus('');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In real implementation, call your auth service here
      // const result = await authService.updateProfile(profileData);

      if (onUpdateUser) {
        onUpdateUser({
          ...mockUser,
          profile: { ...mockUser.profile, ...profileData },
        });
      }

      setSaveStatus('profile-success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setErrors({ submit: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    setSaveStatus('');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In real implementation, call your auth service here
      // const result = await authService.updatePreferences(preferences);

      if (onUpdateUser) {
        onUpdateUser({ ...mockUser, preferences });
      }

      setSaveStatus('preferences-success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setErrors({ submit: 'Failed to update preferences' });
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '24px',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      marginBottom: '32px',
    },
    title: {
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '8px',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '16px',
      margin: 0,
    },
    tabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      borderBottom: '2px solid #f3f4f6',
      paddingBottom: '0',
    },
    tab: {
      padding: '12px 24px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#6b7280',
      borderBottom: '2px solid transparent',
      transition: 'all 0.2s ease',
      marginBottom: '-2px',
    },
    activeTab: {
      color: '#2563eb',
      borderBottomColor: '#2563eb',
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      boxShadow:
        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      padding: '32px',
      marginBottom: '24px',
      border: '1px solid #f3f4f6',
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    formGrid: {
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
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    input: {
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box',
    },
    inputError: {
      borderColor: '#dc2626',
    },
    inputFocus: {
      borderColor: '#2563eb',
      boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
    },
    select: {
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      outline: 'none',
      cursor: 'pointer',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 16px center',
      paddingRight: '40px',
    },
    errorText: {
      fontSize: '12px',
      color: '#dc2626',
      marginTop: '4px',
    },
    notificationGroup: {
      marginBottom: '24px',
    },
    notificationCategory: {
      fontSize: '16px',
      fontWeight: '500',
      color: '#111827',
      marginBottom: '12px',
      textTransform: 'capitalize',
    },
    checkboxGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#374151',
      padding: '8px 0',
    },
    checkbox: {
      width: '20px',
      height: '20px',
      borderRadius: '4px',
      border: '2px solid #e5e7eb',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    checkboxChecked: {
      backgroundColor: '#2563eb',
      borderColor: '#2563eb',
    },
    saveButton: {
      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '24px',
    },
    saveButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    successMessage: {
      padding: '12px 16px',
      background: '#dcfce7',
      borderLeft: '4px solid #22c55e',
      color: '#16a34a',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '16px',
      borderRadius: '0 8px 8px 0',
      fontSize: '14px',
    },
    errorMessage: {
      padding: '12px 16px',
      background: '#fef2f2',
      borderLeft: '4px solid #dc2626',
      color: '#dc2626',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '16px',
      borderRadius: '0 8px 8px 0',
      fontSize: '14px',
    },
    infoCard: {
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid #0284c7',
      marginBottom: '24px',
    },
    infoText: {
      fontSize: '14px',
      color: '#0c4a6e',
      margin: 0,
      lineHeight: 1.5,
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          <User size={32} color="#2563eb" />
          Profile Settings
        </h1>
        <p style={styles.subtitle}>
          Manage your personal information and preferences
        </p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeSection === 'profile' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveSection('profile')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={16} />
            Profile Information
          </span>
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeSection === 'preferences' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveSection('preferences')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} />
            Notifications & Privacy
          </span>
        </button>
      </div>

      {/* Profile Section */}
      {activeSection === 'profile' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            <User size={20} color="#6b7280" />
            Personal Information
          </h2>

          <div style={styles.infoCard}>
            <p style={styles.infoText}>
              <Mail
                size={16}
                style={{ display: 'inline', marginRight: '8px' }}
              />
              Account email: <strong>{mockUser?.email}</strong>
              {mockUser?.isEmailVerified && (
                <span style={{ color: '#16a34a', marginLeft: '8px' }}>
                  <Check size={16} style={{ display: 'inline' }} /> Verified
                </span>
              )}
            </p>
          </div>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>First Name</label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) =>
                  handleProfileChange('firstName', e.target.value)
                }
                style={{
                  ...styles.input,
                  ...(errors.firstName ? styles.inputError : {}),
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563eb';
                  e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.firstName
                    ? '#dc2626'
                    : '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter your first name"
              />
              {errors.firstName && (
                <span style={styles.errorText}>{errors.firstName}</span>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Last Name</label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) =>
                  handleProfileChange('lastName', e.target.value)
                }
                style={{
                  ...styles.input,
                  ...(errors.lastName ? styles.inputError : {}),
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563eb';
                  e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.lastName
                    ? '#dc2626'
                    : '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter your last name"
              />
              {errors.lastName && (
                <span style={styles.errorText}>{errors.lastName}</span>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <Globe size={16} />
                Timezone
              </label>
              <select
                value={profileData.timezone}
                onChange={(e) =>
                  handleProfileChange('timezone', e.target.value)
                }
                style={styles.select}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563eb';
                  e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <DollarSign size={16} />
                Currency
              </label>
              <select
                value={profileData.currency}
                onChange={(e) =>
                  handleProfileChange('currency', e.target.value)
                }
                style={styles.select}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563eb';
                  e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            style={{
              ...styles.saveButton,
              ...(loading ? styles.saveButtonDisabled : {}),
            }}
            onClick={handleSaveProfile}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
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
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Profile
              </>
            )}
          </button>

          {saveStatus === 'profile-success' && (
            <div style={styles.successMessage}>
              <Check size={20} />
              Profile updated successfully!
            </div>
          )}

          {errors.submit && (
            <div style={styles.errorMessage}>
              <AlertTriangle size={20} />
              {errors.submit}
            </div>
          )}
        </div>
      )}

      {/* Preferences Section */}
      {activeSection === 'preferences' && (
        <>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>
              <Bell size={20} color="#6b7280" />
              Notification Preferences
            </h2>

            <div style={styles.notificationGroup}>
              <h3 style={styles.notificationCategory}>Email Notifications</h3>
              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <div
                    style={{
                      ...styles.checkbox,
                      ...(preferences.notifications.email.budgetAlerts
                        ? styles.checkboxChecked
                        : {}),
                    }}
                    onClick={() =>
                      handlePreferenceChange(
                        'notifications',
                        'email',
                        'budgetAlerts',
                        !preferences.notifications.email.budgetAlerts
                      )
                    }
                  >
                    {preferences.notifications.email.budgetAlerts && (
                      <Check size={14} color="white" />
                    )}
                  </div>
                  Budget alerts when spending exceeds limits
                </label>

                <label style={styles.checkboxLabel}>
                  <div
                    style={{
                      ...styles.checkbox,
                      ...(preferences.notifications.email.transactionUpdates
                        ? styles.checkboxChecked
                        : {}),
                    }}
                    onClick={() =>
                      handlePreferenceChange(
                        'notifications',
                        'email',
                        'transactionUpdates',
                        !preferences.notifications.email.transactionUpdates
                      )
                    }
                  >
                    {preferences.notifications.email.transactionUpdates && (
                      <Check size={14} color="white" />
                    )}
                  </div>
                  Transaction updates from group members
                </label>

                <label style={styles.checkboxLabel}>
                  <div
                    style={{
                      ...styles.checkbox,
                      ...(preferences.notifications.email.weeklyReports
                        ? styles.checkboxChecked
                        : {}),
                    }}
                    onClick={() =>
                      handlePreferenceChange(
                        'notifications',
                        'email',
                        'weeklyReports',
                        !preferences.notifications.email.weeklyReports
                      )
                    }
                  >
                    {preferences.notifications.email.weeklyReports && (
                      <Check size={14} color="white" />
                    )}
                  </div>
                  Weekly spending reports
                </label>
              </div>
            </div>

            <div style={styles.notificationGroup}>
              <h3 style={styles.notificationCategory}>Push Notifications</h3>
              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <div
                    style={{
                      ...styles.checkbox,
                      ...(preferences.notifications.push.budgetAlerts
                        ? styles.checkboxChecked
                        : {}),
                    }}
                    onClick={() =>
                      handlePreferenceChange(
                        'notifications',
                        'push',
                        'budgetAlerts',
                        !preferences.notifications.push.budgetAlerts
                      )
                    }
                  >
                    {preferences.notifications.push.budgetAlerts && (
                      <Check size={14} color="white" />
                    )}
                  </div>
                  Budget alerts when spending exceeds limits
                </label>

                <label style={styles.checkboxLabel}>
                  <div
                    style={{
                      ...styles.checkbox,
                      ...(preferences.notifications.push.transactionUpdates
                        ? styles.checkboxChecked
                        : {}),
                    }}
                    onClick={() =>
                      handlePreferenceChange(
                        'notifications',
                        'push',
                        'transactionUpdates',
                        !preferences.notifications.push.transactionUpdates
                      )
                    }
                  >
                    {preferences.notifications.push.transactionUpdates && (
                      <Check size={14} color="white" />
                    )}
                  </div>
                  Real-time transaction notifications
                </label>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>
              <Shield size={20} color="#6b7280" />
              Privacy Settings
            </h2>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <div
                  style={{
                    ...styles.checkbox,
                    ...(preferences.privacy?.showProfileToGroupMembers
                      ? styles.checkboxChecked
                      : {}),
                  }}
                  onClick={() =>
                    handlePreferenceChange(
                      'privacy',
                      null,
                      'showProfileToGroupMembers',
                      !preferences.privacy?.showProfileToGroupMembers
                    )
                  }
                >
                  {preferences.privacy?.showProfileToGroupMembers && (
                    <Check size={14} color="white" />
                  )}
                </div>
                Show my profile to group members
              </label>

              <label style={styles.checkboxLabel}>
                <div
                  style={{
                    ...styles.checkbox,
                    ...(preferences.privacy?.shareExpenseDetails
                      ? styles.checkboxChecked
                      : {}),
                  }}
                  onClick={() =>
                    handlePreferenceChange(
                      'privacy',
                      null,
                      'shareExpenseDetails',
                      !preferences.privacy?.shareExpenseDetails
                    )
                  }
                >
                  {preferences.privacy?.shareExpenseDetails && (
                    <Check size={14} color="white" />
                  )}
                </div>
                Share detailed expense information with group members
              </label>
            </div>

            <button
              style={{
                ...styles.saveButton,
                ...(loading ? styles.saveButtonDisabled : {}),
              }}
              onClick={handleSavePreferences}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
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
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Preferences
                </>
              )}
            </button>

            {saveStatus === 'preferences-success' && (
              <div style={styles.successMessage}>
                <Check size={20} />
                Preferences updated successfully!
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileSettings;
