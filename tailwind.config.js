/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        'primary-hover': '#1d4ed8',
        'bg-page': '#FFFFFF',
        'bg-subtle': '#F8FAFC',
        'border-default': '#E5E7EB',
        'border-focus': '#2563EB',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'error': '#EF4444',
      },
      fontFamily: {
        sans: ['PingFang SC', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
