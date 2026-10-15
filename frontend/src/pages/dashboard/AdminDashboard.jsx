import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient.js';
import { authSuccess } from '../../features/authSlice.js';
import SlidingSegment from '../../components/common/SlidingSegment.jsx';
import {
  Shield,
  Users,
  Award,
  FileCheck,
  Star,
  Plus,
  CheckCircle,
  Database,
  Trash2,
  X,
  Search,
  MessageSquare,
  Eye,
  Radio,
  Send,
  Lock,
  BarChart3,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../components/ui/dialog.jsx';

const AdminOverviewCharts = React.lazy(() => import('../../components/dashboard/AdminOverviewCharts.jsx'));

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userRoleLower = String(user?.role || '').trim().toLowerCase();
  const isAdmin = userRoleLower === 'admin';
  const [dataError, setDataError] = useState(null);

  // Master key verification states
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [keyErrorMsg, setKeyErrorMsg] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlKey = searchParams.get('key') || searchParams.get('adminKey');
    if (urlKey && !isAdmin) {
      setMasterKeyInput(urlKey);
      setVerifyingKey(true);
      setKeyErrorMsg('');
      apiClient
        .post('/api/auth/verify-admin-key', { key: urlKey })
        .then((res) => {
          const data = res.data?.data || res.data;
          dispatch(authSuccess(data));
          setVerifyingKey(false);
        })
        .catch((err) => {
          setVerifyingKey(false);
          setKeyErrorMsg(err.response?.data?.message || 'Invalid administrator master key');
        });
    }
  }, [isAdmin, dispatch]);

  const handleUnlockWithKey = async (e) => {
    e?.preventDefault?.();
    const keyToTest = (masterKeyInput || '').trim();
    if (!keyToTest) return;

    setVerifyingKey(true);
    setKeyErrorMsg('');
    try {
      const res = await apiClient.post('/api/auth/verify-admin-key', { key: keyToTest });
      const data = res.data?.data || res.data;
      dispatch(authSuccess(data));
      setVerifyingKey(false);
      showAdminToast('Master admin key verified successfully!');
    } catch (err) {
      setVerifyingKey(false);
      setKeyErrorMsg(err.response?.data?.message || 'Invalid administrator master key');
    }
  };

  // Active Tab
  const [activeTab, setActiveTab] = useState(() => (
    new URLSearchParams(window.location.search).get('tab') === 'feedbacks' ? 'feedbacks' : 'overview'
  ));

  // Data states
  const [adminStats, setAdminStats] = useState(null);
  const [skills, setSkills] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [usersPage, setUsersPage] = useState(1);
  const [selectedRoleUser, setSelectedRoleUser] = useState(null);
  const [roleSaving, setRoleSaving] = useState(false);
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

  const requestDeleteConfirmation = ({ title, message, onConfirm }) => {
    setAdminConfirmModal({
      title,
      message,
      confirmText: 'Delete permanently',
      danger: true,
      onConfirm: async () => {
        setAdminConfirmModal(null);
        await onConfirm();
      }
    });
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
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [feedbackReplyDraft, setFeedbackReplyDraft] = useState('');
  const [feedbackReplySaving, setFeedbackReplySaving] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setDataError(null);
    try {
      if (activeTab === 'overview') {
        const res = await apiClient.get('/api/dashboard/admin');
        setAdminStats(res.data?.data || res.data || {});
      } else if (activeTab === 'users') {
        const res = await apiClient.get('/api/dashboard/admin/users', {
          params: {
            search: userSearch?.trim() || undefined,
            role: userRoleFilter !== 'All' ? userRoleFilter : undefined,
            page: usersPage,
            limit: 20
          }
        });
        const p = res.data?.data || res.data || {};
        const list = p.users || res.data?.users || [];
        setUsersList(Array.isArray(list) ? list : []);
        setUsersPagination(p.pagination || { page: usersPage, pages: 1, total: list.length, limit: 20 });
      } else if (activeTab === 'groups') {
        const res = await apiClient.get('/api/dashboard/admin/groups');
        const p = res.data?.data || res.data || {};
        const list = p.groups || res.data?.groups || [];
        setGroupsList(Array.isArray(list) ? list : []);
      } else if (activeTab === 'posts') {
        const res = await apiClient.get('/api/dashboard/admin/posts');
        const p = res.data?.data || res.data || {};
        const list = p.posts || res.data?.posts || [];
        setPostsList(Array.isArray(list) ? list : []);
      } else if (activeTab === 'skills') {
        const res = await apiClient.get('/api/skills');
        const p = res.data?.data || res.data || {};
        const list = p.skills || res.data?.skills || [];
        setSkills(Array.isArray(list) ? list : []);
      } else if (activeTab === 'skill-requests') {
        const res = await apiClient.get('/api/skills/requests', {
          params: { status: skillRequestStatusFilter !== 'all' ? skillRequestStatusFilter : undefined }
        });
        const p = res.data?.data || res.data || {};
        const list = p.requests || res.data?.requests || [];
        setSkillRequests(Array.isArray(list) ? list : []);
      } else if (activeTab === 'feedbacks') {
        const res = await apiClient.get('/api/feedback/admin', {
          params: { status: feedbackStatusFilter !== 'all' ? feedbackStatusFilter : undefined }
        });
        const p = res.data?.data || res.data || {};
        const list = p.feedbacks || res.data?.feedbacks || [];
        setFeedbacksList(Array.isArray(list) ? list : []);
        setUnreadFeedbackCount(p.unreadCount ?? res.data?.unreadCount ?? 0);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
      setDataError(err.response?.data?.message || 'Failed to retrieve admin telemetry data.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, userSearch, userRoleFilter, usersPage, skillRequestStatusFilter, feedbackStatusFilter]);

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin, loadDashboardData]);

  const handlePromoteDemoteUser = async () => {
    if (!selectedRoleUser) return;
    const nextRole = String(selectedRoleUser.role).toLowerCase() === 'admin' ? 'User' : 'Admin';
    setRoleSaving(true);
    try {
      await apiClient.put(
        `/api/dashboard/admin/users/${selectedRoleUser._id}/role`,
        { role: nextRole }
      );
      setStatusMsg(`User role updated to ${nextRole}`);
      setTimeout(() => setStatusMsg(''), 3000);
      setSelectedRoleUser(null);
      await loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Could not update user role');
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteUser = (target) => {
    requestDeleteConfirmation({
      title: 'Delete user account?',
      message: `This permanently deletes ${target.name || 'this user'} and associated account data. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/dashboard/admin/users/${target._id}`);
          setStatusMsg('User account removed.');
          setTimeout(() => setStatusMsg(''), 3000);
          await loadDashboardData();
        } catch (err) {
          showAdminToast(err.response?.data?.message || 'Could not delete user');
        }
      }
    });
  };

  const handleDeleteGroup = (group) => {
    requestDeleteConfirmation({
      title: 'Delete study group?',
      message: `The group “${group.name || 'Untitled group'}” will be permanently deleted for all members. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/dashboard/admin/groups/${group._id}`);
          setStatusMsg('Group deleted.');
          setTimeout(() => setStatusMsg(''), 3000);
          await loadDashboardData();
        } catch (err) {
          showAdminToast(err.response?.data?.message || 'Could not delete group');
        }
      }
    });
  };

  const handleDeletePost = (post) => {
    requestDeleteConfirmation({
      title: 'Delete community post?',
      message: `This permanently removes this post by ${post.author?.name || 'the author'} from the community feed. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/dashboard/admin/posts/${post._id}`);
          setStatusMsg('Post removed.');
          setTimeout(() => setStatusMsg(''), 3000);
          await loadDashboardData();
        } catch (err) {
          showAdminToast(err.response?.data?.message || 'Could not delete post');
        }
      }
    });
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
        }
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

  const handleDeleteSkill = (skill) => {
    requestDeleteConfirmation({
      title: 'Remove skill from catalog?',
      message: `“${skill.name}” will no longer be available in the platform catalog. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/skills/${skill._id}`);
          await loadDashboardData();
        } catch (err) {
          showAdminToast(err.response?.data?.message || 'Could not delete skill');
        }
      }
    });
  };

  const handleApproveSkillRequest = async (requestId) => {
    try {
      const res = await apiClient.put(
        `/api/skills/requests/${requestId}/approve`,
        {}
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
        { adminFeedback: reason }
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
        }
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
        { status }
      );
      setStatusMsg(`Feedback marked as ${status}.`);
      setTimeout(() => setStatusMsg(''), 3000);
      loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Failed to update feedback status');
    }
  };

  const openFeedbackDialog = (feedback) => {
    setSelectedFeedback(feedback);
    setFeedbackReplyDraft(feedback.adminNotes || '');
  };

  const handleSaveFeedbackReply = async () => {
    const reply = feedbackReplyDraft.trim();
    if (!selectedFeedback || !reply || feedbackReplySaving) return;

    setFeedbackReplySaving(true);
    try {
      const res = await apiClient.put(
        `/api/feedback/admin/${selectedFeedback._id}/status`,
        { adminNotes: reply, status: 'reviewed' }
      );
      const savedFeedback = res.data?.data?.feedback || res.data?.feedback;
      const updatedFeedback = {
        ...selectedFeedback,
        ...(savedFeedback || {}),
        user: selectedFeedback.user,
        adminNotes: reply,
        status: savedFeedback?.status || 'reviewed'
      };
      setFeedbacksList((current) => current.map((item) => (
        item._id === updatedFeedback._id ? updatedFeedback : item
      )));
      setSelectedFeedback(updatedFeedback);
      if (selectedFeedback.status === 'unread') {
        setUnreadFeedbackCount((count) => Math.max(0, count - 1));
      }
      setStatusMsg('Response sent. The user can read it in Settings → Feedback & Support.');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Failed to send feedback response');
    } finally {
      setFeedbackReplySaving(false);
    }
  };

  const handleDeleteFeedback = (feedback) => {
    requestDeleteConfirmation({
      title: 'Delete user feedback?',
      message: `The feedback “${feedback.subject || 'Untitled feedback'}” will be permanently removed. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/feedback/admin/${feedback._id}`);
          setStatusMsg('Feedback removed.');
          setTimeout(() => setStatusMsg(''), 3000);
          await loadDashboardData();
        } catch (err) {
          showAdminToast(err.response?.data?.message || 'Failed to delete feedback');
        }
      }
    });
  };

  // Administrator Account Required Gate
  if (!isAdmin) {
    return (
      <div className="page-shell flex-1 p-4 sm:p-8 flex flex-col justify-center items-center min-h-[75vh] text-app">
        <div className="w-full max-w-md bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl text-app text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Lock size={26} />
          </div>
          <h2 className="text-xl font-extrabold text-app font-outfit">Administrator Account Required</h2>
          <p className="text-xs text-muted leading-relaxed">
            You must be logged in with an authorized Administrator account or unlock with the Master Admin Key.
          </p>

          <form onSubmit={handleUnlockWithKey} className="space-y-3 pt-2 text-left">
            <div>
              <label className="block text-[11px] font-bold text-muted mb-1">
                Admin Master Secret Key
              </label>
              <input
                type="password"
                placeholder="Enter master key (e.g. orbitus-v2-secret710)..."
                value={masterKeyInput}
                onChange={(e) => setMasterKeyInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-app text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            {keyErrorMsg && (
              <p className="text-[11px] font-semibold text-rose-500">{keyErrorMsg}</p>
            )}
            <button
              type="submit"
              disabled={verifyingKey || !masterKeyInput.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md active:scale-98 cursor-pointer text-xs flex items-center justify-center gap-2"
            >
              {verifyingKey ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Master Key...</span>
                </>
              ) : (
                'Unlock Admin Console'
              )}
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">or login</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate('/login?redirect=/admin')}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-app rounded-xl font-bold transition-all cursor-pointer text-xs"
            >
              Log In as Administrator
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full py-2.5 text-muted hover:text-app rounded-xl font-medium transition-all cursor-pointer text-xs"
            >
              Return to User Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell flex-1 p-4 sm:p-6 lg:p-8 space-y-6 text-app overflow-y-auto">
      {/* Admin Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 border border-white/20 text-white rounded-2xl backdrop-blur-md shadow-sm">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-outfit tracking-tight">
                Master Admin Console
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100/90 mt-0.5 font-medium">
                Global platform telemetry, user moderation, study group management & announcements.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-bold bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>System Operational</span>
          </div>

          {statusMsg && (
            <span className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-md animate-fade-in">
              {statusMsg}
            </span>
          )}
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs scrollbar-none dark:border-slate-800/80 dark:bg-[#181d28]">
        <SlidingSegment
          ariaLabel="Admin Hub sections"
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: 'overview', label: 'Overview & Analytics', icon: BarChart3 },
            { value: 'feedbacks', label: 'User Feedback', icon: MessageSquare, badge: unreadFeedbackCount },
            { value: 'skill-requests', label: 'Course Requests', icon: FileCheck },
            { value: 'users', label: 'User Accounts', icon: Users },
            { value: 'groups', label: 'Study Groups', icon: Layers },
            { value: 'posts', label: 'Feed Posts', icon: MessageSquare },
            { value: 'skills', label: 'Skills Catalog', icon: Database },
            { value: 'certificate-preview', label: 'Certificate Preview', icon: Award },
            { value: 'broadcast', label: 'Global Broadcast', icon: Radio }
          ]}
          className="w-max min-w-full"
          buttonClassName="rounded-xl px-4 py-2.5 text-xs font-bold"
          activeTextClassName="text-white"
          inactiveTextClassName="text-muted hover:bg-slate-100 hover:text-app dark:hover:bg-slate-800/60"
          indicatorClassName="bg-indigo-600 shadow-md shadow-indigo-500/25"
        />
      </div>

      {/* Tab 1: Overview & Charts */}
      {activeTab === 'overview' && (
        <div className="space-y-6 content-switch-motion">
          {loading && !adminStats && (
            <div className="flex h-64 w-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-semibold text-muted">Loading telemetry metrics...</p>
              </div>
            </div>
          )}

          {dataError && !adminStats && (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-3">
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{dataError}</p>
              <button
                type="button"
                onClick={loadDashboardData}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {adminStats && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {[
                  { label: 'Total Users', value: adminStats.stats?.totalUsers ?? 0, icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
                  { label: 'Active Users', value: adminStats.stats?.activeUsers ?? 0, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
                  { label: 'Study Sessions', value: adminStats.stats?.totalSessions ?? 0, icon: FileCheck, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
                  { label: 'Platform Skills', value: adminStats.stats?.totalSkills ?? 0, icon: Database, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
                  { label: 'Reviews Posted', value: adminStats.stats?.totalReviews ?? 0, icon: Star, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
                  { label: 'Admins', value: adminStats.stats?.adminCount ?? 0, icon: Shield, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40' }
                ].map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <div key={idx} className="bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4.5 space-y-2 shadow-xs hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-muted tracking-wider">{s.label}</span>
                        <div className={`p-1.5 rounded-xl ${s.bg}`}>
                          <Icon size={15} className={s.color} />
                        </div>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-app font-outfit">{s.value}</p>
                    </div>
                  );
                })}
              </div>

              <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />}>
                <AdminOverviewCharts adminStats={adminStats} />
              </Suspense>
            </>
          )}
        </div>
      )}

      {/* Tab: User Feedbacks */}
      {activeTab === 'feedbacks' && (
        <div className="space-y-4 content-switch-motion">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-base text-app font-outfit">Direct User Feedbacks & Suggestions</h3>
              <p className="text-xs text-muted">
                Submitted by users via Settings. Review feedback, leave responses, or mark resolved.
              </p>
            </div>

            {/* Filter status */}
            <SlidingSegment
              ariaLabel="Feedback status filter"
              value={feedbackStatusFilter}
              onChange={setFeedbackStatusFilter}
              options={['all', 'unread', 'reviewed', 'resolved'].map((status) => ({
                value: status,
                label: status
              }))}
              className="rounded-2xl border border-slate-200 bg-white text-xs shadow-xs dark:border-slate-800 dark:bg-[#181d28]"
              buttonClassName="px-3 py-1.5 text-[10px] font-bold uppercase"
              indicatorClassName="bg-indigo-600 shadow-xs"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-muted">Loading user feedbacks...</div>
          ) : feedbacksList.length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-white dark:bg-[#181d28] border border-dashed border-slate-200 dark:border-slate-800 text-xs text-muted">
              No feedback entries matching filter &quot;{feedbackStatusFilter}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbacksList.map((fb) => (
                <div
                  key={fb._id}
                  className="bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 space-y-3 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* User header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={fb.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(fb.user?.name || 'User')}&background=6366f1&color=fff`}
                          alt={fb.user?.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-app truncate">{fb.user?.name || 'Anonymous'}</p>
                          <p className="text-[10px] text-muted truncate">{fb.user?.email} • @{fb.user?.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                          {fb.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            fb.status === 'resolved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : fb.status === 'reviewed'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {fb.status}
                        </span>
                      </div>
                    </div>

                    {/* Rating & Subject */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-app text-xs">{fb.subject || 'No Subject'}</span>
                      <span className="text-[11px] text-amber-500">{'⭐'.repeat(fb.rating || 5)}</span>
                    </div>

                    {/* Message */}
                    <p className="text-xs text-muted leading-relaxed whitespace-pre-line line-clamp-4 bg-slate-50 dark:bg-[#12161f] p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                      {fb.message}
                    </p>

                    {/* Admin Note if any */}
                    {fb.adminNotes && (
                      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-600 dark:text-indigo-300 whitespace-pre-line line-clamp-2">
                        <span className="font-bold">Your Response:</span> {fb.adminNotes}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-muted">
                      {new Date(fb.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openFeedbackDialog(fb)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-app font-semibold transition-colors cursor-pointer"
                        title="Read the full feedback"
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => openFeedbackDialog(fb)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors cursor-pointer"
                        title="Read and respond to feedback"
                      >
                        <Send size={12} /> {fb.adminNotes ? 'Edit reply' : 'Respond'}
                      </button>
                      {fb.status !== 'resolved' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateFeedbackStatus(fb._id, 'resolved')}
                          className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteFeedback(fb)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
        <div className="space-y-4 content-switch-motion">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-3 text-muted" />
              <input
                type="text"
                placeholder="Search user by name, email, or username..."
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUsersPage(1); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (usersPage === 1) loadDashboardData();
                    else setUsersPage(1);
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-app outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={userRoleFilter}
                onChange={(e) => { setUserRoleFilter(e.target.value); setUsersPage(1); }}
                className="px-3.5 py-2.5 bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-app outline-none cursor-pointer"
              >
                <option value="All">All Roles</option>
                <option value="User">Regular Users</option>
                <option value="Admin">Administrators</option>
              </select>
              <button
                onClick={loadDashboardData}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl transition-all shadow-xs cursor-pointer"
              >
                Filter
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#12161f] border-b border-slate-200 dark:border-slate-800 text-muted uppercase text-[10px] font-extrabold tracking-wider">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Points</th>
                    <th className="p-4">Joined</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {usersList.length === 0 ? (
                    <tr><td colSpan={6} className="p-10 text-center text-muted">{loading ? 'Loading accounts...' : 'No accounts match these filters.'}</td></tr>
                  ) : usersList.map((u) => {
                    const isUserAdmin = String(u.role || '').toLowerCase() === 'admin';
                    return (
                      <tr key={u._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <button type="button" onClick={() => navigate(`/profile/${u.username || u._id}`)} className="flex items-center gap-3 text-left group">
                            <img src={u.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=6366f1&color=fff`} alt="" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 object-cover border border-slate-200 dark:border-slate-700" />
                            <span className="min-w-0">
                              <span className="block font-bold text-app group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{u.name || 'Unnamed user'}</span>
                              <span className="block text-[10px] text-muted">@{u.username || 'user'}</span>
                            </span>
                          </button>
                        </td>
                        <td className="p-4 text-muted font-mono text-[11px]">{u.email}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${isUserAdmin ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800' : 'bg-slate-100 dark:bg-slate-800 text-muted'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-app">{u.points || 0}</td>
                        <td className="p-4 text-muted">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button type="button" onClick={() => navigate(`/profile/${u.username || u._id}`)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg text-[10px] font-bold" title="Open profile">
                            <ExternalLink size={13} /> Profile
                          </button>
                          <button type="button" onClick={() => setSelectedRoleUser(u)} className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-app rounded-lg text-[10px] font-bold transition-colors">
                            {isUserAdmin ? 'Demote' : 'Promote'}
                          </button>
                          <button type="button" onClick={() => handleDeleteUser(u)} className="inline-flex p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors" title="Delete user" aria-label={`Delete ${u.name || 'user'}`}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">{usersPagination.total} accounts · Page {usersPagination.page || usersPage} of {Math.max(1, usersPagination.pages || 1)}</p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={usersPage <= 1 || loading} onClick={() => setUsersPage((page) => Math.max(1, page - 1))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-app disabled:opacity-40">
                  <ChevronLeft size={14} /> Previous
                </button>
                <button type="button" disabled={usersPage >= (usersPagination.pages || 1) || loading} onClick={() => setUsersPage((page) => page + 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-app disabled:opacity-40">
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Study Groups Management */}
      {activeTab === 'groups' && (
        <div className="space-y-4 content-switch-motion">
          <div className="bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#12161f] border-b border-slate-200 dark:border-slate-800 text-muted uppercase text-[10px] font-extrabold tracking-wider">
                  <tr>
                    <th className="p-4">Group Name</th>
                    <th className="p-4">Privacy</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Creator</th>
                    <th className="p-4">Members</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {groupsList.map((g) => (
                    <tr key={g._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-app">{g.name}</td>
                      <td className="p-4 capitalize text-muted">{g.privacy}</td>
                      <td className="p-4 text-muted">{g.category}</td>
                      <td className="p-4 text-muted">{g.creator?.name || 'Unknown'}</td>
                      <td className="p-4 font-bold text-app">{g.membersCount}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteGroup(g)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Delete group"
                        >
                          <Trash2 size={15} />
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
        <div className="space-y-3 content-switch-motion">
          {postsList.map((p) => (
            <div key={p._id} className="bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 flex items-start justify-between gap-4 shadow-xs">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-app">{p.author?.name || 'User'}</span>
                  <span className="text-[10px] text-muted">@{p.author?.username || 'user'}</span>
                  <span className="text-[10px] text-muted">• {new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-muted line-clamp-3 leading-relaxed">{p.content}</p>
              </div>
              <button
                onClick={() => handleDeletePost(p)}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl shrink-0 transition-colors cursor-pointer"
                title="Remove post"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Skills Catalog */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 content-switch-motion">
          <form onSubmit={handleAddSkill} className="bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 space-y-4 text-xs h-fit shadow-xs">
            <h3 className="font-bold text-sm text-app font-outfit flex items-center gap-2">
              <Plus size={16} className="text-indigo-600 dark:text-indigo-400" /> Register New Skill
            </h3>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Skill Name *</label>
              <input
                type="text"
                required
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="e.g. Next.js App Router"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0f1117] border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Category</label>
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0f1117] border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none cursor-pointer"
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
              <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Description</label>
              <textarea
                rows={2}
                value={newSkillDesc}
                onChange={(e) => setNewSkillDesc(e.target.value)}
                placeholder="Skill scope..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0f1117] border border-slate-200 dark:border-slate-800 rounded-xl text-app outline-none resize-none"
              />
            </div>
            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-md active:scale-98 cursor-pointer">
              Add Skill to Catalog
            </button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-bold text-sm text-app font-outfit">Registered Platform Skills ({skills.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skills.map((s) => (
                <div key={s._id} className="bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-app truncate">{s.name}</p>
                    <p className="text-[10px] text-muted">{s.category}</p>
                  </div>
                  <button onClick={() => handleDeleteSkill(s)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5.5: Course Requests from Community */}
      {activeTab === 'skill-requests' && (
        <div className="space-y-4 content-switch-motion">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-base text-app font-outfit flex items-center gap-2">
                <FileCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
                Community Course Proposals & Skill Requests
              </h3>
              <p className="text-xs text-muted">
                Review courses suggested by users. Approving a request creates the skill in the catalog and automatically adds it to the user's profile.
              </p>
            </div>

            {/* Filter Status Pills */}
            <SlidingSegment
              ariaLabel="Course request status filter"
              value={skillRequestStatusFilter}
              onChange={setSkillRequestStatusFilter}
              options={['all', 'pending', 'approved', 'rejected']}
              className="rounded-2xl border border-slate-200 bg-white text-xs shadow-xs dark:border-slate-800 dark:bg-[#181d28]"
              buttonClassName="px-3 py-1.5 text-xs capitalize"
              indicatorClassName="bg-indigo-600 shadow-xs"
            />
          </div>

          {skillRequests.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#181d28] border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-muted text-xs">
              No course requests found under "{skillRequestStatusFilter}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skillRequests.map((req) => (
                <div
                  key={req._id}
                  className="bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 space-y-3 flex flex-col justify-between shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-app">{req.name}</h4>
                        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">{req.category}</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          req.status === 'approved'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                            : req.status === 'rejected'
                            ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 animate-pulse'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    {req.description && (
                      <p className="text-xs text-muted bg-slate-50 dark:bg-[#12161f] p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                        {req.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-muted font-medium">
                        Intent: <strong className="text-app capitalize">{req.intent}</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-muted font-medium">
                        Level: <strong className="text-app">{req.level || 'Intermediate'}</strong>
                      </span>
                      {req.tags?.map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-muted">
                          #{t}
                        </span>
                      ))}
                    </div>

                    {/* Requesting user info */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                      <img
                        src={req.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user?.name || 'User')}&background=6366f1&color=fff`}
                        alt=""
                        className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-app truncate">{req.user?.name}</p>
                        <p className="text-[10px] text-muted truncate">@{req.user?.username || req.user?.email}</p>
                      </div>
                      <span className="text-[10px] text-muted">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleRejectSkillRequest(req._id)}
                        className="flex-1 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveSkillRequest(req._id)}
                        className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        Approve & Add
                      </button>
                    </div>
                  )}

                  {req.status === 'rejected' && req.adminFeedback && (
                    <p className="text-[10px] text-rose-500 italic pt-1">
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
        <div className="mx-auto grid w-full max-w-5xl gap-5 content-switch-motion lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.8fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#181d28] sm:p-6">
            <header className="mb-5 flex items-start gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
              <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"><Radio size={19} /></span>
              <div>
                <h3 className="text-base font-bold text-app">Global announcement</h3>
                <p className="mt-1 text-xs text-muted">Send one notification to every platform user.</p>
              </div>
            </header>
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="broadcast-title" className="text-xs font-semibold text-app">Title</label>
                <input
                  id="broadcast-title"
                  type="text"
                  required
                  maxLength={200}
                  placeholder="What should users know?"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-app outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-[#11151d]"
                />
                <p className="text-right text-[10px] text-muted">{broadcastTitle.length}/200</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="broadcast-content" className="text-xs font-semibold text-app">Message</label>
                <textarea
                  id="broadcast-content"
                  required
                  rows={6}
                  maxLength={2000}
                  placeholder="Write a clear, useful announcement..."
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-app outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-[#11151d]"
                />
                <p className="text-right text-[10px] text-muted">{broadcastContent.length}/2000</p>
              </div>
              <button type="submit" disabled={broadcastSending || !broadcastTitle.trim() || !broadcastContent.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
                <Send size={15} /> {broadcastSending ? 'Sending announcement…' : 'Send to all users'}
              </button>
            </form>
          </section>
          <aside className="space-y-4">
            <section className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 dark:border-indigo-900/70 dark:bg-indigo-950/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Recipients</p>
              <p className="mt-2 text-xl font-bold text-app">All platform users</p>
              <p className="mt-1 text-xs leading-5 text-muted">This announcement is delivered to user notification inboxes. Review the preview before sending.</p>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#181d28]" aria-live="polite">
              <div className="mb-4 flex items-center gap-2 text-muted"><Radio size={15} /><span className="text-[10px] font-bold uppercase tracking-wider">Notification preview</span></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#11151d]">
                <p className="break-words text-sm font-bold text-app">{broadcastTitle.trim() || 'Announcement title'}</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-muted">{broadcastContent.trim() || 'Your announcement message will appear here.'}</p>
                <p className="mt-4 text-[10px] text-muted">Just now</p>
              </div>
            </section>
          </aside>
        </div>
      )}

      {activeTab === 'certificate-preview' && (
        <section className="mx-auto w-full max-w-5xl space-y-4 content-switch-motion" aria-labelledby="certificate-preview-title">
          <header>
            <h2 id="certificate-preview-title" className="text-lg font-bold text-app font-outfit">Certificate design preview</h2>
            <p className="mt-1 text-xs text-muted">A sample of the certificate learners receive after a completed skill exchange.</p>
          </header>

          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-3 dark:border-slate-800 dark:bg-[#11151d] sm:p-6">
            <article className="relative mx-auto w-full max-w-4xl overflow-hidden border-4 border-double border-amber-500/70 bg-[#0a0e17] px-5 py-8 text-center text-slate-100 shadow-2xl sm:px-12 sm:py-12">
              <div className="pointer-events-none absolute inset-2 border border-amber-300/20 sm:inset-3" />
              <div className="relative flex flex-col items-center">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold tracking-wide text-white">
                  <img src="/favicon.svg" alt="" className="h-8 w-8 object-contain" />
                  Orbitus
                </div>
                <span className="mb-5 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                  Sample preview · Not issued
                </span>
                <h3 className="text-lg font-extrabold uppercase tracking-[0.12em] text-amber-200 sm:text-2xl">Certificate of Skill Mastery</h3>
                <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Presented to</p>
                <p className="mt-2 break-words font-serif text-3xl font-semibold text-white sm:text-4xl">Alex Morgan</p>
                <p className="mt-4 max-w-2xl text-xs leading-6 text-slate-300 sm:text-sm">
                  In recognition of completing a verified peer-to-peer learning exchange and demonstrating commitment to continuous learning.
                </p>
                <span className="mt-5 inline-flex max-w-full items-center rounded-full border border-indigo-300/30 bg-indigo-400/10 px-5 py-2 text-sm font-bold text-indigo-200 sm:text-base">
                  React Development
                </span>
                <div className="mt-8 flex w-full flex-col items-center justify-between gap-5 border-t border-slate-700 pt-5 text-left sm:flex-row">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-slate-500">Issued on</p>
                    <p className="mt-1 text-xs font-semibold text-slate-300">Sample date · 15 October 2026</p>
                    <p className="mt-2 break-all font-mono text-[9px] text-slate-500">SAMPLE-ORB-CERT-0001</p>
                  </div>
                  <div className="flex items-center gap-2 self-center rounded-full border border-amber-300/50 p-2.5 text-amber-200 sm:self-auto" aria-label="Orbitus sample seal">
                    <Award size={24} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Verified<br />Exchange</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
          <p className="text-[11px] text-muted">This preview is illustrative only. It is not linked to a learner record and cannot be verified.</p>
        </section>
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
        <div data-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setAdminConfirmModal(null)}>
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
        <div data-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setAdminPromptModal(null)}>
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

      <Dialog open={Boolean(selectedRoleUser)} onOpenChange={(open) => !open && !roleSaving && setSelectedRoleUser(null)}>
        {selectedRoleUser && (
          <DialogContent className="w-[calc(100%-2rem)] max-w-md text-app">
            <DialogHeader className="pr-7 text-left">
              <DialogTitle>{String(selectedRoleUser.role).toLowerCase() === 'admin' ? 'Demote administrator?' : 'Promote user to admin?'}</DialogTitle>
              <DialogDescription>
                {String(selectedRoleUser.role).toLowerCase() === 'admin'
                  ? 'This account will lose administrator access.'
                  : 'This account will gain administrator access to the Admin Hub.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#11151d]">
              <img src={selectedRoleUser.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedRoleUser.name || 'User')}&background=6366f1&color=fff`} alt="" className="h-11 w-11 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-app">{selectedRoleUser.name || 'Unnamed user'}</p>
                <p className="truncate text-xs text-muted">{selectedRoleUser.email}</p>
              </div>
            </div>
            <DialogFooter>
              <button type="button" disabled={roleSaving} onClick={() => setSelectedRoleUser(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-app hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800">Cancel</button>
              <button type="button" disabled={roleSaving} onClick={handlePromoteDemoteUser} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                {roleSaving ? 'Updating…' : String(selectedRoleUser.role).toLowerCase() === 'admin' ? 'Confirm demotion' : 'Confirm promotion'}
              </button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={Boolean(selectedFeedback)} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        {selectedFeedback && (
          <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl p-5 sm:p-7 text-app">
            <DialogHeader className="pr-8">
              <DialogTitle className="text-left">{selectedFeedback.subject || 'Feedback details'}</DialogTitle>
              <DialogDescription className="text-left">
                Review the complete submission and send a response visible to the user in Settings.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#12161f] p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-app">{selectedFeedback.user?.name || 'Anonymous'}</p>
                  <p className="truncate text-xs text-muted">
                    {[selectedFeedback.user?.email, selectedFeedback.user?.username && `@${selectedFeedback.user.username}`].filter(Boolean).join(' · ') || 'User details unavailable'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-muted">{selectedFeedback.category}</span>
                  <span className="text-amber-500" aria-label={`${selectedFeedback.rating || 5} out of 5 stars`}>
                    {'★'.repeat(selectedFeedback.rating || 5)}{'☆'.repeat(Math.max(0, 5 - (selectedFeedback.rating || 5)))}
                  </span>
                </div>
              </div>

              <section aria-labelledby="feedback-message-title" className="space-y-2">
                <h4 id="feedback-message-title" className="text-xs font-bold uppercase text-muted">Full feedback</h4>
                <div className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12161f] p-4 text-sm leading-relaxed text-app">
                  {selectedFeedback.message}
                </div>
                <p className="text-[11px] text-muted">
                  Submitted {new Date(selectedFeedback.createdAt).toLocaleString()} · Status: {selectedFeedback.status}
                </p>
              </section>

              {selectedFeedback.adminNotes && (
                <section aria-labelledby="previous-response-title" className="space-y-2">
                  <h4 id="previous-response-title" className="text-xs font-bold uppercase text-muted">Previous response</h4>
                  <div className="whitespace-pre-wrap break-words rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/30 p-4 text-sm leading-relaxed text-app">
                    {selectedFeedback.adminNotes}
                  </div>
                </section>
              )}

              <section className="space-y-2">
                <label htmlFor="feedback-admin-reply" className="text-xs font-bold text-app">
                  {selectedFeedback.adminNotes ? 'Edit your response' : 'Write a response'}
                </label>
                <textarea
                  id="feedback-admin-reply"
                  value={feedbackReplyDraft}
                  onChange={(event) => setFeedbackReplyDraft(event.target.value.slice(0, 2000))}
                  rows={6}
                  maxLength={2000}
                  placeholder="Write a clear, helpful response. You can use multiple paragraphs."
                  className="w-full resize-y rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#12161f] p-3 text-sm leading-relaxed text-app placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
                <div className="flex items-center justify-between gap-3 text-[11px] text-muted">
                  <span>The user can read this under Settings → Feedback &amp; Support.</span>
                  <span className="shrink-0">{feedbackReplyDraft.length}/2000</span>
                </div>
              </section>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                className="h-10 rounded-lg border border-slate-200 dark:border-slate-700 px-4 text-sm font-semibold text-app hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveFeedbackReply}
                disabled={feedbackReplySaving || !feedbackReplyDraft.trim()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={14} /> {feedbackReplySaving ? 'Sending…' : 'Send response'}
              </button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
