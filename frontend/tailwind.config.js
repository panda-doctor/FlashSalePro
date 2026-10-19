/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#409EFF',
          dark: '#337ECC',
          light: '#79BBFF',
          soft: '#ECF5FF',
        },
        ink: {
          900: '#303133',
          700: '#606266',
          500: '#909399',
          300: '#C0C4CC',
        },
        canvas: '#F5F7FA',
        surface: '#FFFFFF',
        muted: '#FAFAFA',
        line: '#DCDFE6',
        price: '#FF7D00',
        success: '#67C23A',
        warning: '#E6A23C',
        danger: '#F56C6C',
      },
      fontFamily: {
        sans: [
          'PingFang SC',
          'Microsoft YaHei',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      maxWidth: {
        page: '1200px',
      },
      spacing: {
        18: '4.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04)',
        lift: '0 4px 12px rgba(64, 158, 255, 0.15), 0 12px 32px rgba(0, 0, 0, 0.06)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
