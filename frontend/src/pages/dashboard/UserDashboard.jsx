import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { updateProfileSuccess } from "../../features/authSlice.js";
import apiClient from "../../services/apiClient.js";
import {
	Trophy,
	BookOpen,
	Calendar,
	Hourglass,
	Sparkles,
	Award,
	Edit2,
	CheckCircle,
	Briefcase,
	ExternalLink,
	ChevronRight,
	TrendingUp,
	Plus,
	Trash2,
	FileText,
	Lock,
	BadgeCheck,
	QrCode,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
);

const UserDashboard = () => {
	const { user, token } = useSelector((state) => state.auth);
	const dispatch = useDispatch();

	const [dashboardData, setDashboardData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [matchingSuggestions, setMatchingSuggestions] = useState({
		mentors: [],
		learners: [],
	});
	const [showEditModal, setShowEditModal] = useState(false);

	// Profile edit fields
	const [editName, setEditName] = useState("");
	const [editUsername, setEditUsername] = useState("");
	const [editAvatar, setEditAvatar] = useState("");
	const [editBio, setEditBio] = useState("");
	const [editExp, setEditExp] = useState("Mid");
	const [editEducation, setEditEducation] = useState([
		{ degree: "", institution: "", year: "" },
	]);
	const [editInterests, setEditInterests] = useState("");
	const [editLinkedIn, setEditLinkedIn] = useState("");
	const [editGitHub, setEditGitHub] = useState("");
	const [editWebsite, setEditWebsite] = useState("");
	const [editExtraLinks, setEditExtraLinks] = useState([
		{ label: "", url: "" },
	]);
	const [editProjects, setEditProjects] = useState([
		{
			title: "",
			description: "",
			githubUrl: "",
			liveUrl: "",
			featured: true,
		},
	]);
	const [resumeUploading, setResumeUploading] = useState(false);
	const [resumeFile, setResumeFile] = useState("");
	const [profileError, setProfileError] = useState("");

	useEffect(() => {
		fetchDashboardStats();
		fetchAiSuggestions();
	}, [token]);

	const fetchDashboardStats = async () => {
		try {
			const res = await apiClient.get("/api/dashboard/user");
			setDashboardData(res.data);

			// Initialize edit fields
			if (user) {
				setEditName(user.name);
				setEditUsername(user.username || "");
				setEditAvatar(user.profileImage || "");
				setEditBio(user.bio || "");
				setEditExp(user.experienceLevel || "Mid");
				setEditEducation(
					Array.isArray(user.education) && user.education.length > 0
						? user.education
						: [
								{
									degree:
										typeof user.education === "string"
											? user.education
											: "",
									institution: "",
									year: "",
								},
							],
				);
				setEditInterests(user.interests?.join(", ") || "");
				setEditLinkedIn(user.socialLinks?.linkedin || "");
				setEditGitHub(user.socialLinks?.github || "");
				setEditWebsite(user.socialLinks?.website || "");
				setEditExtraLinks(
					user.socialLinks?.extra?.length
						? user.socialLinks.extra
						: [{ label: "", url: "" }],
				);
				setEditProjects(
					user.projects?.length
						? user.projects
						: [
								{
									title: "",
									description: "",
									githubUrl: "",
									liveUrl: "",
									featured: true,
								},
							],
				);
				setResumeFile(user.resumeFile || "");
			}
		} catch (err) {
			console.error("Error fetching dashboard stats:", err);
		} finally {
			setLoading(false);
		}
	};

	const fetchAiSuggestions = async () => {
		try {
			const res = await apiClient.get("/api/ai/match");
			setMatchingSuggestions(res.data);
		} catch (err) {
			console.error("Error fetching AI suggestions:", err);
		}
	};

	const handleEditProfileSubmit = async (e) => {
		e.preventDefault();
		setProfileError("");
		try {
			const res = await apiClient.put(
				"/api/users/profile",
				{
					name: editName,
					username: editUsername,
					profileImage: editAvatar,
					bio: editBio,
					experienceLevel: editExp,
					education: editEducation.filter(
						(item) => item.degree || item.institution || item.year,
					),
					interests: editInterests
						.split(",")
						.map((i) => i.trim())
						.filter(Boolean),
					resumeFile,
					projects: editProjects.filter(
						(project) =>
							project.title ||
							project.githubUrl ||
							project.liveUrl,
					),
					socialLinks: {
						linkedin: editLinkedIn,
						github: editGitHub,
						website: editWebsite,
						extra: editExtraLinks.filter(
							(link) => link.label || link.url,
						),
					},
				}
			);

			dispatch(updateProfileSuccess(res.data.user));
			setShowEditModal(false);
			fetchDashboardStats();
		} catch (err) {
			console.error("Error updating profile:", err);
			setProfileError(
				err.response?.data?.message ||
					"Profile update failed. Please try again.",
			);
		}
	};

	const uploadResume = async (file) => {
		if (!file) return;

		setResumeUploading(true);
		try {
			const formData = new window.FormData();
			formData.append("resume", file);
			const res = await apiClient.post(
				"/api/users/profile/resume",
				formData,
				{
					headers: { "Content-Type": "multipart/form-data" }
				}
			);
			setResumeFile(res.data.resumeFile);
			dispatch(updateProfileSuccess(res.data.user));
		} catch (err) {
			console.error("Error uploading resume:", err);
		} finally {
			setResumeUploading(false);
		}
	};

	const updateEducationRow = (index, field, value) => {
		setEditEducation((prev) =>
			prev.map((item, itemIndex) =>
				itemIndex === index ? { ...item, [field]: value } : item,
			),
		);
	};

	const updateExtraLink = (index, field, value) => {
		setEditExtraLinks((prev) =>
			prev.map((item, itemIndex) =>
				itemIndex === index ? { ...item, [field]: value } : item,
			),
		);
	};

	const updateProject = (index, field, value) => {
		setEditProjects((prev) =>
			prev.map((item, itemIndex) =>
				itemIndex === index ? { ...item, [field]: value } : item,
			),
		);
	};

	if (loading || !dashboardData) {
		return (
			<div className="flex-1 p-8 space-y-6 flex flex-col justify-center items-center h-screen bg-slate-950 text-slate-100">
				<div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
				<span className="text-sm font-medium text-slate-400">
					Compiling learning metrics...
				</span>
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
	} = dashboardData;
	const avatarSeeds = [
		"Nova",
		"Orbit",
		"Pixel",
		"Aster",
		"Lumen",
		"Echo",
		user.name || "Orbitus",
	];
	const avatarOptions = avatarSeeds.map(
		(seed) =>
			`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`,
	);
	const usernameAvailableAt = user.usernameChangeAvailableAt
		? new Date(user.usernameChangeAvailableAt)
		: null;
	const usernameLocked =
		usernameAvailableAt && usernameAvailableAt.getTime() > Date.now();

	// Chart configuration
	const chartData = {
		labels: charts?.labels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
		datasets: [
			{
				label: "As Mentor (Hours taught)",
				data: charts?.mentorData || [0, 0, 0, 0, 0, 0],
				borderColor: "#818cf8",
				backgroundColor: "rgba(129, 140, 248, 0.1)",
				tension: 0.4,
				fill: true,
			},
			{
				label: "As Learner (Hours learned)",
				data: charts?.learnerData || [0, 0, 0, 0, 0, 0],
				borderColor: "#c084fc",
				backgroundColor: "rgba(192, 132, 252, 0.1)",
				tension: 0.4,
				fill: true,
			},
		],
	};

	const chartOptions = {
		responsive: true,
		plugins: {
			legend: {
				position: "top",
				labels: { color: "#94a3b8", font: { family: "Inter" } },
			},
		},
		scales: {
			x: {
				grid: { color: "rgba(255,255,255,0.03)" },
				ticks: { color: "#64748b" },
			},
			y: {
				grid: { color: "rgba(255,255,255,0.03)" },
				ticks: { color: "#64748b", stepSize: 1 },
			},
		},
	};

	return (
		<div className="flex-1 p-6 lg:p-8 space-y-8 bg-slate-950 min-h-screen text-slate-200 overflow-y-auto">
			{/* Welcome Header banner */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900/60 to-indigo-950/20 p-6 rounded-3xl border border-indigo-900/20 backdrop-blur-md">
				<div className="flex items-center gap-4">
					<img
						src={user.profileImage}
						alt={user.name}
						className="w-16 h-16 rounded-2xl bg-slate-800 shadow-xl border border-indigo-500/20"
					/>
					<div>
						<h1 className="text-2xl lg:text-3xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
							Hello, {user.name}{" "}
							<span className="animate-wave text-xl">👋</span>
						</h1>
						<p className="text-sm text-slate-400 mt-1 max-w-full md:max-w-lg break-words line-clamp-2 sm:line-clamp-3">
							@{user.username || "username"} • {user.followersCount || 0} followers • {user.followingCount || 0} following
						</p>
						<p className="text-sm text-slate-400 mt-1 max-w-full md:max-w-lg break-words line-clamp-2 sm:line-clamp-3">
							{user.bio ||
								"Add a bio to tell matches what you are working on!"}
						</p>
					</div>
				</div>
				<button
					onClick={() => setShowEditModal(true)}
					className="profile-edit-button flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 font-semibold transition-all active:scale-[0.98]">
					<Edit2 size={16} />
					<span>Edit Profile</span>
				</button>
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
							className="glass-panel p-5 rounded-3xl flex flex-col justify-between border-slate-800/60 relative overflow-hidden group">
							<div className="flex justify-between items-start">
								<div>
									<span className="text-xs text-slate-400 font-semibold">
										{card.label}
									</span>
									<h3 className="text-2xl font-bold text-white tracking-tight mt-1">
										{card.value}
									</h3>
								</div>
								<div
									className={`p-2.5 rounded-xl border ${card.color}`}>
									<Icon size={20} />
								</div>
							</div>
							<span className="text-[10px] text-slate-500 mt-4 leading-none truncate">
								{card.sub}
							</span>
						</div>
					);
				})}
			</div>

			{/* Main split sections */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column - Learning Progress Chart */}
				<div className="lg:col-span-2 space-y-6">
					<div className="glass-panel p-6 rounded-3xl space-y-4">
						<div className="flex justify-between items-center">
							<div>
								<h3 className="font-bold text-lg text-slate-100 font-outfit">
									Learning Exchange Progress
								</h3>
								<p className="text-xs text-slate-400">
									Timelines tracking hours exchanged
								</p>
							</div>
							<span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
								<TrendingUp size={14} /> Stable Exchange
							</span>
						</div>
						<div className="w-full">
							<Line data={chartData} options={chartOptions} />
						</div>
					</div>

					{/* Active Roadmaps Card */}
					<div className="glass-panel p-6 rounded-3xl space-y-4">
						<h3 className="font-bold text-lg text-slate-100 font-outfit">
							My AI Learning Roadmaps
						</h3>
						{roadmaps.length === 0 ? (
							<div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
								No active roadmap tracking yet. Go to AI Roadmap
								in the sidebar to generate one!
							</div>
						) : (
							<div className="max-h-96 space-y-3 overflow-y-auto pr-2">
								{roadmaps.map((map) => (
									<div
										key={map._id}
										className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center justify-between">
										<div>
											<h4 className="font-semibold text-sm text-slate-200">
												{map.topic}
											</h4>
											<p className="text-xs text-slate-400 mt-1">
												Curriculum progress checklist
											</p>
										</div>
										<div className="flex items-center gap-3">
											<div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
												<div
													className="bg-indigo-500 h-full rounded-full"
													style={{
														width: `${map.progress}%`,
													}}
												/>
											</div>
											<span className="text-xs font-bold text-slate-300">
												{map.progress}%
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Right Column - AI Recommendations & Badges */}
				<div className="space-y-6">
					{/* AI Suggestions matches */}
					<div className="glass-panel p-6 rounded-3xl space-y-4">
						<div className="flex justify-between items-center">
							<h3 className="font-bold text-lg text-slate-100 font-outfit flex items-center gap-2">
								<Sparkles
									size={18}
									className="text-indigo-400"
								/>{" "}
								AI Matches
							</h3>
							<Link
								to="/ai-match"
								className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center">
								View All <ChevronRight size={14} />
							</Link>
						</div>

						{matchingSuggestions.mentors.length === 0 &&
						matchingSuggestions.learners.length === 0 ? (
							<div className="p-4 text-center text-slate-500 text-sm">
								Complete your profile skills to get matching
								suggested mentors!
							</div>
						) : (
							<div className="space-y-4">
								{/* Mentor Suggs */}
								<div>
									<h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">
										Recommended Mentors
									</h4>
									<div className="space-y-2">
										{matchingSuggestions.mentors
											.slice(0, 2)
											.map((match, idx) => (
												<div
													key={idx}
													className="flex items-center justify-between p-2.5 rounded-2xl bg-indigo-900/10 border border-indigo-900/20">
													<div className="flex items-center gap-2.5">
														<img
															src={
																match.user
																	.profileImage
															}
															alt={
																match.user.name
															}
															className="w-9 h-9 rounded-xl bg-slate-800"
														/>
														<div className="min-w-0">
															<p className="text-xs font-semibold text-slate-200 truncate">
																{
																	match.user
																		.name
																}
															</p>
															<p className="text-[10px] text-slate-400 truncate">
																Teaches:{" "}
																{
																	match.user
																		.skillsTeach[0]
																		?.skill
																		.name
																}
															</p>
														</div>
													</div>
													<span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
														{match.matchScore}%
														Match
													</span>
												</div>
											))}
									</div>
								</div>

								{/* Learner Suggs */}
								<div>
									<h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">
										Recommended Learners
									</h4>
									<div className="space-y-2">
										{matchingSuggestions.learners
											.slice(0, 2)
											.map((match, idx) => (
												<div
													key={idx}
													className="flex items-center justify-between p-2.5 rounded-2xl bg-purple-900/10 border border-purple-900/20">
													<div className="flex items-center gap-2.5">
														<img
															src={
																match.user
																	.profileImage
															}
															alt={
																match.user.name
															}
															className="w-9 h-9 rounded-xl bg-slate-800"
														/>
														<div className="min-w-0">
															<p className="text-xs font-semibold text-slate-200 truncate">
																{
																	match.user
																		.name
																}
															</p>
															<p className="text-[10px] text-slate-400 truncate">
																Wants:{" "}
																{
																	match.user
																		.skillsLearn[0]
																		?.skill
																		.name
																}
															</p>
														</div>
													</div>
													<span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
														{match.matchScore}%
														Match
													</span>
												</div>
											))}
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Gamification Badges locker */}
					<div className="glass-panel p-6 rounded-3xl space-y-4">
						<h3 className="font-bold text-lg text-slate-100 font-outfit flex items-center gap-2">
							<Award size={18} className="text-purple-400" />{" "}
							Unlocked Badges ({badges.length})
						</h3>
						<div className="space-y-3">
							{(badgeProgress.length
								? badgeProgress
								: badges.map((badge) => ({
										...badge,
										unlocked: true,
										progress: 100,
										description: "Unlocked achievement",
									}))
							).map((badge, idx) => (
								<div
									key={badge.name || idx}
									className={`rounded-2xl border p-3 ${badge.unlocked ? "border-emerald-500/30 bg-emerald-500/10" : "border-slate-850 bg-slate-900/30"}`}>
									<div className="flex items-start gap-3">
										<div
											className={`flex h-9 w-9 items-center justify-center rounded-xl ${badge.unlocked ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-500"}`}>
											{badge.unlocked ? (
												<BadgeCheck size={18} />
											) : (
												<Lock size={18} />
											)}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between gap-2">
												<p className="truncate text-xs font-extrabold text-slate-100">
													{badge.name}
												</p>
												<span className="text-[10px] font-bold text-slate-500">
													{badge.progress || 0}%
												</span>
											</div>
											<p className="mt-1 text-[10px] leading-4 text-slate-500">
												{badge.description}
											</p>
											<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
												<div
													className={`h-full rounded-full ${badge.unlocked ? "bg-emerald-500" : "bg-indigo-500"}`}
													style={{
														width: `${badge.progress || 0}%`,
													}}
												/>
											</div>
											<p className="mt-1 text-[9px] text-slate-500">
												{badge.unlocked
													? `Unlocked ${new Date(badge.unlockedAt).toLocaleDateString()}`
													: `${badge.current || 0}/${badge.target || 1} complete`}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="glass-panel p-6 rounded-3xl space-y-4">
						<h3 className="font-bold text-lg text-slate-100 font-outfit flex items-center gap-2">
							<FileText size={18} className="text-blue-400" />{" "}
							Certificates ({certificates.length})
						</h3>
						{certificates.length === 0 ? (
							<div className="p-4 text-center text-slate-500 text-sm">
								Complete a 60+ minute learning session to
								generate a verified skill certificate.
							</div>
						) : (
							<div className="space-y-3">
								{certificates.map((certificate) => (
									<div
										key={certificate._id}
										className="rounded-2xl border border-slate-850 p-3">
										<div className="flex items-start gap-3">
											{certificate.verificationQrCode ? (
												<img
													src={
														certificate.verificationQrCode
													}
													alt="Certificate QR"
													className="h-12 w-12 rounded-lg bg-white p-1"
												/>
											) : (
												<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800 text-slate-500">
													<QrCode size={20} />
												</div>
											)}
											<div className="min-w-0">
												<p className="text-xs font-bold text-slate-100">
													{certificate.skill?.name ||
														"Skill Certificate"}
												</p>
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
									to="/resume"
									className="text-lg hover:translate-x-1 transition-all">
									Resume
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
									to="/ai-match"
									className="text-lg hover:translate-x-1 transition-all">
									AI Match
								</Link>

								<Link
									to="/interview"
									className="text-lg hover:translate-x-1 transition-all">
									AI Interview
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

			{/* Edit Profile Modal */}
			{showEditModal && (
				<div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="w-full max-w-full sm:max-w-2/3 glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center border-b border-slate-800 pb-3">
							<h3 className="font-bold text-lg text-slate-200">
								Modify Exchange Profile
							</h3>
							<button
								onClick={() => setShowEditModal(false)}
								className="text-slate-400 hover:text-white">
								✕
							</button>
						</div>

						<form
							onSubmit={handleEditProfileSubmit}
							className="space-y-4">
							<div className="space-y-3">
								<label className="text-xs font-semibold text-slate-400 uppercase">
									Profile Avatar
								</label>
								<div className="flex flex-col items-center gap-3">
									<img
										src={editAvatar || user.profileImage}
										alt="Selected avatar"
										className="w-50 h-50 rounded-2xl bg-slate-900 border border-slate-800"
									/>
									<input
										type="url"
										value={editAvatar}
										onChange={(e) =>
											setEditAvatar(e.target.value)
										}
										placeholder="Paste image URL or select below"
										className="w-full sm:w-lg max-w-full flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 outline-none"
									/>
								</div>
								<div className="grid grid-cols-7 gap-2">
									{avatarOptions.map((avatarUrl) => (
										<button
											key={avatarUrl}
											type="button"
											onClick={() =>
												setEditAvatar(avatarUrl)
											}
											className={`rounded-2xl border p-1 transition-all ${
												editAvatar === avatarUrl
													? "border-indigo-400 bg-indigo-500/10"
													: "border-slate-800 bg-slate-900 hover:border-slate-600"
											}`}>
											<img
												src={avatarUrl}
												alt=""
												className="w-full aspect-square rounded-xl"
											/>
										</button>
									))}
								</div>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-400 uppercase">
									My Name
								</label>
								<input
									type="text"
									required
									value={editName}
									onChange={(e) =>
										setEditName(e.target.value)
									}
									className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 outline-none"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-400 uppercase">
									Unique Username
								</label>
								<input
									type="text"
									required
									disabled={usernameLocked}
									value={editUsername}
									onChange={(e) =>
										setEditUsername(
											e.target.value
												.toLowerCase()
												.replace(/[^a-z0-9_]/g, ""),
										)
									}
									className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 outline-none disabled:cursor-not-allowed disabled:opacity-60"
								/>
								<p className="text-xs text-slate-500">
									{usernameLocked
										? `Username can be changed after ${usernameAvailableAt.toLocaleString()}.`
										: "After changing your username, it stays locked for 7 days."}
								</p>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-400 uppercase">
									Bio / Purpose
								</label>
								<textarea
									value={editBio}
									onChange={(e) => setEditBio(e.target.value)}
									rows={2}
									className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 outline-none"
								/>
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-slate-400 uppercase">
										Experience Level
									</label>
									<select
										value={editExp}
										onChange={(e) =>
											setEditExp(e.target.value)
										}
										className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 outline-none">
										<option value="Junior">Fresher</option>
										<option value="Junior">Junior</option>
										<option value="Mid">Mid</option>
										<option value="Senior">Senior</option>
										<option value="Lead">Lead</option>
									</select>
								</div>
							</div>

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<label className="text-xs font-semibold text-slate-400 uppercase">
										Education Qualifications
									</label>
									<button
										type="button"
										onClick={() =>
											setEditEducation((prev) => [
												...prev,
												{
													degree: "",
													institution: "",
													year: "",
												},
											])
										}
										className="btn-secondary min-h-0 px-3 py-1.5 text-xs">
										<Plus size={13} /> Add
									</button>
								</div>
								{editEducation.map((item, index) => (
									<div
										key={index}
										className="grid grid-cols-1 gap-2 rounded-xl border border-slate-800 p-3 md:grid-cols-[1fr_1fr_110px_auto]">
										<input
											value={item.degree || ""}
											onChange={(e) =>
												updateEducationRow(
													index,
													"degree",
													e.target.value,
												)
											}
											placeholder="Degree / qualification"
											className="field-input px-3 py-2 text-sm"
										/>
										<input
											value={item.institution || ""}
											onChange={(e) =>
												updateEducationRow(
													index,
													"institution",
													e.target.value,
												)
											}
											placeholder="School / college"
											className="field-input px-3 py-2 text-sm"
										/>
										<input
											value={item.year || ""}
											onChange={(e) =>
												updateEducationRow(
													index,
													"year",
													e.target.value,
												)
											}
											placeholder="Year"
											className="field-input px-3 py-2 text-sm"
										/>
										<button
											type="button"
											onClick={() =>
												setEditEducation((prev) =>
													prev.filter(
														(_, rowIndex) =>
															rowIndex !== index,
													),
												)
											}
											className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
											title="Remove education">
											<Trash2 size={15} />
										</button>
									</div>
								))}
							</div>

							<div className="space-y-2 rounded-xl border border-slate-800 p-3">
								<label className="text-xs font-semibold text-slate-400 uppercase">
									Resume
								</label>
								<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
									<input
										type="file"
										accept=".pdf,.doc,.docx"
										onChange={(e) =>
											uploadResume(e.target.files?.[0])
										}
										className="field-input px-3 py-2 text-sm"
									/>
									{resumeFile && (
										<a
											href={resumeFile}
											target="_blank"
											rel="noreferrer"
											className="btn-secondary min-h-0 px-3 py-2 text-xs">
											<FileText size={14} /> View Resume
										</a>
									)}
								</div>
								{resumeUploading && (
									<p className="text-xs text-slate-500">
										Uploading resume...
									</p>
								)}
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-400 uppercase">
									Interest Tags (comma separated)
								</label>
								<input
									type="text"
									value={editInterests}
									onChange={(e) =>
										setEditInterests(e.target.value)
									}
									placeholder="Coding, Design, Fitness"
									className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 outline-none"
								/>
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-slate-400 uppercase">
										LinkedIn Profile Link
									</label>
									<input
										type="url"
										value={editLinkedIn}
										onChange={(e) =>
											setEditLinkedIn(e.target.value)
										}
										className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 outline-none"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-slate-400 uppercase">
										GitHub Profile Link
									</label>
									<input
										type="url"
										value={editGitHub}
										onChange={(e) =>
											setEditGitHub(e.target.value)
										}
										className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 outline-none"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-slate-400 uppercase">
										Website Link
									</label>
									<input
										type="url"
										value={editWebsite}
										onChange={(e) =>
											setEditWebsite(e.target.value)
										}
										className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 outline-none"
									/>
								</div>
							</div>

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<label className="text-xs font-semibold text-slate-400 uppercase">
										Extra Social Links
									</label>
									<button
										type="button"
										onClick={() =>
											setEditExtraLinks((prev) => [
												...prev,
												{ label: "", url: "" },
											])
										}
										className="btn-secondary min-h-0 px-3 py-1.5 text-xs">
										<Plus size={13} /> Add
									</button>
								</div>
								{editExtraLinks.map((link, index) => (
									<div
										key={index}
										className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr_auto]">
										<input
											value={link.label || ""}
											onChange={(e) =>
												updateExtraLink(
													index,
													"label",
													e.target.value,
												)
											}
											placeholder="Platform name"
											className="field-input px-3 py-2 text-sm"
										/>
										<input
											type="url"
											value={link.url || ""}
											onChange={(e) =>
												updateExtraLink(
													index,
													"url",
													e.target.value,
												)
											}
											placeholder="https://..."
											className="field-input px-3 py-2 text-sm"
										/>
										<button
											type="button"
											onClick={() =>
												setEditExtraLinks((prev) =>
													prev.filter(
														(_, rowIndex) =>
															rowIndex !== index,
													),
												)
											}
											className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
											title="Remove link">
											<Trash2 size={15} />
										</button>
									</div>
								))}
							</div>

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<label className="text-xs font-semibold text-slate-400 uppercase">
										Projects To Show On Website
									</label>
									<button
										type="button"
										onClick={() =>
											setEditProjects((prev) => [
												...prev,
												{
													title: "",
													description: "",
													githubUrl: "",
													liveUrl: "",
													featured: true,
												},
											])
										}
										className="btn-secondary min-h-0 px-3 py-1.5 text-xs">
										<Plus size={13} /> Add
									</button>
								</div>
								{editProjects.map((project, index) => (
									<div
										key={index}
										className="space-y-2 rounded-xl border border-slate-800 p-3 mb-6">
										<div className="flex items-center gap-2">
											<input
												value={project.title || ""}
												onChange={(e) =>
													updateProject(
														index,
														"title",
														e.target.value,
													)
												}
												placeholder="Project title"
												className="field-input px-3 py-2 text-sm"
											/>
											<label className="flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-slate-400">
												<input
													type="checkbox"
													checked={
														project.featured !==
														false
													}
													onChange={(e) =>
														updateProject(
															index,
															"featured",
															e.target.checked,
														)
													}
												/>
												Show
											</label>
											<button
												type="button"
												onClick={() =>
													setEditProjects((prev) =>
														prev.filter(
															(_, rowIndex) =>
																rowIndex !==
																index,
														),
													)
												}
												className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
												title="Remove project">
												<Trash2 size={15} />
											</button>
										</div>
										<textarea
											value={project.description || ""}
											onChange={(e) =>
												updateProject(
													index,
													"description",
													e.target.value,
												)
											}
											placeholder="Short project description"
											rows={2}
											className="field-input resize-none px-3 py-2 text-sm"
										/>
										<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
											<input
												type="url"
												value={project.githubUrl || ""}
												onChange={(e) =>
													updateProject(
														index,
														"githubUrl",
														e.target.value,
													)
												}
												placeholder="GitHub repository URL"
												className="field-input px-3 py-2 text-sm"
											/>
											<input
												type="url"
												value={project.liveUrl || ""}
												onChange={(e) =>
													updateProject(
														index,
														"liveUrl",
														e.target.value,
													)
												}
												placeholder="Live website URL"
												className="field-input px-3 py-2 text-sm"
											/>
										</div>
									</div>
								))}
							</div>

							<button
								type="submit"
								className="w-full py-3 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-500 transition-all">
								Save & Update Profile
							</button>
							{profileError && (
								<p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400">
									{profileError}
								</p>
							)}
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default UserDashboard;
