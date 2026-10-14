import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './components/layout/RouteGuard.jsx';
import AppShadcnSidebar from './components/layout/AppShadcnSidebar.jsx';
import ProfileCompletionGate from './components/layout/ProfileCompletionGate.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

const AdminRedirect = () => {
  const location = useLocation();
  return <Navigate to={`/admin${location.search}`} replace />;
};


// Core auth pages loaded directly for instant login flow
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import AuthCallback from './pages/auth/AuthCallback.jsx';

// Lazy-loaded pages for code-splitting and faster bundle load times
const LandingPage = lazy(() => import('./pages/landing/LandingPage.jsx'));
const UserDashboard = lazy(() => import('./pages/dashboard/UserDashboard.jsx'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard.jsx'));
const SkillCatalog = lazy(() => import('./pages/skills/SkillCatalog.jsx'));
const ChatRoom = lazy(() => import('./pages/chat/ChatRoom.jsx'));
const Bookings = lazy(() => import('./pages/sessions/Bookings.jsx'));
const SuggestedUsers = lazy(() => import('./pages/suggested/SuggestedUsers.jsx'));
const Groups = lazy(() => import('./pages/groups/Groups.jsx'));
const GroupDetail = lazy(() => import('./pages/groups/GroupDetail.jsx'));
const AiRoadmap = lazy(() => import('./pages/ai/AiRoadmap.jsx'));
const Leaderboard = lazy(() => import('./pages/dashboard/Leaderboard.jsx'));
const Feed = lazy(() => import('./pages/feed/Feed.jsx'));
const PublicProfile = lazy(() => import('./pages/profile/PublicProfile.jsx'));
const Notifications = lazy(() => import('./pages/notifications/Notifications.jsx'));
const Settings = lazy(() => import('./pages/settings/Settings.jsx'));

const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 animate-pulse">Loading...</p>
    </div>
  </div>
);

// Layout Wrapper inside Dashboard (toggleable between top nav trial and classic sidebar)
const DashboardLayout = () => {
  const routesContent = (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="skills" element={<SkillCatalog />} />
        <Route path="chat" element={<ChatRoom />} />
        <Route path="feed" element={<Feed />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="bookings" element={<Bookings />} />

        {/* Instagram-style Suggested Users */}
        <Route path="suggested-users" element={<SuggestedUsers />} />
        <Route path="ai-match" element={<SuggestedUsers />} />

        {/* Public & Private Study Groups */}
        <Route path="groups" element={<Groups />} />
        <Route path="groups/:id" element={<GroupDetail />} />

        <Route path="roadmap" element={<AiRoadmap />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="profile" element={<PublicProfile />} />
        <Route path="profile/:id" element={<PublicProfile />} />

        {/* Admin Console routes protected by AdminRoute */}
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/*" element={<AdminDashboard />} />
          <Route path="admin-portal" element={<AdminRedirect />} />
          <Route path="admin-panel" element={<AdminRedirect />} />
          <Route path="admin-panel/*" element={<AdminRedirect />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );

  return (
    <AppShadcnSidebar>
      {routesContent}
      <ProfileCompletionGate />
    </AppShadcnSidebar>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Home / Landing Page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<SkillCatalog />} />

          {/* Core Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Top-Level Admin Route Aliases redirect into authenticated layout */}
          <Route path="/admin-portal" element={<AdminRedirect />} />
          <Route path="/admin-panel" element={<AdminRedirect />} />

          {/* Protected Pages wrapped in Layout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<DashboardLayout />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
