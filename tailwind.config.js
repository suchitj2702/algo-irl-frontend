export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Core Colors - Use CSS variables directly
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',

        // Primary
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },

        // Secondary
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },

        // Accent
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },

        // Destructive
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },

        // Muted
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },

        // Popover
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },

        // Card
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },

        // Text Hierarchy
        content: {
          DEFAULT: 'var(--text-primary)',
          muted: 'var(--text-muted)',
          subtle: 'var(--text-subtle)',
          inverse: 'var(--text-inverse)',
        },

        // Surfaces
        surface: {
          DEFAULT: 'var(--surface-primary)',
          elevated: 'var(--surface-elevated)',
          muted: 'var(--surface-muted)',
        },

        // Borders
        outline: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },

        // Panel Scale
        panel: {
          DEFAULT: 'var(--panel)',
          50: 'var(--panel-50)',
          100: 'var(--panel-100)',
          200: 'var(--panel-200)',
          300: 'var(--panel-300)',
          400: 'var(--panel-400)',
          500: 'var(--panel-500)',
          600: 'var(--panel-600)',
          700: 'var(--panel-700)',
          800: 'var(--panel-800)',
          900: 'var(--panel-900)',
        },

        // Button Scale
        button: {
          DEFAULT: 'var(--button)',
          foreground: 'var(--button-foreground)',
          50: 'var(--button-50)',
          100: 'var(--button-100)',
          200: 'var(--button-200)',
          300: 'var(--button-300)',
          400: 'var(--button-400)',
          500: 'var(--button-500)',
          600: 'var(--button-600)',
          700: 'var(--button-700)',
          800: 'var(--button-800)',
          900: 'var(--button-900)',
        },

        // Navy (Primary Blue) Scale
        navy: {
          DEFAULT: 'var(--navy)',
          50: 'var(--navy-50)',
          100: 'var(--navy-100)',
          200: 'var(--navy-200)',
          300: 'var(--navy-300)',
          400: 'var(--navy-400)',
          500: 'var(--navy-500)',
          600: 'var(--navy-600)',
          700: 'var(--navy-700)',
          800: 'var(--navy-800)',
          900: 'var(--navy-900)',
        },

        // Slate (Neutral) Scale
        slate: {
          DEFAULT: 'var(--slate)',
          light: 'var(--slate-light)',
          50: 'var(--slate-50)',
          100: 'var(--slate-100)',
          200: 'var(--slate-200)',
          300: 'var(--slate-300)',
          400: 'var(--slate-400)',
          500: 'var(--slate-500)',
          600: 'var(--slate-600)',
          700: 'var(--slate-700)',
          800: 'var(--slate-800)',
          900: 'var(--slate-900)',
        },

        // Mint (Secondary) Scale
        mint: {
          DEFAULT: 'var(--mint)',
          light: 'var(--mint-light)',
          dark: 'var(--mint-dark)',
          50: 'var(--mint-50)',
          100: 'var(--mint-100)',
          200: 'var(--mint-200)',
          300: 'var(--mint-300)',
          400: 'var(--mint-400)',
          500: 'var(--mint-500)',
          600: 'var(--mint-600)',
          700: 'var(--mint-700)',
          800: 'var(--mint-800)',
          900: 'var(--mint-900)',
        },

        // Cream (Accent) Scale
        cream: {
          DEFAULT: 'var(--cream)',
          50: 'var(--cream-50)',
          100: 'var(--cream-100)',
          200: 'var(--cream-200)',
          300: 'var(--cream-300)',
          400: 'var(--cream-400)',
          500: 'var(--cream-500)',
          600: 'var(--cream-600)',
          700: 'var(--cream-700)',
          800: 'var(--cream-800)',
          900: 'var(--cream-900)',
        },

        // Sage (Green tint for Easy difficulty)
        sage: {
          DEFAULT: 'var(--sage)',
          light: 'var(--sage-light)',
          dark: 'var(--sage-dark)',
          50: 'var(--sage-50)',
          100: 'var(--sage-100)',
          200: 'var(--sage-200)',
          300: 'var(--sage-300)',
          400: 'var(--sage-400)',
          500: 'var(--sage-500)',
          600: 'var(--sage-600)',
          700: 'var(--sage-700)',
          800: 'var(--sage-800)',
          900: 'var(--sage-900)',
        },

        // Teal (Yellow-teal for Medium difficulty)
        teal: {
          DEFAULT: 'var(--teal)',
          light: 'var(--teal-light)',
          dark: 'var(--teal-dark)',
          50: 'var(--teal-50)',
          100: 'var(--teal-100)',
          200: 'var(--teal-200)',
          300: 'var(--teal-300)',
          400: 'var(--teal-400)',
          500: 'var(--teal-500)',
          600: 'var(--teal-600)',
          700: 'var(--teal-700)',
          800: 'var(--teal-800)',
          900: 'var(--teal-900)',
        },

        // Semantic Colors
        success: {
          50: 'var(--success-50)',
          500: 'var(--success-500)',
          600: 'var(--success-600)',
          700: 'var(--success-700)',
        },
        warning: {
          50: 'var(--warning-50)',
          500: 'var(--warning-500)',
          600: 'var(--warning-600)',
        },
        error: {
          50: 'var(--error-50)',
          500: 'var(--error-500)',
          600: 'var(--error-600)',
          700: 'var(--error-700)',
        },
        info: {
          50: 'var(--info-50)',
          500: 'var(--info-500)',
          600: 'var(--info-600)',
        },

        // Legacy compatibility for some components
        neutral: {
          600: '#525252',
          700: '#404040',
          750: '#2F3339',
          800: '#262626',
          850: '#1F2227',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
        'playfair': ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}