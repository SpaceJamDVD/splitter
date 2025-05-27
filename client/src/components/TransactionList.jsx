import React, { useEffect, useState, useContext } from 'react';
import {
  getGroupTransactions,
  settleUp,
  getRecentTotal,
} from '../services/transactionService';
import { getBalancesForGroup } from '../services/memberBalanceService';
import { AuthContext } from '../contexts/AuthContext';
import socketService from '../services/socketService'; // Import your socket service
import {
  DollarSign,
  Calendar,
  User,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
  CheckCircle,
} from 'lucide-react';

const TransactionList = ({ groupId, members: allGroupMembers }) => {
  const { user, token } = useContext(AuthContext); // Make sure you have token in AuthContext
  const [transactions, setTransactions] = useState([]);
  const [memberBalances, setMemberBalances] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [recentTotal, setRecentTotal] = useState(0);
  const [recentSumTransactions, setRecentSumTransactions] = useState(0);

  // Socket connection and room management
  useEffect(() => {
    if (!groupId || !token) return;

    // Connect to socket with authentication
    const socket = socketService.connect(token);

    // Setup connection listeners
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

    // Set up connection event listeners
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('connect_error', handleConnectError);

    // If already connected, join room immediately
    if (socketService.isConnected()) {
      handleConnect();
    }

    // Cleanup function
    return () => {
      socketService.leaveRoom(`group-${groupId}`);
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('connect_error', handleConnectError);
    };
  }, [groupId, token]);

  // Real-time transaction updates
  useEffect(() => {
    if (!isSocketConnected || !groupId) return;

    const handleTransactionUpdate = (data) => {
      // Only process updates for this group
      if (data.groupId !== groupId) {
        return;
      }

      switch (data.type) {
        case 'created':
          setTransactions((prev) => {
            // Check if transaction already exists to avoid duplicates
            const exists = prev.some((t) => t._id === data.transaction._id);
            if (exists) {
              return prev;
            }
            return [data.transaction, ...prev];
          });
          break;

        case 'updated':
          setTransactions((prev) => {
            return prev.map((t) =>
              t._id === data.transaction._id ? data.transaction : t
            );
          });
          break;

        case 'deleted':
          setTransactions((prev) => {
            return prev.filter((t) => t._id !== data.transactionId);
          });
          break;

        default:
      }

      // Refetch balances when transactions change
      fetchBalances();
    };

    const handleBalanceUpdate = (data) => {
      if (data.groupId === groupId) {
        setMemberBalances(data.balances);
      }
    };

    const handleGroupSettled = (data) => {
      if (data.groupId === groupId) {
        fetchData();
      }
    };

    // Listen for real-time events
    socketService.on('transaction-update', handleTransactionUpdate);
    socketService.on('balance-update', handleBalanceUpdate);
    socketService.on('group-settled', handleGroupSettled);

    // Cleanup
    return () => {
      socketService.off('transaction-update', handleTransactionUpdate);
      socketService.off('balance-update', handleBalanceUpdate);
      socketService.off('group-settled', handleGroupSettled);
    };
  }, [isSocketConnected, groupId]);

  // Helper function to fetch balances
  const fetchBalances = async () => {
    try {
      const balancesData = await getBalancesForGroup(groupId);
      setMemberBalances(balancesData);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  };

  // Helper function to fetch all data
  const fetchData = async () => {
    if (!groupId) return;

    try {
      setLoading(true);

      // Fetch both transactions and balances
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
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [groupId]);

  // Ensure allGroupMembers is not undefined and is an array
  const validGroupMembers = Array.isArray(allGroupMembers)
    ? allGroupMembers
    : [];

  // Get current user's balance from memberBalances
  const myBalance =
    memberBalances.find((balance) => balance.memberId._id === user?.userId)
      ?.balance || 0;

  // Create a balances object for compatibility with existing code
  const balances = {};
  memberBalances.forEach((balance) => {
    balances[balance.memberId._id] = balance.balance;
  });

  // Helper to find member username - enhanced to work with both sources
  const getUsername = (userId) => {
    // First try from memberBalances (populated with username)
    const memberBalance = memberBalances.find(
      (balance) => balance.memberId._id === userId
    );
    if (memberBalance) return memberBalance.memberId.username;

    // Fallback to allGroupMembers
    const member = validGroupMembers.find((m) => m._id === userId);
    return member?.username || 'Someone';
  };

  const handleSettleUp = async () => {
    try {
      await settleUp(groupId);

      alert('Settled up successfully!');
    } catch (err) {
      alert(
        'Failed to settle: ' + (err.response?.data?.error || 'Unknown error')
      );
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'rent/mortgage':
        return '🏠';
      case 'utilities':
        return '⚡';
      case 'groceries':
        return '🛒';
      case 'household':
        return '🧽';
      case 'date night':
        return '💕';
      case 'travel':
        return '✈️';
      case 'transportation':
        return '🚗';
      case 'medical':
        return '🏥';
      case 'gifts':
        return '🎁';
      case 'settlement':
        return '💰';
      case 'miscellaneous':
      default:
        return '📝';
    }
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
    header: {
      marginBottom: '32px',
      position: 'relative',
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
    settlementBadge: {
      backgroundColor: '#16a34a',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginLeft: '8px',
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
    owedToPurchaserBadge: {
      backgroundColor: '#f59e0b',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginLeft: '8px',
    },
    owedToPurchaserAmount: {
      color: '#d97706',
      fontWeight: '700',
    },
    owedToPurchaserDescription: {
      color: '#92400e',
      fontWeight: '600',
    },
    settlementRow: {
      backgroundColor: '#f0fdf4',
      borderLeft: '4px solid #16a34a',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    settlementBadge: {
      backgroundColor: '#16a34a',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginLeft: '8px',
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
    owedToPurchaserBadge: {
      backgroundColor: '#f59e0b',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginLeft: '8px',
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

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Expense Tracker</h1>
          <p style={styles.subtitle}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header Section with Connection Status */}
      <div style={styles.header}>
        <h1 style={styles.title}>Expense Tracker</h1>
        <p style={styles.subtitle}>Track and manage your shared expenses</p>
      </div>

      {/* Balance Overview Card */}
      <div style={styles.balanceCard}>
        <div style={styles.balanceHeader}>
          <h2 style={styles.balanceTitle}>
            <TrendingUp size={20} color="#2563eb" />
            Balance Overview
          </h2>
          <button
            style={styles.settleButton}
            onClick={handleSettleUp}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
          >
            Settle Up
          </button>
        </div>

        <div style={styles.balanceGrid}>
          {/* My Balance */}
          <div style={styles.myBalanceCard}>
            <div style={styles.balanceInfo}>
              <div
                style={{
                  ...styles.balanceIcon,
                  backgroundColor:
                    myBalance > 0
                      ? '#dcfce7'
                      : myBalance < 0
                      ? '#fee2e2'
                      : '#f3f4f6',
                }}
              >
                {myBalance > 0 ? (
                  <TrendingUp size={20} color="#16a34a" />
                ) : myBalance < 0 ? (
                  <TrendingDown size={20} color="#dc2626" />
                ) : (
                  <CheckCircle size={20} color="#6b7280" />
                )}
              </div>
              <div>
                <h3 style={styles.balanceLabel}>Your Balance</h3>
                <p
                  style={{
                    ...styles.balanceAmount,
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
                  color: '#166534',
                  backgroundColor: '#f0fdf4',
                }}
              >
                <p style={{ fontWeight: '500', margin: '0 0 4px 0' }}>
                  You spent more
                </p>
                <p style={{ margin: 0 }}>
                  {Object.entries(balances)
                    .filter(
                      ([userId, bal]) => bal < 0 && userId !== user?.userId
                    )
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
                  color: '#991b1b',
                  backgroundColor: '#fef2f2',
                }}
              >
                <p style={{ fontWeight: '500', margin: '0 0 4px 0' }}>
                  You spent less
                </p>
                <p style={{ margin: 0 }}>
                  {Object.entries(balances)
                    .filter(
                      ([userId, bal]) => bal > 0 && userId !== user?.userId
                    )
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
                  color: '#6b7280',
                  backgroundColor: '#f9fafb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle size={16} color="#16a34a" />
                <span>You're all settled up!</span>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, ...styles.statCardPurple }}>
              <div>
                <p style={styles.statLabel}>
                  Total Expense Since Last Settlement
                </p>
                <p style={{ ...styles.statValue, color: '#7c3aed' }}>
                  {formatCurrency(recentTotal)}
                </p>
              </div>
              <DollarSign size={32} color="#a855f7" />
            </div>
            <div style={{ ...styles.statCard, ...styles.statCardOrange }}>
              <div>
                <p style={styles.statLabel}>
                  Amount of transactions since last settlement
                </p>
                <p style={{ ...styles.statValue, color: '#ea580c' }}>
                  {recentSumTransactions}
                </p>
              </div>
              <FileText size={32} color="#fb923c" />
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
            ></span>
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
                  const isOwedToPurchaser = tx.owedToPurchaser && !isSettlement;

                  return (
                    <tr
                      key={tx._id}
                      style={{
                        ...styles.tableRow,
                        ...(isSettlement ? styles.settlementRow : {}),
                        ...(isOwedToPurchaser ? styles.owedToPurchaserRow : {}),
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
                            {isSettlement ? '💰' : getCategoryIcon(tx.category)}
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
                          {isOwedToPurchaser && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#92400e',
                                fontWeight: '600',
                                marginLeft: '4px',
                              }}
                            ></span>
                          )}
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
    </div>
  );
};

export default TransactionList;
