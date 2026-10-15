import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, useReducedMotion } from 'framer-motion';
import { toggleTheme } from '../../features/themeSlice.js';
import {
  ArrowRight,
  Search,
  UserPlus,
  BookOpen,
  Users,
  Video,
  Sun,
  Moon,
  Menu,
  X,
  ArrowLeftRight,
  ShieldCheck,
  Calendar,
  MessageSquare,
  Compass,
  Trophy,
  Flame,
  Award,
  Check,
  CheckCircle2,
  Share2,
  Heart,
  MessageCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import { useDocumentHead } from '../../hooks/useDocumentHead.js';

const LandingPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  const shouldReduceMotion = useReducedMotion();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroPairingTab, setHeroPairingTab] = useState('code-design');
  const [feedLiked, setFeedLiked] = useState(false);

  const isAuthenticated = Boolean(token && user);

  useDocumentHead({
    title: 'Orbitus — Peer-to-Peer Skill Exchange Platform',
    description: 'Learn and teach skills together. Orbitus connects developers, designers, and learners for reciprocal 1:1 learning sessions, study groups, and verified credentials.',
    canonical: 'https://orbitus-skill-swap-platform.vercel.app/'
  });

  // Motion variants with full reduced-motion accessibility support
  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.5,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const staggerList = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.04
      }
    }
  };

  // Authentic pairing datasets based on real skills in Orbitus
  const PAIRINGS = {
    'code-design': {
      title: 'Code & Product Design',
      peerA: {
        name: 'Aarav Sharma',
        role: 'Fullstack Dev',
        avatarBg: 'bg-indigo-600',
        teaches: ['React.js', 'Node.js', 'TypeScript'],
        wants: ['UI/UX in Figma', 'Design Systems']
      },
      peerB: {
        name: 'Maya Patel',
        role: 'Product Designer',
        avatarBg: 'bg-emerald-600',
        teaches: ['UI/UX in Figma', 'Design Systems'],
        wants: ['React.js', 'Frontend Logic']
      },
      nextSession: 'Upcoming: 1-hour swap on Component Architecture & Design Tokens'
    },
    'data-cloud': {
      title: 'Data & Cloud Infrastructure',
      peerA: {
        name: 'David Chen',
        role: 'Data Analyst',
        avatarBg: 'bg-sky-600',
        teaches: ['Python for Beginners', 'Pandas & Data Cleaning'],
        wants: ['Docker & Containers', 'PostgreSQL Optimization']
      },
      peerB: {
        name: 'Priya Nair',
        role: 'DevOps Engineer',
        avatarBg: 'bg-amber-600',
        teaches: ['Docker & Containers', 'PostgreSQL & Database Design'],
        wants: ['Python Automation', 'Data Scripting']
      },
      nextSession: 'Upcoming: 45-min swap on Containerizing Python ETL Pipelines'
    },
    'language-career': {
      title: 'Language & Interview Prep',
      peerA: {
        name: 'Kenji Takahashi',
        role: 'Frontend Engineer',
        avatarBg: 'bg-rose-600',
        teaches: ['Japanese for Beginners', 'JLPT N5 Prep'],
        wants: ['Business English & Negotiation']
      },
      peerB: {
        name: 'Sarah Miller',
        role: 'Tech Writer & Speaker',
        avatarBg: 'bg-purple-600',
        teaches: ['Business English & Negotiation', 'Public Speaking'],
        wants: ['Conversational Japanese']
      },
      nextSession: 'Upcoming: 1-hour swap on Technical Interviews & Japanese Conversation'
    }
  };

  const activePair = PAIRINGS[heroPairingTab];

  // 4 Simple steps for How It Works
  const HOW_IT_WORKS = [
    {
      step: '01',
      title: 'Publish Your Skill Profile',
      description: 'List the skills you can mentor in and the exact topics you want to learn. No tokens, paywalls, or fees.',
      icon: Users
    },
    {
      step: '02',
      title: 'Discover Reciprocal Matches',
      description: 'Orbitus highlights peers whose learning targets match your teaching strengths for a genuine, mutual exchange.',
      icon: ArrowLeftRight
    },
    {
      step: '03',
      title: 'Schedule 1-on-1 Sessions',
      description: 'Pick a mutual time, outline session objectives, and meet directly in integrated video rooms with agenda notes.',
      icon: Calendar
    },
    {
      step: '04',
      title: 'Earn Verified Credentials',
      description: 'Submit mutual reviews to build community reputation and mint shareable skill certificates with unique verification IDs.',
      icon: Award
    }
  ];

  // Mini Heatmap matrix representation for Learning Activity preview (12 weeks)
  const HEATMAP_WEEKS = [
    [1, 0, 2, 0, 1, 0, 2],
    [0, 2, 1, 3, 0, 2, 1],
    [2, 1, 0, 2, 3, 1, 0],
    [1, 3, 2, 1, 0, 2, 3],
    [0, 1, 3, 2, 1, 0, 2],
    [2, 0, 1, 3, 2, 1, 3],
    [1, 2, 0, 2, 1, 3, 2],
    [3, 1, 2, 0, 3, 2, 1],
    [2, 3, 1, 2, 0, 1, 3],
    [1, 2, 3, 1, 2, 0, 2],
    [2, 1, 2, 3, 1, 3, 1],
    [3, 2, 1, 2, 3, 2, 3]
  ];

  const getHeatmapColor = (level) => {
    switch (level) {
      case 1:
        return 'bg-emerald-200 dark:bg-emerald-900/60';
      case 2:
        return 'bg-emerald-400 dark:bg-emerald-600';
      case 3:
        return 'bg-emerald-600 dark:bg-emerald-500';
      default:
        return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  const FAQS = [
    {
      q: 'Is Orbitus truly free to use?',
      a: 'Yes. Orbitus operates entirely on reciprocal skill exchange. You exchange your time and knowledge directly with peers without money or tokens.'
    },
    {
      q: 'What if I am a beginner with nothing advanced to teach?',
      a: 'Everyone has valuable skills. Beginners frequently teach introductory tool setups, basic coding syntax, conversational language practice, or collaborate as study accountability partners.'
    },
    {
      q: 'How do video sessions work?',
      a: 'When you confirm a booking, an integrated video room link (or custom Google Meet) is automatically prepared in your Bookings dashboard along with a shared agenda.'
    },
    {
      q: 'How does Orbitus verify certificates?',
      a: 'Certificates are issued only after both participants complete a scheduled session and submit reciprocal feedback. Each certificate is minted with a permanent, unique alphanumeric ID that can be verified publicly.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/40 dark:bg-[#12141a] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-150">
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#181d26]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Orbitus Home"
          >
            <BrandLogo size={32} className="h-8 w-8" />
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                Orbitus
              </span>
              <span className="text-[10px] mt-0.5 font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase leading-none">
                SkillSwap
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300" aria-label="Main Navigation">
            <Link
              to="/explore"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              Browse Skills
            </Link>
            <a
              href="#features"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              Platform Features
            </a>
            <Link
              to="/groups"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              Study Groups
            </Link>
            <Link
              to="/feed"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              Community Feed
            </Link>
            <Link
              to="/leaderboard"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              Leaderboard
            </Link>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              aria-label="Toggle visual theme"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Get started
                </Link>
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181d26] px-4 pt-3 pb-6 space-y-3"
          >
            <div className="grid grid-cols-2 gap-2 text-sm font-medium">
              <Link
                to="/explore"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
              >
                <Search size={16} className="text-indigo-500" /> Browse Skills
              </Link>
              <Link
                to="/groups"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
              >
                <BookOpen size={16} className="text-indigo-500" /> Study Groups
              </Link>
              <Link
                to="/feed"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
              >
                <MessageSquare size={16} className="text-indigo-500" /> Community Feed
              </Link>
              <Link
                to="/leaderboard"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
              >
                <Trophy size={16} className="text-indigo-500" /> Leaderboard
              </Link>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
                >
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-slate-700 dark:text-slate-200 text-sm font-semibold"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        {/* 2. Hero Section: Direct Value Proposition + Live Match Simulator */}
        <section className="pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12141a]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              {/* Left Column: Headline and Actions */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="lg:col-span-7 space-y-6 text-left"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                  <ArrowLeftRight size={13} className="text-indigo-600 dark:text-indigo-400" />
                  Direct Peer-to-Peer Knowledge Exchange
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.14]">
                  Learn by teaching. <br />
                  <span className="text-indigo-600 dark:text-indigo-400">
                    Trade skills directly with peers.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  Orbitus connects developers, designers, and learners to exchange knowledge 1-on-1 without money. Share what you know, master what you need, and earn verified skill credentials.
                </p>

                {/* Primary Actions */}
                <div className="pt-1 flex flex-wrap items-center gap-3.5">
                  <Link
                    to="/explore"
                    className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold transition-colors shadow-sm inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <Search size={16} className="text-slate-500" />
                    Explore skills
                  </Link>

                  {isAuthenticated ? (
                    <Link
                      to="/dashboard"
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      Go to Dashboard <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <Link
                      to="/register"
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <UserPlus size={16} />
                      Create account
                    </Link>
                  )}
                </div>

                {/* Core Commitments Strip */}
                <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>Zero Money Required</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>1:1 Video Swaps</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>Verified Proof IDs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>Active Study Circles</span>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Hero Visual Product Preview */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="lg:col-span-5"
              >
                <div className="bg-white dark:bg-[#181d26] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-5 sm:p-6 space-y-4">
                  {/* Category switcher */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Reciprocal Match Preview
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Two-way complementary swap
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                      Mutual Fit
                    </span>
                  </div>

                  {/* Subject Tab Switcher */}
                  <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setHeroPairingTab('code-design')}
                      className={`flex-1 py-1 px-1.5 rounded-md transition-colors ${
                        heroPairingTab === 'code-design'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Web & UX
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroPairingTab('data-cloud')}
                      className={`flex-1 py-1 px-1.5 rounded-md transition-colors ${
                        heroPairingTab === 'data-cloud'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Data & Cloud
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroPairingTab('language-career')}
                      className={`flex-1 py-1 px-1.5 rounded-md transition-colors ${
                        heroPairingTab === 'language-career'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Languages
                    </button>
                  </div>

                  {/* Peer A Card */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${activePair.peerA.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                          {activePair.peerA.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {activePair.peerA.name}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {activePair.peerA.role}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                        Teaches
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {activePair.peerA.teaches.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Swap Connector */}
                  <div className="flex items-center justify-center py-0.5">
                    <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                      <ArrowLeftRight size={12} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Direct 1-on-1 Swap</span>
                    </div>
                  </div>

                  {/* Peer B Card */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${activePair.peerB.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                          {activePair.peerB.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {activePair.peerB.name}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {activePair.peerB.role}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
                        Teaches
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {activePair.peerB.teaches.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Session Scheduled Notice */}
                  <div className="rounded-xl bg-slate-900 dark:bg-black text-white p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <Video size={16} className="text-emerald-400 shrink-0" />
                      <p className="font-semibold text-[11px] text-slate-200 truncate">
                        {activePair.nextSession}
                      </p>
                    </div>
                    <Link
                      to="/explore"
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-[11px] transition-colors shrink-0"
                    >
                      Find Peers
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 3. Section: How Skill Exchange Works (4 Scannable Steps) */}
        <section id="how-it-works" className="py-16 md:py-24 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151922] transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="max-w-2xl mx-auto text-center space-y-3 mb-12 md:mb-16"
            >
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                How It Works
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Direct, Reciprocal Learning in 4 Steps
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                No middleman or monetary fees. Pure mutual learning organized through 4 structured steps.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerList}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {HOW_IT_WORKS.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.step}
                    variants={fadeUp}
                    className="p-6 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <Icon size={20} />
                      </div>
                      <span className="text-xl font-black text-slate-300 dark:text-slate-700 font-mono">
                        {item.step}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* 4. Orbitus Features Showcase — Real Capabilities in Action */}
        <section id="features" className="py-16 md:py-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12141a]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-20 md:space-y-28">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="max-w-2xl mx-auto text-center space-y-3"
            >
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                Platform Features
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Built for Genuine Learning Swaps
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Discover the real user-facing features that empower thousands of peers to teach and learn collaboratively.
              </p>
            </motion.div>

            {/* Feature 1: Skills Browse & Peer Discovery */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="lg:col-span-6 space-y-4 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Search size={20} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Browse 30+ Skills & Find Compatible Peers
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Filter by category, search specific technologies, and connect with peers ready to teach what you want to learn. No guesswork—see exact match percentages and availability before reaching out.
                </p>
                <div className="pt-2">
                  <Link
                    to="/explore"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Browse Skill Catalog <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="lg:col-span-6"
              >
                {/* Authentic Skill Catalog Card Preview */}
                <div className="bg-slate-50 dark:bg-[#181d26] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      Programming & Tech
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      12 Active Mentors
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      React.js & Architecture
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Component design, custom hooks, state synchronization, and scalable frontend architecture.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] text-slate-700 dark:text-slate-200">
                      Frontend
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] text-slate-700 dark:text-slate-200">
                      TypeScript
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] text-slate-700 dark:text-slate-200">
                      Next.js
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Reciprocal exchange ready
                    </span>
                    <Link
                      to="/explore"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Propose Swap
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Feature 2: 1:1 Session Bookings & Integrated Video */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="lg:col-span-6 lg:order-2 space-y-4 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Video size={20} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Schedule 1-on-1 Sessions with Built-in Video
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Propose session slots, confirm mutually agreed times, and join directly via integrated video meeting rooms. Shared agendas and notes keep every session productive.
                </p>
                <div className="pt-2">
                  <Link
                    to="/bookings"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View Sessions & Bookings <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="lg:col-span-6 lg:order-1"
              >
                {/* Authentic Booking Card Preview */}
                <div className="bg-slate-50 dark:bg-[#181d26] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-indigo-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Confirmed Booking #284
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                      Confirmed
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      1:1 Swap: React Component Patterns & Design Systems
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Partner: Maya Patel</span>
                      <span>•</span>
                      <span>45 Minutes</span>
                      <span>•</span>
                      <span>Today 4:00 PM</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Video size={16} className="text-emerald-500" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Orbitus Video Room Ready
                      </span>
                    </div>
                    <Link
                      to="/bookings"
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs"
                    >
                      Join Call
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Feature 3: Collaborative Study Groups & Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="lg:col-span-6 space-y-4 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Join Active Study Groups & Group Discussions
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Connect with peer learning circles centered on specific technologies and subjects. Share resources, ask questions, and host group study calls with dedicated discussion channels.
                </p>
                <div className="pt-2">
                  <Link
                    to="/groups"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Explore Study Groups <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="lg:col-span-6"
              >
                {/* Authentic Study Group Card Preview */}
                <div className="bg-slate-50 dark:bg-[#181d26] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                        FS
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Fullstack & Cloud Builders
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Programming & Tech • 38 members
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                      Active
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Aarav: <span className="font-normal text-slate-600 dark:text-slate-300">Shared the session notes on PostgreSQL connection pooling in the resources tab!</span></p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Elena: <span className="font-normal text-slate-600 dark:text-slate-300">Joining today&apos;s code review call at 5:00 PM.</span></p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Live text & video rooms</span>
                    <Link
                      to="/groups"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Join Group
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Feature 4: Community Feed & Social Exchange */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="lg:col-span-6 lg:order-2 space-y-4 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Share2 size={20} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Community Feed: Share Progress & Learn in Public
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Post learning milestones, ask questions to the community, and interact with peers through likes, comments, and resource recommendations.
                </p>
                <div className="pt-2">
                  <Link
                    to="/feed"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Open Community Feed <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="lg:col-span-6 lg:order-1"
              >
                {/* Authentic Community Feed Card Preview */}
                <div className="bg-slate-50 dark:bg-[#181d26] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        AS
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Aarav Sharma
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Shared an update • 2h ago
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 font-bold">
                      Completed Swap
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Just wrapped up a great 1-on-1 session on Redis caching patterns and Docker multi-container networks with @Priya. Teaching it out loud clarified so many architecture details!
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    <span>#WebDev</span>
                    <span>#SystemDesign</span>
                    <span>#LearningInPublic</span>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => setFeedLiked(!feedLiked)}
                      className={`flex items-center gap-1 font-semibold transition-colors ${
                        feedLiked ? 'text-rose-500' : 'hover:text-rose-500'
                      }`}
                    >
                      <Heart size={14} className={feedLiked ? 'fill-rose-500' : ''} />
                      <span>{feedLiked ? '15 Likes' : '14 Likes'}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <MessageCircle size={14} />
                      <span>4 Comments</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Feature 5: AI Learning Roadmaps */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="lg:col-span-6 space-y-4 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Compass size={20} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Step-by-Step Learning Roadmaps
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Generate structured milestone roadmaps for any technology or subject. Break complex learning goals into clear prerequisites, practice tasks, and project checkpoints.
                </p>
                <div className="pt-2">
                  <Link
                    to="/roadmap"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Explore AI Roadmaps <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="lg:col-span-6"
              >
                {/* Authentic Roadmap Timeline Preview */}
                <div className="bg-slate-50 dark:bg-[#181d26] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Curriculum: Full-Stack React & Node.js
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      Milestone 2 of 4
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Phase 1: Modern JavaScript & TypeScript Foundations (Completed)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                      <Sparkles size={16} className="shrink-0" />
                      <span className="text-slate-900 dark:text-white">
                        Phase 2: React Component Hierarchy & Custom Hooks (In Progress)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0"></div>
                      <span>Phase 3: Backend REST APIs with Node, Express & MongoDB</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0"></div>
                      <span>Phase 4: Caching with Redis & Production Deployment</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Feature 6: Activity Heatmap & Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="lg:col-span-6 lg:order-2 space-y-4 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Flame size={20} className="text-amber-500" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Rolling Activity Heatmap & Leaderboard
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Track your daily learning consistency on a GitHub-style rolling calendar. Earn points for completed sessions, post interactions, and mentorship milestones to rise up the community leaderboard.
                </p>
                <div className="pt-2">
                  <Link
                    to="/leaderboard"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View Community Leaderboard <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="lg:col-span-6 lg:order-1"
              >
                {/* Authentic Activity Heatmap & Streak Preview */}
                <div className="bg-slate-50 dark:bg-[#181d26] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Learning Consistency
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Asia/Kolkata (IST) calendar tracking
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
                      <Flame size={13} className="text-amber-500" />
                      <span>14 Day Streak</span>
                    </div>
                  </div>

                  {/* Heatmap Grid Matrix */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                    <div className="flex gap-1.5 min-w-max">
                      {HEATMAP_WEEKS.map((week, wIdx) => (
                        <div key={wIdx} className="flex flex-col gap-1.5">
                          {week.map((level, dIdx) => (
                            <div
                              key={dIdx}
                              className={`w-3 h-3 rounded-sm ${getHeatmapColor(level)} transition-colors`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Rank #4 on Leaderboard</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      420 Exchange Points
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Feature 7: Verifiable Skill Certificates */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="lg:col-span-6 space-y-4 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Cryptographically Verifiable Skill Certificates
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Earn certificates minted only upon mutual session completion and reciprocal evaluation. Each certificate includes an alphanumeric verification hash that anyone can independently validate.
                </p>
                <div className="pt-2">
                  <Link
                    to="/explore"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Explore Certifiable Skills <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="lg:col-span-6"
              >
                {/* Authentic Certificate Preview Card */}
                <div className="bg-slate-900 text-white rounded-2xl border border-slate-700 p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <BrandLogo size={22} />
                      <span className="font-bold text-xs tracking-wider text-slate-300 uppercase">
                        Orbitus SkillSwap Platform
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-semibold">
                      STATUS: VERIFIED
                    </span>
                  </div>

                  <div className="space-y-1 text-center py-1">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                      Certificate of Completed Knowledge Exchange
                    </p>
                    <h4 className="text-lg font-bold text-white tracking-tight">
                      Aarav Sharma
                    </h4>
                    <p className="text-xs text-slate-300">
                      has successfully completed a 1:1 verified swap in
                    </p>
                    <p className="text-sm font-bold text-indigo-400">
                      React.js & Architecture Systems
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-sans font-bold">Verification ID</p>
                      <p className="text-indigo-300 text-[11px]">ORBITUS-CERT-2026-F981-REACT</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-500 uppercase font-sans font-bold">Peer Evaluation</p>
                      <p className="text-slate-300 text-[11px]">Verified Mutual Review</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 5. Section: Frequently Asked Questions */}
        <section id="faq" className="py-16 md:py-24 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151922] transition-colors">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="text-center space-y-2"
            >
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                Questions & Answers
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Straightforward answers about how peer skill trading works on Orbitus.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerList}
              className="space-y-4"
            >
              {FAQS.map((faq) => (
                <motion.div
                  key={faq.q}
                  variants={fadeUp}
                  className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm text-left"
                >
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    <Check size={16} className="shrink-0 text-emerald-500" />
                    <h3>{faq.q}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                    {faq.a}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 6. Final Call to Action */}
        <section className="py-16 sm:py-20 bg-white dark:bg-[#12141a]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Ready to start swapping skills?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base max-w-xl mx-auto leading-relaxed">
              Create your profile in two minutes, publish what you can teach, and discover peers ready to learn and share knowledge with you.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/explore"
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold transition-colors shadow-sm inline-flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Search size={16} className="text-slate-500" />
                Explore skills
              </Link>

              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold transition-colors shadow-sm inline-flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Go to Dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold transition-colors shadow-sm inline-flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <UserPlus size={16} />
                  Create account
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* 7. Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181d26] py-10 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <BrandLogo size={22} className="h-5 w-5" />
              <span className="font-extrabold text-slate-900 dark:text-white">Orbitus</span>
              <span>— Peer-to-Peer Skill Exchange</span>
            </div>

            <div className="flex flex-wrap items-center gap-5 font-medium">
              <Link to="/explore" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Browse Skills
              </Link>
              <Link to="/groups" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Study Groups
              </Link>
              <Link to="/feed" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Community Feed
              </Link>
              <Link to="/leaderboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Leaderboard
              </Link>
              <Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Sign in
              </Link>
              <Link to="/register" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Create account
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <div>
              &copy; {new Date().getFullYear()} Orbitus SkillSwap Platform. All rights reserved. Zero-currency peer learning.
            </div>
            <div>
              Default Timezone: <span className="font-mono text-slate-600 dark:text-slate-300">Asia/Kolkata (IST)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
