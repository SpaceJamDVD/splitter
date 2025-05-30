import logo from './logo.svg';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import GroupPage from './pages/GroupPage';
import BudgetsPage from './pages/BudgetPage';
import JoinGroupPage from './pages/JoinGroupPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes (no layout) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/join/:inviteToken" element={<JoinGroupPage />} />
          {/* Protected routes (with layout) */}
          <Route
            path="/dashboard"
            element={
              <Layout>
                <GroupPage />
              </Layout>
            }
          />

          <Route
            path="/budgets/:groupId"
            element={
              <Layout>
                <BudgetsPage />
              </Layout>
            }
          />

          <Route
            path="/settings"
            element={
              <Layout>
                <SettingsPage />
              </Layout>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
