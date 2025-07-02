import React, { useState, useEffect, useContext } from 'react';
import { AlertTriangle, X, TrendingUp, Target } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import socketService from '../services/socketService';

const BudgetAlertManager = ({ groupId }) => {
  const { user, token } = useContext(AuthContext);
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    // Connect to socket and join group room
    const socket = socketService.connect(token);

    const handleConnect = () => {
      setIsConnected(true);
      socketService.joinRoom(`group-${groupId}`);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleBudgetAlert = (alertData) => {
      // Only show alerts for this group
      if (alertData.groupId !== groupId) return;

      // Create alert object with unique ID
      const alert = {
        id: `${alertData.type}-${alertData.timestamp}-${Math.random()}`,
        ...alertData,
        createdAt: new Date(),
      };

      setAlerts((prev) => [...prev, alert]);

      // Auto-remove alert after 8 seconds for warnings, 12 for critical
      const autoRemoveTime = alertData.severity === 'critical' ? 12000 : 8000;
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      }, autoRemoveTime);
    };

    // Set up event listeners
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('budget-alert', handleBudgetAlert);

    // If already connected, join room immediately
    if (socketService.isConnected()) {
      handleConnect();
    }

    // Cleanup
    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('budget-alert', handleBudgetAlert);
      socketService.leaveRoom(`group-${groupId}`);
    };
  }, [groupId, token]);

  const dismissAlert = (alertId) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAlertStyles = (severity) => {
    const baseStyles = {
      position: 'relative',
      padding: '16px 20px',
      borderRadius: '12px',
      border: '1px solid',
      marginBottom: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      animation: 'slideInRight 0.4s ease-out',
      minWidth: '350px',
      maxWidth: '400px',
    };

    if (severity === 'critical') {
      return {
        ...baseStyles,
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        borderColor: '#dc2626',
        color: '#7f1d1d',
      };
    } else {
      return {
        ...baseStyles,
        background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
        borderColor: '#f59e0b',
        color: '#92400e',
      };
    }
  };

  const getAlertIcon = (type, severity) => {
    const iconProps = {
      size: 20,
      color: severity === 'critical' ? '#dc2626' : '#f59e0b',
    };

    switch (type) {
      case 'budget_exceeded':
        return <AlertTriangle {...iconProps} />;
      case 'threshold_reached':
        return <TrendingUp {...iconProps} />;
      default:
        return <Target {...iconProps} />;
    }
  };

  const styles = {
    container: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      maxWidth: '90vw',
    },
    alertHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '8px',
    },
    alertTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: '600',
      fontSize: '14px',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px',
      opacity: 0.7,
      transition: 'opacity 0.2s ease',
    },
    alertContent: {
      fontSize: '13px',
      lineHeight: '1.4',
      marginBottom: '12px',
    },
    alertDetails: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
      padding: '8px 12px',
      borderRadius: '6px',
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    detailLabel: {
      fontWeight: '500',
      opacity: 0.8,
    },
    detailValue: {
      fontWeight: '600',
    },
    progressBar: {
      width: '100%',
      height: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: '2px',
      overflow: 'hidden',
      marginTop: '8px',
    },
    progressFill: {
      height: '100%',
      borderRadius: '2px',
      transition: 'width 0.3s ease',
    },
  };

  if (alerts.length === 0) return null;

  return (
    <>
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={styles.container}>
        {alerts.map((alert) => (
          <div key={alert.id} style={getAlertStyles(alert.severity)}>
            <div style={styles.alertHeader}>
              <div style={styles.alertTitle}>
                {getAlertIcon(alert.type, alert.severity)}
                <span>
                  {alert.type === 'budget_exceeded' && 'Budget Exceeded!'}
                  {alert.type === 'threshold_reached' && 'Budget Alert!'}
                </span>
              </div>
              <button
                style={styles.closeButton}
                onClick={() => dismissAlert(alert.id)}
                onMouseEnter={(e) => (e.target.style.opacity = '1')}
                onMouseLeave={(e) => (e.target.style.opacity = '0.7')}
              >
                <X size={16} />
              </button>
            </div>

            <div style={styles.alertContent}>
              <strong>{alert.budget.category}</strong> budget alert:
              <br />
              {alert.transaction.paidBy.username} added{' '}
              {formatCurrency(alert.transaction.amount)}
              {alert.transaction.description &&
                ` for "${alert.transaction.description}"`}
            </div>

            <div style={styles.alertDetails}>
              <div>
                <span style={styles.detailLabel}>Budget: </span>
                <span style={styles.detailValue}>
                  {formatCurrency(alert.budget.amount)}
                </span>
              </div>
              <div>
                <span style={styles.detailLabel}>Now: </span>
                <span style={styles.detailValue}>
                  {alert.spending.percentage.toFixed(1)}%
                </span>
              </div>
              {alert.spending.overAmount && (
                <div>
                  <span style={styles.detailLabel}>Over: </span>
                  <span style={styles.detailValue}>
                    {formatCurrency(alert.spending.overAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${Math.min(alert.spending.percentage, 100)}%`,
                  backgroundColor:
                    alert.severity === 'critical' ? '#dc2626' : '#f59e0b',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default BudgetAlertManager;
