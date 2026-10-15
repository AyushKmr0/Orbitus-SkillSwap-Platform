import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { toggleTheme } from '../../features/themeSlice.js';
import {
  ArrowRight,
  UserPlus,
  BookOpen,
  Video,
  Sun,
  Moon,
  Menu,
  X,
  ArrowLeftRight,
  Calendar,
  Compass,
  CheckCircle2,
  Award,
  Code2,
  Languages,
  Palette,
  Briefcase,
  Music,
  GraduationCap,
  HeartPulse,
  Lightbulb,
  Users2,
  Layers,
  Check
} from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import { useDocumentHead } from '../../hooks/useDocumentHead.js';

const LandingPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  const shouldReduceMotion = useReducedMotion();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');

  const isAuthenticated = Boolean(token && user);

  useDocumentHead({
    title: 'Orbitus — Peer-to-Peer Skill Exchange Platform',
    description: 'Learn and teach skills together. Orbitus connects developers, designers, and learners for reciprocal 1:1 learning sessions, study groups, and verified credentials.',
    canonical: 'https://orbitus-skill-swap-platform.vercel.app/'
  });

  // Dribbble-inspired smooth spring & inertia motion variants
  const springTransition = {
    type: 'spring',
    stiffness: 120,
    damping: 18,
    mass: 0.8
  };

  const smoothEase = [0.16, 1, 0.3, 1];

  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.45,
        ease: smoothEase
      }
    }
  };

  const fadeDown = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.35,
        ease: smoothEase
      }
    }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: 'easeOut'
      }
    }
  };

  const scaleUp = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: smoothEase
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.06,
        delayChildren: shouldReduceMotion ? 0 : 0.03
      }
    }
  };

  const cardHover = {
    y: shouldReduceMotion ? 0 : -4,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 22
    }
  };

  const buttonHover = {
    scale: shouldReduceMotion ? 1 : 1.02,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15
    }
  };

  const buttonTap = {
    scale: shouldReduceMotion ? 1 : 0.98
  };

  // Interactive Feature Showcase Data
  const SHOWCASE_TABS = [
    {
      id: 'sessions',
      label: '1:1 Video Swaps',
      icon: Video,
      title: 'In-Browser Video Rooms with Pre-Session Agendas',
      description: 'Schedule focused learning sessions with peers. Every confirmed swap generates an integrated, download-free video meeting room with agenda checklists to keep learning structured.',
      bullets: [
        'WebRTC in-browser video & audio—zero third-party tools',
        'Shared agenda checklists and real-time objectives',
        'Timezone-synchronized session coordination'
      ],
      preview: {
        badge: 'Active Video Room',
        heading: 'React Component Architecture & TypeScript Tokens',
        meta: '45-Min Exchange · Room Connection Ready',
        points: ['Agenda approved by both peers', 'Microphone and camera ready', 'Session notes live synchronization']
      }
    },
    {
      id: 'groups',
      label: 'Study Circles',
      icon: BookOpen,
      title: 'Community Study Groups Organized by Subject',
      description: 'Connect with learning circles centered on your exact tools. Share curated documentation, ask technical questions, and hold recurring peer review sessions.',
      bullets: [
        'Specialized study circles across 8 knowledge domains',
        'Curated resource repositories and code snippets',
        'Real-time peer chat with group call rooms'
      ],
      preview: {
        badge: 'Study Group Hub',
        heading: 'Fullstack & Cloud Architecture Circle',
        meta: '38 Active Peers · General Discussion Channel',
        points: ['Database connection pooling best practices', 'Redis cache invalidation patterns', 'Docker multi-stage build optimization']
      }
    },
    {
      id: 'roadmaps',
      label: 'Milestone Paths',
      icon: Compass,
      title: 'Step-by-Step Curriculum Milestone Roadmaps',
      description: 'Break complex subjects into clear foundational checkpoints. Track prerequisites, practice tasks, and portfolio milestones in an organized sequence.',
      bullets: [
        'Structured prerequisite hierarchies for any tech stack',
        'Hands-on project checkpoints with real deliverables',
        'Daily consistency tracking on contribution calendars'
      ],
      preview: {
        badge: 'Curriculum Roadmap',
        heading: 'Fullstack React & Node.js Architecture',
        meta: '4 Phases · Milestone 2 in Progress',
        points: ['Phase 1: Architecture & Foundations (Complete)', 'Phase 2: Asynchronous State & Sockets (Current)', 'Phase 3: Production Hardening & Caching (Next)']
      }
    },
    {
      id: 'credentials',
      label: 'Verified Proof',
      icon: Award,
      title: 'Verifiable Skill Credentials Minted by Mutual Review',
      description: 'Certificates on Orbitus require real, demonstrated knowledge. Mint permanent credentials only after both partners complete the session and submit reciprocal evaluations.',
      bullets: [
        'Permanent alphanumeric verification hash ID',
        'Issued solely upon reciprocal partner evaluation',
        'Publicly shareable verification link for portfolios'
      ],
      preview: {
        badge: 'Verified Credential',
        heading: 'Demonstrated Knowledge Exchange Credential',
        meta: 'Status: Cryptographically Verified',
        points: ['Evaluation: Passed Mutual Peer Review', 'Permanent Hash: VERIFIED-HASH-RECORD', 'Public Verification Link Active']
      }
    }
  ];

  // 4 Structured Steps for the Vertical Timeline
  const HOW_IT_WORKS = [
    {
      step: '01',
      title: 'Publish What You Teach & Learn',
      subtitle: 'Build your reciprocal profile matrix',
      description: 'Declare the subjects you are ready to mentor peers in, alongside the exact concepts you want to learn. No fees, coins, or paywalls.',
      icon: ArrowLeftRight,
      highlight: 'Set custom skill levels: Beginner, Intermediate, or Advanced'
    },
    {
      step: '02',
      title: 'Connect with Reciprocal Peers',
      subtitle: 'Automated two-way compatibility matching',
      description: 'Orbitus matches you with fellow learners whose educational targets complement your mentoring capabilities for a balanced, two-way exchange.',
      icon: Users2,
      highlight: 'Balanced 1-to-1 matching based on mutual availability'
    },
    {
      step: '03',
      title: 'Schedule 1-on-1 Video Sessions',
      subtitle: 'Structured live learning with shared agendas',
      description: 'Agree on mutual meeting times and join directly via integrated in-browser video meeting rooms equipped with shared agenda notes and checklists.',
      icon: Calendar,
      highlight: 'Built-in video rooms with pre-meeting agenda outlines'
    },
    {
      step: '04',
      title: 'Earn Verified Credentials',
      subtitle: 'Reciprocal peer signoff and permanent credential IDs',
      description: 'Submit mutual session evaluations upon completion to build community reputation and mint permanent certificates with unique verification IDs.',
      icon: Award,
      highlight: 'Cryptographically verifiable proof IDs for portfolios'
    }
  ];

  // Real Skill Domains available in the Orbitus catalog
  const SKILL_DOMAINS = [
    {
      name: 'Programming & Tech',
      icon: Code2,
      topics: 'React, Node.js, Python, Docker, TypeScript, System Design'
    },
    {
      name: 'Languages & Speaking',
      icon: Languages,
      topics: 'English Conversation, Spanish, Japanese, Interview Practice'
    },
    {
      name: 'Design & Creative Arts',
      icon: Palette,
      topics: 'UI/UX Design, Figma, Design Systems, Typography, Illustration'
    },
    {
      name: 'Business & Startups',
      icon: Briefcase,
      topics: 'Product Strategy, Marketing, Sales Outreach, Pitching'
    },
    {
      name: 'Science & Academics',
      icon: GraduationCap,
      topics: 'Mathematics, Data Analysis, Physics, Research Writing'
    },
    {
      name: 'Music & Audio',
      icon: Music,
      topics: 'Guitar, Piano, Digital Audio Workstations, Music Theory'
    },
    {
      name: 'Health & Lifestyle',
      icon: HeartPulse,
      topics: 'Fitness Planning, Mindfulness, Nutrition, Habit Building'
    },
    {
      name: 'General Learning',
      icon: Lightbulb,
      topics: 'Study Strategies, Time Management, Public Speaking'
    }
  ];

  // Comparison points between passive courses and peer exchange
  const COMPARISONS = [
    {
      title: 'Cost & Accessibility',
      course: 'Expensive subscriptions ($20-$50/month) or upfront paywalls.',
      orbitus: '100% Free reciprocal exchange. You trade your knowledge directly.'
    },
    {
      title: 'Personalized Feedback',
      course: 'Pre-recorded video lectures with no individualized feedback.',
      orbitus: 'Live 1-on-1 dialogue with questions answered on the spot.'
    },
    {
      title: 'Accountability & Completion',
      course: 'High abandonment rates because you study completely in isolation.',
      orbitus: 'Dedicated calendar appointments with a real study partner.'
    },
    {
      title: 'Retention Through Teaching',
      course: 'Passive watching where most information is quickly forgotten.',
      orbitus: 'Active learning by explaining concepts, proven to maximize retention.'
    }
  ];

  // Community Standards
  const COMMUNITY_PILLARS = [
    {
      title: 'Equal Reciprocity',
      description: 'Both peers commit equal dedication and respect to their mutual swap sessions.'
    },
    {
      title: 'Structured Agendas',
      description: 'Every session begins with clear learning outcomes so both partners make real progress.'
    },
    {
      title: 'Honest Evaluations',
      description: 'Certificates and community badges are earned through genuine, reciprocal peer feedback.'
    },
    {
      title: 'Zero Solicitation',
      description: 'Orbitus is strictly a peer-to-peer knowledge platform with no sales pitches or hidden fees.'
    }
  ];

  const currentShowcase = SHOWCASE_TABS.find((t) => t.id === activeTab) || SHOWCASE_TABS[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/40 dark:bg-[#12141a] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-150">
      {/* 1. Header / Navbar — Sleek, compact height and refined typography */}
      <motion.header
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="sticky top-0 z-40 bg-white/95 dark:bg-[#181d26]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Orbitus Home"
          >
            <BrandLogo size={26} className="h-6 w-6" />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-none">
                Orbitus
              </span>
              <span className="text-[8px] mt-0.5 font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase leading-none">
                SkillSwap
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links — Refined text size */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-600 dark:text-slate-300" aria-label="Main Navigation">
            <a
              href="#showcase"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              Interactive Preview
            </a>
            <a
              href="#how-it-works"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              How It Works
            </a>
            <a
              href="#why-orbitus"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              Why SkillSwap
            </a>
            <a
              href="#domains"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              Skill Domains
            </a>
            <a
              href="#community"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              Community Standards
            </a>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <motion.button
              type="button"
              whileHover={{ rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => dispatch(toggleTheme())}
              aria-label="Toggle visual theme"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {mode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </motion.button>

            {isAuthenticated ? (
              <motion.div whileHover={buttonHover} whileTap={buttonTap}>
                <Link
                  to="/dashboard"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-md text-xs font-semibold shadow-sm transition-colors inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Dashboard <ArrowRight size={12} />
                </Link>
              </motion.div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Sign in
                </Link>
                <motion.div whileHover={buttonHover} whileTap={buttonTap}>
                  <Link
                    to="/register"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-md text-xs font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 inline-block"
                  >
                    Get started
                  </Link>
                </motion.div>
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeInOut' }}
              aria-label="Mobile navigation"
              className="overflow-hidden md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181d26] px-4 pt-2.5 pb-4 space-y-2"
            >
              <div className="flex flex-col space-y-1 text-xs font-medium">
                <a
                  href="#showcase"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
                >
                  <Video size={14} className="text-indigo-500" /> Interactive Preview
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
                >
                  <ArrowLeftRight size={14} className="text-indigo-500" /> How It Works
                </a>
                <a
                  href="#why-orbitus"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
                >
                  <Layers size={14} className="text-indigo-500" /> Why SkillSwap
                </a>
                <a
                  href="#domains"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
                >
                  <BookOpen size={14} className="text-indigo-500" /> Skill Domains
                </a>
                <a
                  href="#community"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
                >
                  <CheckCircle2 size={14} className="text-indigo-500" /> Community Standards
                </a>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 bg-indigo-600 text-white rounded text-xs font-semibold"
                  >
                    Open Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-1.5 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-2 bg-indigo-600 text-white rounded text-xs font-semibold"
                    >
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>

      <main className="flex-1">
        {/* 2. Hero Section: Refined, compact typography and balanced padding */}
        <section className="pt-12 pb-14 sm:pt-16 sm:pb-18 md:pt-20 md:pb-22 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12141a]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-4"
            >
              {/* Clean non-bubble category header text */}
              <motion.p
                variants={fadeDown}
                className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400"
              >
                Direct Peer-to-Peer Knowledge Exchange
              </motion.p>

              <motion.h1
                variants={fadeUp}
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.2]"
              >
                Learn by teaching. <br />
                <span className="text-indigo-600 dark:text-indigo-400">
                  Trade skills directly with peers.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed"
              >
                Orbitus is a community platform where learners exchange knowledge 1-on-1 without money. Share what you know, master what you need, and earn verified credentials.
              </motion.p>

              {/* Primary Actions with Compact Proportions */}
              <motion.div
                variants={fadeUp}
                className="pt-2 flex flex-wrap items-center justify-center gap-3"
              >
                {isAuthenticated ? (
                  <motion.div whileHover={buttonHover} whileTap={buttonTap}>
                    <Link
                      to="/dashboard"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      Go to Dashboard <ArrowRight size={13} />
                    </Link>
                  </motion.div>
                ) : (
                  <>
                    <motion.div whileHover={buttonHover} whileTap={buttonTap}>
                      <Link
                        to="/register"
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <UserPlus size={13} />
                        Create Free Account
                      </Link>
                    </motion.div>
                    <motion.a
                      whileHover={buttonHover}
                      whileTap={buttonTap}
                      href="#showcase"
                      className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition-colors shadow-sm inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      Explore Platform
                    </motion.a>
                  </>
                )}
              </motion.div>

              {/* Verified Trust Strip */}
              <motion.div
                variants={fadeUp}
                className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80"
              >
                <div className="flex items-center justify-center gap-1.5 pt-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>100% Free Exchange</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 pt-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>1:1 Video Swaps</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 pt-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Active Study Groups</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 pt-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Verified Credentials</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 3. Dribbble-Style Interactive Feature Showcase Section */}
        <section id="showcase" className="py-12 sm:py-16 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151922] transition-colors">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="max-w-lg mx-auto text-center space-y-2"
            >
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
                Interactive Showcase
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                See How Orbitus Powers Knowledge Exchange
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch through core workflows to see the live toolset designed for genuine peer learning.
              </p>
            </motion.div>

            {/* Interactive Tab Switcher Bar */}
            <div className="flex justify-center">
              <div className="inline-flex p-1 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold">
                {SHOWCASE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-3.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-300 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeShowcaseTab"
                          className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md shadow-sm border border-slate-200/60 dark:border-slate-600"
                          transition={springTransition}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        <Icon size={14} />
                        <span>{tab.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Animated Tab Content Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: smoothEase }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 sm:p-7 rounded-xl bg-white dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                {/* Left Description Column */}
                <div className="md:col-span-6 space-y-3 text-left">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {currentShowcase.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {currentShowcase.description}
                  </p>
                  <div className="pt-1 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {currentShowcase.bullets.map((b) => (
                      <div key={b} className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Interactive Preview Card */}
                <div className="md:col-span-6">
                  <motion.div
                    whileHover={cardHover}
                    className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        {currentShowcase.preview.badge}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Ready
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {currentShowcase.preview.heading}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {currentShowcase.preview.meta}
                      </p>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      {currentShowcase.preview.points.map((pt) => (
                        <div key={pt} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                          <Check size={11} className="text-indigo-500 shrink-0" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* 4. Section: Why Peer Skill Exchange vs Passive Courses */}
        <section id="why-orbitus" className="py-12 sm:py-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12141a] transition-colors">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="max-w-lg mx-auto text-center space-y-2"
            >
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
                The Orbitus Philosophy
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Why Peer Exchange Beats Passive Video Courses
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Learning from pre-recorded videos leaves you isolated without feedback. Orbitus turns learning into an active dialogue.
              </p>
            </motion.div>

            {/* Compact structured comparison cards */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {COMPARISONS.map((comp) => (
                <motion.div
                  key={comp.title}
                  variants={fadeUp}
                  whileHover={cardHover}
                  className="p-4 sm:p-5 rounded-xl bg-slate-50/70 dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 transition-colors text-left"
                >
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {comp.title}
                  </h3>

                  <div className="space-y-2 text-[11px]">
                    <div className="border-l-2 border-slate-300 dark:border-slate-700 pl-2.5 py-0.5 space-y-0.5">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Traditional Courses</p>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{comp.course}</p>
                    </div>

                    <div className="border-l-2 border-indigo-600 dark:border-indigo-400 pl-2.5 py-0.5 space-y-0.5">
                      <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Orbitus SkillSwap</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{comp.orbitus}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 5. Section: How Skill Exchange Works — Compact Vertical Timeline */}
        <section id="how-it-works" className="py-12 sm:py-16 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151922] transition-colors">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="max-w-lg mx-auto text-center space-y-2"
            >
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
                Step-by-Step
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Direct Reciprocal Learning in 4 Steps
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                No middleman or monetary fees. Honest skill trading structured for real progress.
              </p>
            </motion.div>

            {/* Compact timeline flow */}
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6">
              {HOW_IT_WORKS.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.step}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeUp}
                    whileHover={cardHover}
                    className="relative group p-4 sm:p-5 rounded-xl bg-white dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 hover:border-indigo-400/50 dark:hover:border-indigo-500/50 shadow-sm transition-colors text-left"
                  >
                    {/* Compact timeline node */}
                    <div className="absolute -left-[31px] top-5 w-3.5 h-3.5 rounded-full bg-white dark:bg-[#12141a] border-2 border-indigo-600 dark:border-indigo-400 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="text-indigo-600 dark:text-indigo-400">
                          <Icon size={16} />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            {item.title}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-slate-300 dark:text-slate-700 font-mono">
                        {item.step}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-2">
                      {item.description}
                    </p>

                    <div className="pt-2 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Check size={11} className="text-emerald-500" />
                      <span>{item.highlight}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. Skill Domains / Real Categories — Compact 4x2 Grid */}
        <section id="domains" className="py-12 sm:py-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12141a]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="max-w-lg mx-auto text-center space-y-2"
            >
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
                Skill Catalog
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Exchange Across 8 Diverse Subject Domains
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Whether you build software, speak multiple languages, or produce music, find peers ready to exchange knowledge with you.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {SKILL_DOMAINS.map((domain) => {
                const Icon = domain.icon;
                return (
                  <motion.div
                    key={domain.name}
                    variants={scaleUp}
                    whileHover={cardHover}
                    className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 hover:border-indigo-400/50 dark:hover:border-indigo-500/50 space-y-1.5 shadow-sm transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Icon size={15} />
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {domain.name}
                      </h3>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
                      {domain.topics}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* 7. Community Principles & Mutual Accountability */}
        <section id="community" className="py-12 sm:py-16 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151922] transition-colors">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="max-w-lg mx-auto text-center space-y-2"
            >
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
                Community Standards
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Built on Mutual Respect and Accountability
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Four guiding rules ensure every session on Orbitus is welcoming, productive, and focused on genuine learning.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {COMMUNITY_PILLARS.map((pillar) => (
                <motion.div
                  key={pillar.title}
                  variants={fadeUp}
                  whileHover={cardHover}
                  className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 hover:border-emerald-400/50 dark:hover:border-emerald-500/50 space-y-1.5 shadow-sm text-left transition-colors"
                >
                  <div className="text-emerald-600 dark:text-emerald-400 mb-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 8. Final Call to Action — Clean & Compact */}
        <section className="py-14 sm:py-20 bg-white dark:bg-[#12141a] transition-colors">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={scaleUp}
            className="max-w-xl mx-auto px-4 sm:px-6 text-center space-y-4"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Ready to start swapping skills?
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Create your profile in two minutes, declare what you can teach, and start learning directly from peers who know what you want to master.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              {isAuthenticated ? (
                <motion.div whileHover={buttonHover} whileTap={buttonTap} className="w-full sm:w-auto">
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold transition-colors shadow-sm inline-flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    Go to Dashboard <ArrowRight size={13} />
                  </Link>
                </motion.div>
              ) : (
                <>
                  <motion.div whileHover={buttonHover} whileTap={buttonTap} className="w-full sm:w-auto">
                    <Link
                      to="/register"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold transition-colors shadow-sm inline-flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <UserPlus size={13} />
                      Create Free Account
                    </Link>
                  </motion.div>
                  <motion.div whileHover={buttonHover} whileTap={buttonTap} className="w-full sm:w-auto">
                    <Link
                      to="/login"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition-colors shadow-sm inline-flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      Sign In
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        </section>
      </main>

      {/* 9. Footer — Compact typography */}
      <motion.footer
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={fadeIn}
        className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#181d26] py-10 transition-colors"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BrandLogo size={20} className="h-5 w-5" />
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">Orbitus</span>
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                  SkillSwap
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
                A zero-currency peer-to-peer platform where learners exchange knowledge, schedule 1-on-1 video sessions, and earn verifiable credentials.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <a href="#showcase" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Interactive Preview
              </a>
              <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                How It Works
              </a>
              <a href="#why-orbitus" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Why SkillSwap
              </a>
              <a href="#domains" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Skill Domains
              </a>
              <a href="#community" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Community Standards
              </a>
              <Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Sign in
              </Link>
              <Link to="/register" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Create account
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400">
            <div>
              &copy; {new Date().getFullYear()} Orbitus SkillSwap Platform. All rights reserved. Zero-currency peer learning.
            </div>
            <div className="flex items-center gap-3">
              <span>Timezone: <strong className="font-mono text-slate-600 dark:text-slate-300">Asia/Kolkata (IST)</strong></span>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default LandingPage;
