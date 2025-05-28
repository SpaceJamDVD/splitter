import React, { useState, useEffect, useContext } from 'react';
import {
  getGroupBudgets,
  getBudgetOverview,
  createBudget,
  updateBudget,
  deleteBudget,
  getCategories,
} from '../services/budgetService';
import { AuthContext } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import {
  DollarSign,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle,
  X,
} from 'lucide-react';

const BudgetManagement = ({ groupId }) => {
  const { user, token } = useContext(AuthContext);
  const [budgets, setBudgets] = useState([]);
  const [overview, setOverview] = useState(null);
  const [categories, setCategories] = useState({
    predefined: [],
    custom: [],
    all: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    customCategory: '',
    amount: '',
    period: 'monthly',
    alertAt: 80,
  });

  // Socket connection for real-time updates
  useEffect(() => {
    const fetchAllData = async () => {
      if (!groupId) return;

      try {
        setLoading(true);

        await Promise.all([fetchBudgets(), fetchOverview(), fetchCategories()]);
      } catch (err) {
        console.error('Budget fetch error:', err);
        setError('Failed to load budget data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [groupId]);

  // Fetch all data
  const fetchBudgets = async () => {
    try {
      const budgetsData = await getGroupBudgets(groupId);
      setBudgets(budgetsData);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError('Failed to load budgets');
    }
  };

  const fetchOverview = async () => {
    try {
      const overviewData = await getBudgetOverview(groupId);
      setOverview(overviewData);
    } catch (err) {
      console.error('Error fetching overview:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories(groupId);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const category =
        formData.category === 'custom'
          ? formData.customCategory
          : formData.category;

      const budgetData = {
        groupId,
        category,
        amount: parseFloat(formData.amount),
        period: formData.period,
        alertAt: parseInt(formData.alertAt),
        isCustomCategory: formData.category === 'custom',
      };

      if (editingBudget) {
        await updateBudget(editingBudget._id, budgetData);
      } else {
        await createBudget(budgetData);
      }

      // Reset form
      setFormData({
        category: '',
        customCategory: '',
        amount: '',
        period: 'monthly',
        alertAt: 80,
      });
      setShowCreateForm(false);
      setEditingBudget(null);

      await fetchBudgets();
      await fetchOverview();
    } catch (err) {
      alert(
        'Failed to save budget: ' + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.isCustomCategory ? 'custom' : budget.category,
      customCategory: budget.isCustomCategory ? budget.category : '',
      amount: budget.amount.toString(),
      period: budget.period,
      alertAt: budget.alertAt,
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (budgetId) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;

    try {
      await deleteBudget(budgetId);
      await fetchBudgets();
      await fetchOverview();
    } catch (err) {
      alert(
        'Failed to delete budget: ' + (err.response?.data?.error || err.message)
      );
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getBudgetStatusColor = (budget) => {
    if (budget.isOverBudget) return '#dc2626';
    if (budget.shouldAlert) return '#f59e0b';
    return '#16a34a';
  };

  const getBudgetStatusText = (budget) => {
    if (budget.isOverBudget) return 'Over Budget';
    if (budget.shouldAlert) return 'Alert';
    return 'On Track';
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
      case 'miscellaneous':
      default:
        return '📝';
    }
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
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px',
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '8px',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '16px',
      margin: 0,
    },
    addButton: {
      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '12px',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    overviewCard: {
      background: 'white',
      borderRadius: '16px',
      boxShadow:
        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      padding: '24px',
      marginBottom: '32px',
      border: '1px solid #f3f4f6',
    },
    overviewHeader: {
      marginBottom: '24px',
    },
    overviewTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: 0,
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
    },
    statCard: {
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'transform 0.2s ease',
    },
    statCardBlue: {
      background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
      borderColor: '#3b82f6',
    },
    statCardGreen: {
      background: 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)',
      borderColor: '#22c55e',
    },
    statCardPurple: {
      background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
      borderColor: '#a855f7',
    },
    statCardOrange: {
      background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
      borderColor: '#fb923c',
    },
    statValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '0 0 4px 0',
    },
    statLabel: {
      fontSize: '14px',
      margin: 0,
      color: '#6b7280',
      fontWeight: '500',
    },
    budgetsCard: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #f3f4f6',
      overflow: 'hidden',
    },
    budgetsHeader: {
      padding: '20px 24px',
      borderBottom: '1px solid #f3f4f6',
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
    },
    budgetsTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: 0,
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
      margin: '0 0 8px 0',
      fontWeight: '500',
    },
    emptySubtitle: {
      color: '#9ca3af',
      fontSize: '14px',
      margin: '0 0 24px 0',
    },
    emptyButton: {
      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '14px',
    },
    budgetItem: {
      padding: '24px',
      borderBottom: '1px solid #f3f4f6',
      transition: 'background-color 0.15s ease',
    },
    budgetHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
    },
    budgetInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    budgetIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
    },
    budgetDetails: {
      flex: 1,
    },
    budgetName: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#111827',
      margin: '0 0 4px 0',
    },
    budgetPeriod: {
      fontSize: '14px',
      color: '#6b7280',
      margin: 0,
      textTransform: 'capitalize',
    },
    budgetActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    statusBadge: {
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    actionButton: {
      padding: '8px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    editButton: {
      backgroundColor: '#f0f9ff',
      color: '#0369a1',
    },
    deleteButton: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
    },
    budgetStats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px',
      marginBottom: '20px',
    },
    statItem: {
      textAlign: 'center',
    },
    statItemLabel: {
      fontSize: '12px',
      color: '#6b7280',
      margin: '0 0 4px 0',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontWeight: '500',
    },
    statItemValue: {
      fontSize: '18px',
      fontWeight: '600',
      margin: 0,
    },
    progressContainer: {
      marginBottom: '16px',
    },
    progressHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '8px',
    },
    progressLabel: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '500',
    },
    progressPercentage: {
      fontSize: '14px',
      fontWeight: '600',
    },
    progressBar: {
      width: '100%',
      height: '8px',
      backgroundColor: '#f3f4f6',
      borderRadius: '4px',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: '4px',
      transition: 'width 0.3s ease',
    },
    budgetFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '13px',
      color: '#6b7280',
    },
    modal: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      backdropFilter: 'blur(4px)',
    },
    modalContent: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      width: '100%',
      maxWidth: '500px',
      margin: '20px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      margin: 0,
    },
    closeButton: {
      padding: '4px',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '6px',
      color: '#6b7280',
      transition: 'all 0.2s ease',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
    },
    input: {
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'border-color 0.2s ease',
      outline: 'none',
    },
    select: {
      padding: '12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: 'white',
      outline: 'none',
    },
    helpText: {
      fontSize: '12px',
      color: '#6b7280',
      margin: '4px 0 0 0',
    },
    formActions: {
      display: 'flex',
      gap: '12px',
      paddingTop: '16px',
    },
    submitButton: {
      flex: 1,
      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '14px',
    },
    cancelButton: {
      flex: 1,
      backgroundColor: '#f3f4f6',
      color: '#374151',
      padding: '12px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '14px',
    },
    errorMessage: {
      padding: '16px 24px',
      background: '#fef2f2',
      borderLeft: '4px solid #dc2626',
      color: '#dc2626',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: '24px',
      borderRadius: '0 8px 8px 0',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>
              <Target size={32} color="#2563eb" />
              Budget Management
            </h1>
            <p style={styles.subtitle}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>
            <Target size={32} color="#2563eb" />
            Budget Management
          </h1>
          <p style={styles.subtitle}>
            Track spending against your budget goals
          </p>
        </div>
        <button
          style={styles.addButton}
          onClick={() => setShowCreateForm(true)}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          }}
        >
          <Plus size={20} />
          Add Budget
        </button>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div style={styles.overviewCard}>
          <div style={styles.overviewHeader}>
            <h2 style={styles.overviewTitle}>
              <TrendingUp size={20} color="#2563eb" />
              Budget Overview
            </h2>
          </div>

          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, ...styles.statCardBlue }}>
              <div>
                <p style={styles.statLabel}>Total Budgeted</p>
                <p style={{ ...styles.statValue, color: '#1d4ed8' }}>
                  {formatCurrency(overview.totalBudgeted)}
                </p>
              </div>
              <DollarSign size={32} color="#3b82f6" />
            </div>

            <div style={{ ...styles.statCard, ...styles.statCardGreen }}>
              <div>
                <p style={styles.statLabel}>Total Spent</p>
                <p style={{ ...styles.statValue, color: '#16a34a' }}>
                  {formatCurrency(overview.totalSpent)}
                </p>
              </div>
              <TrendingUp size={32} color="#22c55e" />
            </div>

            <div style={{ ...styles.statCard, ...styles.statCardPurple }}>
              <div>
                <p style={styles.statLabel}>Remaining</p>
                <p
                  style={{
                    ...styles.statValue,
                    color: overview.totalRemaining >= 0 ? '#7c3aed' : '#dc2626',
                  }}
                >
                  {formatCurrency(overview.totalRemaining)}
                </p>
              </div>
              <Target size={32} color="#a855f7" />
            </div>

            <div style={{ ...styles.statCard, ...styles.statCardOrange }}>
              <div>
                <p style={styles.statLabel}>Alerts</p>
                <p style={{ ...styles.statValue, color: '#ea580c' }}>
                  {overview.alertCount}
                </p>
              </div>
              <AlertTriangle size={32} color="#fb923c" />
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Budget Form */}
      {showCreateForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
              </h2>
              <button
                style={styles.closeButton}
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingBudget(null);
                  setFormData({
                    category: '',
                    customCategory: '',
                    amount: '',
                    period: 'monthly',
                    alertAt: 80,
                  });
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = '#f3f4f6')
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = 'transparent')
                }
              >
                <X size={24} />
              </button>
            </div>

            <form style={styles.form} onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  style={styles.select}
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                >
                  <option value="">Select Category</option>
                  {categories.predefined.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="custom">Custom Category</option>
                </select>
              </div>

              {formData.category === 'custom' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Custom Category Name</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={formData.customCategory}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customCategory: e.target.value,
                      })
                    }
                    placeholder="Enter custom category name"
                    required
                  />
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Budget Amount</label>
                <input
                  style={styles.input}
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Time Period</label>
                <select
                  style={styles.select}
                  value={formData.period}
                  onChange={(e) =>
                    setFormData({ ...formData, period: e.target.value })
                  }
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Alert Threshold (%)</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  max="100"
                  value={formData.alertAt}
                  onChange={(e) =>
                    setFormData({ ...formData, alertAt: e.target.value })
                  }
                  placeholder="80"
                />
                <p style={styles.helpText}>
                  Get notified when spending reaches this percentage
                </p>
              </div>

              <div style={styles.formActions}>
                <button type="submit" style={styles.submitButton}>
                  {editingBudget ? 'Update Budget' : 'Create Budget'}
                </button>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingBudget(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget List */}
      <div style={styles.budgetsCard}>
        <div style={styles.budgetsHeader}>
          <h2 style={styles.budgetsTitle}>
            <Calendar size={20} color="#6b7280" />
            Active Budgets
          </h2>
        </div>

        {budgets.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Target size={32} color="#9ca3af" />
            </div>
            <h3 style={styles.emptyTitle}>No budgets yet</h3>
            <p style={styles.emptySubtitle}>
              Start tracking your spending by creating your first budget
            </p>
            <button
              style={styles.emptyButton}
              onClick={() => setShowCreateForm(true)}
            >
              Create Budget
            </button>
          </div>
        ) : (
          <div>
            {budgets.map((budget) => (
              <div
                key={budget._id}
                style={styles.budgetItem}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f9fafb')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <div style={styles.budgetHeader}>
                  <div style={styles.budgetInfo}>
                    <div style={styles.budgetIcon}>
                      {getCategoryIcon(budget.category)}
                    </div>
                    <div style={styles.budgetDetails}>
                      <h3 style={styles.budgetName}>{budget.category}</h3>
                      <p style={styles.budgetPeriod}>{budget.period} Budget</p>
                    </div>
                  </div>

                  <div style={styles.budgetActions}>
                    <div
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: getBudgetStatusColor(budget) + '20',
                        color: getBudgetStatusColor(budget),
                      }}
                    >
                      {budget.shouldAlert && <AlertTriangle size={12} />}
                      {getBudgetStatusText(budget)}
                    </div>

                    <button
                      style={{ ...styles.actionButton, ...styles.editButton }}
                      onClick={() => handleEdit(budget)}
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor = '#dbeafe')
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = '#f0f9ff')
                      }
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      style={{ ...styles.actionButton, ...styles.deleteButton }}
                      onClick={() => handleDelete(budget._id)}
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor = '#fee2e2')
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = '#fef2f2')
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div style={styles.budgetStats}>
                  <div style={styles.statItem}>
                    <p style={styles.statItemLabel}>Budgeted</p>
                    <p style={{ ...styles.statItemValue, color: '#111827' }}>
                      {formatCurrency(budget.amount)}
                    </p>
                  </div>
                  <div style={styles.statItem}>
                    <p style={styles.statItemLabel}>Spent</p>
                    <p
                      style={{
                        ...styles.statItemValue,
                        color: getBudgetStatusColor(budget),
                      }}
                    >
                      {formatCurrency(budget.currentSpending)}
                    </p>
                  </div>
                  <div style={styles.statItem}>
                    <p style={styles.statItemLabel}>Remaining</p>
                    <p
                      style={{
                        ...styles.statItemValue,
                        color:
                          budget.remainingAmount >= 0 ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {formatCurrency(budget.remainingAmount)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={styles.progressContainer}>
                  <div style={styles.progressHeader}>
                    <span
                      style={{
                        ...styles.progressPercentage,
                        color: getBudgetStatusColor(budget),
                      }}
                    >
                      {budget.percentageUsed.toFixed(1)}%
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${Math.min(budget.percentageUsed, 100)}%`,
                        backgroundColor: getBudgetStatusColor(budget),
                      }}
                    />
                  </div>
                </div>

                <div style={styles.budgetFooter}>
                  <span>{budget.transactionCount} transactions</span>
                  <span>
                    {budget.currentPeriodStart && budget.currentPeriodEnd
                      ? `${new Date(
                          budget.currentPeriodStart
                        ).toLocaleDateString()} - ${new Date(
                          budget.currentPeriodEnd
                        ).toLocaleDateString()}`
                      : 'Current period'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={styles.errorMessage}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default BudgetManagement;
