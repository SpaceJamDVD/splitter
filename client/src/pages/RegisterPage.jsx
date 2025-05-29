import React from 'react';
import RegisterForm from '../components/RegisterForm';
import PageWrapper from '../components/PageWrapper';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = (token, user) => {
    // Store auth data
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    navigate('/dashboard');
  };

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  return (
    <PageWrapper>
      <RegisterForm
        onSuccess={handleSuccess}
        onNavigateToLogin={handleNavigateToLogin}
      />
    </PageWrapper>
  );
}

export default RegisterPage;
