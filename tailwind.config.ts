import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand-primary)',
          foreground: 'var(--brand-foreground)',
        },
        purple: {
          50:  '#F5F3FB',
          100: '#EDE9FF',
          200: '#D4CCFF',
          700: '#4A2FA0',
          900: '#2D1B69',
        },
        orange: {
          DEFAULT: '#fd9900', //E8845A
          50:  '#FEF0E8',
          600: '#e6692e', //C4623Aj 
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
