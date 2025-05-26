// src/pages/JoinGroupPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import LoginForm from '../components/LoginForm';
import API from '../api';

const JoinGroupPage = () => {
  const { inviteToken } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        // Get group info from invite token
        const response = await API.get(`/groups/invite/${inviteToken}`);
        setGroupInfo(response.data);
      } catch (err) {
        setError('Invalid or expired invite link');
      } finally {
        setLoading(false);
      }
    };

    // If user is already logged in, try to join directly
    if (user) {
      handleJoinExistingUser();
    } else {
      fetchGroupInfo();
    }
  }, [user, inviteToken]);

  const handleJoinExistingUser = async () => {
    try {
      const response = await API.post(`/groups/join/${inviteToken}`);
      if (response.data.message) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Failed to join group');
      setLoading(false);
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
          <p style={styles.loadingText}>
            {user ? 'Joining group...' : 'Loading invite...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Oops!</h2>
          <p style={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <LoginForm
        mode="join"
        inviteToken={inviteToken}
        groupName={groupInfo?.groupName}
      />
    </div>
  );
};

export default JoinGroupPage;
