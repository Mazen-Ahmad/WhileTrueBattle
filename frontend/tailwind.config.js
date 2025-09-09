/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#0066cc',
          purple: '#7700cc',
          pink: '#cc0099',
          green: '#00cc66',
          yellow: '#ccaa00',
          red: '#cc0000',
          dark: '#0a0a0f',
          darker: '#050507',
          gray: '#1a1a25',
          light: '#e0e0ff'
        },
        primary: {
          DEFAULT: '#0066cc',
          hover: '#0080ff',
          dark: '#004499'
        },
        secondary: {
          DEFAULT: '#7700cc',
          hover: '#9933ff',
          dark: '#550099'
        },
        accent: {
          DEFAULT: '#cc0099',
          hover: '#ff33cc',
          dark: '#990066'
        },
        background: {
          dark: '#0a0a0f',
          darker: '#050507',
          light: '#f0f0ff'
        }
      },
      boxShadow: {
        'neon-blue': '0 0 8px #0066cc, 0 0 25px rgba(0, 102, 204, 0.5)',
        'neon-purple': '0 0 8px #7700cc, 0 0 25px rgba(119, 0, 204, 0.5)',
        'neon-pink': '0 0 8px #cc0099, 0 0 25px rgba(204, 0, 153, 0.5)',
        'neon-green': '0 0 8px #00cc66, 0 0 25px rgba(0, 204, 102, 0.5)',
        'neon-red': '0 0 8px #cc0000, 0 0 25px rgba(204, 0, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 8px #0066cc, 0 0 15px rgba(0, 102, 204, 0.5)' },
          '100%': { boxShadow: '0 0 15px #0066cc, 0 0 40px rgba(0, 102, 204, 0.8)' },
        },
      },
      fontFamily: {
        'cyber': ['"Orbitron"', 'sans-serif'],
        'code': ['"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
}