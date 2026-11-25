import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import apiClient, { API_BASE_URL } from '../../services/apiClient.js';
import {
  Trophy,
  BookOpen,
  Hourglass,
  CheckCircle,
  FileText,
  QrCode,
  ArrowRight,
  Flame,
  Award
} from 'lucide-react';
import SkillActivityHeatmap from '../../components/dashboard/SkillActivityHeatmap.jsx';
import RubberSegment from '../../components/common/react-bits/RubberSegment.jsx';
import { Avatar, AvatarImage, AvatarFallback, Badge } from '../../components/ui/index.js';
import { optimizeCloudinaryUrl } from '../../lib/utils.js';

const PlatformBadges = React.lazy(() => import('../../components/dashboard/PlatformBadges.jsx'));
const ActivityBarChart = React.lazy(() => import('../../components/dashboard/ActivityBarChart.jsx'));

const UserDashboard = () => {
  const { user, token } = useSelector((state) => state.auth);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [progressViewMode, setProgressViewMode] = useState('heatmap');

  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const userRef = useRef(user);
  userRef.current = user;

  const formatDashboardError = (err) => {
    if (!err) return 'Unable to load learning metrics. Please try again.';
    if (err.code === 'ERR_NETWORK' || !err.response) {
      return 'Unable to connect to the Orbitus backend service. Please check your network connection.';
    }
    const status = err.response?.status;
    if (status === 401) return 'Your session has expired. Please sign in again.';
    if (status === 403) return 'You do not have permission to view these metrics.';
    if (status === 404) return 'User profile or metrics could not be found.';
    if (status >= 500) return 'The dashboard service encountered an internal error. Please try again.';
    return err.response?.data?.message || err.message || 'Failed to load dashboard metrics.';
  };

  const normalizeDashboardPayload = (rawResponse, fallbackUser) => {
    if (!rawResponse || typeof rawResponse !== 'object') {
      throw new Error('The learning metrics service did not return valid data.');
    }

    const payload = rawResponse.data || rawResponse;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('The learning metrics service returned an unexpected format.');
    }

    const currentUser = payload.user || fallbackUser;
    if (!currentUser || (!payload.stats && !payload.metrics && !payload.user)) {
      throw new Error('The learning metrics service did not return complete metrics.');
    }

    const rawStats = payload.stats || payload.metrics || {};
    const points = Number(payload.user?.points ?? rawStats.points ?? currentUser?.points ?? 0);
    const followersCount = Number(
      rawStats.followersCount ?? currentUser?.followersCount ?? (currentUser?.followers?.length ?? 0)
    );
    const followingCount = Number(
      rawStats.followingCount ?? currentUser?.followingCount ?? (currentUser?.following?.length ?? 0)
    );

    const certificates = Array.isArray(payload.certificates)
      ? payload.certificates
      : Array.isArray(payload.recentCertificates)
      ? payload.recentCertificates
      : [];

    const roadmaps = Array.isArray(payload.roadmaps)
      ? payload.roadmaps
      : Array.isArray(payload.recentRoadmaps)
      ? payload.recentRoadmaps
      : [];

    const stats = {
      points,
      completedSessions: Number(rawStats.completedSessions ?? rawStats.totalExchanges ?? 0),
      learningHours: Number(rawStats.learningHours ?? 0),
      certificatesEarned: Number(rawStats.certificatesEarned ?? rawStats.certificatesCount ?? certificates.length),
      activeRoadmaps: Number(rawStats.activeRoadmaps ?? rawStats.roadmapsCount ?? roadmaps.length),
      badgesUnlocked: Number(rawStats.badgesUnlocked ?? (Array.isArray(payload.badges) ? payload.badges.length : 0)),
      followersCount,
      followingCount,
      totalExchanges: Number(rawStats.totalExchanges ?? rawStats.completedSessions ?? 0)
    };

    const rawCharts = payload.charts || {};
    const rawChart = payload.chart || {};
    const rawActivityMap = payload.activityHeatmap || payload.charts?.activityMap || payload.activityMap || {};
    const charts = {
      labels: rawCharts.labels || rawChart.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      mentorData: rawCharts.mentorData || rawChart.mentorSessions || [0, 0, 0, 0, 0, 0],
      learnerData: rawCharts.learnerData || rawChart.learnerSessions || [0, 0, 0, 0, 0, 0],
      activityMap: rawActivityMap
    };

    return {
      user: currentUser,
      stats,
      badges: Array.isArray(payload.badges) ? payload.badges : [],
      badgeProgress: Array.isArray(payload.badgeProgress) ? payload.badgeProgress : [],
      certificates,
      roadmaps,
      charts,
      activityHeatmap: rawActivityMap,
      timezone: payload.timezone || currentUser?.timezone || 'Asia/Kolkata'
    };
  };

  useEffect(() => {
    isMountedRef.current = true;
    const currentId = ++requestIdRef.current;

    const loadData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await apiClient.get('/api/dashboard/user');
        if (!isMountedRef.current || requestIdRef.current !== currentId) return;
        const normalized = normalizeDashboardPayload(res.data, userRef.current);
        setDashboardData(normalized);
      } catch (err) {
        if (
          err.name === 'CanceledError' ||
          err.name === 'AbortError' ||
          !isMountedRef.current ||
          requestIdRef.current !== currentId
        ) {
          return;
        }
        console.error('Error fetching dashboard stats:', err);
        setFetchError(formatDashboardError(err));
      } finally {
        if (isMountedRef.current && requestIdRef.current === currentId) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [token, user?._id]);

  const fetchDashboardStats = async () => {
    const currentId = ++requestIdRef.current;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await apiClient.get('/api/dashboard/user');
      if (!isMountedRef.current || requestIdRef.current !== currentId) return;
      const normalized = normalizeDashboardPayload(res.data, userRef.current);
      setDashboardData(normalized);
    } catch (err) {
      if (
        err.name === 'CanceledError' ||
        err.name === 'AbortError' ||
        !isMountedRef.current ||
        requestIdRef.current !== currentId
      ) {
        return;
      }
      console.error('Error fetching dashboard stats:', err);
      setFetchError(formatDashboardError(err));
    } finally {
      if (isMountedRef.current && requestIdRef.current === currentId) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-xs text-slate-400">Loading dashboard...</span>
      </div>
    );
  }

  if (fetchError || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 p-4 text-center">
        <div className="orb-card p-6 max-w-md w-full space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <Flame size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Unable to load dashboard</h3>
            <p className="text-xs text-slate-400 mt-1">
              {fetchError || 'The learning metrics service did not return valid data.'}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchDashboardStats}
            className="orb-btn-primary w-full py-2.5 text-xs"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const {
    stats,
    badges,
    badgeProgress = [],
    certificates = [],
    roadmaps,
    charts,
    activityHeatmap = {},
    timezone = 'Asia/Kolkata'
  } = dashboardData;
  const currentUser = dashboardData.user || user || {};
  const followersCount = stats?.followersCount ?? currentUser.followersCount ?? 0;
  const followingCount = stats?.followingCount ?? currentUser.followingCount ?? 0;

  const getCertificateVerifyUrl = (certificate) =>
    `${API_BASE_URL}/api/certificates/verify/${certificate.uniqueId}`;

  const chartData = {
    labels: charts?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'As Mentor (Hours taught)',
        data: charts?.mentorData || [0, 0, 0, 0, 0, 0],
        backgroundColor: '#4f46e5',
        borderRadius: 6
      },
      {
        label: 'As Learner (Hours learned)',
        data: charts?.learnerData || [0, 0, 0, 0, 0, 0],
        backgroundColor: '#818cf8',
        borderRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(128,128,128,0.08)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(128,128,128,0.08)' },
        ticks: { color: '#64748b', stepSize: 1, font: { size: 10 } }
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-w-0">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Your Orbitus workspace</p>
          <h1 className="orb-page-title mt-1">Home</h1>
        </div>
      </div>

      {/* ── Welcome & identity panel ── */}
      <div className="relative isolate overflow-hidden rounded-3xl border border-indigo-950/10 bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 p-6 text-white shadow-xl sm:p-8">
        {currentUser.coverImage && (
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${optimizeCloudinaryUrl(currentUser.coverImage, { width: 1400, crop: 'fill' })})` }}
          />
        )}
        <div aria-hidden="true" className="absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.85fr)] md:items-center lg:gap-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">Your learning journey</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back, {currentUser.name?.split(' ')[0] || 'learner'}.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/85">
              Keep building skills, sharing what you know, and making progress with your community.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/skills" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-950 transition hover:bg-indigo-50">
                Explore courses <ArrowRight size={15} />
              </Link>
              <Link to={`/profile/${currentUser.username || currentUser._id}`} className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15">
                View profile
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-slate-950/25 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Avatar className="h-12 w-12 rounded-2xl border border-white/20">
                <AvatarImage
                  src={optimizeCloudinaryUrl(currentUser.profileImage, { width: 96, height: 96, crop: 'fill', gravity: 'face' })}
                  alt={currentUser.name || 'Member'}
                />
                <AvatarFallback className="rounded-2xl bg-indigo-400/25 text-sm font-bold text-white">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold">{currentUser.name || 'Orbitus member'}</p>
                  {currentUser.role === 'Admin' && (
                    <Badge variant="outline" className="border-amber-300/40 bg-amber-300/10 text-[10px] text-amber-100">Admin</Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-indigo-100/70">
                  @{currentUser.username || 'member'} · {currentUser.experienceLevel || 'Learner'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="rounded-xl bg-white/8 p-3">
                <span className="text-[11px] text-indigo-100/70">Daily streak</span>
                <p className="mt-1 text-xl font-semibold">{currentUser.streak || 0}<span className="ml-1 text-xs font-medium text-indigo-100/70">days</span></p>
              </div>
              <div className="rounded-xl bg-white/8 p-3">
                <span className="text-[11px] text-indigo-100/70">Community points</span>
                <p className="mt-1 text-xl font-semibold">{stats.points || 0}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-indigo-100/80">
              <span>{followersCount} followers</span>
              <span>{followingCount} following</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 Stats Cards matching reference grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Platform Points',
            value: stats.points,
            sub: 'Daily bonus & session gains',
            icon: Trophy,
            color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-800/60'
          },
          {
            label: 'Completed Sessions',
            value: stats.completedSessions,
            sub: 'Exchanged & certified',
            icon: CheckCircle,
            color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-800/60'
          },
          {
            label: 'Active Roadmaps',
            value: roadmaps.length,
            sub: 'AI curriculums tracked',
            icon: BookOpen,
            color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/70 dark:border-indigo-800/60'
          },
          {
            label: 'Learning Hours',
            value: `${stats.learningHours} hrs`,
            sub: 'Total mutual exchange time',
            icon: Hourglass,
            color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200/70 dark:border-purple-800/60'
          }
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="orb-card p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">{card.label}</span>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {card.value}
                  </h2>
                </div>
                <div className={`p-2 rounded-xl border shrink-0 ${card.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <span className="text-[11px] text-slate-400 mt-3 block">{card.sub}</span>
            </div>
          );
        })}
      </div>

      {/* ── Main Row 1: Learning Progress Heatmap (Left 2 cols) & Roadmaps (Right 1 col) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Progress Heatmap */}
        <div className="lg:col-span-2 orb-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Learning Exchange Progress
              </h2>
              <p className="text-xs text-slate-400">Timelines tracking hours exchanged</p>
            </div>
            <RubberSegment
              ariaLabel="Learning progress view"
              value={progressViewMode}
              onChange={setProgressViewMode}
              options={[
                { value: 'heatmap', label: 'Heatmap' },
                { value: 'barchart', label: 'Chart' }
              ]}
              className="rounded-xl bg-slate-100 dark:bg-slate-800/60"
              buttonClassName="px-2.5 py-1 text-xs"
            />
          </div>

          <div className="w-full min-h-[200px] flex items-center justify-center overflow-x-auto scrollbar-none">
            {progressViewMode === 'heatmap' ? (
              <SkillActivityHeatmap
                user={currentUser}
                stats={stats}
                activityMap={activityHeatmap || charts?.activityMap || {}}
                timeZone={timezone || currentUser?.timezone || 'Asia/Kolkata'}
              />
            ) : (
              <React.Suspense
                fallback={
                  <div className="w-full h-48 flex items-center justify-center text-xs text-slate-400">
                    Loading chart...
                  </div>
                }
              >
                <ActivityBarChart chartData={chartData} chartOptions={chartOptions} />
              </React.Suspense>
            )}
          </div>
        </div>

        {/* Active Roadmaps */}
        <div className="orb-card p-6 flex flex-col">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">AI Roadmaps</h2>
            <Link to="/roadmap" className="text-xs text-indigo-600 font-semibold hover:underline">
              Create +
            </Link>
          </div>

          {roadmaps.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs gap-2">
              <BookOpen size={24} className="text-slate-300 dark:text-slate-600" />
              <span>No active roadmaps tracked yet.</span>
              <Link to="/roadmap" className="orb-btn-ghost text-xs mt-1">
                Generate Roadmap
              </Link>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[220px]">
              {roadmaps.map((map) => (
                <div
                  key={map._id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {map.topic}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Curriculum progress</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${map.progress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      {map.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Row 2: Badges (Left 2 cols) & Certificates (Right 1 col) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Platform Badges */}
        <div className="lg:col-span-2 orb-card p-6">
          <React.Suspense
            fallback={
              <div className="p-6 flex items-center justify-center min-h-[180px]">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <PlatformBadges user={currentUser} badges={badges} badgeProgress={badgeProgress} />
          </React.Suspense>
        </div>

        {/* Certificates */}
        <div className="orb-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <FileText size={16} className="text-indigo-600" />
              <span>Certificates ({certificates.length})</span>
            </h3>
          </div>

          {certificates.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
              <Award size={26} className="text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No certificates yet</p>
              <p className="text-[10px]">Complete a 60+ min session to earn an official certificate.</p>
              <Link to="/skills" className="orb-btn-ghost text-xs mt-2">
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[240px]">
              {certificates.map((cert) => (
                <div
                  key={cert._id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700/80 p-3 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-3"
                >
                  {cert.verificationQrCode ? (
                    <a
                      href={getCertificateVerifyUrl(cert)}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0"
                      title="Verify Certificate"
                    >
                      <img src={cert.verificationQrCode} alt="QR" className="h-10 w-10 rounded bg-white p-1" />
                    </a>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-800 text-slate-400 shrink-0">
                      <QrCode size={18} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <a
                      href={getCertificateVerifyUrl(cert)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 truncate block"
                    >
                      {cert.skill?.name || 'Skill Certificate'}
                    </a>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Issued {new Date(cert.issueDate).toLocaleDateString()}
                    </p>
                    <p className="text-[9px] font-mono text-slate-400 break-all mt-0.5">{cert.uniqueId}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
