import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../../features/themeSlice.js';
import {
  Users,
  BookOpen,
  Award,
  Compass,
  Trophy,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sun,
  Moon,
  Menu,
  X,
  Check,
  Sparkles,
  Video,
  ArrowLeftRight,
  Search,
  Star,
  Layers,
  HelpCircle,
  FileBadge
} from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import SpecularButton from '../../components/common/react-bits/SpecularButton.jsx';
import { useDocumentHead } from '../../hooks/useDocumentHead.js';

const LandingPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [simulatedFilter, setSimulatedFilter] = useState('tech');

  const isAuthenticated = Boolean(token && user);

  useDocumentHead({
    title: 'Orbitus - Where Skills Connect | Peer-to-Peer Skill Swap Platform',
    description: 'Exchange skills, generate AI learning roadmaps, practice peer interviews, chat live, and earn verified skill certificates on Orbitus.',
    canonical: 'https://orbitus-skill-swap-platform.vercel.app/',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Orbitus SkillSwap Platform',
      url: 'https://orbitus-skill-swap-platform.vercel.app',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      description: 'Peer-to-peer collaborative skill exchange platform connecting learners and mentors worldwide with AI roadmaps and verified skill credentials.'
    }
  });


  const workflowSteps = [
    {
      step: '01',
      title: 'Publish Your Skill Matrix',
      description: 'Specify the domains you are skilled to teach and the exact technologies you want to master.',
      icon: Layers
    },
    {
      step: '02',
      title: 'Reciprocal Overlap Engine',
      description: 'Orbitus matches you with peers where your teaching capabilities align directly with their learning targets.',
      icon: ArrowLeftRight
    },
    {
      step: '03',
      title: 'Book 1:1 Video Swaps',
      description: 'Agree on session schedules with synchronized agendas, notes, and direct Google Meet or Orbitus video rooms.',
      icon: Video
    },
    {
      step: '04',
      title: 'Earn Proof & Reputation',
      description: 'Receive verified mutual ratings, exchange score points, and cryptographically verifiable certificates.',
      icon: Award
    }
  ];

  const features = [
    {
      icon: ArrowLeftRight,
      title: 'Reciprocal 1:1 Skill Swaps',
      description: 'No monetary payment required. Trade an hour of your frontend knowledge for an hour of machine learning coaching.',
      tag: 'Core Exchange'
    },
    {
      icon: BookOpen,
      title: 'Collaborative Study Groups',
      description: 'Join topic-focused learning circles with real-time discussions, shared study resources, and scheduled group calls.',
      tag: 'Community'
    },
    {
      icon: Compass,
      title: 'AI Learning Roadmaps',
      description: 'Generate step-by-step personalized learning paths with milestones, prerequisites, and curated study tasks.',
      tag: 'AI Guided'
    },
    {
      icon: FileBadge,
      title: 'Cryptographic Certificates',
      description: 'Mint verifiable certificates backed by unique IDs that peers, recruiters, and employers can independently check.',
      tag: 'Proof of Learning'
    },
    {
      icon: Trophy,
      title: 'Transparent Reputation Ladder',
      description: 'Earn exchange points and unlock achievement badges through verified completed sessions and peer reviews.',
      tag: 'Gamification'
    },
    {
      icon: Video,
      title: 'Integrated Meeting Rooms',
      description: 'Launch Google Meet or custom video links right inside your scheduled bookings without external tool confusion.',
      tag: 'Real-Time'
    }
  ];

  const faqs = [
    {
      question: 'Is Orbitus truly free to use?',
      answer: 'Yes. Orbitus operates entirely on reciprocal skill exchange. You exchange your time and knowledge rather than money. Zero currency changes hands.'
    },
    {
      question: 'What if I am a beginner with nothing advanced to teach?',
      answer: 'Everyone has valuable knowledge. Beginners can teach introductory tools, language practice, project coordination, workflow habits, or basic coding syntax.'
    },
    {
      question: 'How do session bookings work?',
      answer: 'You can propose a swap to any compatible peer. Once both parties agree on a date and time, the booking is confirmed with an integrated video meeting room link.'
    },
    {
      question: 'How does Orbitus verify certificates?',
      answer: 'Every certificate is minted upon mutual session completion with a unique alphanumeric verification hash that can be validated publicly at any time.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#12141a] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      {/* Authenticated Banner */}
      {isAuthenticated && (
        <aside
          aria-label="Account status"
          className="bg-indigo-600/10 dark:bg-indigo-950/50 border-b border-indigo-200 dark:border-indigo-800/60 py-2.5 px-4 text-center text-xs font-medium text-indigo-700 dark:text-indigo-300"
        >
          <span>
            Signed in as <strong className="font-semibold">{user.name || user.username}</strong>. Your swap dashboard is active.
          </span>
          <Link
            to="/dashboard"
            className="ml-2 font-bold underline hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            Open Dashboard <ArrowRight size={12} />
          </Link>
        </aside>
      )}

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#181d26]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo with strict :focus-visible */}
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg p-1 transition-transform active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Orbitus Home"
          >
            <BrandLogo size={36} className="h-9 w-9" />
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight font-outfit text-slate-900 dark:text-white leading-none">
                Orbitus
              </span>
              <span className="text-[10px] mt-0.5 font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase leading-none">
                SkillSwap
              </span>
            </div>
          </Link>

          {/* Desktop Navigation: Accessible Clean Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
            <Link
              to="/skills"
              className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-1 py-0.5"
            >
              Browse Skills
            </Link>
            <Link
              to="/suggested-users"
              className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-1 py-0.5"
            >
              Find Peers
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-1 py-0.5"
            >
              How It Works
            </a>
            <Link
              to="/groups"
              className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-1 py-0.5"
            >
              Study Groups
            </Link>
            <a
              href="#features"
              className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-1 py-0.5"
            >
              Features
            </a>
            <Link
              to="/leaderboard"
              className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-1 py-0.5"
            >
              Leaderboard
            </Link>
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              aria-label="Toggle visual theme"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181d26] px-4 pt-3 pb-6 space-y-3"
          >
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 text-sm font-medium">
              <Link
                to="/skills"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
              >
                <Search size={16} className="text-indigo-500" /> Skill Catalog
              </Link>
              <Link
                to="/suggested-users"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
              >
                <Users size={16} className="text-indigo-500" /> Peers
              </Link>
              <Link
                to="/groups"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
              >
                <BookOpen size={16} className="text-indigo-500" /> Study Groups
              </Link>
              <Link
                to="/ai/roadmap"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
              >
                <Compass size={16} className="text-indigo-500" /> AI Roadmaps
              </Link>
            </div>

            <div className="flex flex-col space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                How It Works
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Features
              </a>
              <a
                href="#certificates"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Certificates
              </a>
              <Link
                to="/leaderboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Leaderboard
              </Link>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md"
                >
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-slate-700 dark:text-slate-200 text-sm font-bold"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Hero Section: Editorial Split-Screen Layout */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Product Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold tracking-wide">
                <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                Zero-Currency Peer Skill Exchange
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Exchange Real Skills. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                  Zero Money Required.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Orbitus matches learners and mentors through direct reciprocity. Trade your frontend or design skills for backend engineering, machine learning, or foreign language practice in structured, verified 1:1 sessions.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <SpecularButton className="px-6 py-3.5 text-base">
                      Go to Your Dashboard <ArrowRight size={16} />
                    </SpecularButton>
                  </Link>
                ) : (
                  <Link to="/register">
                    <SpecularButton className="px-6 py-3.5 text-base">
                      Start Swapping Skills <ArrowRight size={16} />
                    </SpecularButton>
                  </Link>
                )}

                <Link
                  to="/skills"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-sm shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Search size={16} className="text-slate-500" />
                  Browse Skill Catalog
                </Link>
              </div>

              {/* Verified Product Commitments (No fake stats) */}
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Direct 1:1 Video Swaps</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Cryptographic Proof IDs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Topic Study Circles</span>
                </div>
              </div>
            </div>

            {/* Right Column: Authentic Reciprocal Match Simulator Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white dark:bg-[#181d26] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
                {/* Simulator Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Reciprocal Match Found
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                    98% Overlap Score
                  </span>
                </div>

                {/* Filter Selector */}
                <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSimulatedFilter('tech')}
                    className={`flex-1 py-1 rounded-md transition-colors ${
                      simulatedFilter === 'tech'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Tech & Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatedFilter('design')}
                    className={`flex-1 py-1 rounded-md transition-colors ${
                      simulatedFilter === 'design'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Design & Lang
                  </button>
                </div>

                {/* Reciprocal Exchange Card */}
                {simulatedFilter === 'tech' ? (
                  <div className="space-y-4">
                    {/* User 1 */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                            ER
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Elena Rostova</p>
                            <p className="text-[10px] text-slate-500">Senior Frontend Dev</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                          Teaches
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          React 19
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          TypeScript
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          Next.js
                        </span>
                      </div>
                    </div>

                    {/* Swap Connector */}
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                        <ArrowLeftRight size={13} className="text-indigo-600 dark:text-indigo-400" />
                        <span>Direct 1:1 Knowledge Exchange</span>
                      </div>
                    </div>

                    {/* User 2 */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center">
                            MV
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Marcus Vance</p>
                            <p className="text-[10px] text-slate-500">Machine Learning Engineer</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-300">
                          Teaches
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          Python
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          FastAPI
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          PyTorch
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* User 1: Design */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-pink-600 text-white font-bold text-xs flex items-center justify-center">
                            SL
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Sarah Lin</p>
                            <p className="text-[10px] text-slate-500">Product Designer</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-300">
                          Teaches
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          Figma Systems
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          UX Research
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 dark:bg-pink-950/70 border border-pink-200 dark:border-pink-800 text-[11px] font-bold text-pink-700 dark:text-pink-300">
                        <ArrowLeftRight size={13} className="text-pink-600 dark:text-pink-400" />
                        <span>Direct 1:1 Knowledge Exchange</span>
                      </div>
                    </div>

                    {/* User 2: Japanese */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                            KT
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Kenji Takahashi</p>
                            <p className="text-[10px] text-slate-500">Native Japanese Tutor</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-300">
                          Teaches
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          Conversational Japanese
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          JLPT N3 Grammar
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Session Ready Bar */}
                <div className="rounded-xl bg-slate-900 text-white p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Video size={16} className="text-emerald-400" />
                    <div>
                      <p className="font-bold">Session Scheduled</p>
                      <p className="text-[10px] text-slate-400">Integrated Video Call Ready</p>
                    </div>
                  </div>
                  <Link
                    to="/suggested-users"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold text-[11px] transition-colors"
                  >
                    Find My Match
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: The 4-Step Exchange Architecture */}
      <section id="how-it-works" className="py-20 md:py-28 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#151922] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
              How Orbitus Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              A Direct Peer-to-Peer Loop
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              No hidden currency or tokenized paywalls. Pure mutual learning organized through 4 structured steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((stepItem) => {
              const StepIcon = stepItem.icon;
              return (
                <div
                  key={stepItem.step}
                  className="relative p-6 rounded-2xl bg-slate-50 dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 space-y-4 hover:border-indigo-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <StepIcon size={20} />
                    </div>
                    <span className="text-2xl font-black text-slate-300 dark:text-slate-700 font-mono">
                      {stepItem.step}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {stepItem.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {stepItem.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section: Platform Features Grid */}
      <section id="features" className="py-20 md:py-28 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
              Core Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Built for Genuine Learning Swaps
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Everything you need to discover peers, schedule live video calls, share study resources, and record verified progress.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="p-6 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Icon size={20} />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {feat.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section: Authentic Cryptographic Certificate Showcase */}
      <section id="certificates" className="py-20 md:py-28 bg-white dark:bg-[#151922] border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Description */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                Verifiable Credentials
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Certificates Backed by Real Peer Reviews
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Unlike passive video course certificates that anyone can screenshot, Orbitus certificates are issued only when both participants complete a verified session and submit exchange evaluations.
              </p>

              <div className="space-y-3 pt-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Unique alphanumeric verification ID issued per completion</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Public verification link that can be placed on LinkedIn or resumes</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Star size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Includes peer mentor validation and mutual exchange feedback</span>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/skills"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow hover:bg-indigo-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Explore Certifiable Skills <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right Certificate Card Mockup */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-lg rounded-2xl bg-slate-900 text-white border-2 border-indigo-500/40 p-7 shadow-2xl space-y-6 font-sans">
                {/* Certificate Watermark / Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <BrandLogo size={28} />
                    <span className="font-extrabold text-sm tracking-widest text-indigo-400 uppercase">
                      Orbitus Ledger
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold tracking-wide">
                    STATUS: VERIFIED
                  </span>
                </div>

                {/* Certificate Core Text */}
                <div className="space-y-2 text-center py-2">
                  <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
                    Certificate of Completed Peer Exchange
                  </p>
                  <h4 className="text-xl font-bold text-white tracking-tight">
                    Elena Rostova
                  </h4>
                  <p className="text-xs text-slate-300">
                    has successfully completed a 1:1 verified knowledge swap in
                  </p>
                  <p className="text-sm font-extrabold text-indigo-400">
                    React & Next.js Architecture
                  </p>
                </div>

                {/* Verification Metadata Footer */}
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-sans font-bold">Verification Hash</p>
                    <p className="text-indigo-300">ORBITUS-CERT-2026-F981-REACT</p>
                  </div>
                  <div className="text-right sm:text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-sans font-bold">Audit Authority</p>
                    <p className="text-slate-300">Peer Exchange Consensus</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Frequently Asked Questions */}
      <section className="py-20 md:py-28 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Straightforward Answers
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Everything you need to know about how peer skill trading works on Orbitus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="p-6 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm"
              >
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <HelpCircle size={16} />
                  <h3>{faq.question}</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Final Call to Action */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-transparent to-indigo-50/50 dark:to-indigo-950/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ready to swap knowledge with peers?
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base max-w-xl mx-auto leading-relaxed">
            Create your profile, publish your teaching skills, and find peers ready to trade their expertise today.
          </p>

          <div className="pt-2 flex flex-wrap justify-center items-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <SpecularButton className="px-6 py-3.5 text-base">
                  Go to Dashboard <ArrowRight size={16} />
                </SpecularButton>
              </Link>
            ) : (
              <Link to="/register">
                <SpecularButton className="px-6 py-3.5 text-base">
                  Join Orbitus Free <ArrowRight size={16} />
                </SpecularButton>
              </Link>
            )}

            <Link
              to="/skills"
              className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Browse Skills First
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181d26] py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <BrandLogo size={24} />
            <span className="font-bold text-slate-900 dark:text-white">Orbitus SkillSwap Platform</span>
            <span>— Zero Currency Learning</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-semibold">
            <Link to="/skills" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Skills
            </Link>
            <Link to="/groups" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Study Groups
            </Link>
            <Link to="/leaderboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Leaderboard
            </Link>
            <Link to="/ai/roadmap" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              AI Roadmaps
            </Link>
          </div>

          <div>
            &copy; {new Date().getFullYear()} Orbitus Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
