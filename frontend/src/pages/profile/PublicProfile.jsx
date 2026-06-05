import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
	Briefcase,
	Calendar,
	FileText,
	GitBranch,
	Globe,
	MessageSquare,
	UserMinus,
	UserPlus,
	Users,
} from "lucide-react";
import { setCurrentRoom, upsertActiveChat } from "../../features/chatSlice.js";

const PublicProfile = () => {
	const { id } = useParams();
	const { token, user } = useSelector((state) => state.auth);
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const [profileUser, setProfileUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [bookingSkill, setBookingSkill] = useState("");
	const [bookDate, setBookDate] = useState("");
	const [bookTime, setBookTime] = useState("");
	const [bookDuration, setBookDuration] = useState(60);
	const [bookNotes, setBookNotes] = useState("");
	const [bookMsg, setBookMsg] = useState("");
	const [followBusy, setFollowBusy] = useState(false);

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const config = {
					headers: { Authorization: `Bearer ${token}` },
				};
				const res = await axios.get(`/api/users/${id}`, config);
				setProfileUser(res.data.user);
				setBookingSkill(
					res.data.user.skillsTeach?.[0]?.skill?._id || "",
				);
			} catch (err) {
				console.error("Error loading shared profile:", err);
			} finally {
				setLoading(false);
			}
		};
		fetchProfile();
	}, [id, token]);

	const renderEducation = (education) => {
		if (Array.isArray(education)) return education;
		return education
			? [{ degree: education, institution: "", year: "" }]
			: [];
	};

	const handleStartChat = () => {
		const chatRoomId = [user._id.toString(), profileUser._id.toString()]
			.sort()
			.join("_");
		dispatch(
			upsertActiveChat({
				partner: profileUser,
				chatRoomId,
				lastMessage: {
					content: "Start the conversation",
					fileType: "none",
					isSeen: true,
					sender: user._id,
					createdAt: new Date().toISOString(),
				},
			}),
		);
		dispatch(setCurrentRoom({ partner: profileUser, roomId: chatRoomId }));
		navigate("/chat");
	};

	const handleFollowToggle = async () => {
		if (
			!profileUser ||
			profileUser._id?.toString() === user._id?.toString()
		)
			return;
		setFollowBusy(true);
		try {
			const config = { headers: { Authorization: `Bearer ${token}` } };
			const res = await axios.post(
				`/api/users/${profileUser._id}/follow`,
				{},
				config,
			);
			setProfileUser(res.data.user);
		} catch (err) {
			console.error("Error updating follow:", err);
		} finally {
			setFollowBusy(false);
		}
	};

	const handleBookingSubmit = async (e) => {
		e.preventDefault();
		setBookMsg("");
		if (!bookDate || !bookTime || !bookingSkill) return;

		const startDateTime = new Date(`${bookDate}T${bookTime}:00`);
		const endDateTime = new Date(
			startDateTime.getTime() + Number(bookDuration) * 60 * 1000,
		);

		try {
			const config = { headers: { Authorization: `Bearer ${token}` } };
			await axios.post(
				"/api/sessions/book",
				{
					mentorId: profileUser._id,
					skillId: bookingSkill,
					startTime: startDateTime.toISOString(),
					endTime: endDateTime.toISOString(),
					notes: bookNotes,
				},
				config,
			);
			setBookMsg("Session request sent.");
		} catch (err) {
			setBookMsg(
				err.response?.data?.message || "Could not book session.",
			);
		}
	};

	if (loading) {
		return (
			<div className="page-shell flex items-center justify-center text-sm text-muted">
				Loading profile...
			</div>
		);
	}

	if (!profileUser) {
		return (
			<div className="page-shell flex items-center justify-center text-sm text-muted">
				Profile not found.
			</div>
		);
	}

	const education = renderEducation(profileUser.education);
	const isOwnProfile = profileUser._id === user._id;

	return (
		<div className="page-shell space-y-6">
			<div className="flex flex-col gap-4 section-panel p-4">
				<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
					<div className="flex items-center gap-4">
						<img
							src={profileUser.profileImage}
							alt={profileUser.name}
							className="w-20 h-20 rounded-lg shrink-0"
						/>

						<div>
							<h1 className="text-2xl md:text-3xl font-bold text-app">
								{profileUser.name}
							</h1>

							<p className="text-muted">
								{profileUser.experienceLevel} Level |{" "}
								{profileUser.points || 0} pts
							</p>

							<div className="flex gap-4 mt-2 text-sm font-medium">
								<span>
									{profileUser.followersCount || 0} Followers
								</span>

								<span>
									{profileUser.followingCount || 0} Following
								</span>
							</div>
						</div>
					</div>

					{!isOwnProfile && (
						<div className="hidden md:flex gap-2">
							<button
								type="button"
								onClick={handleFollowToggle}
								disabled={followBusy}
								className={
									profileUser.isFollowing
										? "btn-secondary"
										: "btn-primary"
								}>
								{profileUser.isFollowing ? (
									<UserMinus size={16} />
								) : (
									<UserPlus size={16} />
								)}
								{profileUser.isFollowing
									? "Following"
									: "Follow"}
							</button>

							<button
								type="button"
								onClick={handleStartChat}
								className="btn-secondary">
								<MessageSquare size={16} />
								Message
							</button>
						</div>
					)}
				</div>

				{!isOwnProfile && (
					<div className="flex md:hidden gap-2">
						<button
							type="button"
							onClick={handleFollowToggle}
							disabled={followBusy}
							className={`${profileUser.isFollowing ? "btn-secondary" : "btn-primary"} flex-1 justify-center`}>
							{profileUser.isFollowing ? (
								<UserMinus size={16} />
							) : (
								<UserPlus size={16} />
							)}
							{profileUser.isFollowing ? "Following" : "Follow"}
						</button>

						<button
							type="button"
							onClick={handleStartChat}
							className="btn-secondary flex-1 justify-center">
							<MessageSquare size={16} />
							Message
						</button>
					</div>
				)}
			</div>

			<div className="grid gap-6 lg:grid-cols-[1fr_360px]">
				<main className="section-panel space-y-6 p-5">
					<section>
						<h2 className="text-sm font-bold uppercase text-muted">
							About
						</h2>
						<p className="mt-2 text-sm leading-6 text-app">
							{profileUser.bio || "No bio added yet."}
						</p>
					</section>

					<section className="grid gap-4 md:grid-cols-2">
						<div
							className="rounded-lg border p-4"
							style={{ borderColor: "var(--app-border)" }}>
							<h3 className="text-xs font-bold uppercase text-muted">
								Teaches
							</h3>
							<div className="mt-3 flex flex-wrap gap-2">
								{(profileUser.skillsTeach || []).map(
									(skill) => (
										<span
											key={skill._id || skill.skill?._id}
											className="accent-pill rounded-full px-3 py-1 text-xs font-bold">
											{skill.skill?.name} ({skill.level})
										</span>
									),
								)}
							</div>
						</div>
						<div
							className="rounded-lg border p-4"
							style={{ borderColor: "var(--app-border)" }}>
							<h3 className="text-xs font-bold uppercase text-muted">
								Wants To Learn
							</h3>
							<div className="mt-3 flex flex-wrap gap-2">
								{(profileUser.skillsLearn || []).map(
									(skill) => (
										<span
											key={skill._id || skill.skill?._id}
											className="rounded-full border px-3 py-1 text-xs font-bold text-muted"
											style={{
												borderColor:
													"var(--app-border)",
											}}>
											{skill.skill?.name} ({skill.level})
										</span>
									),
								)}
							</div>
						</div>
					</section>

					<section className="grid gap-4 md:grid-cols-2">
						<div
							className="rounded-lg border p-4"
							style={{ borderColor: "var(--app-border)" }}>
							<h3 className="text-xs font-bold uppercase text-muted">
								Education
							</h3>
							<div className="mt-3 space-y-2">
								{education.length === 0 ? (
									<p className="text-xs text-muted">
										No education added.
									</p>
								) : (
									education.map((item, index) => (
										<div
											key={index}
											className="text-sm text-app">
											<p className="font-bold">
												{item.degree || item}
											</p>
											{typeof item === "object" && (
												<p className="text-xs text-muted">
													{[
														item.institution,
														item.year,
													]
														.filter(Boolean)
														.join(" | ")}
												</p>
											)}
										</div>
									))
								)}
							</div>
						</div>
						<div
							className="rounded-lg border p-4"
							style={{ borderColor: "var(--app-border)" }}>
							<h3 className="text-xs font-bold uppercase text-muted">
								Links
							</h3>
							<div className="mt-3 flex flex-wrap gap-2">
								{profileUser.socialLinks?.linkedin && (
									<a
										href={profileUser.socialLinks.linkedin}
										target="_blank"
										rel="noreferrer"
										className="btn-secondary min-h-0 px-3 py-2 text-xs">
										<Briefcase size={13} /> LinkedIn
									</a>
								)}
								{profileUser.socialLinks?.github && (
									<a
										href={profileUser.socialLinks.github}
										target="_blank"
										rel="noreferrer"
										className="btn-secondary min-h-0 px-3 py-2 text-xs">
										<GitBranch size={13} /> GitHub
									</a>
								)}
								{profileUser.socialLinks?.website && (
									<a
										href={profileUser.socialLinks.website}
										target="_blank"
										rel="noreferrer"
										className="btn-secondary min-h-0 px-3 py-2 text-xs">
										<Globe size={13} /> Website
									</a>
								)}
								{profileUser.resumeFile && (
									<a
										href={profileUser.resumeFile}
										target="_blank"
										rel="noreferrer"
										className="btn-secondary min-h-0 px-3 py-2 text-xs">
										<FileText size={13} /> Resume
									</a>
								)}
							</div>
						</div>
					</section>

					<section>
						<h2 className="text-sm font-bold uppercase text-muted">
							Projects
						</h2>
						<div className="mt-3 grid gap-3 md:grid-cols-2">
							{(profileUser.projects || [])
								.filter((project) => project.featured !== false)
								.map((project, index) => (
									<div
										key={index}
										className="rounded-lg border p-4"
										style={{
											borderColor: "var(--app-border)",
										}}>
										<p className="font-bold text-app">
											{project.title}
										</p>
										<p className="mt-1 line-clamp-3 text-sm text-muted">
											{project.description}
										</p>
									</div>
								))}
						</div>
					</section>
				</main>

				<aside className="section-panel h-fit p-5">
					<h2 className="text-sm font-bold text-app">
						Book a Session
					</h2>
					{bookMsg && (
						<p className="mt-3 rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-600">
							{bookMsg}
						</p>
					)}
					<form
						onSubmit={handleBookingSubmit}
						className="mt-4 space-y-3">
						<select
							value={bookingSkill}
							onChange={(e) => setBookingSkill(e.target.value)}
							required
							className="field-input px-3 py-2 text-sm">
							<option value="">Select skill</option>
							{(profileUser.skillsTeach || []).map((skill) => (
								<option
									key={skill.skill?._id}
									value={skill.skill?._id}>
									{skill.skill?.name} ({skill.level})
								</option>
							))}
						</select>
						<div className="grid grid-cols-2 gap-2">
							<input
								type="date"
								value={bookDate}
								onChange={(e) => setBookDate(e.target.value)}
								required
								className="field-input px-3 py-2 text-sm"
							/>
							<input
								type="time"
								value={bookTime}
								onChange={(e) => setBookTime(e.target.value)}
								required
								className="field-input px-3 py-2 text-sm"
							/>
						</div>
						<select
							value={bookDuration}
							onChange={(e) => setBookDuration(e.target.value)}
							className="field-input px-3 py-2 text-sm">
							<option value={60}>60 minutes</option>
							<option value={90}>90 minutes</option>
							<option value={120}>120 minutes</option>
						</select>
						<textarea
							value={bookNotes}
							onChange={(e) => setBookNotes(e.target.value)}
							rows={3}
							placeholder="What do you want to learn?"
							className="field-input px-3 py-2 text-sm"
						/>
						<button type="submit" className="btn-primary w-full">
							<Calendar size={15} /> Send Request
						</button>
					</form>
				</aside>
			</div>
		</div>
	);
};

export default PublicProfile;
