export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta corporativa: azul marino profundo + azul acero + detalle dorado sobrio.
        // Se conservan los nombres de tokens para no romper el resto de la app.
        brand: {
          dark: '#FAF5F6',        // fondo principal
          navy: '#FFFFFF',        // fondo de secciones alternas
          panel: '#FFFFFF',       // tarjetas
          panelHover: '#F5DFE5',
          border: '#F5DFE5',
          text: '#292024',
          textMuted: '#6b5a60',
          accent: '#9F1239',      // rojo vino (acciones/alertas)
          accentHover: '#b5174a',
          deep: '#9F1239',
          gold: '#9F1239',
        },
        gray: {
          clean: '#f4f6f8',
          line: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
        lg: '10px',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0, 0, 0, 0.18)',
        card: '0 10px 30px rgba(2, 8, 20, 0.35)',
        glow: '0 0 0 1px rgba(91, 156, 240, 0.25), 0 12px 40px rgba(47, 111, 214, 0.18)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'pulse-ring': 'pulseRing 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '80%, 100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
