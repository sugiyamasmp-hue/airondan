import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        washi: 'var(--washi)',
        'washi-2': 'var(--washi-2)',
        'washi-line': 'var(--washi-line)',
        text: 'var(--text)',
        'text-soft': 'var(--text-soft)',
        vermilion: 'var(--vermilion)',
        'vermilion-deep': 'var(--vermilion-deep)',
        indigo: 'var(--indigo)',
        'indigo-deep': 'var(--indigo-deep)',
        gold: 'var(--gold)',
        teal: 'var(--teal)',
      },
      fontFamily: {
        mincho: ['var(--font-shippori-mincho)', 'serif'],
        sans: ['var(--font-noto-sans-jp)', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
