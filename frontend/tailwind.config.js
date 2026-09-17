/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        detecto: {
          bg: '#0B131F',
          bgSecondary: '#111A2A',
          bgCard: '#152033',
          border: '#1E2D42',
          accent: '#00FF88',
          accentDim: 'rgba(0, 255, 136, 0.15)',
          accentGlow: 'rgba(0, 255, 136, 0.4)',
          text: '#E8EEF4',
          textMuted: '#6B7C93',
          textDim: '#4A5A6F',
          danger: '#FF3E5E',
          warning: '#FFB800',
          info: '#00D4FF',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 255, 136, 0.3)',
        'glow-sm': '0 0 10px rgba(0, 255, 136, 0.2)',
        'inner-glow': 'inset 0 0 20px rgba(0, 255, 136, 0.1)',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px)',
        'radial-glow': 'radial-gradient(ellipse at center, rgba(0, 255, 136, 0.1) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
}