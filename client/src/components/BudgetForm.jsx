import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const BudgetForm = ({
  isOpen,
  onClose,
  onSubmit,
  editingBudget = null,
  categories = { predefined: [], custom: [], all: [] },
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    category: '',
    customCategory: '',
    amount: '',
    period: 'monthly',
    alertAt: 80,
    isRepeating: true,
  });

  // Reset form when modal opens/closes or when editing different budget
  useEffect(() => {
    if (isOpen && editingBudget) {
      // Populate form with existing budget data
      setFormData({
        category: editingBudget.isCustomCategory
          ? 'custom'
          : editingBudget.category,
        customCategory: editingBudget.isCustomCategory
          ? editingBudget.category
          : '',
        amount: editingBudget.amount.toString(),
        period: editingBudget.period,
        alertAt: editingBudget.alertAt,
        isRepeating:
          editingBudget.isRepeating !== undefined
            ? editingBudget.isRepeating
            : true,
      });
    } else if (isOpen && !editingBudget) {
      // Reset to default values for new budget
      setFormData({
        category: '',
        customCategory: '',
        amount: '',
        period: 'monthly',
        alertAt: 80,
        isRepeating: true,
      });
    }
  }, [isOpen, editingBudget]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const category =
      formData.category === 'custom'
        ? formData.customCategory
        : formData.category;

    const budgetData = {
      category,
      amount: parseFloat(formData.amount),
      period: formData.period,
      alertAt: parseInt(formData.alertAt),
      isCustomCategory: formData.category === 'custom',
      isRepeating: formData.isRepeating,
    };

    await onSubmit(budgetData);
  };

  const handleClose = () => {
    setFormData({
      category: '',
      customCategory: '',
      amount: '',
      period: 'monthly',
      alertAt: 80,
      isRepeating: true,
    });
    onClose();
  };

  const styles = {
    modal: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: isOpen ? 'flex' : 'none',
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
      maxHeight: '90vh',
      overflowY: 'auto',
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
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    checkbox: {
      width: '18px',
      height: '18px',
      accentColor: '#2563eb',
      cursor: 'pointer',
    },
    checkboxLabel: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      cursor: 'pointer',
      userSelect: 'none',
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
      opacity: loading ? 0.7 : 1,
      transition: 'opacity 0.2s ease',
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
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {editingBudget ? 'Edit Budget' : 'Create Budget'}
          </h2>
          <button
            style={styles.closeButton}
            onClick={handleClose}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
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

          <div style={styles.formGroup}>
            <div style={styles.checkboxContainer}>
              <input
                style={styles.checkbox}
                type="checkbox"
                id="isRepeating"
                checked={formData.isRepeating}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isRepeating: e.target.checked,
                  })
                }
              />
              <label style={styles.checkboxLabel} htmlFor="isRepeating">
                Repeat this budget automatically
              </label>
            </div>
            <p style={styles.helpText}>
              When enabled, this budget will automatically reset each period.
              When disabled, the budget will deactivate after the current period
              ends.
            </p>
          </div>

          <div style={styles.formActions}>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={loading}
            >
              {loading
                ? 'Saving...'
                : editingBudget
                ? 'Update Budget'
                : 'Create Budget'}
            </button>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;
