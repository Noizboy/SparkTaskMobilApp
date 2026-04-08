import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ForgotPassword } from './components/ForgotPassword';
import { RegisterCleanerPage } from './components/pages/RegisterCleanerPage';
import { Dashboard } from './components/Dashboard';
import * as api from './services/api';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'forgot-password' | 'register-cleaner' | 'dashboard'>('login');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('sparkTaskUser');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.token) {
          setUser(parsed);
          setCurrentView('dashboard');
          return;
        }
        // Stale session without token — clear it and require re-login
        localStorage.removeItem('sparkTaskUser');
      } catch {
        localStorage.removeItem('sparkTaskUser');
      }
    }

    // Check if accessing cleaner registration link
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('invite');
    if (inviteToken) {
      setCurrentView('register-cleaner');
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('sparkTaskUser', JSON.stringify(userData));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sparkTaskUser');
    setCurrentView('login');
  };

  const handleCleanerRegisterSuccess = () => {
    // After cleaner registration, show a success message and redirect to login
    alert('Account created successfully! Please sign in with your credentials.');
    setCurrentView('login');
  };

  if (currentView === 'login') {
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setCurrentView('register')}
        onSwitchToForgotPassword={() => setCurrentView('forgot-password')}
        onSubmit={async (email, password) => {
          const userData = await api.login(email, password);
          handleLogin(userData);
        }}
      />
    );
  }

  if (currentView === 'register') {
    const handleResendEmail = async (email: string) => {
      // Simulate resending verification email
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Resending verification email to:', email);
    };

    return (
      <Register
        onRegister={handleLogin}
        onSwitchToLogin={() => setCurrentView('login')}
        onResendEmail={handleResendEmail}
        onSubmit={async (formData) => {
          await api.register({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            company: formData.companyName,
          });
        }}
      />
    );
  }

  if (currentView === 'forgot-password') {
    return (
      <ForgotPassword 
        onBackToLogin={() => setCurrentView('login')} 
      />
    );
  }

  if (currentView === 'register-cleaner') {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('invite');
    const companyName = urlParams.get('company') || 'SparkTask Company';
    
    return (
      <RegisterCleanerPage 
        inviteToken={inviteToken || undefined}
        companyName={companyName}
        onRegisterSuccess={handleCleanerRegisterSuccess}
      />
    );
  }

  const handleUserUpdate = (updated: any) => {
    setUser(updated);
    localStorage.setItem('sparkTaskUser', JSON.stringify(updated));
  };

  return (
    <>
      <Dashboard user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
      <Toaster richColors position="top-right" />
    </>
  );
}