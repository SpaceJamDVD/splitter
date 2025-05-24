import React, { useEffect, useState, useContext } from 'react';
import { getGroupTransactions, settleUp } from '../services/transactionService';
import { getBalancesForGroup } from '../services/memberBalanceService';
import { AuthContext } from '../contexts/AuthContext';
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
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [memberBalances, setMemberBalances] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!groupId) return;

      try {
        setLoading(true);

        // Fetch both transactions and balances
        const [transactionsData, balancesData] = await Promise.all([
          getGroupTransactions(groupId),
          getBalancesForGroup(groupId),
        ]);

        console.log('Fetched transactions:', transactionsData);
        console.log('Fetched balances:', balancesData);

        setTransactions(transactionsData);
        setMemberBalances(balancesData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

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

      // Refetch balances after settlement
      const updatedBalances = await getBalancesForGroup(groupId);
      setMemberBalances(updatedBalances);

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
    settleButtonHover: {
      transform: 'scale(1.05)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
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
    tableRowHover: {
      backgroundColor: '#f9fafb',
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
      {/* Header Section */}
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
            onMouseEnter={(e) =>
              Object.assign(e.target.style, styles.settleButtonHover)
            }
            onMouseLeave={(e) =>
              Object.assign(e.target.style, styles.settleButton)
            }
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
                  You are owed money
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
                  You owe money
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
                <p style={styles.statLabel}>Total Expenses</p>
                <p style={{ ...styles.statValue, color: '#7c3aed' }}>
                  {formatCurrency(
                    transactions.reduce((sum, tx) => sum + tx.amount, 0)
                  )}
                </p>
              </div>
              <DollarSign size={32} color="#a855f7" />
            </div>
            <div style={{ ...styles.statCard, ...styles.statCardOrange }}>
              <div>
                <p style={styles.statLabel}>Total Transactions</p>
                <p style={{ ...styles.statValue, color: '#ea580c' }}>
                  {transactions.length}
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
                {transactions.map((tx) => (
                  <tr
                    key={tx._id}
                    style={styles.tableRow}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = '#f9fafb')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <td style={styles.tableCell}>
                      <div>
                        <div style={styles.transactionDescription}>
                          {tx.description || 'No description'}
                        </div>
                        {tx.notes && (
                          <div style={styles.transactionNotes}>{tx.notes}</div>
                        )}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.categoryContainer}>
                        <span style={{ fontSize: '18px' }}>
                          {getCategoryIcon(tx.category)}
                        </span>
                        <span style={styles.categoryText}>
                          {tx.category || 'Uncategorized'}
                        </span>
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={styles.amountText}>
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.userContainer}>
                        <div style={styles.userAvatar}>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
