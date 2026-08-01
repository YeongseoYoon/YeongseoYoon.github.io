import type { Config } from 'tailwindcss';

/**
 * 디자인 핸드오프(aquarium-tailwind.html)의 tailwind.config를 그대로 이식.
 * 디자인 시스템 비의존 · 독립 팔레트.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Pretendard Variable"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#21AFBF',
          accessible: '#1c95a2',
          bg: '#e7f9fb',
          bgMed: '#b6ecf2',
        },
        secondary: {
          DEFAULT: '#405bbf',
          accessible: '#364ea2',
          bg: '#eceff9',
        },
        ink: {
          DEFAULT: '#23242a',
          sub: '#515462',
          soft: '#73788c',
          faint: '#8f93a3',
        },
        sea: {
          deep: '#0b3f46',
          mid: '#3d7a83',
        },
        positive: { DEFAULT: '#33CC95', accessible: '#2bad7e', bg: '#ebfaf4' },
        negative: { DEFAULT: '#E54A1A', accessible: '#c33f16', bg: '#fcede8' },
        warning: { DEFAULT: '#E5C51A', accessible: '#c3a716', bg: '#fcf9e8' },
        info: { DEFAULT: '#3355CC', accessible: '#2b48ad', bg: '#ebeefa' },
        sand: { light: '#f0e0b4', DEFAULT: '#dfc78f' },
      },
      borderRadius: { phone: '32px' },
      keyframes: {
        swimBob: {
          '0%,100%': { transform: 'translate(0,0)' },
          '25%': { transform: 'translate(9px,-7px)' },
          '50%': { transform: 'translate(0,-3px)' },
          '75%': { transform: 'translate(-9px,-7px)' },
        },
        weedSway: {
          '0%,100%': { transform: 'rotate(-3.5deg)' },
          '50%': { transform: 'rotate(3.5deg)' },
        },
        jellyFloat: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        bubbleRise: {
          '0%': { transform: 'translateY(0)', opacity: '.65' },
          '100%': { transform: 'translateY(-160px)', opacity: '0' },
        },
        sheetUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        splashIn: {
          '0%': { transform: 'scale(.4) translateY(-24px)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        swimBob: 'swimBob 5s ease-in-out infinite',
        weedSway: 'weedSway 6s ease-in-out infinite',
        jellyFloat: 'jellyFloat 7s ease-in-out infinite',
        bubbleRise: 'bubbleRise 7s linear infinite',
        sheetUp: 'sheetUp .28s cubic-bezier(.22,1,.36,1)',
        fadeIn: 'fadeIn .2s ease-out',
        splashIn: 'splashIn .5s cubic-bezier(.22,1,.36,1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
