/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/pixel-retroui/dist/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        // Enhanced brown palette
        brown: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#e0cec7',
          300: '#bfa094',
          400: '#a18072',
          500: '#8B6F47',
          600: '#5C4033',
          700: '#43302b',
          800: '#3E2723',
          900: '#2c1810',
        },
        // Gold accent colors
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#D4AF37',
          600: '#B8860B',
          700: '#9a7a0a',
          800: '#7c6308',
          900: '#664d03',
        },
        // Cream colors
        cream: {
          50: '#fefdfb',
          100: '#fdfaf5',
          200: '#F5E6D3',
          300: '#E8D4B8',
          400: '#d9c4a0',
          500: '#c9b388',
          600: '#b9a270',
          700: '#997e4a',
          800: '#7a6339',
          900: '#5a4828',
        },
        // Warm tan
        tan: {
          light: '#D4A574',
          DEFAULT: '#C19A6B',
          dark: '#A67C52',
        },
        // Keep disco colors as accent
        disco: {
          purple: '#7c3aed',
          pink: '#ec4899',
          gold: '#D4AF37',
          cyan: '#06b6d4',
        },
        retro: {
          orange: '#fb923c',
          yellow: '#fbbf24',
          teal: '#14b8a6',
          violet: '#8b5cf6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
        retro: ['Courier New', 'monospace'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'disco-spin': 'disco-spin 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'gentle-float': 'gentle-float 4s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.6s ease-out',
        'shimmer': 'shimmer 3s linear infinite',
        'scale-in': 'scale-in 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'disco-spin': {
          '0%': { transform: 'rotate(0deg) scale(1)', filter: 'brightness(1)' },
          '25%': { filter: 'brightness(1.2)' },
          '50%': { transform: 'rotate(180deg) scale(1.05)', filter: 'brightness(1)' },
          '75%': { filter: 'brightness(1.2)' },
          '100%': { transform: 'rotate(360deg) scale(1)', filter: 'brightness(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)', opacity: '0.7' },
          '50%': { transform: 'translateY(-20px)', opacity: '1' },
        },
        'gentle-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow': {
          'from': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
          'to': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' },
        },
        'slide-up': {
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'scale-in': {
          'from': { transform: 'scale(0.95)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            opacity: '1',
            boxShadow: '0 0 0 0 rgba(212, 175, 55, 0.7)'
          },
          '50%': { 
            opacity: '0.7',
            boxShadow: '0 0 0 10px rgba(212, 175, 55, 0)'
          },
        },
      },
      backgroundImage: {
        'gradient-disco': 'linear-gradient(135deg, #8B6F47 0%, #5C4033 50%, #43302b 100%)',
        'gradient-retro': 'linear-gradient(to right, #D4A574, #C19A6B, #8B6F47)',
        'gradient-vinyl': 'radial-gradient(circle, #5C4033 0%, #3E2723 100%)',
        'gradient-warm': 'linear-gradient(to right, #D4A574, #C19A6B, #8B6F47)',
        'gradient-gold': 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
        'gradient-elegant': 'linear-gradient(135deg, #F5E6D3 0%, #E8D4B8 100%)',
        'gradient-deep': 'linear-gradient(180deg, #3E2723 0%, #5C4033 100%)',
        'gradient-brown': 'linear-gradient(135deg, #8B6F47 0%, #5C4033 100%)',
      },
      boxShadow: {
        'brown': '0 10px 40px -10px rgba(92, 64, 51, 0.4)',
        'gold': '0 10px 40px -10px rgba(212, 175, 55, 0.3)',
        'elegant': '0 20px 60px -10px rgba(62, 39, 35, 0.3)',
        'soft': '0 2px 20px rgba(92, 64, 51, 0.08)',
        'card': '0 4px 20px rgba(92, 64, 51, 0.12)',
        'disco': '0 0 20px rgba(212, 175, 55, 0.3), 0 10px 40px rgba(62, 39, 35, 0.4)',
        'glow': '0 0 30px rgba(212, 175, 55, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(212, 175, 55, 0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}