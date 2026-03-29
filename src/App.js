import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout/Layout';
import Home from './pages/Home/Home';
import DiscoveryOracle from './pages/DiscoveryOracle/DiscoveryOracle';
import HardwareChecker from './pages/HardwareChecker/HardwareChecker';
import News from './pages/News/News';
import Contact from './pages/Contact/Contact';
import VideoHub from './pages/VideoHub/VideoHub';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import Games from './pages/Games/Games';
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
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<RootExperience />} />
            <Route path="/news" element={<News />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/genres" element={<Navigate to="/games" replace />} />
          <Route path="/popular" element={<Navigate to="/news" replace />} />

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
            element={
              <ProtectedRoute>
                <Games />
              </ProtectedRoute>
            }
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
            element={
              <ProtectedRoute>
                <DiscoveryOracle />
              </ProtectedRoute>
            }
          />

          <Route
            path="/compatibility"
            element={
              <ProtectedRoute>
                <HardwareChecker />
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
      </Layout>
    </AuthProvider>
    </HelmetProvider>
  );
}

export default App;