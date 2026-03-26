import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home/Home';
import DiscoveryOracle from './pages/DiscoveryOracle/DiscoveryOracle';
import HardwareChecker from './pages/HardwareChecker/HardwareChecker';
import News from './pages/News/News';
import TournamentBoard from './pages/TournamentBoard/TournamentBoard';
import Contact from './pages/Contact/Contact';
import VideoHub from './pages/VideoHub/VideoHub';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import Games from './pages/Games/Games';

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/discovery" element={<DiscoveryOracle />} />
          <Route path="/compatibility" element={<HardwareChecker />} />
          <Route path="/news" element={<News />} />
          <Route path="/events" element={<TournamentBoard />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/gallery" element={<VideoHub />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Legacy aliases for removed pages */}
          <Route path="/genres" element={<Navigate to="/games" replace />} />
          <Route path="/popular" element={<Navigate to="/news" replace />} />
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;