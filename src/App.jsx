import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthProvider';
import { ToastProvider } from './components/Toast';
import { PublicLayout } from './layout/PublicLayout';
import { UserLayout } from './layout/UserLayout';
import { AdminLayout } from './layout/AdminLayout';
import { RequireAdmin } from './components/RequireAdmin';
import { AdminHome } from './pages/admin/AdminHome';
import { AdminUsers } from './pages/admin/Users';
import { AdminOrders } from './pages/admin/Orders';
import { AdminAudit } from './pages/admin/Audit';
import { RouteTransition } from './components/RouteTransition';

// Lazy pages
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/legal/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const PublicEmergency = lazy(() => import('./pages/public/PublicEmergency'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Dashboard (usuario) pages
const DashboardIndex = lazy(() => import('./pages/dashboard/DashboardIndex'));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'));
const ContactsPage = lazy(() => import('./pages/dashboard/ContactsPage'));
const PrivacyPage = lazy(() => import('./pages/dashboard/PrivacyPage'));
const QrPage = lazy(() => import('./pages/dashboard/QrPage'));
const OrdersPage = lazy(() => import('./pages/dashboard/OrdersPage'));

// Admin pages
const Help = lazy(() => import('./pages/admin/help'));
const Checkout = lazy(() => import('./pages/Checkout'));

const App = () => (
  <HelmetProvider>
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-brand-50">
              <div className="animate-pulse rounded-full h-12 w-12 bg-brand-500" />
            </div>
          }>
            <RouteTransition>
              <Routes>
              {/* Rutas públicas: solo Navbar (sin sidebar) */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/productos" element={<Products />} />
                <Route path="/como-funciona" element={<HowItWorks />} />
                <Route path="/privacidad" element={<Privacy />} />
                <Route path="/terminos-y-condiciones" element={<Terms />} />
                <Route path="/politica-de-privacidad" element={<PrivacyPolicy />} />
                <Route path="/preguntas-frecuentes" element={<FAQ />} />
                <Route path="/contacto" element={<Contact />} />
                <Route path="/e/:identifier" element={<PublicEmergency />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/registro" element={<Register />} />
                <Route path="/auth/olvido-contrasena" element={<ForgotPassword />} />
                <Route path="/auth/restablecer-contrasena" element={<ResetPassword />} />
              </Route>

              {/* Panel de USUARIO - rutas /panel/* */}
              <Route element={<UserLayout />}>
                <Route path="/panel">
                  <Route index element={<DashboardIndex />} />
                  <Route path="perfil" element={<ProfilePage />} />
                  <Route path="contactos" element={<ContactsPage />} />
                  <Route path="privacidad" element={<PrivacyPage />} />
                  <Route path="qr" element={<QrPage />} />
                  <Route path="pedidos" element={<OrdersPage />} />
                  <Route path="checkout" element={<Checkout />} />
                </Route>
              </Route>

              {/* Panel de ADMINISTRADOR - rutas /admin/* */}
              <Route element={<AdminLayout />}>
                <Route path="/admin">
                  <Route index element={<RequireAdmin><AdminHome /></RequireAdmin>} />
                  <Route path="usuarios" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
                  <Route path="pedidos" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
                  <Route path="auditoria" element={<RequireAdmin><AdminAudit /></RequireAdmin>} />
                  <Route path="ayuda" element={<RequireAdmin><Help /></RequireAdmin>} />
                  <Route path="*" element={<RequireAdmin><AdminHome /></RequireAdmin>} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            </RouteTransition>
          </Suspense>
        </Router>
      </ToastProvider>
    </AuthProvider>
  </HelmetProvider>
);

export default App;

