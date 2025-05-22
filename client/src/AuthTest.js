import React, { useState } from 'react';
import Button from './components/button';
import API from './api';

export default function AuthTest() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    try {
      const res = await API.post('/auth/register', { username, password });
      setMessage(`✅ Registered: ${res.data.userId}`);
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || 'Error'}`);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await API.post('/auth/login', { username, password });
      setMessage(`Logged in: ${res.data.username}`);
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || 'Error'}`);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2> Dirty Auth Page</h2>
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} /><br /><br />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} /><br /><br />
      <Button onClick={handleRegister}>Register</Button>
      <Button onClick={handleLogin}>Login</Button>
      <p>{message}</p>
    </div>
  );
}
