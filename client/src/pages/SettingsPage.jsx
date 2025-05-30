import React from 'react';
import ProfileSettings from '../components/ProfileSettings';

const SettingsPage = () => {
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    centerContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
    },
  };

  return (
    <div styles={styles.centerContainer}>
      <div styles={styles.container}>
        <ProfileSettings />
      </div>
    </div>
  );
};

export default SettingsPage;
