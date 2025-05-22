import logo from './logo.svg';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import GroupPage from './pages/GroupPage';
import JoinGroupPage from './pages/JoinGroupPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/groups/:id" element={<GroupPage />} />
          <Route path="/join/:inviteToken" element={<JoinGroupPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
