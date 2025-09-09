import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/common/ThemeToggle';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import logo from '../assets/l1.png';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <img 
          src={logo} 
          alt="Logo" 
          className={`h-[150px] w-[150px] ${theme === 'neon' ? 'logo-glow' : ''}`}
        />
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="w-full max-w-md"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <motion.div
          key={isLogin ? 'login' : 'register'}
          initial={{ x: isLogin ? -100 : 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: isLogin ? 100 : -100, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {isLogin ? (
            <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </motion.div>
      </motion.div>
      
      <ThemeToggle position="top-right" />
    </div>
  );
};

export default AuthPage;