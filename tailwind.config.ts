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
        // 1. Complete Brand Palette from CSS variables
        brand: {
          100: '#ecf5e4',
          200: '#d1e7bc',
          300: '#a3d77a', // --brand-300 / --primary-light
          400: '#8ac644',
          500: '#72B01D', // --brand-500 / --primary
          600: '#5c8d17',
          700: '#467314', // --brand-700 / --primary-dark
          800: '#2f4d0e',
          900: '#1a2c08',
        },
        // 2. Neutral/Surface Colors aligned with CSS variables
        surface: {
          50: '#fdfbf7',
          100: '#f6f3ee',
          200: '#eae6e1',
          300: '#ded5c9',
          400: '#aca295',
          500: '#7a7166',
          600: '#5b5249',
          700: '#434038',
          800: '#262626',  // --surface-800 / --bg-surface
          900: '#1a1a19',  // --surface-900 / --bg-body
        },
        // 3. Semantic Colors mapped to your variables
        primary: {
          DEFAULT: 'var(--primary)',       // Will be #72B01D
          light: 'var(--primary-light)',   // Will be #a3d77a
          dark: 'var(--primary-dark)',     // Will be #467314
        },
        // 4. Contextual Background/Text Colors
        dark: {
          bg: 'var(--dark-bg)',              // surface-900
          text: 'var(--dark-text)',          // surface-50
          'text-secondary': 'var(--dark-text-secondary)', // surface-200
        },
        light: {
          bg: 'var(--light-bg)',             // surface-50
          text: 'var(--light-text)',         // surface-900
          'text-secondary': 'var(--light-text-secondary)', // surface-700
        },
        // 5. Feedback Colors
        success: {
          light: 'var(--success-light)',
          dark: 'var(--success-dark)',
        },
        error: {
          light: '#F94144',
          dark: '#cb3455',
        },
      },
      spacing: {
        'header': 'var(--header-height)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // 6. Extended Fluid Typography from all CSS variables
        'scale-13-14': 'var(--font-scale-13-14)',
        'scale-15-16': 'var(--font-scale-15-16)',
        'scale-15-18': 'var(--font-scale-15-18)',
        'scale-16-19': 'var(--font-scale-16-19)',
        'scale-17-20': 'var(--font-scale-17-20)',
        'scale-20-24': 'var(--font-scale-20-24)',
        'scale-20-26': 'var(--font-scale-20-26)',
        'scale-21-25': 'var(--font-scale-21-25)',
        'scale-23-29': 'var(--font-scale-23-29)',
        'scale-24-30': 'var(--font-scale-24-30)',
        'scale-27-36': 'var(--font-scale-27-36)',
        'scale-29-41': 'var(--font-scale-29-41)',
        'scale-33-46': 'var(--font-scale-33-46)',
        'scale-36-52': 'var(--font-scale-36-52)',
        'scale-38-55': 'var(--font-scale-38-55)',
        'scale-41-58': 'var(--font-scale-41-58)',
        'scale-43-62': 'var(--font-scale-43-62)',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms', // Updated to match --transition-base
        'slow': '350ms', // Updated to match --transition-slow
      },
      borderColor: {
        'subtle': 'var(--border-subtle)',
        'strong': 'var(--border-strong)',
      },
      boxShadow: {
        'glow-soft': 'var(--glow-soft)',
        'glow-effect': 'var(--glow-effect)',
        'glow-intense': 'var(--glow-intense)',
        'glow-interactive': 'var(--glow-interactive)',
        // Keep the original as an alias
        'brand': 'var(--glow-effect)',
      },
    },
  },
  plugins: [],
}

export default config