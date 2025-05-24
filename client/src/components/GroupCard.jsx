import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, ChevronRight, DollarSign } from 'lucide-react';

const GroupCard = ({ group }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/groups/${group._id}`);
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get member count
  const memberCount = group.members?.length || 0;
  const partnerCount = Math.max(0, memberCount - 1); // Subtract current user

  // Get recent activity (you can customize this based on your data structure)
  const lastActivity = group.updatedAt || group.createdAt;

  const styles = {
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: '1px solid #f3f4f6',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden',
    },
    cardHover: {
      transform: 'translateY(-4px)',
      boxShadow:
        '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      borderColor: '#e0e7ff',
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '16px',
    },
    titleSection: {
      flex: 1,
    },
    title: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      margin: '0 0 8px 0',
      lineHeight: '1.2',
    },
    description: {
      fontSize: '14px',
      color: '#6b7280',
      margin: 0,
      lineHeight: '1.4',
    },
    chevron: {
      color: '#9ca3af',
      transition: 'all 0.2s ease',
    },
    chevronHover: {
      color: '#2563eb',
      transform: 'translateX(4px)',
    },
    statsContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginTop: '16px',
      paddingTop: '16px',
      borderTop: '1px solid #f3f4f6',
    },
    stat: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      color: '#6b7280',
    },
    statIcon: {
      width: '16px',
      height: '16px',
    },
    badge: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
      color: '#2563eb',
      fontSize: '12px',
      fontWeight: '500',
      padding: '4px 8px',
      borderRadius: '6px',
      border: '1px solid #bfdbfe',
    },
    gradientBorder: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      borderRadius: '16px 16px 0 0',
    },
  };

  return (
    <li style={{ listStyle: 'none' }}>
      <div
        style={styles.card}
        onClick={handleClick}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, styles.cardHover);
          const chevron = e.currentTarget.querySelector('.chevron-icon');
          if (chevron) {
            Object.assign(chevron.style, styles.chevronHover);
          }
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, styles.card);
          const chevron = e.currentTarget.querySelector('.chevron-icon');
          if (chevron) {
            Object.assign(chevron.style, styles.chevron);
          }
        }}
      >
        <div style={styles.gradientBorder}></div>

        <div style={styles.cardHeader}>
          <div style={styles.titleSection}>
            <h3 style={styles.title}>{group.name}</h3>
            {group.description && (
              <p style={styles.description}>{group.description}</p>
            )}
          </div>

          <ChevronRight
            size={20}
            style={styles.chevron}
            className="chevron-icon"
          />
        </div>

        {partnerCount >= 1 && (
          <div style={styles.badge}>
            {partnerCount === 1
              ? 'You + Partner'
              : `You + ${partnerCount} others`}
          </div>
        )}

        <div style={styles.statsContainer}>
          <div style={styles.stat}>
            <Users size={16} style={styles.statIcon} />
            <span>
              {partnerCount === 1 ? 'Just you two' : `${memberCount} people`}
            </span>
          </div>

          {lastActivity && (
            <div style={styles.stat}>
              <Calendar size={16} style={styles.statIcon} />
              <span>Updated {formatDate(lastActivity)}</span>
            </div>
          )}

          {group.totalExpenses !== undefined && (
            <div style={styles.stat}>
              <DollarSign size={16} style={styles.statIcon} />
              <span>${group.totalExpenses?.toFixed(2) || '0.00'}</span>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

export default GroupCard;
