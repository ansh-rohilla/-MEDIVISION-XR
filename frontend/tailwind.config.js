/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49',
        },
        accent: {
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
        },
        obsidian: {
          800: '#111827',
          900: '#0B0F17',
          950: '#05070B',
        },
        clinical: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          muted: '#64748B',
          text: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(2, 132, 199, 0.08)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'card': '0 2px 10px -2px rgba(15, 23, 42, 0.05), 0 4px 20px -2px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 12px 30px -4px rgba(2, 132, 199, 0.14), 0 4px 12px -2px rgba(2, 132, 199, 0.08)',
        'glow': '0 0 25px -5px rgba(14, 165, 233, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
};
