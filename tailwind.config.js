/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'rotate(0deg) scale(var(--balloon-scale, 1))' },
          '20%': { transform: 'rotate(-10deg) scale(var(--balloon-scale, 1))' },
          '40%': { transform: 'rotate(8deg) scale(var(--balloon-scale, 1))' },
          '60%': { transform: 'rotate(-6deg) scale(var(--balloon-scale, 1))' },
          '80%': { transform: 'rotate(5deg) scale(var(--balloon-scale, 1))' },
        },
        burst: {
          '0%': { transform: 'scale(var(--balloon-scale, 1))', opacity: '1' },
          '60%': { transform: 'scale(calc(var(--balloon-scale, 1) * 1.6))', opacity: '1' },
          '100%': { transform: 'scale(calc(var(--balloon-scale, 1) * 2.2))', opacity: '0' },
        },
        confettiBurst: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '1' },
          '100%': {
            transform:
              'translate(var(--confetti-x, 0), var(--confetti-y, 0)) rotate(var(--confetti-rotate, 360deg))',
            opacity: '0',
          },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        burst: 'burst 0.6s ease-out forwards',
        confettiBurst: 'confettiBurst 0.9s ease-out forwards',
        fadeIn: 'fadeIn 0.4s ease-out',
        pulseSoft: 'pulseSoft 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
