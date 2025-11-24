import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Login from './pages/Login.tsx';
import AuthCallback from './pages/AuthCallback.tsx';
import Dashboard from './pages/Dashboard.tsx';
import { GuildDashboardPage, GuildDashboardRedirect } from './pages/GuildDashboardPage.tsx';
import TrackerDetailPage from './pages/TrackerDetailPage.tsx';
import TrackerRegistrationPage from './pages/TrackerRegistrationPage.tsx';
import MyTrackersPage from './pages/MyTrackersPage.tsx';
import { initNavigation } from './lib/navigation.ts';

/**
 * NavigationInitializer - Initializes navigation service for API layer
 */
function NavigationInitializer() {
  const navigate = useNavigate();
  
  useEffect(() => {
    initNavigation(navigate);
  }, [navigate]);
  
  return null;
}

/**
 * App - Single responsibility: Application routing structure only
 * Router handles only navigation, not state or logic
 * No AuthProvider wrapper needed with Zustand
 */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <NavigationInitializer />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/guild/:guildId"
            element={
              <ProtectedRoute>
                <GuildDashboardRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/guild/:guildId/overview"
            element={
              <ProtectedRoute>
                <GuildDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/guild/:guildId/admin"
            element={
              <ProtectedRoute>
                <GuildDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/guild/:guildId/members"
            element={
              <ProtectedRoute>
                <GuildDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/guild/:guildId/settings"
            element={
              <ProtectedRoute>
                <GuildDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tracker/:trackerId"
            element={
              <ProtectedRoute>
                <TrackerDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tracker/register"
            element={
              <ProtectedRoute>
                <TrackerRegistrationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/trackers"
            element={
              <ProtectedRoute>
                <MyTrackersPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}