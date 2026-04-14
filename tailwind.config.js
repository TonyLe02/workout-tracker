/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warp-inspired dark colors (grey/white + orange)
        background: '#0a0a0a',
        surface: '#141414',
        'surface-hover': '#1f1f1f',
        border: '#2a2a2a',
        'border-hover': '#3a3a3a',
        primary: '#ffffff', // White accent
        'primary-hover': '#e5e5e5',
        secondary: '#f97316', // Orange accent
        success: '#22c55e',
        warning: '#f97316',
        danger: '#ef4444',
        muted: '#6b6b6b',
        'text-primary': '#ffffff',
        'text-secondary': '#a1a1a1',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        'glass': '10px',
      },
    },
  },
  plugins: [],
};
