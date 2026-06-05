import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
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
  FileUser,
  Speech,
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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, role: 'User' },
    { name: 'Admin Hub', path: '/admin', icon: ShieldAlert, role: 'Admin' },
    { name: 'Browse Skills', path: '/skills', icon: GraduationCap, role: 'User' },
    { name: 'Daily Feed', path: '/feed', icon: Newspaper, role: 'User' },
    { name: 'Notifications', path: '/notifications', icon: Bell, role: 'User' },
    { name: 'Chat Room', path: '/chat', icon: MessageSquare, role: 'User' },
    { name: 'My Bookings', path: '/bookings', icon: Calendar, role: 'User' },
    { name: 'AI Matches', path: '/ai-match', icon: Sparkles, role: 'User' },
    { name: 'AI Roadmap', path: '/roadmap', icon: Map, role: 'User' },
    { name: 'AI Resume', path: '/resume', icon: FileUser, role: 'User' },
    { name: 'AI Interview', path: '/interview', icon: Speech, role: 'User' },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy, role: 'User' }
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
        <button
          type="button"
          onClick={() => collapsed && setIsCollapsed(false)}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-transparent lg:h-16 lg:w-16"
          title={collapsed ? 'Open Orbitus navigation' : 'Orbitus'}
        >
          <img src="/favicon.svg" alt="Orbitus" className="h-full w-full object-contain" />
        </button>
        {!collapsed && <div className="min-w-28">
          <p className="truncate text-lg font-bold tracking-tight text-app">Orbitus</p>
          <p className="truncate text-xs text-muted">Where Skills Connect</p>
        </div>}
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

      <nav className={`flex-1 space-y-1 ${collapsed ? 'w-full' : ''}`}>
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const showAlert = hasNavAlert(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              title={collapsed ? item.name : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
          ? 'bg-blue-600 font-semibold text-white'
                  : 'text-muted-strong hover:bg-slate-900/5 hover:text-app dark:hover:bg-white/5'
              } ${collapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon size={18} />
              {!collapsed && <span className="truncate">{item.name}</span>}
              {showAlert && (
                <span className={`${collapsed ? 'absolute ml-5 mt-[-18px]' : 'ml-auto'} h-2.5 w-2.5 rounded-full ${isActive ? 'bg-white' : 'bg-red-500'}`} />
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
          <div className="surface-card flex items-center gap-3 rounded-lg p-3">
            <img src={user.profileImage} alt={user.name} className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-app">{user.name}</p>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{user.points} pts</p>
            </div>
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
      <div className="surface-panel fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b p-4 lg:hidden">
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

      <div className={`sticky top-0 z-40 hidden h-screen flex-shrink-0 transition-all duration-300 lg:block ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent collapsed={isCollapsed} />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
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
    </>
  );
};

export default Sidebar;
