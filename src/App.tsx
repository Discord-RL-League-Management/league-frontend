import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Login from './pages/Login.tsx';
import AuthCallback from './pages/AuthCallback.tsx';
import Dashboard from './pages/Dashboard.tsx';
import { GuildDashboardPage, GuildDashboardRedirect } from './pages/GuildDashboardPage.tsx';

/**
 * App - Single responsibility: Application routing structure only
 * Router handles only navigation, not state or logic
 * No AuthProvider wrapper needed with Zustand
 */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}