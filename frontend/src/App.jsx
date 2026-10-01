import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/RouteGuard.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import ProfileCompletionGate from './components/layout/ProfileCompletionGate.jsx';

// Core auth pages loaded directly for instant login flow
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import AuthCallback from './pages/auth/AuthCallback.jsx';

// Lazy-loaded pages for code-splitting and faster bundle load times
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

// Layout Wrapper inside Dashboard to preserve Sidebar navigation
const DashboardLayout = () => {
  return (
    <div className="app-shell flex flex-col lg:flex-row h-[100dvh] max-h-[100dvh] overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden pt-16 lg:pt-0">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="dashboard" replace />} />
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
            
            {/* Admin routes inside layout */}
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin-portal" element={<AdminDashboard />} />
            
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </Suspense>
      </div>
      <ProfileCompletionGate />
    </div>
  );
};

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Direct Secret URL access for Admin Console */}
        <Route path="/admin-portal" element={<AdminDashboard />} />

        {/* Protected Pages wrapped in Layout */}
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<DashboardLayout />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
