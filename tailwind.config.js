/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './**/*.html',
    './**/*.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'inter': ['Inter', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        'spa-navy': '#1e293b',
        'spa-ivory': '#fdfcf7',
        'spa-cream': '#fdfcf7',
        'spa-gold': '#fbbf24',
        'spa-gray': '#4a5568',
        'spa-sage-light': '#f0f4f0',
        'spa-sage-dark': '#6b7b6b',
        'spa-lavender-light': '#f5f3ff',
        'spa-ocean-light': '#e0f2fe',
        'spa-charcoal': '#2d3748',
        'sage-50': '#f8faf8',
        'sage-100': '#f0f4f0',
        'sage-200': '#e2e8e2',
        'sage-300': '#c8d2c8',
        'sage-400': '#9eb09e',
        'sage-500': '#7a8b7a',
        'sage-600': '#6b7b6b',
        'sage-700': '#5a685a',
        'sage-800': '#4a5548',
        'sage-accent': '#8ba28b',
        'lavender-50': '#faf9ff',
        'lavender-100': '#f5f3ff',
        'lavender-200': '#e9e5ff',
        'lavender-300': '#d4c9ff',
        'lavender-400': '#b899ff',
        'lavender-500': '#9f7aff',
        'lavender-600': '#8b5cf6',
        'lavender-client': '#c7b8e8',
        'ocean-mist': '#b8e0d2',
        'soft-lavender': '#e6defe',
        'warm-gray-50': '#fafaf9',
        'warm-gray-100': '#f5f5f4',
        'warm-gray-200': '#e7e5e4',
        'warm-gray-300': '#d6d3d1',
        'warm-gray-400': '#a8a29e',
        'warm-gray-500': '#78716c',
        'warm-gray-600': '#57534e',
        'warm-gray-700': '#44403c',
        'warm-gray-800': '#292524',
        'beige-soft': '#f7f5f3',
        'neutral': '#f5f5f5',
        'neutral-dark': '#4a4a4a',
      },
      borderRadius: {
        'DEFAULT': '1rem',
        '2xl': '1rem'
      },
      boxShadow: {
        'luxury': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'luxury-lg': '0 20px 50px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.08)'
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px'
      }
    }
  },
  plugins: []
};
