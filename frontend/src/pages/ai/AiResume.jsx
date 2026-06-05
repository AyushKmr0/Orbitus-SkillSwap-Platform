import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import {
	FileUser,
	Download,
	Mail,
	GitBranch,
	Award,
	BookOpen,
	Briefcase,
	Star,
	Edit3,
	Save,
	X,
	Plus,
	Trash2,
	Phone,
	MapPin,
	Globe,
	Sparkles,
} from "lucide-react";

const emptyProject = () => ({ name: "", role: "", link: "", description: "" });
const emptyExperience = () => ({
	title: "",
	company: "",
	duration: "",
	description: "",
});
const emptyCertification = () => ({ name: "", issuer: "", year: "" });
const emptyCustomSection = () => ({ title: "", content: "" });

const resumeTemplates = [
	{
		id: "modern",
		name: "Modern",
		description:
			"Clean two-column resume for tech, product and creative roles.",
		accent: "blue",
	},
	{
		id: "classic",
		name: "Classic",
		description: "ATS-friendly single-column layout for most applications.",
		accent: "slate",
	},
	{
		id: "academic",
		name: "Academic",
		description:
			"Formal layout for education, research and credential-heavy profiles.",
		accent: "emerald",
	},
];

const formatEducationEntry = (item) => {
	if (!item) return "";
	if (typeof item === "string") return item;
	return [item.degree, item.institution, item.year]
		.filter(Boolean)
		.join(" - ");
};

const AiResume = () => {
	const { token, user } = useSelector((state) => state.auth);

	const [resume, setResume] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showManualBuilder, setShowManualBuilder] = useState(false);
	const [selectedTemplate, setSelectedTemplate] = useState("modern");
	const [manualDraft, setManualDraft] = useState(null);
	const [showMobileMenu, setShowMobileMenu] = useState(false);

	useEffect(() => {
		fetchCompiledResume();
	}, [token]);

	const fetchCompiledResume = async () => {
		try {
			const config = { headers: { Authorization: `Bearer ${token}` } };
			const res = await axios.post("/api/ai/resume", {}, config);
			setResume(res.data.resume);
			setManualDraft(toManualDraft(res.data.resume));
		} catch (err) {
			console.error("Error fetching resume compiler details:", err);
			const fallbackResume = {
				personalInfo: {
					name: user?.name || "",
					email: user?.email || "",
					bio: user?.bio || "",
					socialLinks: user?.socialLinks || {},
				},
				summary: user?.bio || "Add your professional summary manually.",
				experienceLevel: user?.experienceLevel || "Mid",
				skills:
					user?.skillsTeach?.map((s) => ({
						name: s.skill?.name || "Skill",
						level: s.level,
					})) || [],
				skillsLookingToLearn:
					user?.skillsLearn?.map((s) => ({
						name: s.skill?.name || "Skill",
						level: s.level,
					})) || [],
				education: user?.education || "",
				interests: user?.interests || [],
				testimonials: [],
				earnedPoints: user?.points || 0,
			};
			setResume(fallbackResume);
			setManualDraft(toManualDraft(fallbackResume));
		} finally {
			setLoading(false);
		}
	};

	const toManualDraft = (resumeData) => ({
		name: resumeData.personalInfo?.name || "",
		email: resumeData.personalInfo?.email || "",
		phone: resumeData.personalInfo?.phone || "",
		location: resumeData.personalInfo?.location || "",
		website: resumeData.personalInfo?.website || "",
		headline: resumeData.headline || "",
		bio: resumeData.personalInfo?.bio || "",
		summary: resumeData.summary || "",
		experienceLevel: resumeData.experienceLevel || "Mid",
		education: Array.isArray(resumeData.education)
			? resumeData.education
					.map(formatEducationEntry)
					.filter(Boolean)
					.join("\n")
			: resumeData.education || "",
		linkedin: resumeData.personalInfo?.socialLinks?.linkedin || "",
		github: resumeData.personalInfo?.socialLinks?.github || "",
		skillsText: (resumeData.skills || [])
			.map((skill) => skill.name)
			.join(", "),
		learningText: (resumeData.skillsLookingToLearn || [])
			.map((skill) => skill.name)
			.join(", "),
		interestsText: (resumeData.interests || []).join(", "),
		projects: resumeData.projects?.length
			? resumeData.projects.map((project) => ({
					name: project.name || project.title || "",
					role: project.role || project.techStack || "",
					link: project.link || project.url || "",
					description: project.description || "",
				}))
			: [emptyProject()],
		experience: resumeData.experience?.length
			? resumeData.experience
			: [emptyExperience()],
		certifications: resumeData.certifications?.length
			? resumeData.certifications
			: [emptyCertification()],
		customSections: resumeData.customSections?.length
			? resumeData.customSections
			: [emptyCustomSection()],
	});

	const parseSkillText = (value) =>
		value
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean)
			.map((item) => {
				const [name] = item.split(":").map((part) => part.trim());
				return { name };
			});

	const handleManualResumeSave = (e) => {
		e.preventDefault();

		const nextResume = {
			...resume,
			personalInfo: {
				name: manualDraft.name,
				email: manualDraft.email,
				phone: manualDraft.phone,
				location: manualDraft.location,
				website: manualDraft.website,
				bio: manualDraft.bio,
				socialLinks: {
					linkedin: manualDraft.linkedin,
					github: manualDraft.github,
				},
			},
			headline: manualDraft.headline,
			summary: manualDraft.summary,
			experienceLevel: manualDraft.experienceLevel,
			skills: parseSkillText(manualDraft.skillsText),
			skillsLookingToLearn: parseSkillText(manualDraft.learningText),
			education: manualDraft.education
				.split("\n")
				.map((item) => item.trim())
				.filter(Boolean),
			interests: manualDraft.interestsText
				.split(",")
				.map((item) => item.trim())
				.filter(Boolean),
			projects: manualDraft.projects.filter(
				(project) => project.name || project.description,
			),
			experience: manualDraft.experience.filter(
				(item) => item.title || item.company || item.description,
			),
			certifications: manualDraft.certifications.filter(
				(item) => item.name || item.issuer,
			),
			customSections: manualDraft.customSections.filter(
				(section) => section.title || section.content,
			),
		};

		setResume(nextResume);
		setManualDraft(toManualDraft(nextResume));
		setShowManualBuilder(false);
	};

	const handlePrintPdf = () => {
		window.print();
	};

	if (loading || !resume) {
		return (
			<div className="page-shell flex flex-col items-center justify-center gap-4">
				<div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-600" />
				<span className="text-sm font-medium text-muted">
					Preparing resume workspace...
				</span>
			</div>
		);
	}

	const {
		personalInfo,
		summary,
		experienceLevel,
		skills,
		skillsLookingToLearn,
		education,
		interests,
		testimonials,
	} = resume;
	const educationList = (Array.isArray(education) ? education : [education])
		.map(formatEducationEntry)
		.filter(Boolean);
	const projects = resume.projects || [];
	const experience = resume.experience || [];
	const certifications = resume.certifications || [];
	const customSections = resume.customSections || [];
	const activeTemplate =
		resumeTemplates.find((template) => template.id === selectedTemplate) ||
		resumeTemplates[0];
	const resumeTips = [
		!summary || summary.length < 80
			? "Add a 3-4 line summary with role, strengths and measurable impact."
			: null,
		experience.length === 0
			? "Add at least one experience, internship, freelance or leadership entry."
			: null,
		projects.length < 2
			? "Add 2-3 projects with problem, tech stack and result."
			: null,
		skills.length < 5
			? "List 6-10 role-specific skills instead of broad keywords."
			: null,
		!personalInfo.phone || !personalInfo.location
			? "Add phone and location so recruiters can quickly screen your profile."
			: null,
	].filter(Boolean);

	const updateDraftList = (field, index, key, value) => {
		setManualDraft({
			...manualDraft,
			[field]: manualDraft[field].map((item, itemIndex) =>
				itemIndex === index ? { ...item, [key]: value } : item,
			),
		});
	};

	const addDraftItem = (field, factory) => {
		setManualDraft({
			...manualDraft,
			[field]: [...manualDraft[field], factory()],
		});
	};

	const removeDraftItem = (field, index, factory) => {
		const nextItems = manualDraft[field].filter(
			(_, itemIndex) => itemIndex !== index,
		);
		setManualDraft({
			...manualDraft,
			[field]: nextItems.length ? nextItems : [factory()],
		});
	};

	const accentClasses =
		activeTemplate.accent === "emerald"
			? {
					icon: "text-emerald-700",
					pill: "bg-emerald-50 text-emerald-800",
					border: "border-emerald-700",
					text: "text-emerald-800",
				}
			: activeTemplate.accent === "slate"
				? {
						icon: "text-slate-700",
						pill: "bg-slate-100 text-slate-800",
						border: "border-slate-800",
						text: "text-slate-800",
					}
				: {
						icon: "text-blue-700",
						pill: "bg-blue-50 text-blue-700",
						border: "border-blue-700",
						text: "text-blue-700",
					};
	const sectionTitleClass =
		selectedTemplate === "classic"
			? `border-b border-slate-300 pb-1 text-xs font-bold uppercase tracking-wide text-slate-950 sm:text-sm sm:tracking-wider`
			: `border-l-4 ${accentClasses.border} pl-2 text-xs font-bold uppercase text-slate-950 sm:pl-3 sm:text-sm`;

	return (
		<div className="page-shell space-y-4 p-2 sm:space-y-6 sm:p-4 lg:p-8 print:block print:p-0">
			<div className="page-header flex-col sm:flex-row print:hidden">
				<div className="flex w-full gap-2 sm:w-auto sm:flex-row">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white sm:h-11 sm:w-11">
						<FileUser size={21} />
					</div>
					<div className="min-w-0">
						<h1 className="text-lg font-bold tracking-tight text-app sm:text-2xl lg:text-3xl">
							AI Resume Builder
						</h1>
						<p className="mt-1 text-xs sm:text-sm text-muted line-clamp-2">
							Choose a template, polish the content and export a
							professional resume.
						</p>
					</div>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row">
					<button
						onClick={() => {
							setManualDraft(toManualDraft(resume));
							setShowManualBuilder(true);
						}}
						className="btn-secondary w-full sm:w-auto">
						<Edit3 size={16} />
						<span className="hidden sm:inline">Edit Resume</span>
						<span className="sm:hidden">Edit</span>
					</button>
					<button
						onClick={handlePrintPdf}
						className="btn-primary w-full sm:w-auto">
						<Download size={16} />
						<span className="hidden sm:inline">Download PDF</span>
						<span className="sm:hidden">Download</span>
					</button>
				</div>
			</div>

			<div className="mx-auto grid w-full gap-3 sm:gap-4 lg:gap-6 lg:max-w-6xl lg:grid-cols-[280px_1fr] print:block print:max-w-none">
				{" "}
				<aside className="section-panel p-3 sm:p-5 print:hidden lg:sticky lg:top-4 lg:max-h-screen lg:overflow-y-auto" style={{ gridColumn: 'auto', gridRow: 'auto' }}>
					{/* Mobile Collapsible Menu */}
					<div className="lg:hidden space-y-2">
						<button
							onClick={() => setShowMobileMenu(!showMobileMenu)}
							className="w-full flex items-center justify-between p-2 sm:p-3 rounded-lg border transition-all"
							style={{ borderColor: "var(--app-border)" }}>
							<span className="text-sm font-bold uppercase text-muted">
								Resume Tools & Tips
							</span>
							<span className={`transform transition-transform ${showMobileMenu ? 'rotate-180' : ''}`}>
								↓
							</span>
						</button>
						{showMobileMenu && (
							<div className="space-y-3 p-2 sm:p-3">
								{/* Health Stats */}
								<div>
									<h3 className="text-xs font-bold uppercase text-muted mb-3">
										Resume Health
									</h3>
									<div className="space-y-2">
										{[
											[
												"Name",
												personalInfo.name ? "Complete" : "Missing",
											],
											["Teaching Skills", `${skills.length} listed`],
											[
												"Learning Goals",
												`${skillsLookingToLearn.length} listed`,
											],
											["Interests", `${interests.length} tags`],
										].map(([label, value]) => (
											<div
												key={label}
												className="flex items-center justify-between border-b pb-2 text-xs last:border-b-0"
												style={{ borderColor: "var(--app-border)" }}>
												<span className="text-muted">{label}</span>
												<span className="font-semibold text-app">
													{value}
												</span>
											</div>
										))}
									</div>
								</div>

								{/* Templates */}
								<div className="border-t pt-3" style={{ borderColor: "var(--app-border)" }}>
									<h3 className="text-xs font-bold uppercase text-muted mb-3">
										Templates
									</h3>
									<div className="space-y-2">
										{resumeTemplates.map((template) => (
											<button
												key={template.id}
												type="button"
												onClick={() => {
													setSelectedTemplate(template.id);
													setShowMobileMenu(false);
												}}
												className={`w-full rounded-lg border p-2 text-left transition-all text-xs sm:text-sm ${
													selectedTemplate === template.id
														? "border-blue-500 bg-blue-500/10"
														: "border-slate-200 bg-white hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900/40"
												}`}>
												<span className="flex items-center justify-between gap-2">
													<span className="font-bold text-app">
														{template.name}
													</span>
													{selectedTemplate === template.id && (
														<Sparkles
															size={14}
															className="text-blue-600 dark:text-blue-400"
														/>
													)}
												</span>
												<span className="mt-1 block text-xs leading-4 text-muted line-clamp-2">
													{template.description}
												</span>
											</button>
										))}
									</div>
								</div>

								{/* Tips */}
								<div className="border-t pt-3" style={{ borderColor: "var(--app-border)" }}>
									<h3 className="text-xs font-bold uppercase text-muted mb-3">
										Improve Resume
									</h3>
									<div className="space-y-2">
										{(resumeTips.length
											? resumeTips
											: [
													"Strong base. Keep bullets action-led and include numbers wherever possible.",
												]
										).map((tip, index) => (
											<div
												key={index}
												className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-xs leading-4 text-muted-strong">
												{tip}
											</div>
										))}
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Desktop Sidebar */}
					<div className="hidden lg:block space-y-6">
						<div>
							<h2 className="text-sm font-bold uppercase text-muted">
								Resume Health
							</h2>
							<div className="mt-5 space-y-4">
								{[
									[
										"Name",
										personalInfo.name ? "Complete" : "Missing",
									],
									["Teaching Skills", `${skills.length} listed`],
									[
										"Learning Goals",
										`${skillsLookingToLearn.length} listed`,
									],
									["Interests", `${interests.length} tags`],
								].map(([label, value]) => (
									<div
										key={label}
										className="flex items-center justify-between border-b pb-3 text-sm last:border-b-0 last:pb-0"
										style={{ borderColor: "var(--app-border)" }}>
										<span className="text-muted">{label}</span>
										<span className="font-semibold text-app">
											{value}
										</span>
									</div>
								))}
							</div>
						</div>

						<div
							className="border-t pt-5"
							style={{ borderColor: "var(--app-border)" }}>
							<h2 className="text-sm font-bold uppercase text-muted">
								Templates
							</h2>
							<div className="mt-4 grid gap-2">
								{resumeTemplates.map((template) => (
									<button
										key={template.id}
										type="button"
										onClick={() =>
											setSelectedTemplate(template.id)
										}
										className={`w-full rounded-lg border p-3 text-left transition-all ${
											selectedTemplate === template.id
												? "border-blue-500 bg-blue-500/10"
												: "border-slate-200 bg-white hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900/40"
										}`}>
										<span className="flex items-center justify-between gap-3">
											<span className="text-sm font-bold text-app">
												{template.name}
											</span>
											{selectedTemplate === template.id && (
												<Sparkles
													size={15}
													className="text-blue-600 dark:text-blue-400"
												/>
											)}
										</span>
										<span className="mt-1 block text-xs leading-5 text-muted">
											{template.description}
										</span>
									</button>
								))}
							</div>
						</div>

						<div
							className="border-t pt-5"
							style={{ borderColor: "var(--app-border)" }}>
							<h2 className="text-sm font-bold uppercase text-muted">
								Improve Resume
							</h2>
							<div className="mt-4 space-y-2">
								{(resumeTips.length
									? resumeTips
									: [
											"Strong base. Keep bullets action-led and include numbers wherever possible.",
										]
								).map((tip, index) => (
									<div
										key={index}
										className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-5 text-muted-strong">
										{tip}
									</div>
								))}
							</div>
						</div>
					</div>
				</aside>
				<article className={`resume-a4 section-panel w-full overflow-visible bg-white text-xs sm:text-sm text-slate-900 print:border-0 print:shadow-none ${
  selectedTemplate === 'academic'
    ? 'p-3 sm:p-4 lg:p-10'
    : selectedTemplate === 'classic'
    ? 'p-3 sm:p-4 lg:p-9'
    : 'p-3 sm:p-4 lg:p-9'
}`}>
					<div
						className={`flex flex-col gap-4 border-b pb-4 print:border-slate-300 sm:gap-6 sm:pb-6 ${
							selectedTemplate === "classic"
								? ""
								: "md:flex-row md:items-start md:justify-between"
						}`}
						style={{
							borderColor:
								selectedTemplate === "classic"
									? "#cbd5e1"
									: "var(--app-border)",
						}}>
						<div className="min-w-0">
							<h2
								className={`${selectedTemplate === 'academic' ? 'font-serif text-2xl sm:text-3xl lg:text-4xl' : 'text-xl sm:text-2xl md:text-3xl'} break-words font-bold tracking-tight text-slate-950 print:text-slate-900`}>
								{personalInfo.name || "Your Name"}
							</h2>
							<p
								className={`mt-1 text-xs font-semibold uppercase leading-5 sm:text-sm ${accentClasses.text}`}>
								{resume.headline ||
									`Verified ${experienceLevel}-Level Tutor`}
							</p>
							<p className="mt-2 max-w-xl text-[13px] leading-5 text-slate-600 sm:mt-3 sm:text-sm sm:leading-6">
								{personalInfo.bio}
							</p>
						</div>

						<div
							className={`${selectedTemplate === "classic" ? "mt-3 flex flex-wrap gap-x-4 gap-y-2 sm:mt-4 sm:gap-x-5" : "space-y-2"} min-w-0 text-xs text-slate-600 sm:text-sm`}>
							<div className="flex min-w-0 items-center gap-2">
								<Mail
									size={14}
									className={accentClasses.icon}
								/>
								<span className="break-all">{personalInfo.email}</span>
							</div>
							{personalInfo.phone && (
								<div className="flex min-w-0 items-center gap-2">
									<Phone
										size={14}
										className={accentClasses.icon}
									/>
									<span className="break-words">{personalInfo.phone}</span>
								</div>
							)}
							{personalInfo.location && (
								<div className="flex min-w-0 items-center gap-2">
									<MapPin
										size={14}
										className={accentClasses.icon}
									/>
									<span className="break-words">{personalInfo.location}</span>
								</div>
							)}
							{personalInfo.website && (
								<div className="flex min-w-0 items-center gap-2">
									<Globe
										size={14}
										className={accentClasses.icon}
									/>
									<span className="break-all">{personalInfo.website}</span>
								</div>
							)}
							{personalInfo.socialLinks?.linkedin && (
								<div className="flex items-center gap-2">
									<Briefcase
										size={14}
										className={accentClasses.icon}
									/>
									<span>LinkedIn Portfolio</span>
								</div>
							)}
							{personalInfo.socialLinks?.github && (
								<div className="flex items-center gap-2">
									<GitBranch
										size={14}
										className={accentClasses.icon}
									/>
									<span>GitHub Profile</span>
								</div>
							)}
						</div>
					</div>

<div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2">
					<h3 className={sectionTitleClass}>
						Professional Summary
					</h3>
					<p className="text-[11px] sm:text-[13px] leading-4 sm:leading-5 text-slate-600">
							{summary}
						</p>
					</div>

					<div className="grid grid-cols-1 gap-3 pt-3 sm:gap-4 sm:pt-4 md:gap-6 md:pt-6 md:grid-cols-2">
						<div className="space-y-2 sm:space-y-3">
							<h3
								className={`flex items-center gap-2 ${sectionTitleClass}`}>
								<Award size={14} className="sm:size-4" /> Skills I Teach
							</h3>
							<div className="flex flex-wrap gap-1">
								{skills.map((skill, idx) => (
									<span
										key={idx}
										className={`rounded-full border border-slate-200 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold ${accentClasses.pill}`}>
										{skill.name}
									</span>
								))}
							</div>
						</div>

						<div className="space-y-2 sm:space-y-3">
							<h3
								className={`flex items-center gap-2 ${sectionTitleClass}`}>
								<BookOpen size={14} className="sm:size-4" /> Education & Path
							</h3>
							<div className="space-y-1.5 sm:space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-3">
								{educationList.length ? (
									educationList.map((item, idx) => (
										<div key={idx}>
											<h4 className="text-xs sm:text-sm font-semibold text-slate-800">
												{item}
											</h4>
											<p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500">
												Education / credential
											</p>
										</div>
									))
								) : (
									<div>
										<h4 className="text-xs sm:text-sm font-semibold text-slate-800">
											Education not added
										</h4>
										<p className="mt-1 text-xs text-slate-500">
											Add degree, course, or training
											details
										</p>
									</div>
								)}
								<div className="border-t border-slate-200 pt-2">
									<h4 className="text-xs sm:text-sm font-semibold text-slate-800">
										Earned Platform Points
									</h4>
									<p className="mt-1 text-xs sm:text-sm font-bold text-amber-700">
										{resume.earnedPoints} Experience Points
									</p>
								</div>
							</div>
						</div>
					</div>

					{experience.length > 0 && (
					<div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 lg:pt-6">
						<h3 className={sectionTitleClass}>Experience</h3>
						{experience.map((item, idx) => (
							<div
								key={idx}
								className="border-b border-slate-200 pb-2.5 sm:pb-3 last:border-b-0 last:pb-0">
								<div className="flex flex-col justify-between gap-0.5 sm:gap-1 sm:flex-row">
									<h4 className="text-xs sm:text-sm font-bold text-slate-900">
										{item.title || "Role title"}
									</h4>
									<span className="text-[10px] sm:text-xs font-semibold text-slate-500">
										{item.duration}
									</span>
								</div>
								<p
									className={`text-xs sm:text-sm font-semibold ${accentClasses.text}`}>
									{item.company}
								</p>
								<p className="mt-1 text-[11px] sm:text-[13px] leading-4 sm:leading-5 text-slate-600">
									</p>
								</div>
							))}
						</div>
					)}

					{projects.length > 0 && (
					<div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 lg:pt-6">
						<h3 className={sectionTitleClass}>Projects</h3>
						<div className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2">
							{projects.map((project, idx) => (
								<div
									key={idx}
									className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
									<h4 className="text-xs sm:text-sm font-bold text-slate-900">
										{project.name || "Project name"}
									</h4>
									{project.role && (
										<p
											className={`mt-1 text-[10px] sm:text-xs font-semibold uppercase ${accentClasses.text}`}>
											{project.role}
										</p>
									)}
									<p className="mt-1 text-[11px] sm:text-[13px] leading-4 sm:leading-5 text-slate-600">
										{project.description}
									</p>
									{project.link && (
										<p className="mt-1.5 break-all text-[10px] sm:text-xs font-semibold text-slate-500">
											{project.link}
											</p>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{certifications.length > 0 && (
					<div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 lg:pt-6">
						<h3 className={sectionTitleClass}>
							Certifications
						</h3>
						<div className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2">
							{certifications.map((cert, idx) => (
								<div
									key={idx}
									className="rounded-lg border border-slate-200 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-700">
										<span className="font-bold text-slate-900">
											{cert.name}
										</span>
										{(cert.issuer || cert.year) && (
											<span>
												{" "}
												-{" "}
												{[cert.issuer, cert.year]
													.filter(Boolean)
													.join(", ")}
											</span>
										)}
									</div>
								))}
							</div>
						</div>
					)}

<div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 lg:pt-6">
					<h3 className={sectionTitleClass}>
						Professional Interests
					</h3>
					<div className="flex flex-wrap gap-1">
						{interests.map((interest, idx) => (
							<span
								key={idx}
								className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] sm:text-xs font-medium text-slate-700">
									{interest}
								</span>
							))}
						</div>
					</div>

					{customSections.map((section, idx) => (
						<div key={idx} className="space-y-1 sm:space-y-2 pt-3 sm:pt-4 lg:pt-6">
							<h3 className={sectionTitleClass}>
								{section.title || "Custom Section"}
							</h3>
							<p className="whitespace-pre-line text-[11px] sm:text-[13px] leading-4 sm:leading-5 text-slate-600">
								{section.content}
							</p>
						</div>
					))}

					{/* Peer Testimonials testimonials */}
					{testimonials.length > 0 && (
						<div className="space-y-2 sm:space-y-3 border-t border-slate-200 pt-3 sm:pt-4 lg:pt-6 lg:pt-8">
							<h3
								className={`flex items-center gap-2 ${sectionTitleClass}`}>
								<Star size={14} className="sm:size-4 text-amber-600" />{" "}
								Learner Endorsements
							</h3>
							<div className="space-y-2 sm:space-y-3">
								{testimonials.map((test, idx) => (
									<div
										key={idx}
										className="rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-3 text-xs sm:text-sm italic leading-5 sm:leading-6 text-slate-700">
										{test}
									</div>
								))}
							</div>
						</div>
					)}
				</article>
			</div>

			{showManualBuilder && manualDraft && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm print:hidden">
					<form
						onSubmit={handleManualResumeSave}
						className="surface-panel max-h-[95dvh] w-full max-w-2xl sm:max-w-3xl space-y-3 sm:space-y-4 overflow-y-auto rounded-lg p-3 sm:p-4 lg:p-6">
						<div
							className="flex items-start justify-between gap-2 border-b pb-3"
							style={{ borderColor: "var(--app-border)" }}>
							<div className="min-w-0 flex-1">
								<h3 className="text-sm font-bold text-app sm:text-base lg:text-lg">
									Manual Resume Builder
								</h3>
								<p className="text-xs text-muted mt-0.5 sm:mt-1">
									Create or edit your resume without waiting
									for AI.
								</p>
							</div>
							<button
								type="button"
								onClick={() => setShowManualBuilder(false)}
								className="shrink-0 rounded-lg p-2 text-muted hover:bg-slate-900/5 hover:text-app dark:hover:bg-white/5">
								<X size={16} className="sm:size-5" />
							</button>
						</div>

						<div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2">
							{[
								["name", "Full Name"],
								["email", "Email"],
								["phone", "Phone"],
								["location", "Location"],
								["headline", "Professional Headline"],
								["experienceLevel", "Experience Level"],
								["linkedin", "LinkedIn URL"],
								["github", "GitHub URL"],
								["website", "Website / Portfolio"],
							].map(([field, label]) => (
								<label
									key={field}
									className="space-y-1 text-xs font-semibold text-muted uppercase">
									{label}
									<input
										value={manualDraft[field]}
										onChange={(e) =>
											setManualDraft({
												...manualDraft,
												[field]: e.target.value,
											})
										}
										className="field-input px-3 py-2 text-sm normal-case font-normal"
									/>
								</label>
							))}
						</div>

						<label className="space-y-1 text-xs font-semibold text-muted uppercase block">
							Education Entries
							<textarea
								value={manualDraft.education}
								onChange={(e) =>
									setManualDraft({
										...manualDraft,
										education: e.target.value,
									})
								}
								placeholder="B.Tech Computer Science - ABC University - 2026&#10;Google UX Design Certificate - 2025"
								rows={3}
								className="field-input px-3 py-2 text-sm normal-case font-normal"
							/>
						</label>

						<label className="space-y-1 text-xs font-semibold text-muted uppercase block">
							Bio
							<textarea
								value={manualDraft.bio}
								onChange={(e) =>
									setManualDraft({
										...manualDraft,
										bio: e.target.value,
									})
								}
								rows={2}
								className="field-input px-3 py-2 text-sm normal-case font-normal"
							/>
						</label>

						<label className="space-y-1 text-xs font-semibold text-muted uppercase block">
							Professional Summary
							<textarea
								value={manualDraft.summary}
								onChange={(e) =>
									setManualDraft({
										...manualDraft,
										summary: e.target.value,
									})
								}
								rows={3}
								className="field-input px-3 py-2 text-sm normal-case font-normal"
							/>
						</label>

						<div className="space-y-2">
							<div className="flex items-center justify-between gap-2 sm:gap-3">
								<h4 className="text-xs font-bold uppercase text-muted">
									Experience
								</h4>
								<button
									type="button"
									onClick={() =>
										addDraftItem(
											"experience",
											emptyExperience,
										)
									}
									className="btn-secondary min-h-0 px-2 sm:px-3 py-1.5 sm:py-2 text-xs">
									<Plus size={12} className="sm:size-4" /> Add
								</button>
							</div>
							{manualDraft.experience.map((item, idx) => (
								<div
									key={idx}
									className="rounded-lg border p-2 sm:p-3 space-y-2"
									style={{
										borderColor: "var(--app-border)",
									}}>
									<div className="grid grid-cols-1 gap-2 md:grid-cols-3">
										{[
											["title", "Role"],
											["company", "Company"],
											["duration", "Duration"],
										].map(([key, label]) => (
											<input
												key={key}
												value={item[key]}
												onChange={(e) =>
													updateDraftList(
														"experience",
														idx,
														key,
														e.target.value,
													)
												}
												placeholder={label}
												className="field-input px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
											/>
										))}
									</div>
									<textarea
										value={item.description}
										onChange={(e) =>
											updateDraftList(
												"experience",
												idx,
												"description",
												e.target.value,
											)
										}
										placeholder="Impact, responsibilities, tools, measurable outcomes"
										rows={2}
										className="field-input px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
									/>
									<button
										type="button"
										onClick={() =>
											removeDraftItem(
												"experience",
												idx,
												emptyExperience,
											)
										}
										className="text-xs font-bold text-red-500 flex items-center gap-1">
										<Trash2 size={12} /> Remove
									</button>
								</div>
							))}
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between gap-2 sm:gap-3">
								<h4 className="text-xs font-bold uppercase text-muted">
									Projects
								</h4>
								<button
									type="button"
									onClick={() =>
										addDraftItem("projects", emptyProject)
									}
									className="btn-secondary min-h-0 px-2 sm:px-3 py-1.5 sm:py-2 text-xs">
									<Plus size={12} className="sm:size-4" /> Add
								</button>
							</div>
							{manualDraft.projects.map((project, idx) => (
								<div
									key={idx}
									className="rounded-lg border p-2 sm:p-3 space-y-2"
									style={{
										borderColor: "var(--app-border)",
									}}>
									<div className="grid grid-cols-1 gap-2 md:grid-cols-3">
										{[
											["name", "Project Name"],
											["role", "Role / Stack"],
											["link", "Link"],
										].map(([key, label]) => (
											<input
												key={key}
												value={project[key]}
												onChange={(e) =>
													updateDraftList(
														"projects",
														idx,
														key,
														e.target.value,
													)
												}
												placeholder={label}
												className="field-input px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
											/>
										))}
									</div>
									<textarea
										value={project.description}
										onChange={(e) =>
											updateDraftList(
												"projects",
												idx,
												"description",
												e.target.value,
											)
										}
										placeholder="Problem solved, features built, tech used, result"
										rows={2}
										className="field-input px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
									/>
									<button
										type="button"
										onClick={() =>
											removeDraftItem(
												"projects",
												idx,
												emptyProject,
											)
										}
										className="text-xs font-bold text-red-500 flex items-center gap-1">
										<Trash2 size={12} /> Remove
									</button>
								</div>
							))}
						</div>

<div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2">
										<label className="space-y-1 text-xs font-semibold text-muted uppercase">
											Skills I Teach
											<textarea
												value={manualDraft.skillsText}
												onChange={(e) =>
													setManualDraft({
														...manualDraft,
														skillsText: e.target.value,
													})
												}
												placeholder="React, Node.js, REST APIs, Tailwind CSS"
												rows={3}
												className="field-input px-3 py-2 text-sm normal-case font-normal"
											/>
										</label>
										<label className="space-y-1 text-xs font-semibold text-muted uppercase">
											Skills I Want To Learn
											<textarea
												value={manualDraft.learningText}
												onChange={(e) =>
													setManualDraft({
														...manualDraft,
														learningText: e.target.value,
													})
												}
												placeholder="System Design, Docker, AWS"
												rows={3}
												className="field-input px-3 py-2 text-sm normal-case font-normal"
								/>
							</label>
						</div>

<label className="space-y-1 text-xs font-semibold text-muted uppercase block">
										Interests
										<input
											value={manualDraft.interestsText}
											onChange={(e) =>
												setManualDraft({
													...manualDraft,
													interestsText: e.target.value,
												})
											}
											placeholder="Open Source, Product Design, AI"
											className="field-input px-3 py-2 text-sm normal-case font-normal"
							/>
						</label>

						<div className="space-y-3">
							<div className="flex items-center justify-between gap-3">
								<h4 className="text-xs font-bold uppercase text-muted">
									Certifications
								</h4>
								<button
									type="button"
									onClick={() =>
										addDraftItem(
											"certifications",
											emptyCertification,
										)
									}
									className="btn-secondary min-h-0 px-3 py-2 text-xs">
									<Plus size={14} /> Add
								</button>
							</div>
							{manualDraft.certifications.map((cert, idx) => (
								<div
									key={idx}
									className="grid grid-cols-1 md:grid-cols-[1fr_1fr_100px_auto] gap-3">
									<input
										value={cert.name}
										onChange={(e) =>
											updateDraftList(
												"certifications",
												idx,
												"name",
												e.target.value,
											)
										}
										placeholder="Certification"
										className="field-input px-3 py-2 text-sm"
									/>
									<input
										value={cert.issuer}
										onChange={(e) =>
											updateDraftList(
												"certifications",
												idx,
												"issuer",
												e.target.value,
											)
										}
										placeholder="Issuer"
										className="field-input px-3 py-2 text-sm"
									/>
									<input
										value={cert.year}
										onChange={(e) =>
											updateDraftList(
												"certifications",
												idx,
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
											removeDraftItem(
												"certifications",
												idx,
												emptyCertification,
											)
										}
										className="rounded-lg p-2 text-red-500 hover:bg-red-500/10">
										<Trash2 size={16} />
									</button>
								</div>
							))}
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between gap-3">
								<h4 className="text-xs font-bold uppercase text-muted">
									Custom Sections
								</h4>
								<button
									type="button"
									onClick={() =>
										addDraftItem(
											"customSections",
											emptyCustomSection,
										)
									}
									className="btn-secondary min-h-0 px-3 py-2 text-xs">
									<Plus size={14} /> Add
								</button>
							</div>
							{manualDraft.customSections.map((section, idx) => (
								<div
									key={idx}
									className="rounded-lg border p-3"
									style={{
										borderColor: "var(--app-border)",
									}}>
									<input
										value={section.title}
										onChange={(e) =>
											updateDraftList(
												"customSections",
												idx,
												"title",
												e.target.value,
											)
										}
										placeholder="Section title, e.g. Achievements, Publications, Volunteering"
										className="field-input px-3 py-2 text-sm"
									/>
									<textarea
										value={section.content}
										onChange={(e) =>
											updateDraftList(
												"customSections",
												idx,
												"content",
												e.target.value,
											)
										}
										placeholder="Add bullets or notes. Line breaks will be preserved."
										rows={3}
										className="field-input mt-3 px-3 py-2 text-sm"
									/>
									<button
										type="button"
										onClick={() =>
											removeDraftItem(
												"customSections",
												idx,
												emptyCustomSection,
											)
										}
										className="mt-2 text-xs font-bold text-red-500 flex items-center gap-1">
										<Trash2 size={13} /> Remove
									</button>
								</div>
							))}
						</div>

						<button type="submit" className="btn-primary w-full">
							<Save size={16} /> Apply Resume
						</button>
					</form>
				</div>
			)}
		</div>
	);
};

export default AiResume;
