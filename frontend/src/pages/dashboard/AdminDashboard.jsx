import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient.js';
import { authSuccess } from '../../features/authSlice.js';
import RubberSegment from '../../components/common/react-bits/RubberSegment.jsx';
import AdminLogin from '../auth/AdminLogin.jsx';
import { showDailyLoginToast } from '../../lib/dailyLoginToast.js';
import {
  Shield,
  ShieldCheck,
  Users,
  Award,
  FileCheck,
  Star,
  Plus,
  CheckCircle,
  AlertTriangle,
  Database,
  Trash2,
  X,
  Search,
  MessageSquare,
  Eye,
  Radio,
  Flag,
  ClipboardList,
  Activity,
  SlidersHorizontal,
  Ban,
  RotateCcw,
  Send,
  BarChart3,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  KeyRound,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../components/ui/dialog.jsx';
import './AdminDashboard.css';

const AdminOverviewCharts = React.lazy(() => import('../../components/dashboard/AdminOverviewCharts.jsx'));

const ADMIN_PERMISSION_OPTIONS = [
  { key: 'dashboard.read', label: 'View dashboard analytics' },
  { key: 'users.read', label: 'View user accounts' },
  { key: 'users.manage', label: 'Manage users and suspensions' },
  { key: 'content.read', label: 'View posts and groups' },
  { key: 'content.manage', label: 'Manage posts, groups, and skills' },
  { key: 'moderation.manage', label: 'Review content reports' },
  { key: 'feedback.manage', label: 'Manage user feedback' },
  { key: 'system.manage', label: 'Manage broadcasts and platform keys' },
  { key: 'audit.read', label: 'View admin audit trail' },
  { key: 'permissions.manage', label: 'Manage administrator access' },
  { key: 'feature_flags.manage', label: 'Manage feature flags' },
  { key: 'health.read', label: 'View service health' }
];

const ACCESS_LEVEL_PERMISSIONS = {
  full: ADMIN_PERMISSION_OPTIONS.map(({ key }) => key),
  moderator: ['dashboard.read', 'content.read', 'content.manage', 'moderation.manage', 'audit.read'],
  support: ['dashboard.read', 'users.read', 'users.manage', 'feedback.manage'],
  analyst: ['dashboard.read', 'audit.read', 'feature_flags.manage', 'health.read']
};

const ADMIN_TAB_PERMISSIONS = {
  overview: 'dashboard.read',
  'session-analytics': 'dashboard.read',
  'account-analytics': 'dashboard.read',
  'skills-analytics': 'dashboard.read',
  'community-activity': 'dashboard.read',
  feedbacks: 'feedback.manage',
  'skill-requests': 'content.manage',
  users: 'users.read',
  admins: 'users.read',
  'suspended-users': 'users.read',
  groups: 'content.read',
  posts: 'content.read',
  skills: 'content.manage',
  moderation: 'moderation.manage',
  audit: 'audit.read',
  health: 'health.read',
  features: 'feature_flags.manage',
  'certificate-preview': 'dashboard.read',
  broadcast: 'system.manage'
};

const ADMIN_NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { key: 'overview', label: 'Overview', icon: BarChart3, permission: 'dashboard.read' },
      { key: 'session-analytics', label: 'Session analytics', icon: Activity, permission: 'dashboard.read' },
      { key: 'account-analytics', label: 'Account analytics', icon: Users, permission: 'dashboard.read' },
      { key: 'skills-analytics', label: 'Skills analytics', icon: Database, permission: 'dashboard.read' },
      { key: 'community-activity', label: 'Community pulse', icon: MessageSquare, permission: 'dashboard.read' }
    ]
  },
  {
    label: 'People',
    items: [
      { key: 'users', label: 'User accounts', icon: Users, permission: 'users.read' },
      { key: 'admins', label: 'Administrator access', icon: ShieldCheck, permission: 'users.read' },
      { key: 'suspended-users', label: 'Suspended accounts', icon: Ban, permission: 'users.read' },
      { key: 'feedbacks', label: 'User feedback', icon: MessageSquare, permission: 'feedback.manage' },
      { key: 'moderation', label: 'Moderation queue', icon: Flag, permission: 'moderation.manage' }
    ]
  },
  {
    label: 'Trust & content',
    items: [
      { key: 'skill-requests', label: 'Course requests', icon: FileCheck, permission: 'content.manage' },
      { key: 'groups', label: 'Study groups', icon: Layers, permission: 'content.read' },
      { key: 'posts', label: 'Feed posts', icon: MessageSquare, permission: 'content.read' },
      { key: 'skills', label: 'Skills catalog', icon: Database, permission: 'content.manage' },
      { key: 'certificate-preview', label: 'Certificate preview', icon: Award, permission: 'dashboard.read' }
    ]
  },
  {
    label: 'Platform',
    items: [
      { key: 'health', label: 'Service health', icon: Activity, permission: 'health.read' },
      { key: 'audit', label: 'Audit trail', icon: ClipboardList, permission: 'audit.read' },
      { key: 'features', label: 'Feature flags', icon: SlidersHorizontal, permission: 'feature_flags.manage' },
      { key: 'broadcast', label: 'Global broadcast', icon: Radio, permission: 'system.manage' },
      { key: 'secret-key', label: 'Master secret key', icon: KeyRound, permission: 'system.manage' }
    ]
  }
];

const ADMIN_ANALYTICS_PAGES = {
  'session-analytics': {
    title: 'Session analytics',
    description: 'Peer-learning session outcomes across the platform.',
    chartView: 'sessions'
  },
  'account-analytics': {
    title: 'Account analytics',
    description: 'The current balance of member and administrator accounts.',
    chartView: 'accounts'
  },
  'skills-analytics': {
    title: 'Skills analytics',
    description: 'How the skills catalog is distributed across categories.',
    chartView: 'skills'
  }
};

const FEATURE_FLAG_DESCRIPTIONS = {
  userRegistration: 'Allow new members to create an Orbitus account.',
  postsEnabled: 'Allow members to publish new community posts.',
  groupsEnabled: 'Allow members to create study groups.',
  skillRequestsEnabled: 'Allow members to submit skill and course requests.'
};

const getServiceState = (status) => {
  if (status === 'healthy' || status === 'connected') return 'healthy';
  if (status === 'in_memory_fallback') return 'warning';
  return 'error';
};

const formatServiceStatus = (status) => (
  status === 'in_memory_fallback'
    ? 'In-memory fallback'
    : String(status || 'unknown').replaceAll('_', ' ')
);

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [days && `${days}d`, `${hours}h`, `${minutes}m`].filter(Boolean).join(' ');
};

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userRoleLower = String(user?.role || '').trim().toLowerCase();
  const isAdmin = userRoleLower === 'admin';
  const can = useCallback((permission) => {
    if (!isAdmin) return false;
    if (user?.adminAccessLevel === 'custom') return (user.adminPermissions || []).includes(permission);
    return (ACCESS_LEVEL_PERMISSIONS[user?.adminAccessLevel || 'full'] || []).includes(permission);
  }, [isAdmin, user?.adminAccessLevel, user?.adminPermissions]);
  const [dataError, setDataError] = useState(null);
  // Master Secret Key management state
  const [showSecretKeyModal, setShowSecretKeyModal] = useState(false);
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newSecretKeyInput, setNewSecretKeyInput] = useState('');
  const [confirmSecretKeyInput, setConfirmSecretKeyInput] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showSecretPass, setShowSecretPass] = useState(false);
  const [savingSecretKey, setSavingSecretKey] = useState(false);
  const [secretKeySuccess, setSecretKeySuccess] = useState('');
  const [secretKeyError, setSecretKeyError] = useState('');

  const handleUpdateAdminSecretKey = async (e) => {
    e.preventDefault();
    if (!currentAdminPassword || !newSecretKeyInput) {
      setSecretKeyError('Please enter both your admin password and a new secret key.');
      return;
    }
    if (newSecretKeyInput.length < 6) {
      setSecretKeyError('New secret key must be at least 6 characters long.');
      return;
    }
    if (newSecretKeyInput !== confirmSecretKeyInput) {
      setSecretKeyError('New secret key and confirmation do not match.');
      return;
    }

    setSavingSecretKey(true);
    setSecretKeyError('');
    setSecretKeySuccess('');
    try {
      const res = await apiClient.post('/api/auth/admin-change-secret-key', {
        currentPassword: currentAdminPassword,
        newSecretKey: newSecretKeyInput.trim()
      });
      setSecretKeySuccess(res.data?.message || 'Master Admin secret key updated successfully!');
      setCurrentAdminPassword('');
      setNewSecretKeyInput('');
      setConfirmSecretKeyInput('');
      setTimeout(() => {
        setShowSecretKeyModal(false);
        setSecretKeySuccess('');
      }, 2500);
    } catch (err) {
      setSecretKeyError(err.response?.data?.message || 'Failed to update master secret key. Verify your password.');
    } finally {
      setSavingSecretKey(false);
    }
  };


  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlKey = searchParams.get('key') || searchParams.get('adminKey');
    if (urlKey && !isAdmin) {
      apiClient
        .post('/api/auth/verify-admin-key', { key: urlKey })
        .then((res) => {
          const data = res.data?.data || res.data;
          dispatch(authSuccess(data));
          showDailyLoginToast({
            dailyReward: data.dailyReward,
            user: data.user,
            fallbackTitle: 'Administrator authenticated',
            fallbackDescription: 'Master control console unlocked.'
          });
        })
        .catch(() => {});
    }
  }, [isAdmin, dispatch]);

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
  const [appliedUserSearch, setAppliedUserSearch] = useState('');
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
  const [moderationReports, setModerationReports] = useState([]);
  const [moderationStatusFilter, setModerationStatusFilter] = useState('pending');
  const [adminAuditLogs, setAdminAuditLogs] = useState([]);
  const [featureFlags, setFeatureFlags] = useState([]);
  const [featureFlagSaving, setFeatureFlagSaving] = useState({});
  const [adminHealth, setAdminHealth] = useState(null);
  const [suspensionTarget, setSuspensionTarget] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionExpiresAt, setSuspensionExpiresAt] = useState('');
  const [suspensionSaving, setSuspensionSaving] = useState(false);
  const [selectedAccessUser, setSelectedAccessUser] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [accessSaving, setAccessSaving] = useState(false);

  useEffect(() => {
    const requiredPermission = ADMIN_TAB_PERMISSIONS[activeTab];
    if (requiredPermission && !can(requiredPermission)) {
      const firstAllowedTab = Object.entries(ADMIN_TAB_PERMISSIONS)
        .find(([, permission]) => can(permission))?.[0];
      if (firstAllowedTab) setActiveTab(firstAllowedTab);
    }
  }, [activeTab, can]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setDataError(null);
    try {
      if ([
        'overview',
        'session-analytics',
        'account-analytics',
        'skills-analytics',
        'community-activity'
      ].includes(activeTab)) {
        const res = await apiClient.get('/api/dashboard/admin');
        setAdminStats(res.data?.data || res.data || {});
      } else if (['users', 'admins', 'suspended-users'].includes(activeTab)) {
        const res = await apiClient.get('/api/dashboard/admin/users', {
          params: {
            search: appliedUserSearch || undefined,
            role: activeTab === 'admins'
              ? 'Admin'
              : userRoleFilter !== 'All'
                ? userRoleFilter
                : undefined,
            status: activeTab === 'suspended-users' ? 'suspended' : undefined,
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
      } else if (activeTab === 'moderation') {
        const res = await apiClient.get('/api/moderation/admin/reports', {
          params: { status: moderationStatusFilter, limit: 50 }
        });
        const p = res.data?.data || res.data || {};
        setModerationReports(Array.isArray(p.reports) ? p.reports : []);
      } else if (activeTab === 'audit') {
        const res = await apiClient.get('/api/dashboard/admin/audit', {
          params: { page: 1, limit: 50 }
        });
        const p = res.data?.data || res.data || {};
        setAdminAuditLogs(Array.isArray(p.logs) ? p.logs : []);
      } else if (activeTab === 'features') {
        const res = await apiClient.get('/api/dashboard/admin/feature-flags');
        const p = res.data?.data || res.data || {};
        setFeatureFlags(Array.isArray(p.flags) ? p.flags : []);
      } else if (activeTab === 'health') {
        const res = await apiClient.get('/api/dashboard/admin/health');
        setAdminHealth(res.data?.data || res.data || null);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
      setDataError(err.response?.data?.message || 'Failed to retrieve admin telemetry data.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, appliedUserSearch, userRoleFilter, usersPage, skillRequestStatusFilter, feedbackStatusFilter, moderationStatusFilter]);

  useEffect(() => {
    if (isAdmin && can(ADMIN_TAB_PERMISSIONS[activeTab])) {
      loadDashboardData();
    }
  }, [isAdmin, can, activeTab, loadDashboardData]);

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

  const handleUpdateAdminAccess = async (target, accessLevel) => {
    if (accessLevel === 'custom') {
      setSelectedAccessUser(target);
      setSelectedPermissions(target.adminPermissions || []);
      return;
    }

    try {
      await apiClient.put(`/api/dashboard/admin/users/${target._id}/access`, {
        accessLevel,
        permissions: []
      });
      setStatusMsg(`Admin access updated to ${accessLevel}.`);
      setTimeout(() => setStatusMsg(''), 3000);
      await loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Could not update administrator access');
    }
  };

  const handleSaveCustomAccess = async () => {
    if (!selectedAccessUser || selectedPermissions.length === 0 || accessSaving) return;
    setAccessSaving(true);
    try {
      await apiClient.put(`/api/dashboard/admin/users/${selectedAccessUser._id}/access`, {
        accessLevel: 'custom',
        permissions: selectedPermissions
      });
      setSelectedAccessUser(null);
      setStatusMsg('Custom administrator permissions saved.');
      setTimeout(() => setStatusMsg(''), 3000);
      await loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Could not update administrator permissions');
    } finally {
      setAccessSaving(false);
    }
  };

  const openSuspendUserDialog = (target) => {
    setSuspensionTarget(target);
    setSuspensionReason('');
    setSuspensionExpiresAt('');
  };

  const handleSuspendUser = async () => {
    if (!suspensionTarget || suspensionReason.trim().length < 5 || suspensionSaving) return;
    setSuspensionSaving(true);
    try {
      await apiClient.post(`/api/dashboard/admin/users/${suspensionTarget._id}/suspend`, {
        reason: suspensionReason.trim(),
        ...(suspensionExpiresAt ? { expiresAt: new Date(suspensionExpiresAt).toISOString() } : {})
      });
      setSuspensionTarget(null);
      setStatusMsg('User account suspended.');
      setTimeout(() => setStatusMsg(''), 3000);
      await loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Could not suspend this user');
    } finally {
      setSuspensionSaving(false);
    }
  };

  const handleRestoreUser = async (target) => {
    try {
      await apiClient.put(`/api/dashboard/admin/users/${target._id}/restore`, {
        reason: 'Restored by an administrator'
      });
      setStatusMsg('User account restored.');
      setTimeout(() => setStatusMsg(''), 3000);
      await loadDashboardData();
    } catch (err) {
      showAdminToast(err.response?.data?.message || 'Could not restore this user');
    }
  };

  const handleReviewReport = (report, decision, removeContent = false) => {
    const submitReview = async () => {
      try {
        await apiClient.put(`/api/moderation/admin/reports/${report._id}`, {
          decision,
          removeContent,
          resolutionNote: removeContent ? 'Content removed after review' : 'Reviewed by an administrator'
        });
        setStatusMsg(`Report ${decision}.`);
        setTimeout(() => setStatusMsg(''), 3000);
        await loadDashboardData();
      } catch (err) {
        showAdminToast(err.response?.data?.message || 'Could not update this report');
      }
    };

    if (removeContent) {
      requestDeleteConfirmation({
        title: 'Remove reported content?',
        message: 'This will permanently remove the reported post or group and resolve the report.',
        onConfirm: submitReview
      });
    } else {
      submitReview();
    }
  };

  const handleToggleFeatureFlag = async (flag) => {
    if (featureFlagSaving[flag.key]) return;

    const enabled = !flag.enabled;
    setFeatureFlagSaving((current) => ({ ...current, [flag.key]: true }));
    try {
      const response = await apiClient.put(`/api/dashboard/admin/feature-flags/${flag.key}`, {
        enabled
      });
      const updatedFlag = response.data?.data?.flag;
      if (
        !updatedFlag ||
        updatedFlag.key !== flag.key ||
        typeof updatedFlag.enabled !== 'boolean' ||
        updatedFlag.enabled !== enabled
      ) {
        throw new Error('The server returned an invalid feature flag update.');
      }

      setFeatureFlags((current) => current.map((item) => item.key === flag.key ? updatedFlag : item));
      setStatusMsg(`${flag.label} ${updatedFlag.enabled ? 'enabled' : 'disabled'}.`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      showAdminToast(err.response?.data?.message || err.message || 'Could not update feature flag', true);
    } finally {
      setFeatureFlagSaving((current) => {
        const next = { ...current };
        delete next[flag.key];
        return next;
      });
    }
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

  const handleApplyUserFilters = () => {
    const nextSearch = userSearch.trim();
    const pageNeedsReset = usersPage !== 1;
    setUsersPage(1);
    if (nextSearch !== appliedUserSearch) {
      setAppliedUserSearch(nextSearch);
    } else if (!pageNeedsReset) {
      loadDashboardData();
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

  const healthServices = Object.entries(adminHealth?.services || {});
  const healthyServiceCount = healthServices.filter(([, status]) => getServiceState(status) === 'healthy').length;
  const serviceHealthPercent = healthServices.length
    ? Math.round((healthyServiceCount / healthServices.length) * 100)
    : 0;
  const healthStatus = adminHealth
    ? adminHealth.status === 'healthy' && healthyServiceCount === healthServices.length
      ? 'operational'
      : 'degraded'
    : 'unknown';
  const analyticsPage = ADMIN_ANALYTICS_PAGES[activeTab];
  const peoplePageTitle = {
    users: 'User accounts',
    admins: 'Administrator access',
    'suspended-users': 'Suspended accounts'
  }[activeTab];

  // Administrator Account Required Gate
  if (!isAdmin) {
    return (
      <div className="flex-1 w-full min-h-[75vh] flex items-center justify-center p-4">
        <AdminLogin onSuccess={() => loadDashboardData()} />
      </div>
    );
  }

  if (!Object.values(ADMIN_TAB_PERMISSIONS).some((permission) => can(permission))) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-[#181d28]">
          <Shield size={28} className="mx-auto text-amber-500" />
          <h2 className="mt-4 text-lg font-bold text-app">No Admin Hub permissions</h2>
          <p className="mt-2 text-sm text-muted">Contact a full administrator to request access to the tools you need.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-hub page-shell">
      <header className="admin-hub__topbar">
        <div>
          <p className="admin-hub__eyebrow">Orbitus / Administration</p>
          <h1>Admin Hub</h1>
          <p className="admin-hub__description">Trust, people, and platform operations in one place.</p>
        </div>
        <div className="admin-hub__header-actions">
          <span className="admin-hub__access-pill">
            <ShieldCheck size={15} />
            {String(user?.adminAccessLevel || 'full').replaceAll('-', ' ')} access
          </span>
          <button
            type="button"
            className="admin-hub__icon-button"
            onClick={loadDashboardData}
            disabled={loading}
            aria-label="Refresh current admin data"
            title="Refresh current section"
          >
            <RefreshCw size={16} className={loading ? 'admin-hub__refreshing' : ''} />
          </button>
        </div>
      </header>

      <div className="admin-hub__layout">
        <nav className="admin-hub__navigation" aria-label="Admin Hub navigation">
          {ADMIN_NAV_GROUPS.map((group) => {
            const allowedItems = group.items.filter((item) => can(item.permission));
            if (!allowedItems.length) return null;

            return (
              <section key={group.label} className="admin-hub__nav-group" aria-label={group.label}>
                <p>{group.label}</p>
                <div className="admin-hub__nav-items">
                  {allowedItems.map((item) => {
                    const Icon = item.icon;
                    const badgeCount = item.key === 'feedbacks'
                      ? unreadFeedbackCount
                      : item.key === 'moderation'
                        ? adminStats?.stats?.pendingReports
                        : 0;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`admin-hub__nav-item${activeTab === item.key ? ' is-active' : ''}`}
                        onClick={() => {
                          if (item.key === 'secret-key') {
                            setShowSecretKeyModal(true);
                            setSecretKeyError('');
                            setSecretKeySuccess('');
                            return;
                          }
                          if (['users', 'admins', 'suspended-users'].includes(item.key)) {
                            setUsersPage(1);
                            setUserRoleFilter('All');
                          }
                          setActiveTab(item.key);
                        }}
                        aria-current={activeTab === item.key ? 'page' : undefined}
                      >
                        <Icon size={15} aria-hidden="true" />
                        <span>{item.label}</span>
                        {badgeCount > 0 && (
                          <span className="admin-hub__nav-badge">{badgeCount > 99 ? '99+' : badgeCount}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </nav>

        <section className="admin-hub__content" aria-label="Admin Hub content">
          {statusMsg && (
            <div className="admin-hub__status-message" role="status">
              <CheckCircle size={15} />
              <span>{statusMsg}</span>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="admin-hub__overview-heading">
              <div>
                <p>Workspace overview</p>
                <h2>Platform at a glance</h2>
              </div>
              <span>Live operational metrics</span>
            </div>
          )}

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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {[
                  { label: 'Total Users', value: adminStats.stats?.totalUsers ?? 0, icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
                  { label: 'New Users (30d)', value: adminStats.stats?.newUsers30d ?? 0, icon: Users, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40' },
                  { label: 'Active Users', value: adminStats.stats?.activeUsers ?? 0, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
                  { label: 'Study Sessions', value: adminStats.stats?.totalSessions ?? 0, icon: FileCheck, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
                  { label: 'Platform Skills', value: adminStats.stats?.totalSkills ?? 0, icon: Database, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
                  { label: 'Reviews Posted', value: adminStats.stats?.totalReviews ?? 0, icon: Star, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
                  { label: 'Posts (30d)', value: adminStats.stats?.posts30d ?? 0, icon: MessageSquare, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
                  { label: 'Pending Reports', value: adminStats.stats?.pendingReports ?? 0, icon: Flag, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
                  { label: 'Suspended Users', value: adminStats.stats?.suspendedUsers ?? 0, icon: Ban, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
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

      {analyticsPage && (
        <section className="space-y-4 content-switch-motion">
          <div className="admin-hub__overview-heading">
            <div>
              <p>Workspace analytics</p>
              <h2>{analyticsPage.title}</h2>
            </div>
            <span>{analyticsPage.description}</span>
          </div>

          {loading && !adminStats && (
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          )}
          {dataError && !adminStats && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
              <p className="text-sm font-bold text-red-600 dark:text-red-400" role="alert">{dataError}</p>
              <button
                type="button"
                onClick={loadDashboardData}
                className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white"
              >
                Retry
              </button>
            </div>
          )}
          {dataError && adminStats && (
            <p className="text-xs text-amber-700 dark:text-amber-300" role="status">
              Latest refresh failed. Showing the last successfully loaded metrics.
            </p>
          )}
          {adminStats && (
            <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />}>
              <AdminOverviewCharts adminStats={adminStats} view={analyticsPage.chartView} />
            </Suspense>
          )}
        </section>
      )}

      {activeTab === 'community-activity' && (
        <section className="space-y-4 content-switch-motion">
          <div className="admin-hub__overview-heading">
            <div>
              <p>Workspace analytics</p>
              <h2>Community pulse</h2>
            </div>
            <span>30-day activity and current trust signals</span>
          </div>

          {loading && !adminStats && (
            <div className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          )}
          {dataError && !adminStats && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
              <p className="text-sm font-bold text-red-600 dark:text-red-400" role="alert">{dataError}</p>
              <button
                type="button"
                onClick={loadDashboardData}
                className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white"
              >
                Retry
              </button>
            </div>
          )}
          {dataError && adminStats && (
            <p className="text-xs text-amber-700 dark:text-amber-300" role="status">
              Latest refresh failed. Showing the last successfully loaded metrics.
            </p>
          )}
          {adminStats && (
            <>
              <p className="text-xs text-muted">
                New accounts and posts use a rolling 30-day window. Pending reports and suspensions are current totals.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'New accounts · 30 days', value: adminStats.stats?.newUsers30d ?? 0, icon: Users, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40' },
                  { label: 'Posts · 30 days', value: adminStats.stats?.posts30d ?? 0, icon: MessageSquare, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
                  { label: 'Pending reports', value: adminStats.stats?.pendingReports ?? 0, icon: Flag, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
                  { label: 'Suspended accounts', value: adminStats.stats?.suspendedUsers ?? 0, icon: Ban, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' }
                ].map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <article key={metric.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800/80 dark:bg-[#181d28]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">{metric.label}</span>
                        <span className={`rounded-xl p-1.5 ${metric.bg}`}><Icon size={15} className={metric.color} /></span>
                      </div>
                      <p className="mt-2 font-outfit text-2xl font-black text-app">
                        {Number(metric.value).toLocaleString()}
                      </p>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
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
            <RubberSegment
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
      {['users', 'admins', 'suspended-users'].includes(activeTab) && (
        <div className="space-y-4 content-switch-motion">
          <div className="admin-hub__overview-heading">
            <div>
              <p>People operations</p>
              <h2>{peoplePageTitle}</h2>
            </div>
            <span>{usersPagination.total.toLocaleString()} matching accounts</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-3 text-muted" />
              <input
                type="text"
                placeholder="Search user by name, email, or username..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyUserFilters();
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-app outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'users' && (
                <select
                  value={userRoleFilter}
                  onChange={(e) => { setUserRoleFilter(e.target.value); setUsersPage(1); }}
                  className="px-3.5 py-2.5 bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-app outline-none cursor-pointer"
                >
                  <option value="All">All Roles</option>
                  <option value="User">Regular Users</option>
                  <option value="Admin">Administrators</option>
                </select>
              )}
              <button
                type="button"
                onClick={handleApplyUserFilters}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl transition-all shadow-xs cursor-pointer"
              >
                Apply filters
              </button>
            </div>
          </div>

          {dataError && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400" role="alert">{dataError}</p>
              <button type="button" onClick={loadDashboardData} className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Retry
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#12161f] border-b border-slate-200 dark:border-slate-800 text-muted uppercase text-[10px] font-extrabold tracking-wider">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Admin Access</th>
                    <th className="p-4">Points</th>
                    <th className="p-4">Joined</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {usersList.length === 0 ? (
                    <tr><td colSpan={8} className="p-10 text-center text-muted">{loading ? 'Loading accounts...' : 'No accounts match these filters.'}</td></tr>
                  ) : usersList.map((u) => {
                    const isUserAdmin = String(u.role || '').toLowerCase() === 'admin';
                    const isSuspended = Boolean(
                      u.suspendedAt &&
                      (!u.suspendedUntil || new Date(u.suspendedUntil) > new Date())
                    );
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
                        <td className="p-4">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${isSuspended ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                            {isSuspended ? 'Suspended' : u.suspendedAt ? 'Suspension expired' : 'Active'}
                          </span>
                          {isSuspended && u.suspensionReason && (
                            <p className="mt-1 max-w-36 truncate text-[10px] text-muted" title={u.suspensionReason}>{u.suspensionReason}</p>
                          )}
                        </td>
                        <td className="p-4">
                          {isUserAdmin ? (
                            can('permissions.manage') ? (
                              <select
                                aria-label={`Admin access for ${u.name || u.email}`}
                                value={u.adminAccessLevel || 'full'}
                                onChange={(event) => handleUpdateAdminAccess(u, event.target.value)}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-app dark:border-slate-700 dark:bg-slate-900"
                              >
                                <option value="full">Full access</option>
                                <option value="moderator">Moderator</option>
                                <option value="support">Support</option>
                                <option value="analyst">Analyst</option>
                                <option value="custom">Custom permissions…</option>
                              </select>
                            ) : (
                              <span className="text-[10px] text-muted">{u.adminAccessLevel || 'full'}</span>
                            )
                          ) : <span className="text-[10px] text-muted">—</span>}
                        </td>
                        <td className="p-4 font-bold text-app">{u.points || 0}</td>
                        <td className="p-4 text-muted">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button type="button" onClick={() => navigate(`/profile/${u.username || u._id}`)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg text-[10px] font-bold" title="Open profile">
                            <ExternalLink size={13} /> Profile
                          </button>
                          {can('users.manage') && (
                            <>
                              {can('permissions.manage') && (
                                <button type="button" onClick={() => setSelectedRoleUser(u)} className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-app rounded-lg text-[10px] font-bold transition-colors">
                                  {isUserAdmin ? 'Demote' : 'Promote'}
                                </button>
                              )}
                              {!isUserAdmin && (isSuspended ? (
                                <button type="button" onClick={() => handleRestoreUser(u)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-[10px] font-bold" title="Restore user">
                                  <RotateCcw size={13} /> Restore
                                </button>
                              ) : (
                                <button type="button" onClick={() => openSuspendUserDialog(u)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg text-[10px] font-bold" title="Suspend user">
                                  <Ban size={13} /> Suspend
                                </button>
                              ))}
                              {!isUserAdmin && (
                                <button type="button" onClick={() => handleDeleteUser(u)} className="inline-flex p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors" title="Delete user" aria-label={`Delete ${u.name || 'user'}`}>
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </>
                          )}
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
                        {can('content.manage') && (
                          <button
                            onClick={() => handleDeleteGroup(g)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                            title="Delete group"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
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
              {can('content.manage') && (
                <button
                  onClick={() => handleDeletePost(p)}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl shrink-0 transition-colors cursor-pointer"
                  title="Remove post"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'moderation' && (
        <div className="space-y-4 content-switch-motion">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-base text-app font-outfit">Community moderation queue</h3>
              <p className="text-xs text-muted">Review member reports and take a documented action.</p>
            </div>
            <select
              value={moderationStatusFilter}
              onChange={(event) => setModerationStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-app dark:border-slate-700 dark:bg-[#181d28]"
              aria-label="Moderation report status"
            >
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
              <option value="all">All reports</option>
            </select>
          </div>
          {moderationReports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-muted dark:border-slate-700">
              {loading ? 'Loading reports…' : 'No reports in this queue.'}
            </div>
          ) : moderationReports.map((report) => (
            <article key={report._id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#181d28]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-rose-500/10 px-2 py-1 text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">{report.targetType}</span>
                    <span className="text-xs font-bold text-app">{report.reason}</span>
                    <span className="text-[10px] text-muted">{new Date(report.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-muted">
                    Reported by {report.reporter?.name || 'Unknown member'} · status: {report.status}
                  </p>
                </div>
                {report.status === 'pending' && (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleReviewReport(report, 'dismissed')} className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-app hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Dismiss</button>
                    <button type="button" onClick={() => handleReviewReport(report, 'resolved')} className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-emerald-500">Resolve</button>
                    <button type="button" onClick={() => handleReviewReport(report, 'resolved', true)} className="rounded-lg bg-rose-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-rose-500">Remove content</button>
                  </div>
                )}
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                  {report.target?.name || report.target?.author?.name || report.target?.creator?.name || 'Reported content'}
                </p>
                <p className="whitespace-pre-wrap break-words text-xs text-app">
                  {report.target?.content || report.target?.description || report.target?.name || 'The reported content is no longer available.'}
                </p>
              </div>
              {report.details && <p className="text-xs text-muted"><strong>Reporter details:</strong> {report.details}</p>}
              {report.resolutionNote && <p className="text-xs text-muted"><strong>Resolution:</strong> {report.resolutionNote}</p>}
            </article>
          ))}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-[#181d28] content-switch-motion">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <h3 className="font-bold text-base text-app font-outfit">Administrator audit trail</h3>
            <p className="mt-1 text-xs text-muted">Privileged actions, their actor, target, outcome and timestamp.</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {adminAuditLogs.length === 0 ? (
              <p className="p-8 text-center text-xs text-muted">{loading ? 'Loading audit entries…' : 'No admin actions recorded yet.'}</p>
            ) : adminAuditLogs.map((entry) => (
              <div key={entry._id} className="grid gap-2 p-4 text-xs sm:grid-cols-[1fr_1.2fr_1fr_auto] sm:items-center">
                <div>
                  <p className="font-bold text-app">{entry.actor?.name || 'Unknown admin'}</p>
                  <p className="text-[10px] text-muted">{entry.actor?.email || ''}</p>
                </div>
                <div>
                  <p className="font-semibold text-app">{entry.action.replaceAll('_', ' ')}</p>
                  <p className="text-[10px] text-muted">{entry.targetType || 'platform'}{entry.targetLabel ? ` · ${entry.targetLabel}` : entry.targetId ? ` · ${entry.targetId}` : ''}</p>
                </div>
                <p className="truncate text-muted" title={entry.reason}>{entry.reason || 'No reason provided'}</p>
                <div className="text-right">
                  <p className={`font-bold ${entry.statusCode < 400 ? 'text-emerald-600' : 'text-rose-600'}`}>{entry.statusCode}</p>
                  <p className="text-[10px] text-muted">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="admin-health content-switch-motion">
          <header className="admin-health__header">
            <div>
              <p className="admin-health__eyebrow"><Activity size={14} /> Operations</p>
              <h3>Service health</h3>
              <p>Current API, database, and cache status snapshot.</p>
            </div>
            {adminHealth && (
              <div className={`admin-health__overall is-${healthStatus}`} role="status">
                <span />
                <div>
                  <small>Overall status</small>
                  <strong>{healthStatus === 'operational' ? 'Operational' : 'Needs attention'}</strong>
                </div>
              </div>
            )}
          </header>

          {loading && !adminHealth ? (
            <div className="admin-health__empty" role="status">Checking platform services…</div>
          ) : dataError && !adminHealth ? (
            <div className="admin-health__empty admin-health__empty--error" role="alert">
              <p>{dataError}</p>
              <button type="button" onClick={loadDashboardData}>Retry check</button>
            </div>
          ) : adminHealth ? (
            <>
              {dataError && (
                <p className="admin-section-warning" role="alert">
                  Refresh failed: {dataError} Showing the last successful snapshot.
                </p>
              )}
              <section className="admin-health__summary">
                <div className="admin-health__summary-top">
                  <div>
                    <span>Services healthy</span>
                    <strong>{healthyServiceCount} <small>/ {healthServices.length}</small></strong>
                  </div>
                  {adminHealth.uptimeSeconds != null && (
                    <div className="admin-health__uptime">
                      <span>API uptime</span>
                      <strong>{formatUptime(adminHealth.uptimeSeconds)}</strong>
                    </div>
                  )}
                </div>
                <div
                  className="admin-health__meter"
                  role="progressbar"
                  aria-label="Currently healthy services"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={serviceHealthPercent}
                >
                  <span style={{ width: `${serviceHealthPercent}%` }} />
                </div>
                <p>
                  Snapshot only; historical uptime isn’t collected.
                  {adminHealth.checkedAt && ` Last checked ${new Date(adminHealth.checkedAt).toLocaleString()}.`}
                </p>
              </section>

              <div className="admin-health__services">
                {healthServices.map(([service, status]) => {
                  const serviceState = getServiceState(status);
                  const serviceName = service === 'api'
                    ? 'API server'
                    : service === 'database'
                      ? 'Database'
                      : service === 'cache'
                        ? 'Cache'
                        : service;
                  const ServiceIcon = service === 'api' ? Activity : Database;

                  return (
                    <article key={service} className={`admin-health__service is-${serviceState}`}>
                      <div className="admin-health__service-icon"><ServiceIcon size={17} /></div>
                      <div className="admin-health__service-copy">
                        <span>{serviceName}</span>
                        <strong>{formatServiceStatus(status)}</strong>
                      </div>
                      <span className="admin-health__service-indicator" aria-hidden="true" />
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="admin-health__empty">No health snapshot available.</div>
          )}
        </div>
      )}

      {activeTab === 'features' && (
        <div className="admin-feature-flags content-switch-motion">
          <header className="admin-feature-flags__header">
            <div>
              <p className="admin-feature-flags__eyebrow">Platform controls</p>
              <h3>Feature flags</h3>
              <p>Changes are stored centrally and enforced by the API.</p>
            </div>
            <span className="admin-feature-flags__count">
              {featureFlags.filter((flag) => flag.enabled).length} of {featureFlags.length} enabled
            </span>
          </header>

          {loading && !featureFlags.length ? (
            <div className="admin-feature-flags__empty" role="status">Loading feature controls…</div>
          ) : dataError && !featureFlags.length ? (
            <div className="admin-feature-flags__empty admin-feature-flags__empty--error" role="alert">
              <p>{dataError}</p>
              <button type="button" onClick={loadDashboardData}>Retry</button>
            </div>
          ) : featureFlags.length ? (
            <>
              {dataError && (
                <p className="admin-section-warning" role="alert">
                  Refresh failed: {dataError} Showing the last successful settings.
                </p>
              )}
              <div className="admin-feature-flags__list">
                {featureFlags.map((flag) => {
                  const saving = Boolean(featureFlagSaving[flag.key]);
                  return (
                    <article key={flag.key} className="admin-feature-flag">
                      <div className="admin-feature-flag__copy">
                        <div className="admin-feature-flag__title-row">
                          <h4>{flag.label}</h4>
                          <span className={`admin-feature-flag__status${flag.enabled ? ' is-enabled' : ''}`}>
                            {flag.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <p>{FEATURE_FLAG_DESCRIPTIONS[flag.key] || 'Control this feature across the platform.'}</p>
                        <code>{flag.key}</code>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(flag.enabled)}
                        aria-busy={saving}
                        aria-label={`${flag.enabled ? 'Disable' : 'Enable'} ${flag.label}`}
                        disabled={saving}
                        onClick={() => handleToggleFeatureFlag(flag)}
                        className={`admin-feature-flag__switch${flag.enabled ? ' is-enabled' : ''}${saving ? ' is-saving' : ''}`}
                      >
                        <span className="admin-feature-flag__switch-track">
                          <span className="admin-feature-flag__switch-knob" />
                        </span>
                        <span className="admin-feature-flag__switch-label">
                          {saving ? 'Saving…' : flag.enabled ? 'Disable' : 'Enable'}
                        </span>
                      </button>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="admin-feature-flags__empty">No feature flags are configured.</div>
          )}
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
            <RubberSegment
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

        </section>
      </div>

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

      <Dialog
        open={Boolean(suspensionTarget)}
        onOpenChange={(open) => {
          if (!open && !suspensionSaving) setSuspensionTarget(null);
        }}
      >
        {suspensionTarget && (
          <DialogContent className="w-[calc(100%-2rem)] max-w-lg text-app">
            <DialogHeader className="pr-7 text-left">
              <DialogTitle>Suspend {suspensionTarget.name || 'user'}?</DialogTitle>
              <DialogDescription>
                The user will lose access immediately. An empty expiry means the suspension remains active until restored.
              </DialogDescription>
            </DialogHeader>
            <label className="space-y-1.5 text-xs font-bold text-app">
              Reason
              <textarea
                value={suspensionReason}
                onChange={(event) => setSuspensionReason(event.target.value.slice(0, 500))}
                rows={3}
                maxLength={500}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <label className="space-y-1.5 text-xs font-bold text-app">
              Expiry (optional)
              <input
                type="datetime-local"
                value={suspensionExpiresAt}
                onChange={(event) => setSuspensionExpiresAt(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <DialogFooter>
              <button type="button" disabled={suspensionSaving} onClick={() => setSuspensionTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-app dark:border-slate-700">Cancel</button>
              <button type="button" disabled={suspensionSaving || suspensionReason.trim().length < 5} onClick={handleSuspendUser} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {suspensionSaving ? 'Suspending…' : 'Confirm suspension'}
              </button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog
        open={Boolean(selectedAccessUser)}
        onOpenChange={(open) => !open && !accessSaving && setSelectedAccessUser(null)}
      >
        {selectedAccessUser && (
          <DialogContent className="w-[calc(100%-2rem)] max-w-xl max-h-[85vh] overflow-y-auto text-app">
            <DialogHeader className="pr-7 text-left">
              <DialogTitle>Custom permissions for {selectedAccessUser.name || 'administrator'}</DialogTitle>
              <DialogDescription>Select only the capabilities this administrator needs.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 sm:grid-cols-2">
              {ADMIN_PERMISSION_OPTIONS.map((permission) => (
                <label key={permission.key} className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(permission.key)}
                    onChange={(event) => {
                      setSelectedPermissions((current) => event.target.checked
                        ? [...current, permission.key]
                        : current.filter((value) => value !== permission.key));
                    }}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <span>{permission.label}</span>
                </label>
              ))}
            </div>
            <DialogFooter>
              <button type="button" disabled={accessSaving} onClick={() => setSelectedAccessUser(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-app dark:border-slate-700">Cancel</button>
              <button type="button" disabled={accessSaving || selectedPermissions.length === 0} onClick={handleSaveCustomAccess} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {accessSaving ? 'Saving…' : 'Save permissions'}
              </button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

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

      {/* Admin Secret Key Modal */}
      {showSecretKeyModal && (
        <div data-modal="true" className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl text-app">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base font-outfit text-app">Change Master Secret Key</h3>
                  <p className="text-[11px] text-muted">Update platform administrative master key</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSecretKeyModal(false);
                  setSecretKeyError('');
                  setSecretKeySuccess('');
                }}
                className="text-slate-400 hover:text-app p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {secretKeySuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2 font-medium">
                <CheckCircle size={16} className="shrink-0" />
                <span>{secretKeySuccess}</span>
              </div>
            )}

            {secretKeyError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{secretKeyError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateAdminSecretKey} className="space-y-3.5 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-app">Current Admin Password</label>
                <div className="relative">
                  <input
                    type={showAdminPass ? "text" : "password"}
                    required
                    value={currentAdminPassword}
                    onChange={(e) => setCurrentAdminPassword(e.target.value)}
                    placeholder="Enter your current password..."
                    className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-app text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-app p-1 cursor-pointer"
                  >
                    {showAdminPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-app">New Master Secret Key</label>
                <div className="relative">
                  <input
                    type={showSecretPass ? "text" : "password"}
                    required
                    value={newSecretKeyInput}
                    onChange={(e) => setNewSecretKeyInput(e.target.value)}
                    placeholder="Enter at least 6 characters..."
                    className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-app text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretPass((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-app p-1 cursor-pointer"
                  >
                    {showSecretPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-app">Confirm New Secret Key</label>
                <input
                  type="password"
                  required
                  value={confirmSecretKeyInput}
                  onChange={(e) => setConfirmSecretKeyInput(e.target.value)}
                  placeholder="Re-enter new secret key..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-app text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSecretKeyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-app rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSecretKey || !currentAdminPassword || !newSecretKeyInput}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-98 cursor-pointer flex items-center gap-2"
                >
                  {savingSecretKey ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating Key...</span>
                    </>
                  ) : (
                    "Save Secret Key"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
