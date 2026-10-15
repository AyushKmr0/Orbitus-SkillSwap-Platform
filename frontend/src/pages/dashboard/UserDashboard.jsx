import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import ScrollReveal from "../../components/motion/ScrollReveal.jsx";
import apiClient, { API_BASE_URL } from "../../services/apiClient.js";
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
} from "lucide-react";
import SkillActivityHeatmap from "../../components/dashboard/SkillActivityHeatmap.jsx";
import SlidingSegment from "../../components/common/SlidingSegment.jsx";
import { Avatar, AvatarImage, AvatarFallback, Badge } from "../../components/ui/index.js";
import { optimizeCloudinaryUrl } from "../../lib/utils.js";

const PlatformBadges = React.lazy(() => import("../../components/dashboard/PlatformBadges.jsx"));
const ActivityBarChart = React.lazy(() => import("../../components/dashboard/ActivityBarChart.jsx"));


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
		if (!err) return "Unable to load learning metrics. Please try again.";
		if (err.code === "ERR_NETWORK" || !err.response) {
			return "Unable to connect to the Orbitus backend service. Please check your network or verify the backend is running.";
		}
		const status = err.response?.status;
		if (status === 401) {
			return "Your session has expired. Please sign in again to access your dashboard.";
		}
		if (status === 403) {
			return "You do not have permission to view these dashboard metrics.";
		}
		if (status === 404) {
			return "User profile or metrics could not be found. Please check your account.";
		}
		if (status >= 500) {
			return "The dashboard service encountered an internal error. Please try again in a few moments.";
		}
		return err.response?.data?.message || err.message || "Failed to load dashboard metrics. Please try again.";
	};

	const normalizeDashboardPayload = (rawResponse, fallbackUser) => {
		if (!rawResponse || typeof rawResponse !== "object") {
			throw new Error("The learning metrics service did not return valid data.");
		}

		const payload = rawResponse.data || rawResponse;
		if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
			throw new Error("The learning metrics service returned an unexpected response format.");
		}

		const currentUser = payload.user || fallbackUser;
		if (!currentUser || (!payload.stats && !payload.metrics && !payload.user)) {
			throw new Error("The learning metrics service did not return complete user metrics.");
		}

		const rawStats = payload.stats || payload.metrics || {};

		const points = Number(
			payload.user?.points ??
			rawStats.points ??
			currentUser?.points ??
			0
		);

		const followersCount = Number(
			rawStats.followersCount ??
			currentUser?.followersCount ??
			(currentUser?.followers?.length ?? 0)
		);

		const followingCount = Number(
			rawStats.followingCount ??
			currentUser?.followingCount ??
			(currentUser?.following?.length ?? 0)
		);

		const certificates = Array.isArray(payload.certificates)
			? payload.certificates
			: (Array.isArray(payload.recentCertificates) ? payload.recentCertificates : []);

		const roadmaps = Array.isArray(payload.roadmaps)
			? payload.roadmaps
			: (Array.isArray(payload.recentRoadmaps) ? payload.recentRoadmaps : []);

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
			labels: rawCharts.labels || rawChart.labels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
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
				const res = await apiClient.get("/api/dashboard/user");
				if (!isMountedRef.current || requestIdRef.current !== currentId) return;
				const normalized = normalizeDashboardPayload(res.data, userRef.current);
				setDashboardData(normalized);
			} catch (err) {
				if (
					err.name === "CanceledError" ||
					err.name === "AbortError" ||
					!isMountedRef.current ||
					requestIdRef.current !== currentId
				) {
					return;
				}
				console.error("Error fetching dashboard stats:", err);
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
			const res = await apiClient.get("/api/dashboard/user");
			if (!isMountedRef.current || requestIdRef.current !== currentId) return;
			const normalized = normalizeDashboardPayload(res.data, userRef.current);
			setDashboardData(normalized);
		} catch (err) {
			if (
				err.name === "CanceledError" ||
				err.name === "AbortError" ||
				!isMountedRef.current ||
				requestIdRef.current !== currentId
			) {
				return;
			}
			console.error("Error fetching dashboard stats:", err);
			setFetchError(formatDashboardError(err));
		} finally {
			if (isMountedRef.current && requestIdRef.current === currentId) {
				setLoading(false);
			}
		}
	};

	if (loading) {
		return (
			<div className="page-shell flex flex-col justify-center items-center h-screen text-app">
				<div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
				<span className="text-sm font-medium text-muted mt-3">
					Compiling learning metrics...
				</span>
			</div>
		);
	}

	if (fetchError || !dashboardData) {
		return (
			<div className="page-shell flex flex-col justify-center items-center h-screen text-app p-4 text-center">
				<div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl max-w-md w-full space-y-4">
					<div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center mx-auto">
						<Flame size={24} />
					</div>
					<div>
						<h3 className="text-base font-bold text-app font-outfit">Unable to load dashboard</h3>
						<p className="text-xs text-muted mt-1 leading-relaxed">
							{fetchError || "The learning metrics service did not return valid data. Please try again."}
						</p>
					</div>
					<button
						type="button"
						onClick={fetchDashboardStats}
						className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
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
		timezone = 'Asia/Kolkata',
	} = dashboardData;
	const currentUser = dashboardData.user || user || {};
	const followersCount = stats?.followersCount ?? currentUser.followersCount ?? 0;
	const followingCount = stats?.followingCount ?? currentUser.followingCount ?? 0;

	const getCertificateVerifyUrl = (certificate) =>
		`${API_BASE_URL}/api/certificates/verify/${certificate.uniqueId}`;

	// Bar Chart configuration (ultra responsive)
	const chartData = {
		labels: charts?.labels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
		datasets: [
			{
				label: "As Mentor (Hours taught)",
				data: charts?.mentorData || [0, 0, 0, 0, 0, 0],
				backgroundColor: "#3b82f6",
				borderRadius: 6,
			},
			{
				label: "As Learner (Hours learned)",
				data: charts?.learnerData || [0, 0, 0, 0, 0, 0],
				backgroundColor: "#8b5cf6",
				borderRadius: 6,
			},
		],
	};

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: "top",
				labels: { color: "#94a3b8", font: { family: "Inter", size: 11 } },
			},
		},
		scales: {
			x: {
				grid: { color: "rgba(128,128,128,0.1)" },
				ticks: { color: "#64748b", font: { size: 10 } },
			},
			y: {
				grid: { color: "rgba(128,128,128,0.1)" },
				ticks: { color: "#64748b", stepSize: 1, font: { size: 10 } },
			},
		},
	};

	return (
		<div className="page-shell space-y-8 overflow-y-auto relative z-0">
			{/* Subtle Fixed Ambient Light Orbs on Viewport */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
				{/* Glowing Blue Light Orb - Top Left */}
				<div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-blue-500/20 via-cyan-500/12 to-transparent blur-[120px]" />

				{/* Glowing Indigo/Purple Light Orb - Top Right */}
				<div className="absolute top-10 -right-32 w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-indigo-500/20 via-purple-600/12 to-transparent blur-[130px]" />

				{/* Glowing Red/Rose Light Orb - Middle Right */}
				<div className="absolute top-[40%] -right-24 w-[480px] h-[480px] rounded-full bg-gradient-to-l from-rose-500/15 via-pink-500/10 to-transparent blur-[115px]" />

				{/* Glowing Emerald/Cyan Light Orb - Bottom Left */}
				<div className="absolute bottom-10 -left-24 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent blur-[120px]" />

				{/* Glowing Amber Gold Light Orb - Platform Badges Focus */}
				<div className="absolute top-[62%] left-1/4 w-[650px] h-[400px] rounded-full bg-gradient-to-r from-amber-500/15 via-yellow-400/10 to-transparent blur-[135px]" />
			</div>
			{/* Professional User Profile Summary Card */}
			<div className="bg-white dark:bg-[#22242a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">

				{/* Cover Banner */}
				<div
					className="h-36 sm:h-44 w-full bg-slate-200 dark:bg-slate-800 relative bg-cover bg-center"
					style={currentUser.coverImage ? { backgroundImage: `url(${optimizeCloudinaryUrl(currentUser.coverImage, { width: 1200, crop: 'fill' })})` } : {}}
				>
					<div className="absolute inset-0 bg-black/5 dark:bg-black/20" />
				</div>

				{/* Card Body with Overlapping Rounded Avatar */}
				<div className="relative z-10 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
					<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
						<div className="flex items-end gap-3 sm:gap-5 min-w-0">
							<Link to={`/profile/${currentUser.username || currentUser._id}`} className="group relative -mt-12 sm:-mt-16 shrink-0 z-20">
								<Avatar className="w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-slate-100 dark:bg-slate-800 shadow-2xl border-4 border-white dark:border-[#22242a] group-hover:scale-105 transition-transform">
									<AvatarImage
										src={optimizeCloudinaryUrl(currentUser.profileImage, { width: 288, height: 288, crop: 'fill', gravity: 'face' })}
										alt={currentUser.name || "Member"}
										className="object-cover"
										width={144}
										height={144}
									/>
									<AvatarFallback className="text-xl sm:text-2xl font-bold">
										{currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
									</AvatarFallback>
								</Avatar>
							</Link>
							<div className="min-w-0 flex-1 pt-1 sm:pt-0 sm:mb-1">
								<div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
									<Link to={`/profile/${currentUser.username || currentUser._id}`} className="hover:underline min-w-0">
										<h1 className="text-lg sm:text-2xl font-extrabold text-app font-outfit tracking-tight truncate">
											{currentUser.name}
										</h1>
									</Link>
									<span className="text-[11px] sm:text-xs text-muted font-normal shrink-0">
										• {currentUser.experienceLevel || 'Learner'}
									</span>
									{currentUser.role === 'Admin' && (
										<Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10">
											Admin
										</Badge>
									)}
								</div>
								<p className="text-xs sm:text-sm text-muted font-mono truncate mt-0.5">
									@{currentUser.username || 'username'}
								</p>
							</div>
						</div>

						{/* Clean Professional Action Button */}
						<Link
							to={`/profile/${currentUser.username || currentUser._id}`}
							className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl !bg-white dark:!bg-slate-800 hover:!bg-slate-50 dark:hover:!bg-slate-700/80 !text-slate-900 dark:!text-white border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-sm hover:shadow active:scale-[0.98] shrink-0 self-start sm:self-end"
						>
							<span>View Full Profile</span>
							<ArrowRight size={13} className="text-slate-500" />
						</Link>
					</div>

					{/* Bio & Quick Stats */}
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
						<p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
							{currentUser.bio || "Add a bio to showcase your skills, learning targets, and project interests to peers."}
						</p>

						<div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-3 text-xs font-semibold w-full sm:w-auto shrink-0">
							<div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center sm:text-left">
								<span className="font-extrabold text-app font-mono text-xs sm:text-sm">{followersCount}</span>
								<span className="text-muted text-[10px] sm:text-[11px]">Followers</span>
							</div>
							<div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center sm:text-left">
								<span className="font-extrabold text-app font-mono text-xs sm:text-sm">{followingCount}</span>
								<span className="text-muted text-[10px] sm:text-[11px]">Following</span>
							</div>
							<div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-center sm:text-left">
								<span className="font-extrabold font-mono text-xs sm:text-sm">🏆 {stats.points || 0}</span>
								<span className="text-[10px] sm:text-[11px]">Points</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Grid of stats cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{[
					{
						label: "Platform Points",
						value: stats.points,
						sub: "Daily bonus & session gains",
						icon: Trophy,
						color: "text-amber-400 bg-amber-400/10 border-amber-500/20",
					},
					{
						label: "Completed Sessions",
						value: stats.completedSessions,
						sub: "Exchanged & certified",
						icon: CheckCircle,
						color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20",
					},
					{
						label: "Active Roadmaps",
						value: roadmaps.length,
						sub: "AI curriculums tracked",
						icon: BookOpen,
						color: "text-indigo-400 bg-indigo-400/10 border-indigo-500/20",
					},
					{
						label: "Learning Hours",
						value: `${stats.learningHours} hrs`,
						sub: "Total exchanged learning time",
						icon: Hourglass,
						color: "text-purple-400 bg-purple-400/10 border-purple-500/20",
					},
				].map((card, i) => {
					const Icon = card.icon;
					return (
						<div
							key={i}
							className={`glass-panel p-5 rounded-3xl flex flex-col justify-between border-slate-200 dark:border-slate-800/60 relative overflow-hidden group interactive-card animate-card-enter stagger-${i + 1}`}>
							<div className="flex justify-between items-start">
								<div>
									<span className="text-xs text-muted font-semibold">
										{card.label}
									</span>
									<h2 className="text-2xl font-bold text-app tracking-tight mt-1">
										{card.value}
									</h2>
								</div>
								<div
									className={`p-2.5 rounded-xl border ${card.color}`}>
									<Icon size={20} />
								</div>
							</div>
							<span className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-none truncate">
								{card.sub}
							</span>
						</div>
					);
				})}
			</div>

			{/* Main split sections */}
			<ScrollReveal direction="up" distance={20} duration={0.45}>
			<div className="space-y-6">
				{/* Row 1: Heatmap (Left 2 cols) & My AI Learning Roadmaps (Right 1 col) */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
					{/* Left Column - Learning Progress Heatmap */}
					<div className="lg:col-span-2 flex flex-col min-w-0">
						<div className="glass-panel p-6 rounded-3xl space-y-4 flex-1 flex flex-col justify-between">
							<div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
								<div>
									<h2 className="font-bold text-lg text-app font-outfit">
										Learning Exchange Progress
									</h2>
									<p className="text-xs text-slate-400">
										Timelines tracking hours exchanged
									</p>
								</div>
								<SlidingSegment
									ariaLabel="Learning progress view"
									value={progressViewMode}
									onChange={setProgressViewMode}
									options={[{ value: 'heatmap', label: 'Heatmap' }, { value: 'barchart', label: 'Chart' }]}
									className="rounded-xl bg-slate-100 dark:bg-slate-800/60"
									buttonClassName="px-2.5 py-1 text-xs"
								/>
							</div>
							<div key={progressViewMode} className="w-full min-h-[220px] flex items-center justify-center pt-1 content-switch-motion">
								{progressViewMode === 'heatmap' ? (
									<SkillActivityHeatmap
										user={currentUser}
										stats={stats}
										activityMap={activityHeatmap || charts?.activityMap || {}}
										timeZone={timezone || currentUser?.timezone || 'Asia/Kolkata'}
									/>
								) : (
									<React.Suspense fallback={<div className="w-full h-48 flex items-center justify-center text-xs text-muted">Loading chart...</div>}>
										<ActivityBarChart chartData={chartData} chartOptions={chartOptions} />
									</React.Suspense>
								)}
							</div>
						</div>
					</div>

					{/* Right Column - Active Roadmaps Card */}
					<div className="flex flex-col min-w-0">
						<div className="glass-panel p-6 rounded-3xl space-y-4 flex-1 flex flex-col justify-between h-full">
							<h2 className="font-bold text-lg text-app font-outfit">
								My AI Learning Roadmaps
							</h2>
							{roadmaps.length === 0 ? (
								<div className="flex-1 flex items-center justify-center p-6 text-center text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
									No active roadmap tracking yet. Go to AI Roadmap in the sidebar to generate one!
								</div>
							) : (
								<div className="flex-1 overflow-y-auto scrollbar-none space-y-3 pr-1 max-h-[200px]">
									{roadmaps.map((map) => (
										<div
											key={map._id}
											className="p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
											<div className="min-w-0 pr-2">
												<h4 className="font-semibold text-xs text-app truncate">
													{map.topic}
												</h4>
												<p className="text-[10px] text-slate-400 mt-0.5">
													Curriculum progress
												</p>
											</div>
											<div className="flex items-center gap-2 shrink-0">
												<div className="w-16 sm:w-20 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
													<div
														className="bg-indigo-500 h-full rounded-full"
														style={{
															width: `${map.progress}%`,
														}}
													/>
												</div>
												<span className="text-[10px] font-bold text-app">
													{map.progress}%
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Row 2: Badges (Left 2 cols) & Certificates (Right 1 col) */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
					{/* Left Column - Platform Badges Locker */}
					<div className="lg:col-span-2 flex flex-col min-w-0">
						<React.Suspense
							fallback={
								<div className="glass-panel p-6 rounded-3xl flex items-center justify-center min-h-[220px]">
									<div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
								</div>
							}
						>
							<PlatformBadges user={currentUser} badges={badges} badgeProgress={badgeProgress} className="flex-1" />
						</React.Suspense>
					</div>

					{/* Right Column - Certificates Card */}
					<div className="flex flex-col min-w-0">
						<div className="glass-panel p-6 rounded-3xl space-y-4 flex-1 flex flex-col justify-between">
							<h3 className="font-bold text-lg text-app font-outfit flex items-center gap-2">
								<FileText size={18} className="text-blue-400" />{" "}
								Certificates ({certificates.length})
							</h3>
							{certificates.length === 0 ? (
								<div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
									<Award size={28} className="text-slate-300 dark:text-slate-700" />
									<div>
										<p className="text-xs font-semibold text-app">Earn your first certificate</p>
										<p className="text-[10px] text-muted mt-0.5">Complete a 60+ min session as mentor or learner.</p>
									</div>
									<Link to="/bookings" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors">Book a Session</Link>
								</div>
							) : (
								<div className="flex-1 overflow-y-auto scrollbar-none space-y-3 pr-1 max-h-[300px]">
									{certificates.map((certificate) => (
										<div
											key={certificate._id}
											className="rounded-2xl border border-slate-200 dark:border-slate-850 p-3 bg-slate-50/50 dark:bg-slate-900/30">
											<div className="flex items-start gap-3">
												{certificate.verificationQrCode ? (
													<a
														href={getCertificateVerifyUrl(certificate)}
														target="_blank"
														rel="noreferrer"
														className="shrink-0"
														title="Open certificate verification">
														<img
															src={
																certificate.verificationQrCode
															}
															alt="Certificate QR"
															className="h-12 w-12 rounded-lg bg-white p-1"
														/>
													</a>
												) : (
													<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800 text-slate-500">
														<QrCode size={20} />
													</div>
												)}
												<div className="min-w-0">
													<a
														href={getCertificateVerifyUrl(certificate)}
														target="_blank"
														rel="noreferrer"
														className="text-xs font-bold text-app hover:text-blue-500">
														{certificate.skill?.name ||
															"Skill Certificate"}
													</a>
													<p className="mt-1 text-[10px] text-slate-500">
														Issued{" "}
														{new Date(
															certificate.issueDate,
														).toLocaleDateString()}
													</p>
													<p className="mt-1 break-all text-[9px] font-mono text-slate-500">
														{certificate.uniqueId}
													</p>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
			</ScrollReveal>

			<footer className="flex min-h-screen items-center justify-center border-t border-slate-200 pt-10">
				<div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
					{/* Top Section */}
					<div className="grid grid-cols-1 md:grid-cols-12 gap-y-10 mb-20">
						{/* Left */}
						<div className="md:col-span-4">
							<h3 className="text-4xl font-medium leading-tight">
								Experience liftoff
							</h3>
						</div>

						{/* Right links */}
						<div className="md:col-span-3 md:col-start-8">
							<nav className="flex flex-col gap-4">
								<Link
									to="/skills"
									className="text-lg hover:translate-x-1 transition-all">
									Browse Skills
								</Link>

								<Link
									to="/feed"
									className="text-lg hover:translate-x-1 transition-all">
									Daily Feed
								</Link>

								<Link
									to="/chat"
									className="text-lg hover:translate-x-1 transition-all">
									Chat
								</Link>

								<Link
									to="/bookings"
									className="text-lg hover:translate-x-1 transition-all">
									Bookings
								</Link>

								<Link
									to="/groups"
									className="text-lg hover:translate-x-1 transition-all">
									Study Groups
								</Link>
							</nav>
						</div>

						<div className="md:col-span-2">
							<nav className="flex flex-col gap-4">
								<Link
									to="/roadmap"
									className="text-lg hover:translate-x-1 transition-all">
									AI Roadmap
								</Link>

								<Link
									to="/suggested-users"
									className="text-lg hover:translate-x-1 transition-all">
									Suggested Peers
								</Link>
							</nav>
						</div>
					</div>

					{/* Huge Text */}
					<div className="mb-16 overflow-hidden flex justify-center">
						<h1 className="text-center text-[4rem] sm:text-[7rem] md:text-[10rem] lg:text-[12rem] font-black font-bold tracking-wide leading-none w-full">
							Orbitus
						</h1>
					</div>
					<nav className="flex flex-wrap justify-center gap-8 mt-5 md:mt-0">
						<Link
							to="/"
							className="text-sm text-slate-600 hover:text-black">
							About
						</Link>

						<Link
							to="/"
							className="text-sm text-slate-600 hover:text-black">
							Privacy
						</Link>

						<Link
							to="/"
							className="text-sm text-slate-600 hover:text-black">
							Terms
						</Link>

						<Link
							to="/"
							className="text-sm text-slate-600 hover:text-black">
							Manage Cookies
						</Link>
					</nav>
				</div>
			</footer>

			</div>
	);
};

export default UserDashboard;

