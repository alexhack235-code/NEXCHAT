/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'nex-green': '#00FF88',
        'nex-black': '#0A0E13',
        'nex-chat-bg': '#101A24',
        'nex-sidebar': '#111B21',
        'nex-card': '#202C33',
        'nex-bubble-me': '#005C4B',
        'nex-bubble-them': '#202C33',
        'nex-cyan': '#00D4FF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(0, 255, 136, 0.4)',
        'neon-cyan': '0 0 20px rgba(0, 212, 255, 0.3)',
      },
    },
  },
  plugins: [],
};
