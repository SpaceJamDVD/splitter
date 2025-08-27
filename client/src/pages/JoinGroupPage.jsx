// src/pages/JoinGroupPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import RegisterForm from '../components/RegisterForm';
import { getInviteInfo, joinGroupWithToken } from '../services/groupService';

const JoinGroupPage = () => {
  const { inviteToken } = useParams();
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  // Fetch group info on mount / token change
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const response = await getInviteInfo(inviteToken);
        if (isMounted) setGroupInfo(response);
      } catch (err) {
        if (isMounted) setError('Invalid or expired invite link');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [inviteToken]);

  // Auto-join for authenticated users who aren't members
  useEffect(() => {
    if (!user || !groupInfo || joining) return;

    const isAlreadyMember = groupInfo.members?.some(
      (member) => member._id === user.id
    );

    if (isAlreadyMember) {
      navigate('/dashboard');
    } else {
      // inline async join for signed-in users
      (async () => {
        setJoining(true);
        setError('');
        try {
          const response = await joinGroupWithToken(inviteToken, {});

          // If server created a new user (edge-case), refresh session
          if (!user && response?.isNewUser) {
            await login();
          }

          navigate('/dashboard');
        } catch (err) {
          console.error('Join group error:', err);
          setError(err?.response?.data?.error || 'Failed to join group');
          setJoining(false);
        }
      })();
    }
  }, [user, groupInfo, joining, inviteToken, login, navigate]);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    errorContainer: {
      background: 'white',
      padding: '40px',
      borderRadius: '16px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
      maxWidth: '400px',
    },
    errorTitle: {
      color: '#dc2626',
      fontSize: '20px',
      fontWeight: '600',
      margin: '0 0 8px 0',
    },
    errorText: {
      color: '#6b7280',
      fontSize: '14px',
      margin: 0,
    },
    loadingContainer: {
      background: 'white',
      padding: '40px',
      borderRadius: '16px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
    },
    loadingText: {
      color: '#6b7280',
      fontSize: '16px',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <p style={styles.loadingText}>Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error && !groupInfo) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Oops!</h2>
          <p style={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  if (joining) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <p style={styles.loadingText}>Joining group...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.container}>
        <RegisterForm
          mode="join"
          inviteToken={inviteToken}
          groupName={groupInfo?.groupName}
          error={error}
          onJoinGroup={async (userData = null) => {
            if (joining) return;

            if (
              !user &&
              (!userData || !userData.username || !userData.password)
            ) {
              setError('Please provide a username and password to join');
              return;
            }

            setJoining(true);
            setError('');
            try {
              const requestData = userData || {};
              const response = await joinGroupWithToken(
                inviteToken,
                requestData
              );

              if (!user && response?.isNewUser) {
                await login();
              }

              navigate('/dashboard');
            } catch (err) {
              console.error('Join group error:', err);
              setError(err?.response?.data?.error || 'Failed to join group');
              setJoining(false);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.loadingContainer}>
        <p style={styles.loadingText}>Joining group...</p>
      </div>
    </div>
  );
};

export default JoinGroupPage;
