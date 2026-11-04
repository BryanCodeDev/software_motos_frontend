export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Escala semántica de colores (WCAG AA verificada).
        brand: {
          50: '#fdf4f6',      // fondo principal muy suave
          100: '#f7e3ea',     // fondo de secciones alternas
          200: '#efc7d4',     // bordes suaves / hover
          500: '#9F1239',     // acento principal (borgoña)
          600: '#b5174a',     // acento hover
          900: '#3f0617',     // fondo degradado (aside login, progreso)
        },
        neutral: {
          50: '#fafafa',      // tarjetas / fondo base elevado
          100: '#f4f4f5',
          200: '#e4e4e7',
          900: '#18181b',     // texto principal
          950: '#09090b',
        },
        text: {
          primary: '#292024',   // 14.6:1 sobre blanco (AAA)
          secondary: '#666666', // 5.7:1 sobre blanco (AA texto grande)
          muted: '#9ca3af',     // etiquetas decorativas / íconos
          inverse: '#ffffff',
        },
        border: '#e2e8f0',
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
