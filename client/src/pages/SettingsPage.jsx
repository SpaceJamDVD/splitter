import React, { useContext } from 'react';
import ProfileSettings from '../components/ProfileSettings';
import { AuthContext } from '../contexts/AuthContext';

const SettingsPage = () => {
  const { user } = useContext(AuthContext); // Get user from context

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    contentWrapper: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
    },
    header: {
      marginBottom: '32px',
    },
    title: {
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#111827',
      margin: '0 0 8px 0',
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '16px',
      margin: 0,
    },
    settingsContainer: {
      display: 'flex',
      justifyContent: 'center',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>
            Manage your account preferences and profile information
          </p>
        </div>

        <div style={styles.settingsContainer}>
          <ProfileSettings user={user} />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
