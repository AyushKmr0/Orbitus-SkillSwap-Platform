import React, { useState, useRef } from 'react';
import { Lock, Award, CheckCircle, X, ShieldCheck } from 'lucide-react';

// Badges arranged from EASY to HARD difficulty
const ACHIEVEMENTS_DATA = [
  {
    id: 'yolo',
    title: 'YOLO',
    category: 'Milestone',
    badgeType: 'First Study Session Completed',
    tier: 'Bronze',
    tierColor: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white',
    description: 'Took the leap and scheduled your very first skill exchange session.',
    criteria: 'Book & complete 1st study session + 25 platform points',
    target: 25,
    icon: (
      <svg viewBox="0 0 48 48" className="w-36 h-36 sm:w-40 sm:h-40" fill="none">
        <polygon points="24,2 44,13 44,35 24,46 4,35 4,13" fill="url(#roseRimYolo)" />
        <polygon points="24,5 41,15 41,33 24,43 7,33 7,15" fill="url(#yoloGrad)" stroke="#fb7185" strokeWidth="1.5" />
        <path d="M24,5 L41,15 L41,24 C30,22 20,18 7,24 L7,15 Z" fill="url(#glossHighlight)" />
        <path d="M17 18C17 14 31 14 31 18C31 23 29 27 24 29C19 27 17 23 17 18Z" fill="#f43f5e" />
        <circle cx="24" cy="21" r="4.5" fill="#1e293b" />
        <path d="M22 21L24 23L27 19" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M20 33L24 30L28 33" stroke="#fecdd3" strokeWidth="1.8" strokeLinecap="round" />
        <defs>
          <linearGradient id="roseRimYolo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#be123c" />
            <stop offset="100%" stopColor="#881337" />
          </linearGradient>
          <linearGradient id="yoloGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#be123c" />
            <stop offset="100%" stopColor="#4c0519" />
          </linearGradient>
          <linearGradient id="glossHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    id: 'pair-extraordinaire',
    title: 'Pair Extraordinaire',
    category: 'Mentoring',
    badgeType: '1-on-1 Live Sessions',
    tier: 'x3',
    tierColor: 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white',
    description: 'Co-authored and participated in live 1-on-1 video mentoring sessions.',
    criteria: 'Participate in 3+ 1-on-1 live mentoring sessions',
    target: 3,
    icon: (
      <svg viewBox="0 0 48 48" className="w-36 h-36 sm:w-40 sm:h-40" fill="none">
        <polygon points="24,2 44,13 44,35 24,46 4,35 4,13" fill="url(#emeraldRimPair)" />
        <polygon points="24,5 41,15 41,33 24,43 7,33 7,15" fill="url(#pairGrad)" stroke="#34d399" strokeWidth="1.5" />
        <path d="M24,5 L41,15 L41,24 C30,22 20,18 7,24 L7,15 Z" fill="url(#glossHighlight)" />
        <circle cx="18" cy="20" r="4.5" fill="#a7f3d0" />
        <circle cx="30" cy="20" r="4.5" fill="#a7f3d0" />
        <path d="M13 32C13 28 16 26 20 26C22 26 23 27 24 28C25 27 26 26 28 26C32 26 35 28 35 32" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <path d="M21 28L27 28" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="emeraldRimPair" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="pairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    id: 'pull-shark',
    title: 'Pull Shark',
    category: 'Exchange',
    badgeType: 'Peer Skill Exchange',
    tier: 'x2',
    tierColor: 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white',
    description: 'Mastered peer skill exchanges & completed collaborative learning sessions.',
    criteria: 'Complete 5 or more peer skill exchanges on Orbitus',
    target: 5,
    icon: (
      <svg viewBox="0 0 48 48" className="w-36 h-36 sm:w-40 sm:h-40" fill="none">
        <polygon points="24,2 44,13 44,35 24,46 4,35 4,13" fill="url(#goldRimShark)" />
        <polygon points="24,5 41,15 41,33 24,43 7,33 7,15" fill="url(#sharkGrad)" stroke="#38bdf8" strokeWidth="1.5" />
        <path d="M24,5 L41,15 L41,24 C30,22 20,18 7,24 L7,15 Z" fill="url(#glossHighlight)" />
        <path d="M15 27C17 23 23 18 33 19C35 23 33 29 27 32C23 34 17 31 15 27Z" fill="#38bdf8" />
        <path d="M27 15L28 20L24 19L27 15Z" fill="#7dd3fc" />
        <circle cx="22" cy="24" r="1.8" fill="#ffffff" />
        <circle cx="22.5" cy="24" r="0.9" fill="#0f172a" />
        <path d="M20 29C22 30 25 30 27 29" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
        <defs>
          <linearGradient id="goldRimShark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>
          <linearGradient id="sharkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    id: 'public-sponsor',
    title: 'Public Sponsor',
    category: 'Community',
    badgeType: 'Community Learning Support',
    tier: 'Silver',
    tierColor: 'bg-gradient-to-r from-pink-500 to-rose-400 text-white',
    description: 'Mentored peers and supported the skill learning community.',
    criteria: 'Help 8+ learners and reach 300+ platform points',
    target: 300,
    icon: (
      <svg viewBox="0 0 48 48" className="w-36 h-36 sm:w-40 sm:h-40" fill="none">
        <polygon points="24,2 44,13 44,35 24,46 4,35 4,13" fill="url(#pinkRimHeart)" />
        <polygon points="24,5 41,15 41,33 24,43 7,33 7,15" fill="url(#heartGrad)" stroke="#f472b6" strokeWidth="1.5" />
        <path d="M24,5 L41,15 L41,24 C30,22 20,18 7,24 L7,15 Z" fill="url(#glossHighlight)" />
        <path d="M24 32L17 25C14.5 22.5 14.5 18.5 17 16C19.5 13.5 23.5 13.5 26 16L24 18L22 16C24.5 13.5 28.5 13.5 31 16C33.5 18.5 33.5 22.5 31 25L24 32Z" fill="#ec4899" stroke="#ffffff" strokeWidth="1.2" />
        <defs>
          <linearGradient id="pinkRimHeart" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="50%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#831843" />
          </linearGradient>
          <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9d174d" />
            <stop offset="100%" stopColor="#500724" />
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    id: 'galaxy-brain',
    title: 'Galaxy Brain',
    category: 'Community',
    badgeType: 'Notes & Post Contributions',
    tier: 'x2',
    tierColor: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    description: 'Shared breakthrough learning notes and answered peer community questions.',
    criteria: 'Publish 10+ learning posts and engage in discussions',
    target: 10,
    icon: (
      <svg viewBox="0 0 48 48" className="w-36 h-36 sm:w-40 sm:h-40" fill="none">
        <polygon points="24,2 44,13 44,35 24,46 4,35 4,13" fill="url(#purpleRimBrain)" />
        <polygon points="24,5 41,15 41,33 24,43 7,33 7,15" fill="url(#brainGrad)" stroke="#c084fc" strokeWidth="1.5" />
        <path d="M24,5 L41,15 L41,24 C30,22 20,18 7,24 L7,15 Z" fill="url(#glossHighlight)" />
        <path d="M18 21C18 17 22 15 24 17C26 15 30 17 30 21C32 23 32 27 29 29C29 32 27 33 24 33C21 33 19 32 19 29C16 27 16 23 18 21Z" fill="#c084fc" stroke="#f3e8ff" strokeWidth="1.2" />
        <circle cx="24" cy="24" r="1.5" fill="#ffffff" />
        <circle cx="15" cy="16" r="1" fill="#fbcfe8" />
        <circle cx="33" cy="15" r="1.2" fill="#fbcfe8" />
        <defs>
          <linearGradient id="purpleRimBrain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6b21a8" />
          </linearGradient>
          <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b21a8" />
            <stop offset="100%" stopColor="#2e1065" />
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    id: 'quickdraw',
    title: 'Quickdraw',
    category: 'Speed',
    badgeType: 'Rapid Booking Responses',
    tier: 'Gold',
    tierColor: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 font-extrabold',
    description: 'Responded and connected with a learning partner rapidly within minutes.',
    criteria: 'Earn 150+ platform points with rapid booking responses',
    target: 150,
    icon: (
      <svg viewBox="0 0 48 48" className="w-36 h-36 sm:w-40 sm:h-40" fill="none">
        <polygon points="24,2 44,13 44,35 24,46 4,35 4,13" fill="url(#goldRimQuick)" />
        <polygon points="24,5 41,15 41,33 24,43 7,33 7,15" fill="url(#quickGrad)" stroke="#fbbf24" strokeWidth="1.5" />
        <path d="M24,5 L41,15 L41,24 C30,22 20,18 7,24 L7,15 Z" fill="url(#glossHighlight)" />
        <path d="M26 13L16 26H24L22 35L32 22H24L26 13Z" fill="#fef08a" stroke="#d97706" strokeWidth="1.2" strokeLinejoin="round" />
        <defs>
          <linearGradient id="goldRimQuick" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient id="quickGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    id: 'starstruck',
    title: 'Starstruck',
    category: 'Reputation',
    badgeType: '5-Star Session Ratings',
    tier: 'x2',
    tierColor: 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 font-extrabold',
    description: 'Earned 5-star rating on completed peer mentoring sessions.',
    criteria: 'Receive 3+ 5-star ratings & earn 250+ platform points',
    target: 250,
    icon: (
      <svg viewBox="0 0 48 48" className="w-36 h-36 sm:w-40 sm:h-40" fill="none">
        <polygon points="24,2 44,13 44,35 24,46 4,35 4,13" fill="url(#amberRimStar)" />
        <polygon points="24,5 41,15 41,33 24,43 7,33 7,15" fill="url(#starGrad)" stroke="#f59e0b" strokeWidth="1.5" />
        <path d="M24,5 L41,15 L41,24 C30,22 20,18 7,24 L7,15 Z" fill="url(#glossHighlight)" />
        <path d="M24 14L27.2 20.7L34.5 21.7L29.2 26.8L30.5 34L24 30.5L17.5 34L18.8 26.8L13.5 21.7L20.8 20.7L24 14Z" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.2" />
        <circle cx="24" cy="24" r="2" fill="#ffffff" />
        <defs>
          <linearGradient id="amberRimStar" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    id: 'arctic-vault',
    title: 'Arctic Vault',
    category: 'Consistency',
    badgeType: 'Active Learning Streak',
    tier: 'Gold',
    tierColor: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white',
    description: 'Consistently engaged in skill swapping across active learning streaks.',
    criteria: 'Maintain 10-day active streak and reach 500+ points',
    target: 500,
    icon: (
      <svg viewBox="0 0 48 48" className="w-36 h-36 sm:w-40 sm:h-40" fill="none">
        <polygon points="24,2 44,13 44,35 24,46 4,35 4,13" fill="url(#cyanRimVault)" />
        <polygon points="24,5 41,15 41,33 24,43 7,33 7,15" fill="url(#vaultGrad)" stroke="#67e8f9" strokeWidth="1.5" />
        <path d="M24,5 L41,15 L41,24 C30,22 20,18 7,24 L7,15 Z" fill="url(#glossHighlight)" />
        <path d="M24 15L32 20V28L24 33L16 28V20L24 15Z" fill="#0891b2" stroke="#cffafe" strokeWidth="1.2" />
        <circle cx="24" cy="24" r="3.5" fill="#fef08a" />
        <defs>
          <linearGradient id="cyanRimVault" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="50%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#164e63" />
          </linearGradient>
          <linearGradient id="vaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#155e75" />
            <stop offset="100%" stopColor="#042f2e" />
          </linearGradient>
        </defs>
      </svg>
    )
  }
];

export const PlatformBadges = ({ user, badges = [], badgeProgress = [], onlyUnlocked = false, className = '' }) => {
  const [selectedBadge, setSelectedBadge] = useState(null);
  const sliderRef = useRef(null);

  // Compute unlock state based on user stats or backend badge data
  const achievements = ACHIEVEMENTS_DATA.map((ach) => {
    const serverBadge = badges.find(
      (b) => b.name?.toLowerCase().includes(ach.title.toLowerCase()) ||
             ach.title.toLowerCase().includes(b.name?.toLowerCase() || '')
    );
    const progressItem = badgeProgress.find(
      (p) => p.name?.toLowerCase().includes(ach.title.toLowerCase())
    );

    const sessions = user?.sessionsCompleted || 0;
    const points = user?.points || 0;

    let isUnlocked = Boolean(serverBadge);
    let currentVal = progressItem?.current || 0;

    if (!isUnlocked) {
      if (ach.id === 'yolo' && (sessions >= 1 && points >= 25)) {
        isUnlocked = true;
        currentVal = 1;
      } else if (ach.id === 'pair-extraordinaire' && sessions >= 3) {
        isUnlocked = true;
        currentVal = sessions;
      } else if (ach.id === 'pull-shark' && sessions >= 5) {
        isUnlocked = true;
        currentVal = sessions;
      } else if (ach.id === 'quickdraw' && points >= 150) {
        isUnlocked = true;
        currentVal = 1;
      } else if (ach.id === 'starstruck' && points >= 250 && sessions >= 3) {
        isUnlocked = true;
        currentVal = sessions;
      } else if (ach.id === 'galaxy-brain' && points >= 300) {
        isUnlocked = true;
        currentVal = 10;
      } else if (ach.id === 'public-sponsor' && sessions >= 8 && points >= 300) {
        isUnlocked = true;
        currentVal = sessions;
      } else if (ach.id === 'arctic-vault' && points >= 500) {
        isUnlocked = true;
        currentVal = 10;
      }
    }

    const percentage = isUnlocked
      ? 100
      : Math.min(99, Math.round((currentVal / ach.target) * 100));

    return {
      ...ach,
      unlocked: isUnlocked,
      current: currentVal,
      progress: percentage,
      unlockedAt: serverBadge?.unlockedAt || user?.createdAt || new Date()
    };
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const displayAchievements = onlyUnlocked
    ? achievements.filter((a) => a.unlocked)
    : achievements;

  return (
    <div className={`glass-panel p-5 sm:p-6 rounded-3xl space-y-4 flex-1 flex flex-col justify-between h-full ${className}`}>
      {/* Clean Header Bar without Chevron Slide Buttons */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <Award size={22} className="text-amber-500 shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-app tracking-tight font-outfit leading-none">
              Platform Badges
            </h3>
            <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-app border border-slate-200 dark:border-slate-700 leading-none">
              {unlockedCount} / {achievements.length} Unlocked
            </span>
          </div>
        </div>
      </div>

      {onlyUnlocked && displayAchievements.length === 0 ? (
        <div className="p-6 text-center text-slate-500 text-xs rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
          <p className="font-semibold text-app">No Unlocked Badges Yet</p>
          <p>Complete mentorship sessions, earn 5-star ratings, and reach milestones to unlock platform achievements!</p>
        </div>
      ) : (
        /* Single Row Horizontal Mouse/Touch Scrollable Carousel Container */
        <div className="relative">
          <div
            ref={sliderRef}
            className="flex gap-4 overflow-x-auto scrollbar-none py-6 px-3 scroll-smooth snap-x"
          >
            {displayAchievements.map((ach) => (
              <button
                key={ach.id}
                type="button"
                onClick={() => setSelectedBadge(ach)}
                className={`shrink-0 w-[310px] sm:w-[340px] snap-center group relative flex flex-col items-center p-6 sm:p-7 rounded-3xl border transition-all duration-500 text-center overflow-hidden transform-gpu hover:-translate-y-2 hover:scale-[1.02] cursor-pointer ${
                  ach.unlocked
                    ? 'bg-gradient-to-b from-white via-slate-50/80 to-amber-500/10 dark:from-[#181d26] dark:via-[#161b22] dark:to-[#221c10] border-amber-500/40 hover:border-amber-400 hover:shadow-[0_22px_55px_rgba(245,158,11,0.3)]'
                    : 'bg-white dark:bg-[#161b22] border-slate-200 dark:border-slate-800/80 hover:border-indigo-400/80 dark:hover:border-indigo-500/80 hover:shadow-[0_18px_45px_rgba(99,102,241,0.25)]'
                }`}
              >
                {/* Metallic Light Shimmer Sweep Layer on Hover / Unlocked */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
                  <div className={`w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 dark:via-white/25 to-transparent skew-x-[-25deg] ${
                    ach.unlocked ? 'animate-metallic-shimmer' : 'group-hover:animate-metallic-shimmer opacity-0 group-hover:opacity-100'
                  }`} />
                </div>

                {/* Tier Pill */}
                {ach.tier && (
                  <span className={`absolute top-3.5 right-3.5 text-[10px] font-black px-2.5 py-0.5 rounded-lg shadow-sm z-10 ${
                    ach.unlocked
                      ? ach.tierColor
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors'
                  }`}>
                    {ach.tier}
                  </span>
                )}

                {/* Extra Large 3D Emblem Frame: Grayscale by default for locked, FULL COLOR when unlocked OR hovered */}
                <div className={`relative my-2 transition-all duration-500 transform-gpu z-10 ${
                  ach.unlocked
                    ? 'grayscale-0 opacity-100 animate-badge-float filter drop-shadow-[0_18px_36px_rgba(245,158,11,0.6)] group-hover:scale-110'
                    : 'grayscale group-hover:grayscale-0 opacity-50 group-hover:opacity-100 group-hover:animate-badge-float transition-all'
                }`}>
                  {/* High-Vibrancy Ambient Glow Aura Behind Badge */}
                  <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 -z-10 ${
                    ach.unlocked
                      ? 'bg-gradient-to-tr from-amber-500/50 via-yellow-400/40 to-indigo-500/30 opacity-90 group-hover:opacity-100 group-hover:blur-3xl'
                      : 'bg-indigo-500/30 opacity-0 group-hover:opacity-90 group-hover:blur-2xl'
                  }`} />

                  {ach.icon}

                  {!ach.unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0 pointer-events-none">
                      <span className="p-2.5 rounded-full bg-slate-950/85 text-slate-200 shadow-2xl border border-slate-700/80 backdrop-blur-xs">
                        <Lock size={20} />
                      </span>
                    </div>
                  )}
                </div>

                {/* Badge Title */}
                <h4 className="text-sm font-extrabold text-app truncate w-full mt-2 font-outfit tracking-wide">
                  {ach.title}
                </h4>

                {/* Subtitle / Orbitus Domain */}
                <p className="text-xs text-indigo-500 dark:text-indigo-400 truncate w-full mt-0.5 font-semibold">
                  {ach.badgeType}
                </p>

                {/* Status Indicator */}
                {ach.unlocked ? (
                  <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-3 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 shadow-xs">
                    <CheckCircle size={13} /> Unlocked & Verified
                  </span>
                ) : (
                  <div className="w-full mt-3 space-y-1.5">
                    <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${ach.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 block text-right">
                      {ach.progress}% completed
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Badge Details Modal */}
      {selectedBadge && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="w-full max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl text-app space-y-4 sm:space-y-6 relative scrollbar-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Ambient Glow inside Modal */}
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-amber-500/20 blur-[90px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-indigo-500/20 blur-[90px] pointer-events-none" />

            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4 sticky top-0 bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-sm z-10 -mx-4 -mt-4 px-4 pt-4 sm:-mx-8 sm:-mt-8 sm:px-8 sm:pt-8">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-amber-500 shrink-0" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-app font-outfit">
                  Badge Detail
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="text-slate-400 hover:text-app p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Centered Large Levitating Emblem Showcase Frame */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-50/80 dark:bg-[#0d1117]/80 border border-slate-200/90 dark:border-slate-800 relative">
              <div className="relative w-28 h-28 sm:w-44 sm:h-44 flex items-center justify-center animate-badge-float filter drop-shadow-[0_15px_30px_rgba(245,158,11,0.5)] grayscale-0 opacity-100">
                {/* Multi-Stop Ambient Light Aura */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400/40 via-purple-500/30 to-blue-500/30 blur-2xl animate-neon-pulse -z-10" />
                {selectedBadge.icon}
              </div>

              {/* Title & Category Info Below Frame */}
              <div className="text-center mt-3 sm:mt-5 space-y-1.5 sm:space-y-2 max-w-md">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <h3 className="text-xl sm:text-3xl font-black text-app font-outfit tracking-tight">
                    {selectedBadge.title}
                  </h3>
                  {selectedBadge.tier && (
                    <span className={`text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-lg shadow-xs ${selectedBadge.tierColor}`}>
                      {selectedBadge.tier}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm font-bold text-indigo-500 dark:text-indigo-400">
                  {selectedBadge.badgeType}
                </p>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal pt-1">
                  {selectedBadge.description}
                </p>
              </div>
            </div>

            {/* Criteria & Unlock Requirement Box */}
            <div className="p-3.5 sm:p-5 bg-slate-50/90 dark:bg-[#0d1117]/90 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-400 font-medium">Unlock Criterion:</span>
                <span className="font-extrabold text-app">{selectedBadge.criteria}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800/80 pt-2.5">
                <span className="text-slate-400 font-medium">Verification Status:</span>
                <span className={`font-extrabold flex items-center gap-1.5 ${selectedBadge.unlocked ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {selectedBadge.unlocked ? (
                    <>
                      <ShieldCheck size={16} /> Verified & Unlocked
                    </>
                  ) : (
                    `In Progress (${selectedBadge.progress}% Completed)`
                  )}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-extrabold rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformBadges;
