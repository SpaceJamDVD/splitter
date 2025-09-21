import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  getGroupTransactions,
  settleUp,
  getRecentTotal,
} from '../services/transactionService';
import { getBalancesForGroup } from '../services/memberBalanceService';
import { AuthContext } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import BudgetAlertManager from './BudgetAlertManager';
import {
  DollarSign,
  Calendar,
  User,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Loader,
} from 'lucide-react';

const TransactionList = ({
  groupId,
  members: allGroupMembers = [],
  isMobile = false,
}) => {
  const {
    user,
    token,
    loading: authLoading,
    isLoggedIn,
  } = useContext(AuthContext);

  //console.log('TransactionList isMobile:', isMobile);

  // State management
  const [transactions, setTransactions] = useState([]);
  const [memberBalances, setMemberBalances] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [recentTotal, setRecentTotal] = useState(0);
  const [recentSumTransactions, setRecentSumTransactions] = useState(0);

  // Memoized data fetching functions
  const fetchRecentTotal = useCallback(async () => {
    if (!groupId) return;
    try {
      const recentTotalData = await getRecentTotal(groupId);
      setRecentTotal(recentTotalData.totalAmount);
      setRecentSumTransactions(recentTotalData.transactionCount);
    } catch (err) {
      console.error('Failed to fetch recent total:', err);
    }
  }, [groupId]);

  const fetchBalances = useCallback(async () => {
    if (!groupId) return;
    try {
      const balancesData = await getBalancesForGroup(groupId);
      setMemberBalances(balancesData);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  }, [groupId]);

  const fetchAllData = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError('');

      const [transactionsData, balancesData, recentTotalData] =
        await Promise.all([
          getGroupTransactions(groupId),
          getBalancesForGroup(groupId),
          getRecentTotal(groupId),
        ]);

      setTransactions(transactionsData);
      setMemberBalances(balancesData);
      setRecentTotal(recentTotalData.totalAmount);
      setRecentSumTransactions(recentTotalData.transactionCount);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // CONSOLIDATED EFFECT: Authentication, data fetching, and socket setup
  useEffect(() => {
    // Wait for auth to complete
    if (authLoading) return;

    // Ensure user is logged in and we have a groupId
    if (!isLoggedIn || !groupId) {
      setLoading(false);
      return;
    }

    // Fetch initial data
    fetchAllData();

    // Socket event handlers

    const handleConnect = () => {
      setIsSocketConnected(true);
      socketService.joinRoom(`group-${groupId}`);
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    const handleConnectError = (error) => {
      console.error('Socket connection error:', error);
      setIsSocketConnected(false);
    };

    const handleTransactionUpdate = (data) => {
      if (data.groupId !== groupId) return;

      switch (data.type) {
        case 'created':
          setTransactions((prev) => {
            const exists = prev.some((t) => t._id === data.transaction._id);
            if (exists) return prev;
            return [data.transaction, ...prev];
          });
          fetchRecentTotal();
          break;

        case 'updated':
          setTransactions((prev) =>
            prev.map((t) =>
              t._id === data.transaction._id ? data.transaction : t
            )
          );
          break;

        case 'deleted':
          setTransactions((prev) =>
            prev.filter((t) => t._id !== data.transactionId)
          );
          fetchRecentTotal();
          break;

        default:
          break;
      }
      fetchBalances();
    };

    const handleBalanceUpdate = (data) => {
      if (data.groupId === groupId) {
        setMemberBalances(data.balances);
      }
    };

    const handleGroupSettled = (data) => {
      if (data.groupId === groupId) {
        fetchAllData();
      }
    };

    // Set up all socket event listeners
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('connect_error', handleConnectError);
    socketService.on('transaction-update', handleTransactionUpdate);
    socketService.on('balance-update', handleBalanceUpdate);
    socketService.on('group-settled', handleGroupSettled);

    // If already connected, join room immediately
    if (!socketService.isConnected()) {
      socketService.connect();
    } else {
      handleConnect();
    }

    // Cleanup function
    return () => {
      socketService.leaveRoom(`group-${groupId}`);
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('connect_error', handleConnectError);
      socketService.off('transaction-update', handleTransactionUpdate);
      socketService.off('balance-update', handleBalanceUpdate);
      socketService.off('group-settled', handleGroupSettled);
    };
  }, [
    groupId,
    token,
    authLoading,
    isLoggedIn,
    fetchAllData,
    fetchRecentTotal,
    fetchBalances,
  ]);

  // Computed values
  const myBalance =
    memberBalances.find((balance) => balance.memberId._id === user?.id)
      ?.balance || 0;

  const balances = {};
  memberBalances.forEach((balance) => {
    balances[balance.memberId._id] = balance.balance;
  });

  // Helper functions
  const getUsername = (userId) => {
    const memberBalance = memberBalances.find(
      (balance) => balance.memberId._id === userId
    );
    if (memberBalance) return memberBalance.memberId.username;

    const member = allGroupMembers.find((m) => m._id === userId);
    return member?.username || 'Someone';
  };

  const handleSettleUp = async () => {
    try {
      await settleUp(groupId);
    } catch (err) {}
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      'rent/mortgage': '🏠',
      utilities: '⚡',
      groceries: '🛒',
      household: '🧽',
      'date night': '💕',
      travel: '✈️',
      transportation: '🚗',
      medical: '🏥',
      gifts: '🎁',
      settlement: '💰',
    };
    return iconMap[category?.toLowerCase()] || '📝';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      flexDirection: 'column',
      gap: '16px',
    },
    header: {
      marginBottom: '32px',
      position: 'relative',
    },
    title: {
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#111827',
      margin: 0,
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '16px',
      margin: '8px 0 0 0',
    },
    connectionStatus: {
      position: 'absolute',
      top: 0,
      right: 0,
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    connected: {
      backgroundColor: '#dcfce7',
      color: '#166534',
    },
    disconnected: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
    },
    balanceCard: {
      background: 'white',
      borderRadius: '16px',
      boxShadow:
        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      padding: '24px',
      marginBottom: '32px',
      border: '1px solid #f3f4f6',
    },
    balanceHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px',
    },
    balanceTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: 0,
    },
    settleButton: {
      background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
      color: 'white',
      padding: '10px 24px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      fontSize: '14px',
    },
    balanceGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
    },
    myBalanceCard: {
      background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid #bfdbfe',
    },
    balanceInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
    },
    balanceIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    balanceAmount: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: 0,
    },
    balanceLabel: {
      fontWeight: '500',
      color: '#111827',
      margin: 0,
      fontSize: '14px',
    },
    balanceDetail: {
      fontSize: '14px',
      borderRadius: '8px',
      padding: '12px',
    },
    statsGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    statCard: {
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statCardPurple: {
      background: 'linear-gradient(135deg, #faf5ff 0%, #fce7f3 100%)',
      borderColor: '#e879f9',
    },
    statCardOrange: {
      background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
      borderColor: '#fb923c',
    },
    statValue: {
      fontSize: '20px',
      fontWeight: 'bold',
      margin: 0,
    },
    statLabel: {
      fontSize: '14px',
      margin: 0,
      color: '#6b7280',
    },
    transactionsCard: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #f3f4f6',
      overflow: 'hidden',
    },
    transactionsHeader: {
      padding: '16px 24px',
      borderBottom: '1px solid #f3f4f6',
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
    },
    transactionsTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: 0,
    },
    errorMessage: {
      padding: '16px 24px',
      background: '#fef2f2',
      borderBottom: '1px solid #fecaca',
      color: '#dc2626',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    emptyState: {
      padding: '48px 24px',
      textAlign: 'center',
    },
    emptyIcon: {
      width: '64px',
      height: '64px',
      margin: '0 auto 16px',
      background: '#f3f4f6',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      color: '#6b7280',
      fontSize: '18px',
      margin: '0 0 4px 0',
    },
    emptySubtitle: {
      color: '#9ca3af',
      fontSize: '14px',
      margin: 0,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableHeader: {
      background: '#f9fafb',
    },
    tableHeaderCell: {
      padding: '16px 24px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '500',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: '1px solid #f3f4f6',
    },
    tableRow: {
      transition: 'background-color 0.15s ease',
      cursor: 'pointer',
    },
    tableCell: {
      padding: '16px 24px',
      borderBottom: '1px solid #f3f4f6',
    },
    transactionDescription: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#111827',
      margin: '0 0 4px 0',
    },
    transactionNotes: {
      fontSize: '14px',
      color: '#6b7280',
      fontStyle: 'italic',
      margin: 0,
    },
    categoryContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    categoryText: {
      fontSize: '14px',
      color: '#6b7280',
    },
    amountText: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#111827',
    },
    settlementRow: {
      backgroundColor: '#f0fdf4',
      borderLeft: '4px solid #16a34a',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    settlementAmount: {
      color: '#16a34a',
      fontWeight: '700',
    },
    settlementDescription: {
      color: '#166534',
      fontWeight: '600',
      fontStyle: 'italic',
    },
    owedToPurchaserRow: {
      backgroundColor: '#fef3c7',
      borderLeft: '4px solid #f59e0b',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    owedToPurchaserAmount: {
      color: '#d97706',
      fontWeight: '700',
    },
    owedToPurchaserDescription: {
      color: '#92400e',
      fontWeight: '600',
    },
    userContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    userAvatar: {
      width: '32px',
      height: '32px',
      background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    userName: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#111827',
    },
    dateContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#6b7280',
    },
  };

  // Loading states
  if (authLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <Loader size={48} color="#2563eb" className="animate-spin" />
          <p style={styles.subtitle}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null; // Parent should handle unauthenticated state
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <Loader size={48} color="#2563eb" className="animate-spin" />
          <p style={styles.subtitle}>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <BudgetAlertManager groupId={groupId} />

      <div
        style={{
          ...styles.container,
          ...(isMobile ? { padding: 12 } : {}),
        }}
      >
        {/* Header Section */}
        <div
          style={{
            ...styles.header,
            ...(isMobile ? { marginBottom: 20 } : {}),
          }}
        >
          <h1
            style={{
              ...styles.title,
              ...(isMobile ? { fontSize: 22 } : {}),
            }}
          >
            Expense Tracker
          </h1>

          <p
            style={{
              ...styles.subtitle,
              ...(isMobile ? { fontSize: 14, marginTop: 6 } : {}),
            }}
          >
            Track and manage your shared expenses
          </p>

          <div
            style={{
              ...styles.connectionStatus,
              ...(isSocketConnected ? styles.connected : styles.disconnected),
              ...(isMobile
                ? {
                    position: 'static', // don't overlap the title
                    marginTop: 8,
                    display: 'inline-flex',
                  }
                : {}),
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                backgroundColor: isSocketConnected ? '#16a34a' : '#dc2626',
                borderRadius: '50%',
                animation: isSocketConnected ? 'pulse 2s infinite' : 'none',
              }}
            />
            {isSocketConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {/* Balance Overview Card */}
        <div
          style={{
            ...styles.balanceCard,
            ...(isMobile ? { padding: 16, marginBottom: 20 } : {}),
          }}
        >
          <div
            style={{
              ...styles.balanceHeader,
              ...(isMobile ? { gap: 12, marginBottom: 16 } : {}),
            }}
          >
            <h2
              style={{
                ...styles.balanceTitle,
                ...(isMobile ? { fontSize: 18 } : {}),
              }}
            >
              <TrendingUp size={isMobile ? 16 : 20} color="#2563eb" />
              Balance Overview
            </h2>

            <button
              style={{
                ...styles.settleButton,
                ...(isMobile
                  ? {
                      width: '100%', // full width on mobile
                      padding: '10px 16px',
                      fontSize: 14,
                    }
                  : {}),
              }}
              onClick={handleSettleUp}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow =
                  '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow =
                  '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              Settle Up
            </button>
          </div>

          <div
            style={{
              ...styles.balanceGrid,
              ...(isMobile
                ? {
                    gridTemplateColumns: '1fr', // collapse to single column
                    gap: 12,
                  }
                : {}),
            }}
          >
            {/* My Balance */}
            <div
              style={{
                ...styles.myBalanceCard,
                ...(isMobile ? { padding: 12 } : {}),
              }}
            >
              <div
                style={{
                  ...styles.balanceInfo,
                  ...(isMobile ? { gap: 10, marginBottom: 10 } : {}),
                }}
              >
                <div
                  style={{
                    ...styles.balanceIcon,
                    ...(isMobile ? { width: 36, height: 36 } : {}),
                    backgroundColor:
                      myBalance > 0
                        ? '#dcfce7'
                        : myBalance < 0
                        ? '#fee2e2'
                        : '#f3f4f6',
                  }}
                >
                  {myBalance > 0 ? (
                    <TrendingUp size={isMobile ? 16 : 20} color="#16a34a" />
                  ) : myBalance < 0 ? (
                    <TrendingDown size={isMobile ? 16 : 20} color="#dc2626" />
                  ) : (
                    <CheckCircle size={isMobile ? 16 : 20} color="#6b7280" />
                  )}
                </div>
                <div>
                  <h3
                    style={{
                      ...styles.balanceLabel,
                      ...(isMobile ? { fontSize: 13 } : {}),
                    }}
                  >
                    Your Balance
                  </h3>
                  <p
                    style={{
                      ...styles.balanceAmount,
                      ...(isMobile ? { fontSize: 20 } : {}),
                      color:
                        myBalance > 0
                          ? '#16a34a'
                          : myBalance < 0
                          ? '#dc2626'
                          : '#6b7280',
                    }}
                  >
                    {formatCurrency(Math.abs(myBalance))}
                  </p>
                </div>
              </div>

              {myBalance > 0 && (
                <div
                  style={{
                    ...styles.balanceDetail,
                    ...(isMobile ? { fontSize: 13, padding: 10 } : {}),
                    color: '#166534',
                    backgroundColor: '#f0fdf4',
                  }}
                >
                  <p style={{ fontWeight: 500, margin: '0 0 4px 0' }}>
                    You spent more
                  </p>
                  <p style={{ margin: 0 }}>
                    {Object.entries(balances)
                      .filter(([userId, bal]) => bal < 0 && userId !== user?.id)
                      .map(([userId, bal]) => {
                        const username = getUsername(userId);
                        const amountOwed = Math.abs(bal);
                        return `${username} owes you ${formatCurrency(
                          amountOwed
                        )}`;
                      })
                      .join(', ') || 'from various members'}
                  </p>
                </div>
              )}

              {myBalance < 0 && (
                <div
                  style={{
                    ...styles.balanceDetail,
                    ...(isMobile ? { fontSize: 13, padding: 10 } : {}),
                    color: '#991b1b',
                    backgroundColor: '#fef2f2',
                  }}
                >
                  <p style={{ fontWeight: 500, margin: '0 0 4px 0' }}>
                    You spent less
                  </p>
                  <p style={{ margin: 0 }}>
                    {Object.entries(balances)
                      .filter(([userId, bal]) => bal > 0 && userId !== user?.id)
                      .map(([userId, bal]) => {
                        const username = getUsername(userId);
                        const amountToPay = Math.abs(bal);
                        return `You owe ${username} ${formatCurrency(
                          amountToPay
                        )}`;
                      })
                      .join(', ') || 'to various members'}
                  </p>
                </div>
              )}

              {myBalance === 0 && transactions.length > 0 && (
                <div
                  style={{
                    ...styles.balanceDetail,
                    ...(isMobile
                      ? { fontSize: 13, padding: 10, gap: 6 }
                      : { gap: 8 }),
                    color: '#6b7280',
                    backgroundColor: '#f9fafb',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <CheckCircle size={isMobile ? 14 : 16} color="#16a34a" />
                  <span>You're all settled up!</span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div
              style={{
                ...styles.statsGrid,
                ...(isMobile ? { gap: 12 } : {}),
              }}
            >
              <div
                style={{
                  ...styles.statCard,
                  ...styles.statCardPurple,
                  ...(isMobile ? { padding: 12 } : {}),
                }}
              >
                <div>
                  <p
                    style={{
                      ...styles.statLabel,
                      ...(isMobile ? { fontSize: 12 } : {}),
                    }}
                  >
                    Total Expense Since Last Settlement
                  </p>
                  <p
                    style={{
                      ...styles.statValue,
                      ...(isMobile ? { fontSize: 18 } : {}),
                      color: '#7c3aed',
                    }}
                  >
                    {formatCurrency(recentTotal)}
                  </p>
                </div>
                <DollarSign size={isMobile ? 28 : 32} color="#a855f7" />
              </div>

              <div
                style={{
                  ...styles.statCard,
                  ...styles.statCardOrange,
                  ...(isMobile ? { padding: 12 } : {}),
                }}
              >
                <div>
                  <p
                    style={{
                      ...styles.statLabel,
                      ...(isMobile ? { fontSize: 12 } : {}),
                    }}
                  >
                    Transactions Since Last Settlement
                  </p>
                  <p
                    style={{
                      ...styles.statValue,
                      ...(isMobile ? { fontSize: 18 } : {}),
                      color: '#ea580c',
                    }}
                  >
                    {recentSumTransactions}
                  </p>
                </div>
                <FileText size={isMobile ? 28 : 32} color="#fb923c" />
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div style={styles.transactionsCard}>
          <div style={styles.transactionsHeader}>
            <h2 style={styles.transactionsTitle}>
              <CreditCard size={20} color="#6b7280" />
              Recent Transactions
            </h2>
          </div>

          {error && (
            <div style={styles.errorMessage}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#dc2626',
                  borderRadius: '50%',
                }}
              />
              {error}
            </div>
          )}

          {transactions.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <FileText size={32} color="#9ca3af" />
              </div>
              <p style={styles.emptyTitle}>No transactions yet</p>
              <p style={styles.emptySubtitle}>
                Start by adding your first expense!
              </p>
            </div>
          ) : isMobile ? (
            // ======= MOBILE CARD LIST =======
            <div style={{ padding: 12 }}>
              {transactions.map((tx) => {
                const isSettlement =
                  tx.isSettlement ||
                  tx.category?.toLowerCase() === 'settlement';
                const isOwedToPurchaser = tx.owedToPurchaser && !isSettlement;

                return (
                  <div
                    key={tx._id}
                    style={{
                      padding: 12,
                      marginBottom: 12,
                      borderRadius: 12,
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      ...(isSettlement ? styles.settlementRow : {}),
                      ...(isOwedToPurchaser ? styles.owedToPurchaserRow : {}),
                    }}
                  >
                    {/* Top line: description */}
                    <div
                      style={{
                        ...styles.transactionDescription,
                        ...(isSettlement ? styles.settlementDescription : {}),
                        ...(isOwedToPurchaser
                          ? styles.owedToPurchaserDescription
                          : {}),
                        marginBottom: 6,
                      }}
                    >
                      {isSettlement
                        ? 'Settlement Payment'
                        : tx.description || 'No description'}
                    </div>
                    {tx.notes && (
                      <div style={styles.transactionNotes}>{tx.notes}</div>
                    )}

                    {/* Middle: category + amount */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 8,
                        gap: 12,
                      }}
                    >
                      <div style={styles.categoryContainer}>
                        <span style={{ fontSize: 18 }}>
                          {isSettlement ? '💰' : getCategoryIcon(tx.category)}
                        </span>
                        <span style={styles.categoryText}>
                          {isSettlement
                            ? 'Settlement'
                            : tx.category || 'Uncategorized'}
                        </span>
                      </div>

                      <div
                        style={{
                          ...styles.amountText,
                          ...(isSettlement ? styles.settlementAmount : {}),
                          ...(isOwedToPurchaser
                            ? styles.owedToPurchaserAmount
                            : {}),
                        }}
                      >
                        {formatCurrency(tx.amount)}
                        {isOwedToPurchaser && (
                          <div
                            style={{
                              fontSize: 11,
                              color: '#92400e',
                              fontWeight: 600,
                              marginTop: 2,
                              textAlign: 'right',
                            }}
                          >
                            Owed full amount
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom: paid by + date */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 10,
                        gap: 12,
                      }}
                    >
                      <div style={styles.userContainer}>
                        <div
                          style={{
                            ...styles.userAvatar,
                            ...(isSettlement
                              ? {
                                  background:
                                    'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                                }
                              : isOwedToPurchaser
                              ? {
                                  background:
                                    'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                                }
                              : {}),
                          }}
                        >
                          <User size={16} color="white" />
                        </div>
                        <span style={styles.userName}>
                          {tx.paidBy?.username || 'Unknown'}
                        </span>
                      </div>

                      <div style={styles.dateContainer}>
                        <Calendar size={16} />
                        {new Date(tx.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th style={styles.tableHeaderCell}>Description</th>
                    <th style={styles.tableHeaderCell}>Category</th>
                    <th style={styles.tableHeaderCell}>Amount</th>
                    <th style={styles.tableHeaderCell}>Paid By</th>
                    <th style={styles.tableHeaderCell}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isSettlement =
                      tx.isSettlement ||
                      tx.category?.toLowerCase() === 'settlement';
                    const isOwedToPurchaser =
                      tx.owedToPurchaser && !isSettlement;

                    return (
                      <tr
                        key={tx._id}
                        style={{
                          ...styles.tableRow,
                          ...(isSettlement ? styles.settlementRow : {}),
                          ...(isOwedToPurchaser
                            ? styles.owedToPurchaserRow
                            : {}),
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = isSettlement
                            ? '#dcfce7'
                            : isOwedToPurchaser
                            ? '#fde68a'
                            : '#f9fafb')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = isSettlement
                            ? '#f0fdf4'
                            : isOwedToPurchaser
                            ? '#fef3c7'
                            : 'transparent')
                        }
                      >
                        <td style={styles.tableCell}>
                          <div>
                            <div
                              style={{
                                ...styles.transactionDescription,
                                ...(isSettlement
                                  ? styles.settlementDescription
                                  : {}),
                                ...(isOwedToPurchaser
                                  ? styles.owedToPurchaserDescription
                                  : {}),
                              }}
                            >
                              {isSettlement
                                ? 'Settlement Payment'
                                : tx.description || 'No description'}
                            </div>
                            {tx.notes && (
                              <div style={styles.transactionNotes}>
                                {tx.notes}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.categoryContainer}>
                            <span style={{ fontSize: '18px' }}>
                              {isSettlement
                                ? '💰'
                                : getCategoryIcon(tx.category)}
                            </span>
                            <span style={styles.categoryText}>
                              {isSettlement
                                ? 'Settlement'
                                : tx.category || 'Uncategorized'}
                            </span>
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <span
                            style={{
                              ...styles.amountText,
                              ...(isSettlement ? styles.settlementAmount : {}),
                              ...(isOwedToPurchaser
                                ? styles.owedToPurchaserAmount
                                : {}),
                            }}
                          >
                            {formatCurrency(tx.amount)}
                          </span>
                          {isOwedToPurchaser && (
                            <div
                              style={{
                                fontSize: '11px',
                                color: '#92400e',
                                fontWeight: '600',
                                marginTop: '2px',
                              }}
                            >
                              Owed full amount
                            </div>
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.userContainer}>
                            <div
                              style={{
                                ...styles.userAvatar,
                                ...(isSettlement
                                  ? {
                                      background:
                                        'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                                    }
                                  : isOwedToPurchaser
                                  ? {
                                      background:
                                        'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                                    }
                                  : {}),
                              }}
                            >
                              <User size={16} color="white" />
                            </div>
                            <span style={styles.userName}>
                              {tx.paidBy?.username || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.dateContainer}>
                            <Calendar size={16} />
                            {new Date(tx.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pulse animation for connection status */}
        <style>
          {`
            @keyframes pulse {
              0% {
                box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7);
              }
              70% {
                box-shadow: 0 0 0 6px rgba(22, 163, 74, 0);
              }
              100% {
                box-shadow: 0 0 0 0 rgba(22, 163, 74, 0);
              }
            }
          `}
        </style>
      </div>
    </>
  );
};

export default TransactionList;
