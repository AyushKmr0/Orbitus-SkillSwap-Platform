import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './components/layout/RouteGuard.jsx';
import AppShadcnSidebar from './components/layout/AppShadcnSidebar.jsx';
import ProfileCompletionGate from './components/layout/ProfileCompletionGate.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import PageTransition from './components/common/PageTransition.jsx';

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

const withPageTransition = (page, dashboard = false) => <PageTransition dashboard={dashboard}>{page}</PageTransition>;

// Layout Wrapper inside Dashboard (toggleable between top nav trial and classic sidebar)
const DashboardLayout = () => {
  const routesContent = (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={withPageTransition(<UserDashboard />, true)} />
        <Route path="skills" element={withPageTransition(<SkillCatalog />, true)} />
        <Route path="chat" element={withPageTransition(<ChatRoom />, true)} />
        <Route path="feed" element={withPageTransition(<Feed />, true)} />
        <Route path="notifications" element={withPageTransition(<Notifications />, true)} />
        <Route path="settings" element={withPageTransition(<Settings />, true)} />
        <Route path="bookings" element={withPageTransition(<Bookings />, true)} />

        {/* Instagram-style Suggested Users */}
        <Route path="suggested-users" element={withPageTransition(<SuggestedUsers />, true)} />
        <Route path="ai-match" element={withPageTransition(<SuggestedUsers />, true)} />

        {/* Public & Private Study Groups */}
        <Route path="groups" element={withPageTransition(<Groups />, true)} />
        <Route path="groups/:id" element={withPageTransition(<GroupDetail />, true)} />

        <Route path="roadmap" element={withPageTransition(<AiRoadmap />, true)} />
        <Route path="leaderboard" element={withPageTransition(<Leaderboard />, true)} />
        <Route path="profile" element={withPageTransition(<PublicProfile />, true)} />
        <Route path="profile/:id" element={withPageTransition(<PublicProfile />, true)} />

        {/* Admin Console routes protected by AdminRoute */}
        <Route element={<AdminRoute />}>
          <Route path="admin" element={withPageTransition(<AdminDashboard />, true)} />
          <Route path="admin/*" element={withPageTransition(<AdminDashboard />, true)} />
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
          <Route path="/" element={withPageTransition(<LandingPage />)} />

          {/* Core Auth Pages */}
          <Route path="/login" element={withPageTransition(<Login />)} />
          <Route path="/register" element={withPageTransition(<Register />)} />
          <Route path="/auth/callback" element={withPageTransition(<AuthCallback />)} />

          {/* Top-Level Admin Route Aliases redirect into authenticated layout */}
          <Route path="/admin-portal" element={<AdminRedirect />} />
          <Route path="/admin-panel" element={<AdminRedirect />} />

          {/* Protected Pages wrapped in Layout */}
          <Route element={<ProtectedRoute />}>
            <Route path="/explore" element={withPageTransition(<SkillCatalog />, true)} />
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
