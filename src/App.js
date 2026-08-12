import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Helmet } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import Home from './pages/Home/Home';
import DiscoveryOracle from './pages/DiscoveryOracle/DiscoveryOracle';
import HardwareChecker from './pages/HardwareChecker/HardwareChecker';
import News from './pages/News/News';
import Contact from './pages/Contact/Contact';
import VideoHub from './pages/VideoHub/VideoHub';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AnalyticsScripts from './components/Analytics/AnalyticsScripts';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import NewsletterUnsubscribe from './pages/NewsletterUnsubscribe/NewsletterUnsubscribe';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import Games from './pages/Games/Games';
import GameDetail from './pages/GameDetail/GameDetail';
import PrivacyPolicy from './pages/Legal/PrivacyPolicy';
import TermsOfService from './pages/Legal/TermsOfService';
import CompatibilityGame from './pages/CompatibilityGame/CompatibilityGame';
import HardwareTier from './pages/HardwareTier/HardwareTier';
import PublicProfile from './pages/PublicProfile/PublicProfile';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import Notifications from './pages/Notifications/Notifications';
import Support from './pages/Support/Support';
import DevelopersSignup from './pages/DevelopersSignup/DevelopersSignup';
import DevelopersDocs from './pages/DevelopersDocs/DevelopersDocs';
import { useAuth } from './contexts/AuthContext';

const AdminPage = lazy(() => import('./pages/Admin/Admin'));
const TournamentBoard = lazy(() => import('./pages/TournamentBoard/TournamentBoard'));

const RootExperience = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <Home />;
};

function App() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>GameVerse | Discover Games, News and Compatibility</title>
        <meta
          name="description"
          content="GameVerse helps players discover games, read gaming news, and check hardware compatibility."
        />
      </Helmet>
      <AuthProvider>
        <AnalyticsScripts />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-elev)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            },
            success: { iconTheme: { primary: 'var(--primary)', secondary: 'var(--bg-elev)' } },
            error: { iconTheme: { primary: '#e5484d', secondary: 'var(--bg-elev)' } },
          }}
        />
        <Layout>
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<RootExperience />} />
            <Route path="/news" element={<News />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
          <Route path="/genres" element={<Navigate to="/games" replace />} />
          <Route path="/popular" element={<Navigate to="/news" replace />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/support" element={<Support />} />
          <Route path="/developers" element={<DevelopersSignup />} />
          <Route path="/developers/docs" element={<DevelopersDocs />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Navigate to="/" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games"
            element={<Games />}
          />

          <Route
            path="/games/:rawgSlug"
            element={<GameDetail />}
          />

          <Route
            path="/admin"
            element={
              <Suspense fallback={<div className="section">Loading admin panel...</div>}>
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              </Suspense>
            }
          />

          <Route
            path="/discovery"
            element={<DiscoveryOracle />}
          />

          <Route
            path="/compatibility"
            element={<HardwareChecker />}
          />

          <Route
            path="/compatibility/:rawgSlug"
            element={<CompatibilityGame />}
          />

          <Route
            path="/best-games/:tier"
            element={<HardwareTier />}
          />

          <Route
            path="/u/:username"
            element={<PublicProfile />}
          />

          <Route
            path="/leaderboard"
            element={<Leaderboard />}
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <Suspense fallback={<div className="section">Loading tournament board...</div>}>
                <ProtectedRoute>
                  <TournamentBoard />
                </ProtectedRoute>
              </Suspense>
            }
          />

          <Route
            path="/contact"
            element={
              <ProtectedRoute>
                <Contact />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gallery"
            element={
              <ProtectedRoute>
                <VideoHub />
              </ProtectedRoute>
            }
          />


          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ErrorBoundary>
      </Layout>
    </AuthProvider>
    </HelmetProvider>
  );
}

export default App;