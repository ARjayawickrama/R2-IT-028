import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import BoileControl from './pages/MechanicalSaltOptimization/BoileControl';
import DriedFishQuality from './pages/DriedFishQuality/DriedFishQuality';
import EnvironmentalMonitoring from './pages/EnvironmentalMonitoring/EnvironmentalMonitoring';
import DryFish from './pages/EnvironmentalMonitoring/dry_fish';
import RawFishQuality from './pages/RawFishQuality/RawFishQuality';
import SystemSettings from './pages/SystemSettings/SystemSettings';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/boile-control"
            element={
              <ProtectedRoute>
                <Layout>
                  <BoileControl />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dried-fish-quality"
            element={
              <ProtectedRoute>
                <Layout>
                  <DriedFishQuality />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/environmental-monitoring"
            element={
              <ProtectedRoute>
                <Layout>
                  <EnvironmentalMonitoring />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/environmental-monitoring/dry-fish"
            element={
              <ProtectedRoute>
                <Layout>
                  <DryFish />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/raw-fish-quality"
            element={
              <ProtectedRoute>
                <Layout>
                  <RawFishQuality />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/system-settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <SystemSettings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route
            path="/public-dashboard"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/public-boile-control"
            element={
              <Layout>
                <BoileControl />
              </Layout>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
