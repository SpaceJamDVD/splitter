import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getMyGroups } from '../services/groupService';
import { useNavigate } from 'react-router-dom';
import GroupForm from '../components/GroupForm';
import GroupCard from '../components/GroupCard';
import { Plus, Users, Calendar, TrendingUp } from 'lucide-react';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const result = await getMyGroups();
        setGroups(result);
      } catch (err) {
        console.error('Failed to fetch groups', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleCreateGroup = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleGroupCreated = () => {
    // Refresh groups after creating a new one
    const fetchGroups = async () => {
      try {
        const result = await getMyGroups();
        setGroups(result);
      } catch (err) {
        console.error('Failed to fetch groups', err);
      }
    };
    fetchGroups();
    setShowModal(false);
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
      minHeight: '100vh',
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
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '16px',
      margin: 0,
    },
    welcomeCard: {
      background: 'white',
      borderRadius: '16px',
      boxShadow:
        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      padding: '24px',
      marginBottom: '32px',
      border: '1px solid #f3f4f6',
    },
    welcomeHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px',
      flexWrap: 'wrap',
      gap: '16px',
    },
    welcomeTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      margin: 0,
    },
    newGroupButton: {
      background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '12px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    newGroupButtonHover: {
      transform: 'scale(1.05)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '32px',
    },
    statCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #f3f4f6',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    statIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statIconBlue: {
      background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
    },
    statIconGreen: {
      background: 'linear-gradient(135deg, #dcfce7 0%, #ecfdf5 100%)',
    },
    statIconPurple: {
      background: 'linear-gradient(135deg, #faf5ff 0%, #fce7f3 100%)',
    },
    statContent: {
      flex: 1,
    },
    statValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#111827',
      margin: '0 0 4px 0',
    },
    statLabel: {
      fontSize: '14px',
      color: '#6b7280',
      margin: 0,
    },
    groupsSection: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #f3f4f6',
      overflow: 'hidden',
    },
    groupsHeader: {
      padding: '20px 24px',
      borderBottom: '1px solid #f3f4f6',
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    groupsTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: 0,
    },
    groupsContent: {
      padding: '24px',
    },
    loadingState: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px',
      color: '#6b7280',
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 24px',
    },
    emptyIcon: {
      width: '64px',
      height: '64px',
      margin: '0 auto 16px',
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      color: '#374151',
      fontSize: '18px',
      fontWeight: '600',
      margin: '0 0 8px 0',
    },
    emptySubtitle: {
      color: '#6b7280',
      fontSize: '14px',
      margin: '0 0 24px 0',
    },
    groupsList: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '20px',
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    },
    modalContent: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '80vh',
      overflow: 'auto',
      position: 'relative',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    closeButton: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      border: 'none',
      borderRadius: '8px',
      width: '32px',
      height: '32px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6b7280',
      fontSize: '16px',
      fontWeight: 'bold',
      transition: 'all 0.2s ease',
    },
    closeButtonHover: {
      background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
      color: '#374151',
    },
  };

  // Calculate some basic stats
  const totalGroups = groups.length;
  const activeGroups = groups.filter(
    (group) => group.isActive !== false
  ).length;
  const recentGroups = groups.filter((group) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(group.createdAt || group.updatedAt) > weekAgo;
  }).length;

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <h1 style={styles.title}>Welcome back, {user?.username || 'User'}!</h1>
        <p style={styles.subtitle}>Track your shared expenses together</p>
      </div>

      {/* Quick Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, ...styles.statIconBlue }}>
            <Users size={24} color="#2563eb" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statValue}>{totalGroups}</p>
            <p style={styles.statLabel}>Expense Categories</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, ...styles.statIconGreen }}>
            <TrendingUp size={24} color="#16a34a" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statValue}>{activeGroups}</p>
            <p style={styles.statLabel}>Active Budgets</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, ...styles.statIconPurple }}>
            <Calendar size={24} color="#7c3aed" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statValue}>{recentGroups}</p>
            <p style={styles.statLabel}>This Week</p>
          </div>
        </div>
      </div>

      {/* Groups Section */}
      <div style={styles.groupsSection}>
        <div style={styles.groupsHeader}>
          <h2 style={styles.groupsTitle}>
            <Users size={20} color="#6b7280" />
            Our Expense Categories
          </h2>
          <button
            onClick={handleCreateGroup}
            style={styles.newGroupButton}
            onMouseEnter={(e) =>
              Object.assign(e.target.style, styles.newGroupButtonHover)
            }
            onMouseLeave={(e) =>
              Object.assign(e.target.style, styles.newGroupButton)
            }
          >
            <Plus size={16} />
            New Category
          </button>
        </div>

        <div style={styles.groupsContent}>
          {loading ? (
            <div style={styles.loadingState}>
              <p>Loading groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <Users size={32} color="#9ca3af" />
              </div>
              <h3 style={styles.emptyTitle}>No expense categories yet</h3>
              <p style={styles.emptySubtitle}>
                Create your first category to start tracking shared expenses
                together.
              </p>
              <button
                onClick={handleCreateGroup}
                style={styles.newGroupButton}
                onMouseEnter={(e) =>
                  Object.assign(e.target.style, styles.newGroupButtonHover)
                }
                onMouseLeave={(e) =>
                  Object.assign(e.target.style, styles.newGroupButton)
                }
              >
                <Plus size={16} />
                Create Your First Category
              </button>
            </div>
          ) : (
            <ul style={styles.groupsList}>
              {groups.map((group) => (
                <GroupCard key={group._id} group={group} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              style={styles.closeButton}
              onClick={handleCloseModal}
              onMouseEnter={(e) =>
                Object.assign(e.target.style, styles.closeButtonHover)
              }
              onMouseLeave={(e) =>
                Object.assign(e.target.style, styles.closeButton)
              }
            >
              ✕
            </button>
            <GroupForm onSuccess={handleGroupCreated} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
