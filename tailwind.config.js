const withRgb = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

const createColorScale = (prefix) => {
  const scale = {
    DEFAULT: `rgb(var(--${prefix}-500-rgb) / <alpha-value>)`,
  };

  ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].forEach((level) => {
    scale[level] = `rgb(var(--${prefix}-${level}-rgb) / <alpha-value>)`;
  });

  scale.light = `rgb(var(--${prefix}-300-rgb) / <alpha-value>)`;
  scale.dark = `rgb(var(--${prefix}-700-rgb) / <alpha-value>)`;

  return scale;
};

const createPanelScale = () => {
  const scale = createColorScale('panel');
  scale.muted = `rgb(var(--panel-50-rgb) / <alpha-value>)`;
  scale.accent = `rgb(var(--panel-200-rgb) / <alpha-value>)`;
  scale.strong = `rgb(var(--panel-700-rgb) / <alpha-value>)`;
  return scale;
};

const createButtonScale = () => {
  const scale = createColorScale('button');
  scale.foreground = withRgb('--button-foreground-rgb');
  return scale;
};

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
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        content: {
          DEFAULT: withRgb('--text-primary-rgb'),
          muted: withRgb('--text-muted-rgb'),
          subtle: withRgb('--text-subtle-rgb'),
          inverse: withRgb('--text-inverse-rgb'),
        },
        surface: {
          DEFAULT: withRgb('--surface-primary-rgb'),
          elevated: withRgb('--surface-elevated-rgb'),
          muted: withRgb('--surface-muted-rgb'),
        },
        outline: {
          subtle: withRgb('--border-subtle-rgb'),
          strong: withRgb('--border-strong-rgb'),
        },
        panel: createPanelScale(),
        button: createButtonScale(),
        navy: createColorScale('navy'),
        slate: createColorScale('slate'),
        mint: createColorScale('mint'),
        cream: createColorScale('cream'),
        brand: {
          primary: 'var(--navy-500)',
          secondary: 'var(--slate-500)',
        },
        // Keep existing custom colors for dark mode
        neutral: {
          750: '#2F3339',
          850: '#1F2227',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
