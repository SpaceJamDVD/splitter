import React, { useState } from 'react';
import { createTransaction } from '../services/transactionService';
import {
  DollarSign,
  FileText,
  Tag,
  MessageSquare,
  Check,
  X,
} from 'lucide-react';

const TransactionForm = ({ groupId, onClose }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Miscellaneous');
  const [owedToPurchaser, setOwedToPurchaser] = useState(false);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTransaction({
        groupId,
        amount: parseFloat(amount),
        description,
        category,
        owedToPurchaser,
        notes,
      });
      setMessage('✅ Transaction added');
      onClose();
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to add transaction');
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

  const categories = [
    'Rent/Mortgage',
    'Utilities',
    'Groceries',
    'Household',
    'Date Night',
    'Travel',
    'Transportation',
    'Medical',
    'Gifts',
    'Miscellaneous',
  ];

  const styles = {
    form: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    fieldGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      backgroundColor: '#ffffff',
      outline: 'none',
      boxSizing: 'border-box',
    },
    inputFocus: {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
    categoryTabs: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '8px',
      marginBottom: '4px',
    },
    categoryTab: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      padding: '12px 8px',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: '#e5e7eb',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: '#ffffff',
      fontSize: '12px',
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: '1.2',
      color: '#374151', // Add explicit text color
    },
    categoryTabActive: {
      borderColor: '#3b82f6',
      backgroundColor: '#dbeafe',
      color: '#1e40af',
    },
    categoryTabHover: {
      borderColor: '#9ca3af',
      backgroundColor: '#f9fafb',
      color: '#374151', // Ensure text stays visible on hover
    },
    categoryIcon: {
      fontSize: '20px',
      lineHeight: '1',
    },
    categoryText: {
      fontSize: '11px',
      fontWeight: '500',
      color: 'inherit', // Inherit color from parent
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      backgroundColor: '#ffffff',
      outline: 'none',
      resize: 'vertical',
      minHeight: '80px',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
    },
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      backgroundColor: '#f8fafc',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    checkboxContainerChecked: {
      backgroundColor: '#dbeafe',
      borderColor: '#3b82f6',
    },
    checkbox: {
      width: '18px',
      height: '18px',
      accentColor: '#3b82f6',
      cursor: 'pointer',
    },
    checkboxLabel: {
      fontSize: '14px',
      color: '#374151',
      cursor: 'pointer',
      flex: 1,
      margin: 0,
    },
    buttonContainer: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px',
    },
    submitButton: {
      flex: 1,
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    cancelButton: {
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      color: '#374151',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    buttonHover: {
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 12px -2px rgba(0, 0, 0, 0.15)',
    },
    message: {
      marginTop: '16px',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      textAlign: 'center',
    },
    messageSuccess: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      border: '1px solid #a7f3d0',
    },
    messageError: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fecaca',
    },
    categoryOption: {
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
  };

  return (
    <div style={styles.form}>
      {/* Amount Field */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          <DollarSign size={16} color="#6b7280" />
          Amount *
        </label>
        <input
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={styles.input}
          onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
          onBlur={(e) => Object.assign(e.target.style, styles.input)}
        />
      </div>

      {/* Description Field */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          <FileText size={16} color="#6b7280" />
          Description
        </label>
        <input
          type="text"
          placeholder="What was this expense for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={styles.input}
          onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
          onBlur={(e) => Object.assign(e.target.style, styles.input)}
        />
      </div>

      {/* Category Field */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          <Tag size={16} color="#6b7280" />
          Category
        </label>
        <div style={styles.categoryTabs}>
          {categories.map((cat) => {
            const isActive = category === cat;

            return (
              <div
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  ...styles.categoryTab,
                  ...(isActive ? styles.categoryTabActive : {}),
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    Object.assign(e.currentTarget.style, {
                      borderColor: '#9ca3af',
                      backgroundColor: '#f9fafb',
                      color: '#374151',
                    });
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    Object.assign(e.currentTarget.style, {
                      borderColor: '#e5e7eb',
                      backgroundColor: '#ffffff',
                      color: '#374151',
                    });
                  }
                }}
              >
                <div style={styles.categoryIcon}>{getCategoryIcon(cat)}</div>
                <div style={styles.categoryText}>{cat}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checkbox Field */}
      <div style={styles.fieldGroup}>
        <div
          style={{
            ...styles.checkboxContainer,
            ...(owedToPurchaser ? styles.checkboxContainerChecked : {}),
          }}
          onClick={() => setOwedToPurchaser(!owedToPurchaser)}
        >
          <input
            type="checkbox"
            checked={owedToPurchaser}
            onChange={(e) => setOwedToPurchaser(e.target.checked)}
            style={styles.checkbox}
            onClick={(e) => e.stopPropagation()}
          />
          <label style={styles.checkboxLabel}>
            Entire amount owed to purchaser
          </label>
        </div>
      </div>

      {/* Notes Field */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          <MessageSquare size={16} color="#6b7280" />
          Notes (optional)
        </label>
        <textarea
          placeholder="Add any additional details..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={styles.textarea}
          onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
          onBlur={(e) => Object.assign(e.target.style, styles.textarea)}
        />
      </div>

      {/* Buttons */}
      <div style={styles.buttonContainer}>
        <button
          type="button"
          onClick={onClose}
          style={styles.cancelButton}
          onMouseEnter={(e) =>
            Object.assign(e.target.style, styles.buttonHover)
          }
          onMouseLeave={(e) =>
            Object.assign(e.target.style, styles.cancelButton)
          }
        >
          <X size={16} />
          Cancel
        </button>

        <button
          type="submit"
          onClick={handleSubmit}
          style={styles.submitButton}
          onMouseEnter={(e) =>
            Object.assign(e.target.style, styles.buttonHover)
          }
          onMouseLeave={(e) =>
            Object.assign(e.target.style, styles.submitButton)
          }
        >
          <Check size={16} />
          Add Transaction
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          style={{
            ...styles.message,
            ...(message.includes('✅')
              ? styles.messageSuccess
              : styles.messageError),
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default TransactionForm;
