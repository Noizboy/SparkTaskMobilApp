import { useState } from 'react';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ForgotPassword } from './components/ForgotPassword';
import { RegisterCleanerPage } from './components/pages/RegisterCleanerPage';
import { Dashboard } from './components/Dashboard';
import * as api from './services/api';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [user, setUser] = useState<any>(() => {
    try {
      // Check localStorage first (remember me), then sessionStorage (session only)
      const stored = localStorage.getItem('sparkTaskUser') || sessionStorage.getItem('sparkTaskUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token) return parsed;
        localStorage.removeItem('sparkTaskUser');
        sessionStorage.removeItem('sparkTaskUser');
      }
    } catch {
      localStorage.removeItem('sparkTaskUser');
      sessionStorage.removeItem('sparkTaskUser');
    }
    return null;
  });

  const [currentView, setCurrentView] = useState<'login' | 'register' | 'forgot-password' | 'register-cleaner' | 'dashboard'>(() => {
    // If user was restored from localStorage, go straight to dashboard
    if (user) return 'dashboard';
    // Check if accessing cleaner registration link
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('invite')) return 'register-cleaner';
    return 'login';
  });

  const handleLogin = (userData: any, rememberMe = false) => {
    setUser(userData);
    const serialized = JSON.stringify(userData);
    if (rememberMe) {
      localStorage.setItem('sparkTaskUser', serialized);
    } else {
      sessionStorage.setItem('sparkTaskUser', serialized);
    }
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sparkTaskUser');
    sessionStorage.removeItem('sparkTaskUser');
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
        onSubmit={async (email, password, rememberMe) => {
          const userData = await api.login(email, password);
          handleLogin(userData, rememberMe);
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
    const serialized = JSON.stringify(updated);
    if (localStorage.getItem('sparkTaskUser')) {
      localStorage.setItem('sparkTaskUser', serialized);
    } else {
      sessionStorage.setItem('sparkTaskUser', serialized);
    }
  };

  return (
    <>
      <Dashboard user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
      <Toaster richColors position="top-right" />
    </>
  );
}