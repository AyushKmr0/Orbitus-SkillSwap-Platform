import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { logout } from '../../features/authSlice.js';
import { toggleTheme } from '../../features/themeSlice.js';
import { useSocket } from '../../context/SocketContext.jsx';
import {
  LayoutDashboard,
  GraduationCap,
  MessageSquare,
  Calendar,
  Sparkles,
  Map,
  Users,
  Compass,
  Trophy,
  ShieldAlert,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  PanelLeftClose,
  Newspaper,
  Bell,
  Settings,
  UserRound,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const { unreadCount } = useSelector((state) => state.chat);
  const { notificationSummary } = useSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const checkModal = () => {
      const modal = document.querySelector(
        '[role="dialog"], [data-modal="true"], [class*="z-[60]"], [class*="z-[70]"], [class*="z-[9999]"]'
      );
      setIsModalOpen(Boolean(modal));
    };

    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, role: 'User' },
    { name: 'Suggested Peers', path: '/suggested-users', icon: Sparkles, role: 'User' },
    { name: 'Daily Feed', path: '/feed', icon: Newspaper, role: 'User' },
    { name: 'Browse Skills', path: '/skills', icon: GraduationCap, role: 'User' },
    { name: 'Study Groups', path: '/groups', icon: Users, role: 'User' },
    { name: 'Chat Room', path: '/chat', icon: MessageSquare, role: 'User' },
    { name: 'Notifications', path: '/notifications', icon: Bell, role: 'User' },
    { name: 'My Bookings', path: '/bookings', icon: Calendar, role: 'User' },
    { name: 'Learning Roadmap', path: '/roadmap', icon: Map, role: 'User' },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy, role: 'User' },
    { name: 'Admin Hub', path: '/admin', icon: ShieldAlert, role: 'Admin' }
  ];

  const filteredItems = navItems.filter((item) => item.role !== 'Admin' || user?.role === 'Admin');

  const hasNavAlert = (path) => {
    if (path === '/chat') return unreadCount > 0;
    if (path === '/notifications') return (notificationSummary?.totalUnread || 0) > 0;
    if (path === '/bookings') return (notificationSummary?.byLink?.['/bookings'] || 0) > 0;
    return false;
  };

  const SidebarContent = ({ collapsed = false }) => (
    <div className={`surface-panel flex h-full flex-col border-r p-3 transition-all duration-300 ${collapsed ? 'items-center' : ''}`}>
      <div className={`mb-4 flex w-full items-center gap-2 px-2 py-2 lg:mb-5 lg:py-3 ${collapsed ? 'justify-center' : ''}`}>
        <motion.button
          type="button"
          whileHover={{ scale: 1.08, rotate: 3 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => collapsed && setIsCollapsed(false)}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-transparent lg:h-14 lg:w-14"
          title={collapsed ? 'Open Orbitus navigation' : 'Orbitus'}
        >
          <img src="/favicon.svg" alt="Orbitus" className="h-full w-full object-contain" />
        </motion.button>
        {!collapsed && (
          <div className="min-w-28">
            <p className="truncate text-lg font-bold tracking-tight text-app">Orbitus</p>
            <p className="truncate text-xs text-muted">Where Skills Connect</p>
          </div>
        )}
        {!collapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="ml-auto rounded-lg p-2 text-muted-strong transition-colors hover:bg-slate-900/5 hover:text-app dark:hover:bg-white/5"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      <nav className={`flex-1 space-y-1 overflow-y-auto ${collapsed ? 'w-full' : ''}`}>
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/suggested-users' && location.pathname === '/ai-match');
          const Icon = item.icon;
          const showAlert = hasNavAlert(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              title={collapsed ? item.name : undefined}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'font-semibold text-white'
                  : 'text-muted-strong hover:bg-slate-900/5 hover:text-app dark:hover:bg-white/5'
              } ${collapsed ? 'justify-center px-2' : ''}`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActivePill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-lg bg-blue-600 shadow-md"
                />
              )}
              <span className="relative z-10 flex items-center gap-3 min-w-0">
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </span>
              {showAlert && (
                <span className={`relative z-10 ${collapsed ? 'absolute ml-5 mt-[-18px]' : 'ml-auto'} flex h-2.5 w-2.5`}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? 'bg-white' : 'bg-red-500'}`} />
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 border-t pt-4" style={{ borderColor: 'var(--app-border)' }}>
        <button
          onClick={() => dispatch(toggleTheme())}
          title={collapsed ? (mode === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
          className={`theme-toggle flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-muted-strong transition-all duration-300 hover:bg-slate-900/5 hover:text-app dark:hover:bg-white/5 ${collapsed ? 'justify-center px-2' : ''}`}
        >
          <span className="flex items-center gap-3 text-sm font-medium">
            {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && (mode === 'dark' ? 'Light Mode' : 'Dark Mode')}
          </span>
          {!collapsed && (
            <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors duration-300 ${mode === 'dark' ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ${mode === 'dark' ? 'translate-x-4' : ''}`} />
            </span>
          )}
        </button>

        {user && !collapsed && (
          <div className="surface-card flex items-center gap-3 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
            <Link
              to={`/profile/${user._id || 'me'}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-85 transition-opacity"
              title="View your LinkedIn-style profile"
            >
              <img src={user.profileImage} alt={user.name} className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 object-cover border border-slate-200 dark:border-slate-700" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-app">{user.name}</p>
              </div>
            </Link>
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-900/5 hover:text-app dark:hover:bg-white/5"
              title="Settings"
            >
              <Settings size={16} />
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-500"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}

        {user && collapsed && (
          <div className="w-full space-y-1">
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex w-full justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-900/5 hover:text-app dark:hover:bg-white/5"
              title="Settings"
            >
              <Settings size={18} />
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-500"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="surface-panel fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b px-4 lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-1">
          <img src="/favicon.svg" alt="Orbitus" className="h-10 w-10 rounded-lg object-contain" />
          <span className="font-bold tracking-tight text-app">Orbitus</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg border p-1.5 text-muted-strong transition-colors hover:bg-slate-900/5 hover:text-app dark:hover:bg-white/5"
          style={{ borderColor: 'var(--app-border)' }}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className={`sticky top-0 z-30 hidden h-screen flex-shrink-0 transition-all duration-300 lg:block ${isCollapsed ? 'w-20' : 'w-64'} ${isModalOpen ? 'pointer-events-none filter blur-[3px] opacity-40 select-none' : ''}`}>
        <SidebarContent collapsed={isCollapsed} />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden mobile-sidebar-container">
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 bg-slate-950/35"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative z-50 h-full w-64 shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5 animate-fade-in">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10 mb-1">
                <LogOut size={26} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-app">Log out of Orbitus?</h2>
              <p className="text-sm text-muted">You'll need to sign in again to access your dashboard and chats.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-app transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
