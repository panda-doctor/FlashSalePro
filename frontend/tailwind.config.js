/**
 * 秒杀商城视觉体系 v5 ——「Trust Light」
 *
 * 近白纸感画布 + 纯白卡片 + 深靛蓝信任主色 + 交易红强调。
 * - canvas/surface/muted/line 构成四级浅色表面，ink-* 为冷墨文字层级
 * - brand 收敛到深靛蓝（白底可读 ≥4.5:1），用于导航激活/链接/主按钮/图表/焦点环
 * - price / flash 为交易语义：价格、秒杀价、倒计时、进行中徽标与抢购按钮
 * - atelier-* 为历史遗留令牌键，值已回映到冷色体系；noir 仅作深色文字/描边，ivory 仅用于深蓝面板上的文字
 * - 新代码请优先使用 brand / flash / ink / canvas / surface / muted / line / price
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1D4ED8',
          dark: '#1E40AF',
          light: '#93C5FD',
          soft: '#EFF6FF',
        },
        /* 交易强调：价格 / 秒杀 / 倒计时 / 抢购 CTA */
        price: {
          DEFAULT: '#DC2626',
          dark: '#B91C1C',
          soft: '#FEF2F2',
        },
        flash: {
          DEFAULT: '#DC2626',
          dark: '#B91C1C',
          soft: '#FEF2F2',
        },
        /* 历史别名（值已回映到 Trust Light 体系） */
        atelier: {
          ink: '#0F172A',
          noir: '#0F172A',
          ivory: '#FFFFFF',
          sand: '#F1F5F9',
          gold: '#1D4ED8',
          'gold-light': '#3B82F6',
          clay: '#334155',
          stone: '#5B6B7F',
          coral: '#1D4ED8',
          peach: '#93C5FD',
          apricot: '#60A5FA',
          rose: '#EFF6FF',
          olive: '#047857',
        },
        ink: {
          900: '#0F172A',
          700: '#334155',
          500: '#5B6B7F',
          300: '#94A3B8',
        },
        canvas: '#FBFCFD',
        surface: '#FFFFFF',
        muted: '#F1F5F9',
        line: '#E4E9F0',
        success: '#047857',
        warning: '#B45309',
        danger: '#DC2626',
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
        card: 'inset 0 1px 0 #FFFFFF, 0 1px 2px rgba(15,23,42,0.06), 0 12px 28px rgba(15,23,42,0.08)',
        lift: 'inset 0 1px 0 #FFFFFF, 0 18px 44px rgba(15,23,42,0.12)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 24px 60px rgba(15,23,42,0.1)',
        'glass-dark': 'inset 0 1px 0 rgba(255,255,255,0.95), 0 30px 80px rgba(15,23,42,0.12)',
        'tech-panel': '0 1px 2px rgba(15,23,42,0.05), 0 18px 44px rgba(15,23,42,0.1)',
        'tech-lift': '0 22px 52px rgba(15,23,42,0.14), 0 4px 12px rgba(15,23,42,0.08)',
        'tech-cta': '0 12px 28px rgba(29, 78, 216, 0.24)',
        'tech-gold': '0 12px 30px rgba(59, 130, 246, 0.16)',
        'tech-flash': '0 12px 28px rgba(220, 38, 38, 0.24)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
