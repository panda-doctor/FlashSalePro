/**
 * 秒杀商城视觉体系 v4 ——「Warm Atelier Light」
 *
 * 奶白纸感画布 + 纯白卡片 + 深赤陶主色：暖而不腻，科技感来自极淡的暖灰星链与细网格。
 * - canvas/surface/muted/line 构成四级浅色表面，ink-* 为深暖棕文字层级
 * - brand 收敛到深赤陶（白底可读 ≥4.5:1），价格使用更深的 price
 * - atelier-* 为历史遗留令牌键，值已回映到浅色体系；noir 仅作深色文字/描边，ivory 仅用于赤陶面板上的文字
 * - 新代码请优先使用 brand / ink / canvas / surface / muted / line / price
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#B8543A',
          dark: '#963D26',
          light: '#E8A87C',
          soft: '#F7E7DE',
        },
        /* 历史别名（值已回映到 Warm Atelier Light 体系） */
        atelier: {
          ink: '#2B211B',
          noir: '#2A1A13',
          ivory: '#FFFBF5',
          sand: '#F4E7DB',
          gold: '#9C6B2F',
          'gold-light': '#C58B4E',
          clay: '#6E5C51',
          stone: '#8A7365',
          coral: '#B8543A',
          peach: '#E8A87C',
          apricot: '#D98A6A',
          rose: '#FBEFE7',
          olive: '#2F7D5A',
        },
        ink: {
          900: '#2B211B',
          700: '#4A3B32',
          500: '#6E5C51',
          300: '#A0907F',
        },
        canvas: '#FAF6F1',
        surface: '#FFFFFF',
        muted: '#F5EDE6',
        line: '#EADFD5',
        price: '#A6402A',
        success: '#2F7D5A',
        warning: '#8F5A0F',
        danger: '#B23A32',
      },
      opacity: {
        15: '0.15',
        45: '0.45',
        55: '0.55',
        65: '0.65',
        85: '0.85',
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
        display: ['Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', 'serif'],
      },
      maxWidth: {
        page: '1200px',
      },
      spacing: {
        18: '4.5rem',
      },
      boxShadow: {
        card: 'inset 0 1px 0 #FFFFFF, 0 1px 2px rgba(120,72,48,0.04), 0 12px 28px rgba(120,72,48,0.08)',
        lift: 'inset 0 1px 0 #FFFFFF, 0 18px 44px rgba(120,72,48,0.14)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 24px 60px rgba(120,72,48,0.1)',
        'glass-dark': 'inset 0 1px 0 rgba(255,255,255,0.95), 0 30px 80px rgba(120,72,48,0.12)',
        'tech-panel': '0 1px 2px rgba(120,72,48,0.05), 0 18px 44px rgba(120,72,48,0.1)',
        'tech-lift': '0 22px 52px rgba(120,72,48,0.16), 0 4px 12px rgba(120,72,48,0.08)',
        'tech-cta': '0 12px 28px rgba(184, 84, 58, 0.26)',
        'tech-gold': '0 12px 30px rgba(156, 107, 47, 0.16)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
