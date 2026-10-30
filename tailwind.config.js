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
          dark: '#07101f',        // fondo principal (azul marino casi negro)
          navy: '#0b1830',        // fondo de secciones alternas
          panel: '#0f1f3a',       // tarjetas
          panelHover: '#132648',
          border: '#1f3355',
          text: '#eef3fa',
          textMuted: '#9db0cc',
          textFaint: '#6f84a3',
          accent: '#5b9cf0',      // azul acero (acciones, iconos)
          accentHover: '#82b4f5',
          deep: '#2f6fd6',        // azul corporativo (degradados, énfasis)
          gold: '#c9a96a',        // detalle premium, usar con moderación
        },
        status: {
          success: '#34d399',
          warning: '#fbbf24',
          danger: '#fb7185',
          info: '#5b9cf0',
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
