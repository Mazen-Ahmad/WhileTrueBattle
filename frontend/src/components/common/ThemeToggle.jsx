import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ position = 'top-right' }) => {
  const { theme, toggleTheme } = useTheme();
  
  const getPositionClasses = () => {
    switch(position) {
      case 'top-left': return 'top-5 left-5';
      case 'top-right': return 'top-3 right-0';
      case 'bottom-left': return 'bottom-5 left-5';
      case 'bottom-right': return 'bottom-5 right-0';
      default: return 'top-5 right-5';
    }
  };

  return (
    <motion.button
      className={`fixed z-50 w-16 h-10 flex items-center justify-center cursor-pointer backdrop-blur-md focus:outline-none ${getPositionClasses()}`}
      style={{
        borderRadius: '20px 0px 0px 20px',
        background: theme === 'neon' 
          ? 'radial-gradient(circle, #000000 60%, rgba(204, 0, 0, 0.1) 80%, rgba(0, 102, 204, 0.1) 100%)'
          : '#fefefe',
        borderLeft: '3px solid',
        borderTop: '3px solid',
        borderBottom: '3px solid',
        borderRight: 'none',
        borderColor: theme === 'neon' 
          ? '#e0e0e0' 
          : '#000000',
        boxShadow: theme === 'neon' 
          ? '0 0 15px rgba(224, 224, 224, 0.3), inset 0 0 15px rgba(224, 224, 224, 0.1)'
          : '0 0 8px rgba(0, 0, 0, 0.3)',
        color: theme === 'neon' ? '#e0e0e0' : '#374151'
      }}

      onClick={toggleTheme}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={{ rotate: theme === 'neon' ? 180 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {theme === 'default' ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#4a4a4a"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="5" fill="#e0e0e0"/>
            <line x1="12" y1="1" x2="12" y2="3" stroke="#e0e0e0" strokeWidth="2"/>
            <line x1="12" y1="21" x2="12" y2="23" stroke="#e0e0e0" strokeWidth="2"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#e0e0e0" strokeWidth="2"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="#e0e0e0" strokeWidth="2"/>
            <line x1="1" y1="12" x2="3" y2="12" stroke="#e0e0e0" strokeWidth="2"/>
            <line x1="21" y1="12" x2="23" y2="12" stroke="#e0e0e0" strokeWidth="2"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="#e0e0e0" strokeWidth="2"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="#e0e0e0" strokeWidth="2"/>
          </svg>
        )}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;