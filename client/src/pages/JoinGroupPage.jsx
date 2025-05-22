import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { joinGroupWithToken } from '../services/groupService';
import { AuthContext } from '../contexts/AuthContext';

const JoinGroupPage = () => {
  const { inviteToken } = useParams();
  const [message, setMessage] = useState('Joining...');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const join = async () => {
      try {
        const res = await joinGroupWithToken(inviteToken);
        setMessage(`✅ ${res.message}: ${res.group.name}`);
        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (err) {
        setMessage(`❌ ${err.response?.data?.error || 'Failed to join group'}`);
      }
    };

    if (user) join();
    else setMessage('You must be logged in to join a group.');
  }, [inviteToken, user, navigate]);

  return (
    <div style={{ padding: '40px', color: '#fff' }}>
      <h2>Joining Group</h2>
      <p>{message}</p>
    </div>
  );
};

export default JoinGroupPage;
