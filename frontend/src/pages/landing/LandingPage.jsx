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
  Check,
  Lock
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
  const smoothEase = [0.16, 1, 0.3, 1];

  const springTransition = {
    type: 'spring',
    stiffness: 120,
    damping: 18,
    mass: 0.8
  };

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
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.04
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

  // 5 Floating Capability Cards in the Hero Viewport (Dribbble Frame 01)
  const HERO_FLOATING_CARDS = [
    {
      id: 'react',
      title: 'React & TypeScript',
      sub: 'Frontend Architecture',
      tag: 'Peer Swap',
      icon: Code2,
      duration: 4.4,
      yOffset: -7,
      delay: 0
    },
    {
      id: 'python',
      title: 'Python & FastApi',
      sub: 'Data & Backend Services',
      tag: 'Peer Swap',
      icon: Layers,
      duration: 5.0,
      yOffset: 8,
      delay: 0.5
    },
    {
      id: 'video',
      title: '1:1 Live Swap Room',
      sub: 'In-Browser WebRTC Call',
      tag: 'Instant Session',
      icon: Video,
      duration: 4.2,
      yOffset: -9,
      delay: 1.0,
      isHighlighted: true
    },
    {
      id: 'uiux',
      title: 'UI/UX & Figma',
      sub: 'Design Systems & Motion',
      tag: 'Peer Swap',
      icon: Palette,
      duration: 4.8,
      yOffset: 7,
      delay: 0.8
    },
    {
      id: 'languages',
      title: 'Fluent English & Spanish',
      sub: 'Real-time Conversation',
      tag: 'Language Swap',
      icon: Languages,
      duration: 4.1,
      yOffset: -6,
      delay: 1.3
    }
  ];

  // Interactive Feature Showcase Data (Dribbble Frame 05 Mockup)
  const SHOWCASE_TABS = [
    {
      id: 'sessions',
      label: '1:1 Video Swaps',
      icon: Video,
      title: 'In-Browser Video Rooms with Pre-Session Agendas',
      description: 'Schedule focused learning sessions with peers. Every confirmed swap generates an integrated, download-free video meeting room with agenda checklists to keep learning structured.',
      bullets: [
        'Integrated WebRTC video calling — zero third-party downloads',
        'Structured pre-session agendas with reciprocal time breakdown',
        'Mutual completion checklists and review prompts'
      ],
      previewType: 'video'
    },
    {
      id: 'groups',
      label: 'Study Circles',
      icon: Users2,
      title: 'Persistent Collaborative Circles with Live Chat',
      description: 'Join subject-focused learning circles or build your own. Collaborate with multiple peers simultaneously, ask questions, share project code, and coordinate group sessions.',
      bullets: [
        'Real-time group discussions with code & resource sharing',
        'Built-in member management and group video coordination',
        'Subject channels across Programming, Design, and Languages'
      ],
      previewType: 'group'
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
      previewType: 'roadmap'
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
      previewType: 'certificate'
    }
  ];

  // 4 Connected Nodes for Architecture Flow (Dribbble Frame 10)
  const ARCHITECTURE_STEPS = [
    {
      step: '01',
      title: 'Mutual Skill Match',
      subtitle: 'Two-Way Reciprocal Engine',
      description: 'Declare the subjects you can teach and what you want to learn. The platform pairs peers whose availability and interests complement each other.',
      icon: ArrowLeftRight
    },
    {
      step: '02',
      title: '1:1 Video Swaps',
      subtitle: 'Integrated WebRTC Rooms',
      description: 'Book a confirmed slot on the calendar. Join directly via in-browser video equipped with shared agenda outlines and checklists.',
      icon: Video
    },
    {
      step: '03',
      title: 'Study Circles',
      subtitle: 'Continuous Peer Support',
      description: 'Deepen understanding in community study groups with real-time text chat, shared code snippets, and group meetups.',
      icon: Users2
    },
    {
      step: '04',
      title: 'Verified Proof',
      subtitle: 'Reciprocal Signoff IDs',
      description: 'Submit mutual session evaluations upon completion to unlock verified certificates with permanent cryptographic hash IDs.',
      icon: Award
    }
  ];

  // High-Contrast Dark Tier Cards (Dribbble Frame 15/18)
  const PEER_TIERS = [
    {
      name: 'Self-Directed Learner',
      price: '$0',
      period: 'forever free',
      description: 'Ideal for independent exploration and discovering high-quality learning paths.',
      highlight: false,
      features: [
        'Explore complete skill catalogs & domains',
        'Access all public study groups & discussions',
        'Track personal milestone learning roadmaps',
        'Activity heatmap & streak monitoring',
        'No credit card or payment info ever needed'
      ]
    },
    {
      name: 'Active Peer Swapper',
      price: '$0',
      period: 'forever free',
      description: 'Our core reciprocal exchange model designed for hands-on, accelerated learning.',
      highlight: true,
      features: [
        'Everything in Self-Directed Learner',
        'Unlimited 1:1 in-browser video swap sessions',
        'Mutual post-session evaluations & ratings',
        'Mint permanent verified skill credentials',
        'Real-time direct messaging with learning peers'
      ]
    },
    {
      name: 'Community Mentor',
      price: '$0',
      period: 'forever free',
      description: 'For experienced practitioners who enjoy guiding study circles and mentoring.',
      highlight: false,
      features: [
        'Everything in Active Peer Swapper',
        'Create & moderate custom study circles',
        'Publish learning roadmaps for the community',
        'Top contributor status on leaderboard',
        'Priority reciprocal matching algorithm'
      ]
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
              href="#architecture"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              How It Works
            </a>
            <a
              href="#tiers"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              Free Tiers
            </a>
            <a
              href="#domains"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              Skill Domains
            </a>
            <a
              href="#standards"
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
                  href="#architecture"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
                >
                  <ArrowLeftRight size={14} className="text-indigo-500" /> How It Works
                </a>
                <a
                  href="#tiers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
                >
                  <Layers size={14} className="text-indigo-500" /> Free Tiers
                </a>
                <a
                  href="#domains"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
                >
                  <BookOpen size={14} className="text-indigo-500" /> Skill Domains
                </a>
                <a
                  href="#standards"
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
        {/* 2. Hero Section: Full Viewport Height Canvas with Floating Motion Arc (Dribbble Frame 01) */}
        <section className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-between pt-8 pb-8 sm:pt-12 sm:pb-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12141a] relative overflow-hidden">
          {/* Subtle background ambient glow for spatial depth */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />

          {/* Top/Center: Hero Text & Call to Action */}
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-4 my-auto relative z-10">
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
                className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.2]"
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
                className="pt-1 flex flex-wrap items-center justify-center gap-3"
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
                className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80"
              >
                <div className="flex items-center justify-center gap-1.5 pt-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>100% Free Exchange</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 pt-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>1:1 Video Swaps</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 pt-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Active Study Circles</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 pt-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Verified Proof</span>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom of First Viewport: Floating Capabilities Arc from Dribbble Reference */}
          <div className="w-full max-w-5xl mx-auto px-4 pt-6 sm:pt-8 relative z-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {HERO_FLOATING_CARDS.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    animate={{
                      opacity: 1,
                      y: shouldReduceMotion ? 0 : [0, card.yOffset, 0]
                    }}
                    transition={{
                      opacity: { duration: 0.5, delay: idx * 0.1 },
                      y: {
                        duration: card.duration,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: card.delay
                      }
                    }}
                    whileHover={cardHover}
                    className={`p-3 sm:p-3.5 rounded-xl border text-left shadow-sm transition-colors ${
                      card.isHighlighted
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700/80'
                        : 'bg-white dark:bg-[#181d26] border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5">
                      <div className={`p-1.5 rounded-md ${card.isHighlighted ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}`}>
                        <Icon size={14} />
                      </div>
                      <span className="text-[9px] font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
                        {card.tag}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {card.title}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {card.sub}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. Dribbble-Style Browser Mockup Interactive Showcase (Frame 05) */}
        <section id="showcase" className="py-14 sm:py-20 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151922] transition-colors">
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

            {/* Browser Frame Mockup Container */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={scaleUp}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181d26] shadow-xl overflow-hidden"
            >
              {/* Browser Window Header with Traffic Lights & URL Bar */}
              <div className="px-4 py-2.5 bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>

                <div className="flex-1 max-w-sm mx-auto bg-white dark:bg-slate-900 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-mono">
                  <Lock size={10} className="text-emerald-500" />
                  <span>orbitus.app/workspace/{activeTab}</span>
                </div>

                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">Connected</span>
                </div>
              </div>

              {/* Showcase Tab Switcher Row */}
              <div className="px-4 pt-3 pb-1 border-b border-slate-200 dark:border-slate-800 flex justify-center">
                <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold">
                  {SHOWCASE_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative px-3 sm:px-3.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
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
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inside Browser Window: Dynamic Tab Visual */}
              <div className="p-5 sm:p-7">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: smoothEase }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
                  >
                    {/* Left Column: Description */}
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

                    {/* Right Column: Live App Mockup UI */}
                    <div className="md:col-span-6">
                      <motion.div
                        whileHover={cardHover}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 space-y-3 text-left shadow-inner transition-colors"
                      >
                        {/* 1. Video Mockup */}
                        {currentShowcase.previewType === 'video' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="h-24 rounded-lg bg-slate-800 text-white flex flex-col justify-between p-2 relative overflow-hidden border border-slate-700">
                                <span className="text-[10px] font-medium text-slate-300">Alex · Teaching React</span>
                                <div className="self-end px-1.5 py-0.5 rounded bg-emerald-500/80 text-[8px] font-bold text-white">
                                  Speaking
                                </div>
                              </div>
                              <div className="h-24 rounded-lg bg-slate-700 text-white flex flex-col justify-between p-2 relative overflow-hidden border border-slate-600">
                                <span className="text-[10px] font-medium text-slate-300">Sarah · Learning TS</span>
                                <div className="self-end px-1.5 py-0.5 rounded bg-slate-900/80 text-[8px] font-semibold text-slate-300">
                                  Listening
                                </div>
                              </div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-[10px] uppercase tracking-wide">
                                Shared Agenda Checklist
                              </span>
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <Check size={11} className="text-emerald-500" />
                                <span>30m: React Custom Hooks & Memory Leaks</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <Check size={11} className="text-emerald-500" />
                                <span>30m: Python Asyncio & FastApi Routers</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. Group Chat Mockup */}
                        {currentShowcase.previewType === 'group' && (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 text-xs font-bold text-slate-900 dark:text-white">
                              <span>Fullstack Systems Circle</span>
                              <span className="text-[10px] text-emerald-500 font-semibold">18 Online</span>
                            </div>
                            <div className="space-y-2 text-[11px]">
                              <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-[10px]">Priya K.</span>
                                <p className="text-slate-600 dark:text-slate-300 text-[11px]">Any peer available tonight for a 45m swap on Docker Compose & Nginx?</p>
                              </div>
                              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg border border-indigo-200 dark:border-indigo-800/60 ml-4">
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-[10px]">Dev M.</span>
                                <p className="text-slate-600 dark:text-slate-300 text-[11px]">Yes! I can do 8:00 PM IST. Booking the video room now.</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3. Roadmap Mockup */}
                        {currentShowcase.previewType === 'roadmap' && (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1.5">
                              <span>Curriculum: Fullstack TypeScript</span>
                              <span className="text-[10px] text-indigo-500">67% Complete</span>
                            </div>
                            <div className="space-y-1.5 text-[11px]">
                              <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <CheckCircle2 size={13} />
                                  <span>Phase 1: Generics & Strict Type-Safety</span>
                                </div>
                                <span className="text-[9px] uppercase font-bold text-slate-400">Done</span>
                              </div>
                              <div className="p-2 rounded bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-800 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold">
                                  <Compass size={13} className="text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
                                  <span>Phase 2: Fullstack Monorepos & TRPC</span>
                                </div>
                                <span className="text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Current</span>
                              </div>
                              <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-slate-400">
                                <div className="flex items-center gap-2">
                                  <span className="w-3.5 h-3.5 rounded-full border border-slate-400" />
                                  <span>Phase 3: Production Deployment & Docker</span>
                                </div>
                                <span className="text-[9px] uppercase font-bold">Next</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 4. Certificate Mockup */}
                        {currentShowcase.previewType === 'certificate' && (
                          <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-left">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1.5">
                              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                Cryptographic Credential
                              </span>
                              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                Verified
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                Peer Knowledge Exchange: System Architecture
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Hash ID: ORB-2026-F982B-VALID
                              </p>
                            </div>
                            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-500">
                              <span>Signoff: Mutual Evaluation Passed</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Shareable Link</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 4. Connected Node Architecture Flow (Dribbble Frame 10) */}
        <section id="architecture" className="py-14 sm:py-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12141a] transition-colors">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="max-w-lg mx-auto text-center space-y-2"
            >
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
                Peer Architecture
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                A Frictionless Knowledge Loop
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                How learners connect, schedule, collaborate, and earn verified recognition on Orbitus without monetary friction.
              </p>
            </motion.div>

            {/* Visual Connected 4-Node Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
              {ARCHITECTURE_STEPS.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.step}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeUp}
                    whileHover={cardHover}
                    className="p-4 sm:p-5 rounded-xl bg-slate-50/70 dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 hover:border-indigo-400/50 dark:hover:border-indigo-500/50 shadow-sm transition-colors text-left flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                          <Icon size={18} />
                        </div>
                        <span className="text-sm font-mono font-black text-slate-300 dark:text-slate-700">
                          {step.step}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {step.title}
                        </h3>
                        <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                          {step.subtitle}
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Phase {idx + 1}</span>
                      <span className="text-emerald-500 font-semibold">Ready</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Dribbble High-Contrast Dark Tier Canvas (Frame 15 & 18) */}
        <section id="tiers" className="py-16 sm:py-24 bg-[#0b0f17] text-white border-b border-slate-800 transition-colors relative overflow-hidden">
          {/* Subtle cosmic ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 blur-[130px] pointer-events-none rounded-full" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10 relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="max-w-lg mx-auto text-center space-y-2"
            >
              <p className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase">
                The 100% Free Peer Economy
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Knowledge Is A Reciprocal Currency
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero paywalls, zero subscription tiers, and no credit card required. You pay with your knowledge and focus.
              </p>
            </motion.div>

            {/* 3 Tier Comparison Cards */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              {PEER_TIERS.map((tier) => (
                <motion.div
                  key={tier.name}
                  variants={fadeUp}
                  whileHover={cardHover}
                  className={`p-5 sm:p-6 rounded-2xl flex flex-col justify-between text-left transition-colors relative ${
                    tier.highlight
                      ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-2 border-indigo-500 shadow-xl'
                      : 'bg-slate-900/80 border border-slate-800'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        {tier.name}
                      </span>
                      {tier.highlight && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-600 text-white">
                          Core Model
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-white font-mono">{tier.price}</span>
                        <span className="text-[11px] text-slate-400 font-medium">/ {tier.period}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {tier.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                      {tier.features.map((feat) => (
                        <div key={feat} className="flex items-start gap-2 text-slate-300">
                          <Check size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-tight">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-4">
                    <Link
                      to={isAuthenticated ? '/dashboard' : '/register'}
                      className={`w-full py-2.5 rounded-lg text-xs font-semibold text-center transition-colors inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        tier.highlight
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isAuthenticated ? 'Open Dashboard' : 'Join as a Peer'}
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Quick Differentiator Comparison Against Paid Courses */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs"
            >
              <div className="space-y-0.5 p-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Commercial Bootcamps</span>
                <p className="text-slate-300 font-semibold">$10,000+ upfront debt</p>
                <p className="text-[10px] text-slate-500">Orbitus: $0 (Trade knowledge)</p>
              </div>
              <div className="space-y-0.5 p-2 border-t sm:border-t-0 sm:border-x border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Pre-Recorded Courses</span>
                <p className="text-slate-300 font-semibold">90%+ dropout rate</p>
                <p className="text-[10px] text-slate-500">Orbitus: Live partner accountability</p>
              </div>
              <div className="space-y-0.5 p-2 border-t sm:border-t-0 border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Passive Videos</span>
                <p className="text-slate-300 font-semibold">One-way monologue</p>
                <p className="text-[10px] text-slate-500">Orbitus: 1:1 active dialogue</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 6. Skill Domains / Real Categories — Compact 4x2 Grid */}
        <section id="domains" className="py-14 sm:py-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12141a]">
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
        <section id="standards" className="py-14 sm:py-20 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151922] transition-colors">
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
              <a href="#architecture" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                How It Works
              </a>
              <a href="#tiers" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Free Tiers
              </a>
              <a href="#domains" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Skill Domains
              </a>
              <a href="#standards" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
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
