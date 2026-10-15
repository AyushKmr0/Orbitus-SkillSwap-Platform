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
  Users,
  Trophy,
  ShieldAlert,
  LogOut,
  Sun,
  Moon,
  Newspaper,
  Bell,
  Settings,
  PanelLeft,
  X
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo.jsx';
import { optimizeCloudinaryUrl } from '../../lib/utils.js';
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarRail,
  SidebarInset,
  SidebarTrigger,
  useSidebar
} from '../ui/sidebar.jsx';
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
import { Badge } from '../ui/badge.jsx';

const AppShadcnSidebarInner = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const { unreadCount } = useSelector((state) => state.chat);
  const { notificationSummary } = useSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isMobile, open, setOpen, setOpenMobile } = useSidebar();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const userRoleLower = (user?.role || '').toLowerCase();
  const filteredItems = navItems.filter(
    (item) => item.role !== 'Admin' || userRoleLower === 'admin'
  );

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

  const getPageTitle = () => {
    const current = navItems.find(
      (item) =>
        location.pathname === item.path ||
        (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
    );
    return current ? current.name : 'Orbitus';
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogoClick = (event) => {
    if (isMobile) {
      setOpenMobile(false);
    } else if (!open) {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    <>
      {/* shadcn Responsive Sidebar (Left rail on desktop, slide-over Sheet on mobile) */}
      <Sidebar data-orbitus-sidebar="true" collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        {/* Sidebar Header with Brand Logo */}
          <SidebarHeader className="p-3 group-data-[collapsible=icon]:px-2 border-b border-sidebar-border orbitus-sidebar-header-motion">
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/"
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 overflow-hidden rounded-lg p-1 transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring cursor-pointer"
              title={!open && !isMobile ? 'Expand sidebar' : 'Orbitus home'}
              aria-label={!open && !isMobile ? 'Expand sidebar' : 'Orbitus home'}
            >
              <BrandLogo size={40} className="h-10 w-10 shrink-0 object-contain" />
              <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="truncate text-base font-extrabold tracking-tight text-app leading-tight font-outfit">
                  Orbitus
                </span>
                <span className="truncate text-[10px] font-semibold text-muted leading-none">
                  Where Skills Connect
                </span>
              </div>
            </Link>

            {isMobile ? (
              <button
                type="button"
                onClick={() => setOpenMobile(false)}
                className="p-1.5 rounded-lg text-muted hover:text-app hover:bg-sidebar-accent transition-colors"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            ) : (
              <div className="group-data-[collapsible=icon]:hidden">
                <SidebarTrigger className="p-1.5 rounded-lg text-muted hover:text-app hover:bg-sidebar-accent transition-colors" />
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* Sidebar Navigation Items */}
        <SidebarContent className="p-2">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted px-2 py-1.5 group-data-[collapsible=icon]:hidden">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredItems.map((item, index) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== '/dashboard' && location.pathname.startsWith(item.path)) ||
                    (item.path === '/suggested-users' && location.pathname === '/ai-match');
                  const Icon = item.icon;
                  const badgeValue = getUnreadBadge(item.path);

                  return (
                    <SidebarMenuItem
                      key={item.path}
                      className="orbitus-sidebar-item-motion"
                      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                          tooltip={{
                            children: item.name,
                            className: 'z-[100] min-h-8 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                          }}
                        className={`relative rounded-xl transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white font-bold hover:bg-blue-600 hover:text-white shadow-sm'
                            : 'text-muted-strong hover:bg-sidebar-accent hover:text-app'
                        }`}
                      >
                          <Link
                            to={item.path}
                            onClick={handleLinkClick}
                            className="flex items-center gap-3 w-full"
                            title={item.name}
                            aria-label={item.name}
                          >
                          <Icon size={18} className="shrink-0" />
                          <span className="truncate text-xs font-semibold">{item.name}</span>
                          {badgeValue && (
                            <SidebarMenuBadge
                              className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-white text-blue-600'
                                  : 'bg-red-500 text-white'
                              }`}
                            >
                              {badgeValue}
                            </SidebarMenuBadge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Sidebar Footer: Theme Toggle, Profile, Settings & Logout */}
        <SidebarFooter className="p-2 border-t border-sidebar-border space-y-2 orbitus-sidebar-footer-motion">
          {/* Theme Toggle Button */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => dispatch(toggleTheme())}
                tooltip={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                className="w-full rounded-xl text-muted-strong hover:bg-sidebar-accent hover:text-app transition-colors"
              >
                <div className="flex items-center gap-3 w-full">
                  {mode === 'dark' ? <Sun size={18} className="shrink-0 text-amber-400" /> : <Moon size={18} className="shrink-0 text-indigo-500" />}
                  <span className="truncate text-xs font-medium group-data-[collapsible=icon]:hidden">
                    {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* User Profile Footer (Expanded State) */}
          {user && (
            <>
              <div className="flex group-data-[collapsible=icon]:hidden items-center justify-between p-1.5 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
                <Link
                  to={`/profile/${user._id || 'me'}`}
                  onClick={handleLinkClick}
                  className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
                  title="View your public profile"
                >
                  <Avatar className="h-8 w-8 shrink-0 border border-sidebar-border">
                    <AvatarImage src={optimizeCloudinaryUrl(user.profileImage, { width: 96, height: 96 })} alt={user.name} />
                    <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
                      {user.name?.slice(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-app leading-tight">{user.name}</p>
                    {userRoleLower === 'admin' ? (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 border-indigo-400/40 text-indigo-500">
                        Admin
                      </Badge>
                    ) : (
                      <p className="truncate text-[10px] text-muted leading-tight">
                        @{user.username || 'user'}
                      </p>
                    )}
                  </div>
                </Link>

                <div className="flex items-center gap-1">
                  <Link
                    to="/settings"
                    onClick={handleLinkClick}
                    className="p-1 rounded-lg text-muted hover:text-app hover:bg-sidebar-accent transition-colors"
                    title="Account Settings"
                  >
                    <Settings size={15} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="p-1 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </div>

              {/* User Profile Mini Actions (Collapsed / Icon State) */}
              <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-1.5">
                <SidebarMenuButton
                  asChild
                    tooltip={{
                      children: `Profile (${user.name})`,
                      className: 'z-[100] min-h-8 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                    }}
                  className="h-8 w-8 p-0 rounded-xl justify-center"
                >
                  <Link to={`/profile/${user._id || 'me'}`} onClick={handleLinkClick}>
                    <Avatar className="h-7 w-7 border border-sidebar-border">
                      <AvatarImage src={optimizeCloudinaryUrl(user.profileImage, { width: 84, height: 84 })} alt={user.name} />
                      <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">
                        {user.name?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </SidebarMenuButton>

                <SidebarMenuButton
                  asChild
                    tooltip={{
                      children: 'Account Settings',
                      className: 'z-[100] min-h-8 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                    }}
                  className="h-8 w-8 p-0 rounded-xl justify-center text-muted-strong hover:text-app"
                >
                  <Link to="/settings" onClick={handleLinkClick}>
                    <Settings size={16} />
                  </Link>
                </SidebarMenuButton>

                <SidebarMenuButton
                    tooltip={{
                      children: 'Sign Out',
                      className: 'z-[100] min-h-8 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                    }}
                  onClick={() => setShowLogoutModal(true)}
                  className="h-8 w-8 p-0 rounded-xl justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut size={16} />
                </SidebarMenuButton>
              </div>
            </>
          )}
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Main Content Area via SidebarInset: starts beside desktop sidebar with min-w-0 */}
      <SidebarInset className="flex-1 min-w-0 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden bg-background">
        {/* Mobile / Responsive Shell Header Bar (Hidden on md and desktop) */}
        <header className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-sidebar-border bg-sidebar/95 backdrop-blur-sm z-30 shrink-0 orbitus-sidebar-mobile-header-motion">
          <div className="flex items-center gap-2.5">
            <SidebarTrigger className="p-1.5 rounded-lg text-muted hover:text-app hover:bg-sidebar-accent transition-colors">
              <PanelLeft size={18} />
            </SidebarTrigger>
            <span className="text-sm font-bold text-app truncate font-outfit">
              {getPageTitle()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/notifications"
              className="relative p-1.5 rounded-lg text-muted hover:text-app hover:bg-sidebar-accent transition-colors"
              title="Notifications"
            >
              <Bell size={17} />
              {(notificationSummary?.totalUnread || 0) > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Link>
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              className="p-1.5 rounded-lg text-muted hover:text-app hover:bg-sidebar-accent transition-colors"
              title="Toggle theme"
            >
              {mode === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-500" />}
            </button>
          </div>
        </header>

        {/* Page Content Container: Starts beside desktop sidebar without clipping */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>

      {/* Logout Confirmation AlertDialog */}
      <AlertDialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <AlertDialogContent className="max-w-sm rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Confirm Sign Out
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to end your current session? You will need to sign in again to access your exchanges.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:justify-end pt-4">
            <AlertDialogCancel
              onClick={() => setShowLogoutModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-0"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm border-0"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const AppShadcnSidebar = ({ children }) => {
  return (
    <SidebarProvider defaultOpen={true} className="flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden">
      <AppShadcnSidebarInner>{children}</AppShadcnSidebarInner>
    </SidebarProvider>
  );
};

export default AppShadcnSidebar;
