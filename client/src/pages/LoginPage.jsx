import React from 'react';
import LoginForm from '../components/LoginForm';
import PageWrapper from '../components/PageWrapper';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const handleSuccess = (token, user) => {
    navigate('/dashboard');
  };

  const handleNavigateToRegister = () => {
    navigate('/register');
  };

  return (
    <PageWrapper>
      <LoginForm
        onSuccess={handleSuccess}
        onNavigateToRegister={handleNavigateToRegister}
      />
    </PageWrapper>
  );
}

export default LoginPage;
