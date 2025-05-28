// src/pages/BudgetsPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import BudgetManagement from '../components/BudgetManagement';
import { getGroupById } from '../services/groupService';
import { AlertTriangle, Loader } from 'lucide-react';
import { useParams } from 'react-router-dom';

const BudgetsPage = () => {
  const { groupId } = useParams();
  const { user } = useContext(AuthContext);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) {
        setError('No group selected');
        setLoading(false);
        return;
      }

      try {
        const groupData = await getGroupById(groupId);
        setGroup(groupData);
      } catch (err) {
        console.error('Error fetching group:', err);
        setError('Failed to load group information');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

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
    messageCard: {
      textAlign: 'center',
      maxWidth: '400px',
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #f3f4f6',
    },
    icon: {
      margin: '0 auto 16px',
    },
    title: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      margin: '0 0 8px 0',
    },
    text: {
      color: '#6b7280',
      fontSize: '16px',
      margin: '0 0 24px 0',
    },
    retryButton: {
      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s ease',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.centerContainer}>
          <div style={styles.messageCard}>
            <div style={{ ...styles.icon, color: '#2563eb' }}>
              <Loader size={48} className="animate-spin" />
            </div>
            <h2 style={styles.title}>Loading...</h2>
            <p style={styles.text}>Please wait while we load your budgets</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div style={styles.container}>
        <div style={styles.centerContainer}>
          <div style={styles.messageCard}>
            <div style={{ ...styles.icon, color: '#dc2626' }}>
              <AlertTriangle size={48} />
            </div>
            <h2 style={styles.title}>Unable to Load</h2>
            <p style={styles.text}>
              {error || "Group not found or you don't have access"}
            </p>
            <button
              style={styles.retryButton}
              onClick={() => window.location.reload()}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <BudgetManagement groupId={groupId} />
    </div>
  );
};

export default BudgetsPage;
