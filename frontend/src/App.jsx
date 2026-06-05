import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './components/layout/RouteGuard.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import ProfileCompletionGate from './components/layout/ProfileCompletionGate.jsx';

// Pages
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import AuthCallback from './pages/auth/AuthCallback.jsx';
import UserDashboard from './pages/dashboard/UserDashboard.jsx';
import AdminDashboard from './pages/dashboard/AdminDashboard.jsx';
import SkillCatalog from './pages/skills/SkillCatalog.jsx';
import ChatRoom from './pages/chat/ChatRoom.jsx';
import Bookings from './pages/sessions/Bookings.jsx';
import AiMatches from './pages/ai/AiMatches.jsx';
import AiRoadmap from './pages/ai/AiRoadmap.jsx';
import AiResume from './pages/ai/AiResume.jsx';
import AiInterview from './pages/ai/AiInterview.jsx';
import Leaderboard from './pages/dashboard/Leaderboard.jsx';
import Feed from './pages/feed/Feed.jsx';
import PublicProfile from './pages/profile/PublicProfile.jsx';
import Notifications from './pages/notifications/Notifications.jsx';
import Settings from './pages/settings/Settings.jsx';

// Layout Wrapper inside Dashboard to preserve Sidebar navigation
const DashboardLayout = () => {
  return (
    <div className="app-shell flex flex-col lg:flex-row min-h-screen font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden pt-16 lg:pt-0">
        <Routes>
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="skills" element={<SkillCatalog />} />
          <Route path="chat" element={<ChatRoom />} />
          <Route path="feed" element={<Feed />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="ai-match" element={<AiMatches />} />
          <Route path="roadmap" element={<AiRoadmap />} />
          <Route path="resume" element={<AiResume />} />
          <Route path="interview" element={<AiInterview />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="profile/:id" element={<PublicProfile />} />
          
          {/* Admin routes inside layout */}
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminDashboard />} />
          </Route>
          
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </div>
      <ProfileCompletionGate />
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected Pages wrapped in Layout */}
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<DashboardLayout />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
