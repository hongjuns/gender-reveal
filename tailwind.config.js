/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        pixel: ['RoundedFixedsys', 'monospace'],
      },
      colors: {
        'boy-bg': '#cae7ff',
        'boy-point': '#509fdf',
        'girl-bg': '#ffd2d2',
        'girl-point': '#ff9999',
        'heart-pink': '#fba3af',
        'heart-blue': '#9cc5e5',
        ink: '#232323',
        'ink-muted': '#9f9f9f',
        'input-bg': '#f2f2f2',
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
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(var(--balloon-scale, 1))' },
          '50%': { transform: 'translateY(-6px) scale(var(--balloon-scale, 1))' },
        },
        heartFloat: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-5px) scale(1.08)' },
        },
        tabPop: {
          '0%': {
            transform: 'translate(calc(-50% + var(--tap-offset-x, 0px)), 0) scale(0.7)',
            opacity: '0',
          },
          '15%': {
            transform: 'translate(calc(-50% + var(--tap-offset-x, 0px)), -8px) scale(1.15)',
            opacity: '1',
          },
          '35%': {
            transform: 'translate(calc(-50% + var(--tap-offset-x, 0px)), -14px) scale(1)',
            opacity: '1',
          },
          '100%': {
            transform: 'translate(calc(-50% + var(--tap-offset-x, 0px)), -50px) scale(1)',
            opacity: '0',
          },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        burst: 'burst 0.6s ease-out forwards',
        confettiBurst: 'confettiBurst 0.9s ease-out forwards',
        fadeIn: 'fadeIn 0.4s ease-out',
        pulseSoft: 'pulseSoft 1.4s ease-in-out infinite',
        float: 'float 2.6s ease-in-out infinite',
        heartFloat: 'heartFloat 1.8s ease-in-out infinite',
        tabPop: 'tabPop 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
};
