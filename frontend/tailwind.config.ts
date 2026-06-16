import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(240 4% 16%)',
        input: 'hsl(240 4% 16%)',
        ring: 'hsl(142 71% 45%)',
        background: 'hsl(240 10% 4%)',
        foreground: 'hsl(0 0% 98%)',
        muted: {
          DEFAULT: 'hsl(240 4% 12%)',
          foreground: 'hsl(240 5% 65%)',
        },
        card: {
          DEFAULT: 'hsl(240 6% 8%)',
          foreground: 'hsl(0 0% 98%)',
        },
        primary: {
          DEFAULT: 'hsl(142 71% 45%)',
          foreground: 'hsl(0 0% 4%)',
        },
        destructive: {
          DEFAULT: 'hsl(0 72% 51%)',
          foreground: 'hsl(0 0% 98%)',
        },
      },
      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
    },
  },
  plugins: [],
};

export default config;
