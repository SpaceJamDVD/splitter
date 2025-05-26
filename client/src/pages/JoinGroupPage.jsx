// src/pages/JoinGroupPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import LoginForm from '../components/LoginForm';
import { getInviteInfo, joinGroupWithToken } from '../services/groupService';

const JoinGroupPage = () => {
  const { inviteToken } = useParams();
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  // Fetch group info on mount
  useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        const response = await getInviteInfo(inviteToken);
        setGroupInfo(response);
      } catch (err) {
        setError('Invalid or expired invite link');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupInfo();
  }, [inviteToken]);

  // Auto-join for authenticated users who aren't members
  useEffect(() => {
    if (user && groupInfo && !joining) {
      // Check if user is already a member
      const isAlreadyMember = groupInfo.members?.some(
        (member) => member._id === user.userId
      );

      if (isAlreadyMember) {
        console.log('User is already a member, redirecting...');
        navigate('/dashboard');
        return;
      }

      // User is logged in but not a member - join them automatically
      handleJoinGroup();
    }
  }, [user, groupInfo, joining]);

  const handleJoinGroup = async (userData = null) => {
    if (joining) return;

    // IMPORTANT: Only proceed if we have valid user data for new users
    // or if the user is already authenticated
    if (!user && (!userData || !userData.username || !userData.password)) {
      setError('Please provide a username and password to join');
      return;
    }

    setJoining(true);
    setError(''); // Clear any previous errors

    try {
      // Only pass userData if it exists and has required fields
      const requestData =
        userData && userData.username && userData.password
          ? userData
          : undefined;

      const response = await joinGroupWithToken(inviteToken, requestData);

      // If new user was created, log them in
      if (response.token) {
        await login(response.token);
      }

      // Navigate to the dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Join group error:', err);
      setError(err.response?.data?.error || 'Failed to join group');
      setJoining(false); // Reset joining state on error
    }
  };

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

  // Show login form for non-authenticated users
  if (!user) {
    return (
      <div style={styles.container}>
        <LoginForm
          mode="join"
          inviteToken={inviteToken}
          groupName={groupInfo?.groupName}
          onJoinGroup={handleJoinGroup}
          error={error}
        />
      </div>
    );
  }

  // This shouldn't be reached due to auto-join effect, but just in case
  return (
    <div style={styles.container}>
      <div style={styles.loadingContainer}>
        <p style={styles.loadingText}>Joining group...</p>
      </div>
    </div>
  );
};

export default JoinGroupPage;
