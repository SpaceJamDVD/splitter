import React from 'react';
import PropTypes from 'prop-types';

Button.propTypes = {
    onClick: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    };

function Button({ onClick, children }) {
  return (
    <button
      style={{
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        ':hover': {
          backgroundColor: '#0056b3',
        },
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;