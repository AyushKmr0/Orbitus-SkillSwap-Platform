import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient.js';
import {
  Shield,
  Users,
  Compass,
  FileCheck,
  Star,
  Plus,
  CheckCircle,
  Database,
  Edit2,
  Trash2,
  X,
  Search,
  MessageSquare,
  Radio,
  Send,
  Lock,
  Key,
  BarChart3,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend, CategoryScale, LinearScale, BarElement);

const DEFAULT_SECRET_KEY = 'orbitus_master_admin_2026';

const AdminDashboard = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Authentication via URL secret or admin role
  const urlKey = searchParams.get('key') || '';
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('orbitus_admin_key') || urlKey);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'groups', 'posts', 'skills', 'broadcast'

  // Data states
  const [adminStats, setAdminStats] = useState(null);
  const [skills, setSkills] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [postsList, setPostsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [adminConfirmModal, setAdminConfirmModal] = useState(null);
  const [adminPromptModal, setAdminPromptModal] = useState(null);
  const [promptInputText, setPromptInputText] = useState('');
  const [adminToast, setAdminToast] = useState({ text: '', isError: false });

  const showAdminToast = (text, isError = false) => {
    setAdminToast({ text, isError });
    setTimeout(() => setAdminToast({ text: '', isError: false }), 4000);
  };

  // User tab search
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');

  // Skill CRUD
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Web Development');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillTags, setNewSkillTags] = useState('');

  // Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);

  // Skill Requests
  const [skillRequests, setSkillRequests] = useState([]);
  const [skillRequestStatusFilter, setSkillRequestStatusFilter] = useState('pending');

  // User Feedbacks
  const [feedbacksList, setFeedbacksList] = useState([]);
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('all');
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);

  useEffect(() => {
    const verifyAccess = async () => {
      // 1. If currently logged in user has Admin role in DB/JWT
      if (user?.role === 'Admin') {
        setIsAuthenticated(true);
        return;
      }

      // 2. Check if passkey provided via URL or cached in localStorage
      const candidateKey = urlKey || adminKey;
      if (candidateKey) {
        try {
          const res = await apiClient.get('/api/dashboard/admin', {
            headers: { 'x-admin-secret': candidateKey }
          });
          if (res.data) {
            setAdminKey(candidateKey);
            localStorage.setItem('orbitus_admin_key', candidateKey);
            setIsAuthenticated(true);
            setAuthError('');
            return;
          }
        } catch (err) {
          console.warn('Admin passkey verification failed:', err.response?.data?.message || err.message);
          setIsAuthenticated(false);
          setAuthError('Invalid or expired admin secret key.');
          localStorage.removeItem('orbitus_admin_key');
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    verifyAccess();
  }, [user, urlKey]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, activeTab, skillRequestStatusFilter, feedbackStatusFilter]);

  const getAdminHeaders = () => {
    const headers = {};
    if (adminKey) headers['x-admin-secret'] = adminKey;
    return headers;
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await apiClient.get('/api/dashboard/admin', { headers: getAdminHeaders() });
        setAdminStats(res.data);
      } else if (activeTab === 'users') {
        const res = await apiClient.get('/api/dashboard/admin/users', {
          headers: getAdminHeaders(),
          params: { search: userSearch, role: userRoleFilter }
        });
        setUsersList(res.data.users || []);
      } else if (activeTab === 'groups') {
        const res = await apiClient.get('/api/dashboard/admin/groups', { headers: getAdminHeaders() });
        setGroupsList(res.data.groups || []);
      } else if (activeTab === 'posts') {
        const res = await apiClient.get('/api/dashboard/admin/posts', { headers: getAdminHeaders() });
        setPostsList(res.data.posts || []);
      } else if (activeTab === 'skills') {
        const res = await apiClient.get('/api/skills');
        setSkills(res.data.skills || []);
      } else if (activeTab === 'skill-requests') {
        const res = await apiClient.get('/api/skills/requests', {
          headers: getAdminHeaders(),
          params: { status: skillRequestStatusFilter !== 'all' ? skillRequestStatusFilter : undefined }
        });
        setSkillRequests(res.data.requests || []);
      } else if (activeTab === 'feedbacks') {
        const res = await apiClient.get('/api/feedback/admin', {
          headers: getAdminHeaders(),
          params: { status: feedbackStatusFilter !== 'all' ? feedbackStatusFilter : undefined }
        });
        setFeedbacksList(res.data.feedbacks || []);
        setUnreadFeedbackCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAuth = async (e) => {
    e.preventDefault();
    const candidate = passkeyInput.trim();
    if (!candidate) return;

    setLoading(true);
    setAuthError('');
    try {
      const res = await apiClient.get('/api/dashboard/admin', {
        headers: { 'x-admin-secret': candidate }
      });
      if (res.data) {
        localStorage.setItem('orbitus_admin_key', candidate);
        setAdminKey(candidate);
        setIsAuthenticated(true);
        setAdminStats(res.data);
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Access denied: Invalid administrator secret passkey.');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteDemoteUser = async (userId, currentRole) => {
    const nextRole = currentRole === 'Admin' ? 'User' : 'Admin';
    if (!window.confirm(`Change this user's role to ${nextRole}?`)) return;

    try {
      await apiClient.put(
        `/api/dashboard/admin/users/${userId}/role`,
        { role: nextRole },
        { headers: getAdminHeaders() }
      );
      setStatusMsg(`User role updated to ${nextRole}`);
      setTimeout(() => setStatusMsg(''), 3000);
      loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Could not update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user and all associated data permanently?')) return;
    try {
      await apiClient.delete(`/api/dashboard/admin/users/${userId}`, { headers: getAdminHeaders() });
      setStatusMsg('User account removed.');
      setTimeout(() => setStatusMsg(''), 3000);
      loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Could not delete user');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Delete this study group permanently?')) return;
    try {
      await apiClient.delete(`/api/dashboard/admin/groups/${groupId}`, { headers: getAdminHeaders() });
      setStatusMsg('Group deleted.');
      setTimeout(() => setStatusMsg(''), 3000);
      loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Could not delete group');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this community post permanently?')) return;
    try {
      await apiClient.delete(`/api/dashboard/admin/posts/${postId}`, { headers: getAdminHeaders() });
      setStatusMsg('Post removed.');
      setTimeout(() => setStatusMsg(''), 3000);
      loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Could not delete post');
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    try {
      await apiClient.post(
        '/api/skills',
        {
          name: newSkillName.trim(),
          category: newSkillCategory,
          description: newSkillDesc.trim(),
          tags: newSkillTags.split(',').map((t) => t.trim()).filter(Boolean)
        },
        { headers: getAdminHeaders() }
      );

      setNewSkillName('');
      setNewSkillDesc('');
      setNewSkillTags('');
      setStatusMsg('Skill registered successfully!');
      setTimeout(() => setStatusMsg(''), 3000);
      loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Could not register skill');
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Delete this skill from platform?')) return;
    try {
      await apiClient.delete(`/api/skills/${skillId}`, { headers: getAdminHeaders() });
      loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Could not delete skill');
    }
  };

  const handleApproveSkillRequest = async (requestId) => {
    try {
      const res = await apiClient.put(
        `/api/skills/requests/${requestId}/approve`,
        {},
        { headers: getAdminHeaders() }
      );
      setStatusMsg(res.data.message || 'Course request approved and added to catalog!');
      setTimeout(() => setStatusMsg(''), 3000);
      loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Failed to approve course request');
    }
  };

  const handleRejectSkillRequest = async (requestId) => {
    const reason = window.prompt('Enter reason / feedback for rejecting this course request:');
    if (reason === null) return;
    try {
      const res = await apiClient.put(
        `/api/skills/requests/${requestId}/reject`,
        { adminFeedback: reason },
        { headers: getAdminHeaders() }
      );
      setStatusMsg(res.data.message || 'Course request rejected.');
      setTimeout(() => setStatusMsg(''), 3000);
      loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Failed to reject course request');
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastContent.trim()) return;

    setBroadcastSending(true);
    try {
      const res = await apiClient.post(
        '/api/dashboard/admin/broadcast',
        {
          title: broadcastTitle.trim(),
          content: broadcastContent.trim()
        },
        { headers: getAdminHeaders() }
      );

      setStatusMsg(res.data.message || 'Broadcast dispatched!');
      setBroadcastTitle('');
      setBroadcastContent('');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Broadcast failed');
    } finally {
      setBroadcastSending(false);
    }
  };

  const handleUpdateFeedbackStatus = async (feedbackId, status) => {
    try {
      await apiClient.put(
        `/api/feedback/admin/${feedbackId}/status`,
        { status },
        { headers: getAdminHeaders() }
      );
      setStatusMsg(`Feedback marked as ${status}.`);
      setTimeout(() => setStatusMsg(''), 3000);
      loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Failed to update feedback status');
    }
  };

  const handleAddAdminFeedbackNote = async (feedbackId) => {
    const note = window.prompt('Enter admin response note for user:');
    if (note === null) return;
    try {
      await apiClient.put(
        `/api/feedback/admin/${feedbackId}/status`,
        { adminNotes: note, status: 'reviewed' },
        { headers: getAdminHeaders() }
      );
      setStatusMsg('Admin note saved and marked reviewed.');
      setTimeout(() => setStatusMsg(''), 3000);
      loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Failed to save admin note');
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Delete this user feedback permanently?')) return;
    try {
      await apiClient.delete(`/api/feedback/admin/${feedbackId}`, { headers: getAdminHeaders() });
      setStatusMsg('Feedback removed.');
      setTimeout(() => setStatusMsg(''), 3000);
      loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Failed to delete feedback');
    }
  };

  // URL Secret Passkey Gate
  if (!isAuthenticated) {
    return (
      <div className="flex-1 p-4 sm:p-8 flex flex-col justify-center items-center min-h-screen bg-slate-950 text-slate-200">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
              <Key size={26} />
            </div>
            <h2 className="text-xl font-extrabold text-white">Administrator Portal</h2>
            <p className="text-xs text-slate-400">
              Enter your administrative passkey or access via your master URL token to unlock platform controls.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleManualAuth} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secret Key</label>
              <input
                type="password"
                required
                placeholder="Enter admin secret passkey..."
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-purple-500 font-mono text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow"
            >
              Verify & Enter Console
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center">
            Tip: You can bookmark <code className="text-purple-400">/admin-portal?key={DEFAULT_SECRET_KEY}</code> for direct access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-950 min-h-screen text-slate-200 overflow-y-auto">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-purple-950/40 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-2xl">
              <Shield size={22} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit tracking-tight">
              Master Admin Console
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global management portal: monitor telemetry, moderate users & groups, publish announcements.
          </p>
        </div>

        {statusMsg && (
          <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-2xl animate-pulse">
            {statusMsg}
          </span>
        )}
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-850">
        {[
          { id: 'overview', label: 'Overview & Charts', icon: BarChart3 },
          { id: 'feedbacks', label: 'User Feedback', icon: MessageSquare, badge: unreadFeedbackCount },
          { id: 'skill-requests', label: 'Course Requests', icon: FileCheck },
          { id: 'users', label: 'User Accounts', icon: Users },
          { id: 'groups', label: 'Study Groups', icon: Layers },
          { id: 'posts', label: 'Feed Posts', icon: MessageSquare },
          { id: 'skills', label: 'Skills Catalog', icon: Database },
          { id: 'broadcast', label: 'Global Broadcast', icon: Radio }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 relative ${
                isActive
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Charts */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {adminStats && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {[
                  { label: 'Total Users', value: adminStats.stats.totalUsers, icon: Users, color: 'text-blue-400' },
                  { label: 'Active Users', value: adminStats.stats.activeUsers, icon: CheckCircle, color: 'text-emerald-400' },
                  { label: 'Study Sessions', value: adminStats.stats.totalSessions, icon: FileCheck, color: 'text-purple-400' },
                  { label: 'Platform Skills', value: adminStats.stats.totalSkills, icon: Database, color: 'text-amber-400' },
                  { label: 'Reviews Posted', value: adminStats.stats.totalReviews, icon: Star, color: 'text-pink-400' },
                  { label: 'Admins', value: adminStats.stats.adminCount, icon: Shield, color: 'text-indigo-400' }
                ].map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <div key={idx} className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 space-y-1 shadow">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-500">{s.label}</span>
                        <Icon size={14} className={s.color} />
                      </div>
                      <p className="text-xl sm:text-2xl font-black text-white">{s.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Chart breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-4">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-400" />
                    Session Status Breakdown
                  </h3>
                  <div className="h-60 flex items-center justify-center">
                    <Doughnut
                      data={{
                        labels: adminStats.charts.sessionsBreakdown.labels,
                        datasets: [
                          {
                            data: adminStats.charts.sessionsBreakdown.data,
                            backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
                            borderWidth: 0
                          }
                        ]
                      }}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-4">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <Database size={16} className="text-purple-400" />
                    Skills Category Share
                  </h3>
                  <div className="h-60 flex items-center justify-center">
                    <Bar
                      data={{
                        labels: adminStats.charts.skillsBreakdown.labels,
                        datasets: [
                          {
                            label: 'Skills Count',
                            data: adminStats.charts.skillsBreakdown.data,
                            backgroundColor: '#8b5cf6',
                            borderRadius: 6
                          }
                        ]
                      }}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: User Feedbacks */}
      {activeTab === 'feedbacks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-base text-white">Direct User Feedbacks & Suggestions</h3>
              <p className="text-xs text-slate-400">
                Submitted by users via Settings. Review feedback, leave responses, or mark resolved.
              </p>
            </div>

            {/* Filter status */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-2xl border border-slate-800 text-xs">
              {['all', 'unread', 'reviewed', 'resolved'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFeedbackStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] transition-all ${
                    feedbackStatusFilter === st
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading user feedbacks...</div>
          ) : feedbacksList.length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-xs text-slate-400">
              No feedback entries matching filter &quot;{feedbackStatusFilter}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbacksList.map((fb) => (
                <div
                  key={fb._id}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-3 shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* User header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={fb.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(fb.user?.name || 'User')}&background=6366f1&color=fff`}
                          alt={fb.user?.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-700"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white truncate">{fb.user?.name || 'Anonymous'}</p>
                          <p className="text-[10px] text-slate-400 truncate">{fb.user?.email} • @{fb.user?.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/60 text-purple-300 text-[10px] font-bold">
                          {fb.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            fb.status === 'resolved'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                              : fb.status === 'reviewed'
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                              : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                          }`}
                        >
                          {fb.status}
                        </span>
                      </div>
                    </div>

                    {/* Rating & Subject */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                      <span className="font-bold text-white text-xs">{fb.subject || 'No Subject'}</span>
                      <span className="text-[11px] text-amber-400">{'⭐'.repeat(fb.rating || 5)}</span>
                    </div>

                    {/* Message */}
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/40 p-3 rounded-2xl border border-slate-800/40">
                      {fb.message}
                    </p>

                    {/* Admin Note if any */}
                    {fb.adminNotes && (
                      <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[11px] text-purple-300">
                        <span className="font-bold">Your Response:</span> {fb.adminNotes}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-slate-500">
                      {new Date(fb.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddAdminFeedbackNote(fb._id)}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold transition-colors"
                        title="Add admin response note"
                      >
                        Respond
                      </button>
                      {fb.status !== 'resolved' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateFeedbackStatus(fb._id, 'resolved')}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-semibold border border-emerald-500/30 transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteFeedback(fb._id)}
                        className="p-1.5 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete feedback"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search user by name, email, or username..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadDashboardData()}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-200 outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-200 outline-none"
              >
                <option value="All">All Roles</option>
                <option value="User">Regular Users</option>
                <option value="Admin">Administrators</option>
              </select>
              <button
                onClick={loadDashboardData}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-2xl transition-all"
              >
                Filter
              </button>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Points</th>
                    <th className="p-4">Joined</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {usersList.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img src={u.profileImage} alt={u.name} className="w-8 h-8 rounded-full bg-slate-800 object-cover" />
                        <div>
                          <p className="font-bold text-slate-100">{u.name}</p>
                          <p className="text-[10px] text-slate-500">@{u.username || 'user'}</p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${u.role === 'Admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-800 text-slate-400'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-200">{u.points || 0}</td>
                      <td className="p-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handlePromoteDemoteUser(u._id, u.role)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold"
                        >
                          {u.role === 'Admin' ? 'Demote' : 'Promote'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1 text-red-400 hover:bg-red-500/10 rounded-lg"
                          title="Delete user"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Study Groups Management */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Group Name</th>
                    <th className="p-4">Privacy</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Creator</th>
                    <th className="p-4">Members</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {groupsList.map((g) => (
                    <tr key={g._id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="p-4 font-bold text-slate-100">{g.name}</td>
                      <td className="p-4 capitalize">{g.privacy}</td>
                      <td className="p-4 text-slate-300">{g.category}</td>
                      <td className="p-4 text-slate-400">{g.creator?.name || 'Unknown'}</td>
                      <td className="p-4 font-bold text-slate-200">{g.membersCount}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteGroup(g._id)}
                          className="p-1 text-red-400 hover:bg-red-500/10 rounded-lg"
                          title="Delete group"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Posts Moderation */}
      {activeTab === 'posts' && (
        <div className="space-y-3">
          {postsList.map((p) => (
            <div key={p._id} className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-200">{p.author?.name || 'User'}</span>
                  <span className="text-[10px] text-slate-500">@{p.author?.username || 'user'}</span>
                  <span className="text-[10px] text-slate-500">• {new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{p.content}</p>
              </div>
              <button
                onClick={() => handleDeletePost(p._id)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl shrink-0"
                title="Remove post"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Skills Catalog */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddSkill} className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-3.5 text-xs h-fit">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Plus size={15} className="text-purple-400" /> Register New Skill
            </h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Skill Name *</label>
              <input
                type="text"
                required
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="e.g. Next.js App Router"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Category</label>
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none"
              >
                <option value="Web Development">Web Development</option>
                <option value="DSA & Algorithms">DSA & Algorithms</option>
                <option value="AI & Machine Learning">AI & Machine Learning</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Cyber Security">Cyber Security</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Description</label>
              <textarea
                rows={2}
                value={newSkillDesc}
                onChange={(e) => setNewSkillDesc(e.target.value)}
                placeholder="Skill scope..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none resize-none"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow">
              Add Skill to Catalog
            </button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-bold text-sm text-slate-100">Registered Platform Skills ({skills.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skills.map((s) => (
                <div key={s._id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-100 truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{s.category}</p>
                  </div>
                  <button onClick={() => handleDeleteSkill(s._id)} className="p-1 text-red-400 hover:bg-red-500/10 rounded-lg">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5.5: Course Requests from Community */}
      {activeTab === 'skill-requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <FileCheck size={18} className="text-purple-400" />
                Community Course Proposals & Skill Requests
              </h3>
              <p className="text-xs text-slate-400">
                Review courses suggested by users. Approving a request creates the skill in the catalog and automatically adds it to the user's profile.
              </p>
            </div>

            {/* Filter Status Pills */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              {['all', 'pending', 'approved', 'rejected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSkillRequestStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                    skillRequestStatusFilter === st
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {skillRequests.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl text-slate-500 text-xs">
              No course requests found under "{skillRequestStatusFilter}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skillRequests.map((req) => (
                <div
                  key={req._id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-white">{req.name}</h4>
                        <span className="text-[11px] font-semibold text-purple-400">{req.category}</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          req.status === 'approved'
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : req.status === 'rejected'
                            ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                            : 'bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    {req.description && (
                      <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                        {req.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                        Intent: <strong className="text-white capitalize">{req.intent}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                        Level: <strong className="text-white">{req.level || 'Intermediate'}</strong>
                      </span>
                      {req.tags?.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-lg bg-slate-850 text-slate-400">
                          #{t}
                        </span>
                      ))}
                    </div>

                    {/* Requesting user info */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2.5">
                      <img
                        src={req.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user?.name || 'User')}&background=6366f1&color=fff`}
                        alt=""
                        className="w-7 h-7 rounded-full bg-slate-800"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-200 truncate">{req.user?.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">@{req.user?.username || req.user?.email}</p>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => handleRejectSkillRequest(req._id)}
                        className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-all"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveSkillRequest(req._id)}
                        className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow"
                      >
                        Approve & Add to Catalog
                      </button>
                    </div>
                  )}

                  {req.status === 'rejected' && req.adminFeedback && (
                    <p className="text-[10px] text-red-400/80 italic pt-1">
                      Reason: {req.adminFeedback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Global Broadcast */}
      {activeTab === 'broadcast' && (
        <div className="max-w-xl mx-auto bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-4 text-xs">
          <div className="flex items-center gap-2 text-purple-400">
            <Radio size={20} />
            <h3 className="font-bold text-base text-white">Broadcast Global Notification</h3>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Send an instant notification alert to all verified platform users. It will appear on their notification bells in real-time.
          </p>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Announcement Title</label>
              <input
                type="text"
                placeholder="e.g. Platform v2.0 Release!"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Message Content *</label>
              <textarea
                required
                rows={4}
                placeholder="Write the platform-wide announcement..."
                value={broadcastContent}
                onChange={(e) => setBroadcastContent(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={broadcastSending}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={15} />
              <span>{broadcastSending ? 'Broadcasting...' : 'Broadcast to All Users'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Toast Notification */}
      {adminToast.text && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-bounce ${
          adminToast.isError ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          <span>{adminToast.text}</span>
        </div>
      )}

      {/* Admin Confirmation Modal */}
      {adminConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setAdminConfirmModal(null)}>
          <div className="w-full max-w-sm bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-app space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold font-outfit text-app">{adminConfirmModal.title}</h3>
              <button onClick={() => setAdminConfirmModal(null)} className="text-slate-400 hover:text-app p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{adminConfirmModal.message}</p>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setAdminConfirmModal(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-app font-bold text-xs rounded-xl">
                Cancel
              </button>
              <button
                type="button"
                onClick={adminConfirmModal.onConfirm}
                className={`flex-1 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-all ${
                  adminConfirmModal.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {adminConfirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Prompt Input Modal */}
      {adminPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setAdminPromptModal(null)}>
          <div className="w-full max-w-sm bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-app space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold font-outfit text-app">{adminPromptModal.title}</h3>
              <button onClick={() => setAdminPromptModal(null)} className="text-slate-400 hover:text-app p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{adminPromptModal.message}</p>
            <textarea
              rows={3}
              value={promptInputText}
              onChange={(e) => setPromptInputText(e.target.value)}
              placeholder={adminPromptModal.placeholder}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-app text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setAdminPromptModal(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-app font-bold text-xs rounded-xl">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => adminPromptModal.onSubmit(promptInputText)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
