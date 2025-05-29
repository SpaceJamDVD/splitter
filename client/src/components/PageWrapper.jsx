import React from 'react';

function PageWrapper({ children }) {
  const styles = {
    wrapper: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f7f7f7',
    },
  };

  return <div style={styles.wrapper}>{children}</div>;
}

export default PageWrapper;
