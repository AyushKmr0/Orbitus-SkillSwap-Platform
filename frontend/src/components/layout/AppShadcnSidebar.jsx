import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/authSlice.js';
import { toggleTheme } from '../../features/themeSlice.js';
import { useSocket } from '../../context/SocketContext.jsx';
import {
  Home,
  LayoutGrid,
  Trophy,
  BookOpen,
  Sparkles,
  Compass,
  Calendar,
  MessageSquare,
  Bell,
  Settings,
  ShieldAlert,
  Search,
  Plus,
  Zap,
  Gift,
  Sun,
  Moon,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo.jsx';
import { optimizeCloudinaryUrl } from '../../lib/utils.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../ui/alert-dialog.jsx';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar.jsx';

export const AppShadcnSidebar = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const { unreadCount } = useSelector((state) => state.chat);
  const { notificationSummary } = useSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [topSearchQuery, setTopSearchQuery] = useState(
    () => new URLSearchParams(location.search).get('search') || ''
  );
  const topSearchInputRef = useRef(null);

  useEffect(() => {
    setTopSearchQuery(new URLSearchParams(location.search).get('search') || '');
  }, [location.search]);

  useEffect(() => {
    const handleSearchShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        topSearchInputRef.current?.focus();
        topSearchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  const handleTopSearch = (event) => {
    event.preventDefault();
    const query = topSearchQuery.trim();
    const search = query ? `?search=${encodeURIComponent(query)}` : '';
    navigate(`/skills${search}#search`);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    dispatch(logout());
    navigate('/login');
  };

  const userRoleLower = (user?.role || '').toLowerCase();
  const isAdmin = userRoleLower === 'admin';

  const mainNavItems = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Showcase', path: '/feed', icon: LayoutGrid },
    { name: 'Peers', path: '/suggested-users', icon: Sparkles },
    { name: 'Leaderboards', path: '/leaderboard', icon: Trophy }
  ];

  const learnNavItems = [
    { name: 'Courses', path: '/skills', icon: BookOpen },
    { name: 'Study Groups', path: '/groups', icon: Compass },
    { name: 'Sessions', path: '/bookings', icon: Calendar },
    { name: 'Career Paths', path: '/roadmap', icon: Sparkles },
    { name: 'Messages', path: '/chat', icon: MessageSquare },
    ...(isAdmin ? [{ name: 'Admin', path: '/admin', icon: ShieldAlert }] : [])
  ];

  const getUnreadBadge = (path) => {
    if (path === '/chat' && unreadCount > 0) return unreadCount;
    if (path === '/notifications') {
      const total = notificationSummary?.totalUnread || 0;
      if (total > 0) return total;
    }
    if (path === '/bookings') {
      const bookingsCount = notificationSummary?.byLink?.['/bookings'] || 0;
      if (bookingsCount > 0) return bookingsCount;
    }
    return null;
  };

  const isItemActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path === '/skills') return location.pathname === '/skills' || location.pathname === '/explore';
    if (path === '/suggested-users') return location.pathname === '/suggested-users' || location.pathname === '/ai-match';
    if (path === '/feed') return location.pathname.startsWith('/feed');
    if (path === '/groups') return location.pathname.startsWith('/groups');
    if (path.startsWith('/profile')) return location.pathname.startsWith('/profile');
    if (path === '/admin') return location.pathname.startsWith('/admin');
    if (path === '/chat') return location.pathname.startsWith('/chat');
    if (path === '/bookings') return location.pathname.startsWith('/bookings');
    if (path === '/roadmap') return location.pathname.startsWith('/roadmap');
    if (path === '/leaderboard') return location.pathname.startsWith('/leaderboard');
    if (path === '/notifications') return location.pathname.startsWith('/notifications');
    if (path === '/settings') return location.pathname.startsWith('/settings');
    return location.pathname === path;
  };

  const NavLink = ({ item, onClick }) => {
    const active = isItemActive(item.path);
    const Icon = item.icon;
    const badge = getUnreadBadge(item.path);
    return (
      <Link
        to={item.path}
        onClick={onClick}
        className={`orb-nav-item${active ? ' orb-active' : ''}`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Icon
            size={16}
            className={`shrink-0 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
          />
          <span className="truncate text-[13px]">{item.name}</span>
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {badge && <span className="orb-unread-dot">{badge > 99 ? '99+' : badge}</span>}
        </span>
      </Link>
    );
  };

  const renderSidebarNav = (onLinkClick) => (
    <div className="flex flex-col gap-1">
      {/* Main nav */}
      <nav className="flex flex-col gap-0.5">
        {mainNavItems.map((item) => (
          <NavLink key={item.path} item={item} onClick={onLinkClick} />
        ))}
      </nav>

      {/* LEARN section */}
      <div className="mt-3">
        <p className="orb-nav-label">Learn</p>
        <nav className="flex flex-col gap-0.5 mt-1">
          {learnNavItems.map((item) => (
            <NavLink key={item.path} item={item} onClick={onLinkClick} />
          ))}
        </nav>
      </div>
    </div>
  );

  const userPoints = user?.points
    ? user.points > 999
      ? `${(user.points / 1000).toFixed(1)}k`
      : user.points
    : '0';

  return (
    <div className="orb-shell">
      <div className="orb-frame">

        {/* ── TOP BAR ── */}
        <header className="orb-topbar">
          <div className="orb-topbar-brand">
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>

            {/* Orbitus wordmark */}
            <Link
              to="/dashboard"
              className="orb-topbar-wordmark"
              title="Orbitus"
              aria-label="Orbitus home"
            >
              <BrandLogo size={36} className="orb-topbar-wordmark-logo" />
              <span className="font-outfit text-[19px] font-bold tracking-tight text-slate-900 dark:text-white">
                Orbitus
              </span>
            </Link>
          </div>

          <form className="orb-topbar-search" role="search" onSubmit={handleTopSearch}>
            <Search size={15} className="orb-topbar-search-icon" aria-hidden="true" />
            <input
              ref={topSearchInputRef}
              type="search"
              value={topSearchQuery}
              onChange={(event) => setTopSearchQuery(event.target.value)}
              className="orb-topbar-search-input"
              placeholder="Search courses and skills"
              aria-label="Search courses and skills"
            />
            <kbd className="orb-topbar-search-shortcut">Ctrl K</kbd>
            <button type="submit" className="orb-topbar-search-submit" aria-label="Search">
              <Search size={14} />
            </button>
          </form>

          <div className="orb-topbar-actions">
            <Link
              to="/feed#create"
              className="orb-pill-btn orb-post-project"
              aria-label="Post project"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Post project</span>
            </Link>

            {/* Streak */}
            <div className="orb-stat-amber" title="Daily Streak">
              <Zap size={13} className="fill-amber-500 text-amber-500" />
              <span>{user?.streak || 0}</span>
            </div>

            {/* Credits */}
            <div className="orb-stat-indigo" title="Platform Credits">
              <Gift size={13} />
              <span>{userPoints}</span>
            </div>

            {/* Bell */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Notifications"
            >
              <Bell size={17} />
              {(notificationSummary?.totalUnread || 0) > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Link>

            {/* Avatar */}
            <Link
              to={`/profile/${user?._id || 'me'}`}
              className="hover:opacity-85 transition-opacity"
              title={user?.name || 'My Profile'}
            >
              <Avatar className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700">
                <AvatarImage
                  src={optimizeCloudinaryUrl(user?.profileImage, { width: 96, height: 96 })}
                  alt={user?.name}
                />
                <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
                  {user?.name?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {mode === 'dark' ? (
                <Sun size={16} className="text-amber-400" />
              ) : (
                <Moon size={16} className="text-indigo-500" />
              )}
            </button>
          </div>
        </header>

        {/* ── BODY: sidebar + content ── */}
        <div className="orb-body">

          {/* Desktop Sidebar */}
          <aside className="orb-sidebar hidden lg:flex">
            <div className="flex-1 flex flex-col">
              {renderSidebarNav(() => {})}
            </div>

            {/* Footer: user snippet */}
            {user && (
              <div className="mt-auto pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                <Link
                  to={`/profile/${user._id || 'me'}`}
                  className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
                  title="View Profile"
                >
                  <Avatar className="h-7 w-7 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
                    <AvatarImage src={optimizeCloudinaryUrl(user.profileImage, { width: 72, height: 72 })} alt={user.name} />
                    <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">
                      {user.name?.slice(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">@{user.username || 'user'}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Link
                    to="/settings"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    title="Settings"
                  >
                    <Settings size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="relative w-64 max-w-[80vw] bg-white dark:bg-[#1A1D27] flex flex-col shadow-2xl overflow-y-auto z-10">
                <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <BrandLogo size={28} className="h-7 w-7 object-contain" />
                    <span className="font-outfit text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                      Orbitus
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    aria-label="Close navigation"
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className="flex-1 p-3">
                  {renderSidebarNav(() => setMobileMenuOpen(false))}
                </div>
                {user && (
                  <div className="p-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-7 w-7 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
                        <AvatarImage src={optimizeCloudinaryUrl(user.profileImage, { width: 72, height: 72 })} alt={user.name} />
                        <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">
                          {user.name?.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); setShowLogoutModal(true); }}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Sign Out"
                    >
                      <LogOut size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main content */}
          <main className="orb-content">
            {children}
          </main>
        </div>
      </div>

      {/* Logout confirm dialog */}
      <AlertDialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <AlertDialogContent className="max-w-sm rounded-2xl bg-white dark:bg-[#1A1D27] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Confirm Sign Out
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to end your current session? You will need to sign in again to access Orbitus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:justify-end pt-4">
            <AlertDialogCancel
              onClick={() => setShowLogoutModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-0 cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm border-0 cursor-pointer"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppShadcnSidebar;
