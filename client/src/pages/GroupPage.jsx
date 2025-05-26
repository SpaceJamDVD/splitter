import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { useParams } from 'react-router-dom';
import GroupForm from '../components/GroupForm';
import { getGroupById, getUserGroup } from '../services/groupService';
import {
  Users,
  Plus,
  Link2,
  Copy,
  X,
  UserPlus,
  CreditCard,
} from 'lucide-react';

const GroupPage = () => {
  const { id } = useParams();
  // If no ID from URL, get user's first group
  const [shouldGetUserGroup, setShouldGetUserGroup] = useState(!id);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showInviteButton, setShowInviteButton] = useState(false);

  useEffect(() => {
    const loadGroup = async () => {
      try {
        let data;
        if (id) {
          data = await getGroupById(id);
        } else {
          data = await getUserGroup(); // Returns group object or null
          if (!data) {
            setShowCreateGroup(true);
            setLoading(false);
            return;
          }
          // data is already the full group with populated members
        }
        setGroup(data);
        setShowInviteButton(data.members?.length < 2);
      } catch (err) {
        console.error(err);
        setError('Failed to load group');
      } finally {
        setLoading(false);
      }
    };

    loadGroup();
  }, [id]);

  const inviteLink = `${window.location.origin}/join/${group?.inviteToken}`;

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleGroupCreated = (newGroup) => {
    setGroup(newGroup);
    setShowCreateGroup(false);
  };

  const styles = {
    container: {
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
      minHeight: '100vh',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    content: {
      padding: '40px',
      maxWidth: '1200px',
    },
    loadingContainer: {
      padding: '40px',
      color: '#6b7280',
      fontSize: '16px',
    },
    errorContainer: {
      padding: '40px',
      color: '#dc2626',
      fontSize: '16px',
    },
    header: {
      marginBottom: '40px',
    },
    titleRow: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '24px',
      marginBottom: '8px',
      flexWrap: 'wrap',
    },
    titleSection: {
      flex: 1,
      minWidth: '300px',
    },
    title: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#111827',
      margin: '0 0 8px 0',
      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    description: {
      fontSize: '18px',
      color: '#6b7280',
      margin: 0,
      lineHeight: '1.6',
    },
    headerButtons: {
      display: 'flex',
      gap: '12px',
      alignSelf: 'flex-start',
      alignItems: 'center',
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 24px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(0)', // Explicitly set default transform
    },
    inviteButton: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
    },
    transactionButton: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white',
    },
    buttonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
    membersToggle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 24px',
      background: showMembers
        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
        : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      color: showMembers ? 'white' : '#374151',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      height: 'fit-content',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(0)', // Explicitly set default transform
    },
    membersSection: {
      marginTop: '24px',
      marginBottom: '32px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    },
    membersCard: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #f3f4f6',
      overflow: 'hidden',
    },
    membersHeader: {
      padding: '20px 24px',
      borderBottom: '1px solid #f3f4f6',
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    membersTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      margin: 0,
    },
    membersList: {
      padding: '24px',
      listStyle: 'none',
      margin: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '16px',
    },
    memberItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
    },
    memberAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '600',
      fontSize: '16px',
    },
    memberName: {
      fontSize: '16px',
      fontWeight: '500',
      color: '#111827',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    },
    modalContent: {
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      minWidth: '400px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      overflow: 'auto',
      animation: 'modalSlideIn 0.3s ease-out',
    },
    modalHeader: {
      padding: '24px 24px 16px',
      borderBottom: '1px solid #f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      color: '#6b7280',
      transition: 'all 0.2s ease',
      backgroundColor: 'transparent', // Explicitly set default
    },
    closeButtonHover: {
      backgroundColor: '#f3f4f6',
      color: '#111827',
    },
    modalBody: {
      padding: '24px',
    },
    inviteLink: {
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '12px',
      wordBreak: 'break-all',
      fontSize: '14px',
      color: '#374151',
      marginBottom: '16px',
      fontFamily: 'monospace',
    },
    copyButton: {
      background: copySuccess
        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      width: '100%',
      justifyContent: 'center',
    },
  };

  // Add keyframe animation for modal
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;
  if (!document.head.contains(styleElement)) {
    document.head.appendChild(styleElement);
  }

  // Show create group onboarding if no groups exist
  if (showCreateGroup) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h1>Welcome to OurExpenses!</h1>
            <p>Let's create your first shared expense account.</p>

            <GroupForm onSuccess={handleGroupCreated} />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.loadingContainer}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.errorContainer}>{error}</div>
        </div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <div style={styles.titleSection}>
              <h1 style={styles.title}>{group.name}</h1>
              <p style={styles.description}>{group.description}</p>
            </div>

            <div style={styles.headerButtons}>
              <button
                onClick={() => setShowMembers(!showMembers)}
                style={{
                  ...styles.membersToggle,
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow =
                    '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow =
                    '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
              >
                <Users size={16} />
                {showMembers ? 'Hide' : 'Show'} Members (
                {group.members?.length || 0})
              </button>

              {showInviteButton && (
                <button
                  onClick={() => setShowModal(true)}
                  style={{ ...styles.button, ...styles.inviteButton }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow =
                      '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow =
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <UserPlus size={16} />
                  Invite Member
                </button>
              )}

              <button
                onClick={() => setShowTransactionModal(true)}
                style={{ ...styles.button, ...styles.transactionButton }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow =
                    '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow =
                    '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
              >
                <Plus size={16} />
                Add Transaction
              </button>
            </div>
          </div>
        </div>

        {/* Members Section - Collapsible */}
        {showMembers && (
          <div style={styles.membersSection}>
            <div style={styles.membersCard}>
              <div style={styles.membersHeader}>
                <h3 style={styles.membersTitle}>
                  <Users size={20} color="#6b7280" />
                  Group Members ({group.members?.length || 0})
                </h3>
              </div>
              <ul style={styles.membersList}>
                {group.members?.map((member) => (
                  <li key={member._id} style={styles.memberItem}>
                    <div style={styles.memberAvatar}>
                      {member.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span style={styles.memberName}>{member.username}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Transaction List */}
        <TransactionList groupId={group._id} members={group.members} />
      </div>

      {/* Invite Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <Link2 size={20} color="#2563eb" />
                Invite Link
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={styles.closeButton}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.color = '#111827';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6b7280';
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.inviteLink}>{inviteLink}</div>

              <button onClick={handleCopyInvite} style={styles.copyButton}>
                <Copy size={16} />
                {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowTransactionModal(false)}
        >
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <CreditCard size={20} color="#2563eb" />
                Add Transaction
              </h2>
              <button
                onClick={() => setShowTransactionModal(false)}
                style={styles.closeButton}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.color = '#111827';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6b7280';
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <TransactionForm
                groupId={group._id}
                onClose={() => setShowTransactionModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupPage;
