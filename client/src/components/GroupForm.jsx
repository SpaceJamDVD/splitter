import React, { useState } from 'react';
import { createGroup } from '../services/groupService';
import {
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';

const GroupForm = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const group = await createGroup({
        name,
        description,
      });

      setMessageType('success');
      setMessage(`Category "${group.name}" created successfully!`);
      setName('');
      setDescription('');

      // Call onSuccess callback if provided (to close modal, refresh list, etc.)
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(group);
        }, 1500); // Give user time to see success message
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setMessageType('error');
      setMessage(
        error.response?.data?.message ||
          'Failed to create category. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      width: '100%',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      marginBottom: '24px',
      textAlign: 'center',
    },
    title: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#111827',
      margin: '0 0 8px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      margin: 0,
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    input: {
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      fontSize: '16px',
      transition: 'all 0.2s ease',
      outline: 'none',
      background: 'white',
      fontFamily: 'inherit',
    },
    inputFocus: {
      borderColor: '#2563eb',
      boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
    },
    textarea: {
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      fontSize: '16px',
      transition: 'all 0.2s ease',
      outline: 'none',
      background: 'white',
      minHeight: '80px',
      resize: 'vertical',
      fontFamily: 'inherit',
    },
    button: {
      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      color: 'white',
      padding: '14px 24px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    buttonHover: {
      background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 15px -3px rgba(0, 0, 0, 0.1)',
    },
    buttonDisabled: {
      background: '#9ca3af',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none',
    },
    message: {
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '8px',
    },
    successMessage: {
      background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)',
      color: '#166534',
      border: '1px solid #bbf7d0',
    },
    errorMessage: {
      background: 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)',
      color: '#dc2626',
      border: '1px solid #fecaca',
    },
    characterCount: {
      fontSize: '12px',
      color: '#9ca3af',
      textAlign: 'right',
      marginTop: '4px',
    },
    characterCountNearLimit: {
      color: '#f59e0b',
    },
    characterCountOverLimit: {
      color: '#dc2626',
    },
  };

  const maxDescriptionLength = 200;
  const isDescriptionNearLimit =
    description.length > maxDescriptionLength * 0.8;
  const isDescriptionOverLimit = description.length > maxDescriptionLength;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          <Users size={20} color="#2563eb" />
          Create Expense Category
        </h2>
        <p style={styles.subtitle}>
          Organize your shared expenses into categories
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            <Users size={14} />
            Category Name *
          </label>
          <input
            type="text"
            placeholder="e.g., Groceries, Date Nights, Home Expenses, Utilities"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => Object.assign(e.target.style, styles.input)}
            disabled={isLoading}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>
            <FileText size={14} />
            Description
          </label>
          <textarea
            placeholder="What expenses will you track together in this category? (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={styles.textarea}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => Object.assign(e.target.style, styles.textarea)}
            disabled={isLoading}
            maxLength={maxDescriptionLength}
          />
          <div
            style={{
              ...styles.characterCount,
              ...(isDescriptionNearLimit && !isDescriptionOverLimit
                ? styles.characterCountNearLimit
                : {}),
              ...(isDescriptionOverLimit ? styles.characterCountOverLimit : {}),
            }}
          >
            {description.length}/{maxDescriptionLength}
          </div>
        </div>

        <button
          type="submit"
          style={{
            ...styles.button,
            ...(isLoading || isDescriptionOverLimit
              ? styles.buttonDisabled
              : {}),
          }}
          onMouseEnter={(e) => {
            if (!isLoading && !isDescriptionOverLimit) {
              Object.assign(e.target.style, {
                ...styles.button,
                ...styles.buttonHover,
              });
            }
          }}
          onMouseLeave={(e) => {
            Object.assign(e.target.style, styles.button);
          }}
          disabled={isLoading || isDescriptionOverLimit}
        >
          {isLoading ? (
            <>
              <Loader size={16} className="spin" />
              Creating Category...
            </>
          ) : (
            <>
              <Users size={16} />
              Create Category
            </>
          )}
        </button>

        {message && (
          <div
            style={{
              ...styles.message,
              ...(messageType === 'success'
                ? styles.successMessage
                : styles.errorMessage),
            }}
          >
            {messageType === 'success' ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {message}
          </div>
        )}
      </form>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default GroupForm;
