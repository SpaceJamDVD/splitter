import React from 'react';
import { useNavigate } from 'react-router-dom';

const GroupCard = ({ group }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/groups/${group._id}`);
  };

  const styles = {
    card: {
      backgroundColor: '#2b2b3c',
      color: '#fff',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '15px',
      cursor: 'pointer',
      transition: 'background 0.2s ease',
    },
    title: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
    },
    description: {
      fontSize: '0.95rem',
      color: '#ccc',
      marginTop: '5px',
    },
  };

  return (
    <div style={styles.card} onClick={handleClick}>
      <div style={styles.title}>{group.name}</div>
      <div style={styles.description}>{group.description}</div>
    </div>
  );
};

export default GroupCard;
