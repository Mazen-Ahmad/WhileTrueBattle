import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import LoadingSpinner from './components/common/LoadingSpinner';
import ThemeToggle from './components/common/ThemeToggle';
import './App.css';
import './styles/neon-theme.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return user ? <HomePage /> : <AuthPage />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;