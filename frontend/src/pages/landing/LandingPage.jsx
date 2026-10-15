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
  Check,
  CheckCircle2,
  Award
} from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import { useDocumentHead } from '../../hooks/useDocumentHead.js';

const LandingPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  const shouldReduceMotion = useReducedMotion();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = Boolean(token && user);

  useDocumentHead({
    title: 'Orbitus — Peer-to-Peer Skill Exchange Platform',
    description: 'Learn and teach skills together. Orbitus connects developers, designers, and learners for reciprocal 1:1 learning sessions, study groups, and verified credentials.',
    canonical: 'https://orbitus-skill-swap-platform.vercel.app/'
  });

  // Motion variants respecting user accessibility preferences
  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.45,
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

  // 4 Structured Steps explaining how Orbitus operates
  const HOW_IT_WORKS = [
    {
      step: '01',
      title: 'Publish What You Teach & Learn',
      description: 'List the subjects you can share with peers and the exact skills you want to learn. No tokens or paywalls.',
      icon: ArrowLeftRight
    },
    {
      step: '02',
      title: 'Find Reciprocal Learning Partners',
      description: 'Search the public skill catalog to find peers whose learning goals complement your mentoring strengths.',
      icon: Search
    },
    {
      step: '03',
      title: 'Schedule 1-on-1 Video Sessions',
      description: 'Agree on mutual times and collaborate directly in integrated video rooms with structured agenda notes.',
      icon: Calendar
    },
    {
      step: '04',
      title: 'Earn Verified Skill Credentials',
      description: 'Submit mutual session evaluations to earn shareable certificates backed by permanent verification IDs.',
      icon: Award
    }
  ];

  // Core real platform features without fake cards or mock metrics
  const CORE_FEATURES = [
    {
      title: 'Browse & Discover Skills',
      description: 'Filter across programming, design, cloud infrastructure, and languages to find learners ready for two-way knowledge exchange.',
      icon: Search,
      ctaText: 'Browse Catalog',
      ctaLink: '/explore'
    },
    {
      title: '1-on-1 Video Sessions',
      description: 'Book collaborative sessions with mutual agenda notes, time coordination, and built-in video rooms directly in your browser.',
      icon: Video,
      ctaText: 'View Sessions',
      ctaLink: '/bookings'
    },
    {
      title: 'Collaborative Study Groups',
      description: 'Join peer study circles organized around specific technologies. Ask questions, share resources, and join group study calls.',
      icon: BookOpen,
      ctaText: 'Explore Groups',
      ctaLink: '/groups'
    },
    {
      title: 'Community Feed & Discussions',
      description: 'Share learning updates, troubleshoot implementation challenges, and exchange technical insights publicly with fellow learners.',
      icon: MessageSquare,
      ctaText: 'Community Feed',
      ctaLink: '/feed'
    },
    {
      title: 'Structured Learning Roadmaps',
      description: 'Follow organized step-by-step curriculum milestones for complex subjects, breaking goals into clear practical checkpoints.',
      icon: Compass,
      ctaText: 'Explore Roadmaps',
      ctaLink: '/roadmap'
    },
    {
      title: 'Verifiable Skill Certificates',
      description: 'Earn cryptographic certificate credentials minted only upon mutual session completion and reciprocal peer evaluation.',
      icon: ShieldCheck,
      ctaText: 'Start Learning',
      ctaLink: isAuthenticated ? '/dashboard' : '/register'
    }
  ];

  const FAQS = [
    {
      q: 'Is Orbitus completely free?',
      a: 'Yes. Orbitus is built on reciprocal skill exchange. You share your knowledge and time with peers in return for their knowledge, with zero fees or tokens.'
    },
    {
      q: 'What if I am a beginner with nothing advanced to teach?',
      a: 'Everyone has valuable skills to share. Beginners frequently mentor in introductory setup, fundamental syntax, conversational language practice, or partner up as accountability buddies.'
    },
    {
      q: 'How are video sessions conducted?',
      a: 'When a session booking is confirmed by both partners, a dedicated integrated video room link is provided directly in the platform alongside shared agenda notes.'
    },
    {
      q: 'How does Orbitus verify certificates?',
      a: 'Certificates are issued only after both peers complete their scheduled session and submit reciprocal evaluations. Each certificate includes an alphanumeric verification ID that can be independently verified.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/40 dark:bg-[#12141a] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-150">
      {/* 1. Header / Navbar — Only Public Links */}
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

          {/* Desktop Nav Links — Strictly Public Pages & Sections */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300" aria-label="Main Navigation">
            <Link
              to="/explore"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              Browse Skills
            </Link>
            <a
              href="#how-it-works"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              Features
            </a>
            <a
              href="#faq"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 py-0.5"
            >
              FAQ
            </a>
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

        {/* Mobile Navigation Drawer — Public Links Only */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181d26] px-4 pt-3 pb-6 space-y-3"
          >
            <div className="flex flex-col space-y-2 text-sm font-medium">
              <Link
                to="/explore"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
              >
                <Search size={16} className="text-indigo-500" /> Browse Skills
              </Link>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
              >
                <ArrowLeftRight size={16} className="text-indigo-500" /> How It Works
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
              >
                <ShieldCheck size={16} className="text-indigo-500" /> Features
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600 flex items-center gap-2"
              >
                <CheckCircle2 size={16} className="text-indigo-500" /> FAQ
              </a>
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
        {/* 2. Hero Section: Direct, Authentic Value Proposition (No fake simulator) */}
        <section className="pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12141a]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                <ArrowLeftRight size={13} className="text-indigo-600 dark:text-indigo-400" />
                Direct Peer-to-Peer Knowledge Exchange
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Learn by teaching. <br />
                <span className="text-indigo-600 dark:text-indigo-400">
                  Trade skills directly with peers.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Orbitus is a community platform where learners exchange skills 1-on-1 without money. Share what you know, learn what you need, and earn verified credentials.
              </p>

              {/* Primary Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
                <Link
                  to="/explore"
                  className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold transition-colors shadow-sm inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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

              {/* Verified Trust Strip */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>100% Free Exchange</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>1:1 Video Swaps</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>Active Study Groups</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>Verified Credentials</span>
                </div>
              </div>
            </motion.div>
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
                Direct Reciprocal Learning in 4 Steps
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                No middleman or monetary fees. Honest skill trading structured for real progress.
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

        {/* 4. Core Features Showcase — Concise, Genuine Capabilities */}
        <section id="features" className="py-16 md:py-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12141a]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="max-w-2xl mx-auto text-center space-y-3 mb-12 md:mb-16"
            >
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                Platform Features
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Designed for Practical Peer Learning
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Discover the actual tools and workflows available to teach, learn, and collaborate on Orbitus.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerList}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {CORE_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    variants={fadeUp}
                    className="p-6 rounded-2xl bg-slate-50/70 dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <Icon size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    <div className="pt-2">
                      <Link
                        to={feature.ctaLink}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {feature.ctaText} <ArrowRight size={13} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
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

      {/* 7. Footer — Clean Public Links */}
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
              <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                How It Works
              </a>
              <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Features
              </a>
              <a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                FAQ
              </a>
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
