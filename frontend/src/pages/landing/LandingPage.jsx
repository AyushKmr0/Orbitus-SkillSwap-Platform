import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../../features/themeSlice.js';
import {
  ArrowRight,
  Search,
  UserPlus,
  BookOpen,
  Users,
  Video,
  Sun,
  Moon
} from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import { useDocumentHead } from '../../hooks/useDocumentHead.js';

const LandingPage = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const dispatch = useDispatch();

  const isAuthenticated = Boolean(token && user);

  useDocumentHead({
    title: 'Orbitus — Learn and Teach Skills Together',
    description: 'Orbitus is a community platform where people exchange skills directly 1-on-1 without money. Teach what you know, learn what you need.',
    canonical: 'https://orbitus-skill-swap-platform.vercel.app/'
  });

  const steps = [
    {
      icon: BookOpen,
      step: '1',
      title: 'Share your skills',
      description: 'List the skills you can teach and what you want to learn. No fees, coins, or payments.'
    },
    {
      icon: Users,
      step: '2',
      title: 'Find a peer match',
      description: 'Discover peers whose learning goals match what you can teach, creating a natural two-way exchange.'
    },
    {
      icon: Video,
      step: '3',
      title: 'Connect & learn',
      description: 'Schedule a session, connect 1-on-1, and learn directly through hands-on practice.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#12141a] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-150">
      {/* 1. Simple Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#181d26]/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Orbitus Home"
          >
            <BrandLogo size={32} className="h-8 w-8" />
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              Orbitus
            </span>
          </Link>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 sm:py-24 md:py-32 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#12141a]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Peer-to-Peer Skill Sharing
            </span>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Learn and teach skills together.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Orbitus is a community platform where people exchange skills directly without money. Teach what you know, learn what you need, and grow together with peers.
            </p>

            {/* The Two Primary Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
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

        {/* 3. Short Section: How the Platform Works */}
        <section className="py-16 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How Orbitus works
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Three simple steps to exchange knowledge directly with someone who wants to learn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="p-6 rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* 4. Simple Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181d26] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <BrandLogo size={20} className="h-5 w-5" />
            <span className="font-bold text-slate-800 dark:text-slate-200">Orbitus</span>
            <span>— Community Skill Exchange</span>
          </div>

          <div className="flex items-center gap-5 font-medium">
            <Link to="/explore" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Explore skills
            </Link>
            <Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Create account
            </Link>
          </div>

          <div>
            &copy; {new Date().getFullYear()} Orbitus. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
