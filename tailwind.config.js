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
        // Warp/Vercel inspired dark colors
        background: '#0a0a0a',
        surface: '#141414',
        'surface-hover': '#1a1a1a',
        border: '#262626',
        'border-hover': '#404040',
        primary: '#00d9ff', // Cyan accent
        'primary-hover': '#00b8d9',
        secondary: '#a855f7', // Purple accent
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        muted: '#737373',
        'text-primary': '#fafafa',
        'text-secondary': '#a3a3a3',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 217, 255, 0.15)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.15)',
        'glass': '0 4px 30px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        'glass': '10px',
      },
    },
  },
  plugins: [],
};
