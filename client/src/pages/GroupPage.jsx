import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useParams } from 'react-router-dom';
import { getGroupById } from '../services/groupService';

const GroupPage = () => {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadGroup = async () => {
      try {
        const data = await getGroupById(id);
        setGroup(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load group');
      } finally {
        setLoading(false);
      }
    };

    loadGroup();
  }, [id]);

  const inviteLink = `${window.location.origin}/join/${group?.inviteToken}`;

  if (loading) return <p style={{ padding: '40px' }}>Loading...</p>;
  if (error) return <p style={{ padding: '40px', color: 'red' }}>{error}</p>;
  if (!group) return null;

  return (
    <div>
      <Navbar />
      <div style={{ marginLeft: '220px', padding: '40px', color: '#fff' }}>
        <h1>{group.name}</h1>
        <p style={{ color: '#ccc' }}>{group.description}</p>

        <button
          onClick={() => setShowModal(true)}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#4caf50',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#fff',
          }}
        >
          + Invite Member
        </button>

        <h3 style={{ marginTop: '30px' }}>Transactions</h3>
        <p>(Transactions will go here)</p>

        <h3>Members</h3>
        <ul>
          {group.members?.map((memberId) => (
            <li key={memberId}>{memberId}</li>
          ))}
        </ul>
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#2c2c3c',
              padding: '30px',
              borderRadius: '8px',
              color: '#fff',
              minWidth: '400px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Invite Link</h2>
            <p style={{ wordWrap: 'break-word' }}>{inviteLink}</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
              }}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupPage;
