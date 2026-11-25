import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Bell, CheckCheck } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import apiClient from '../../services/apiClient.js';

const notificationLabels = {
  Follow: 'followed you',
  PostLike: 'liked your post',
  PostComment: 'commented on your post',
  NewMessage: 'sent a message',
  SessionBooked: 'booked a session',
  SessionReminder: 'session reminder',
  MatchRequest: 'match request',
  BadgeUnlocked: 'badge unlocked',
  CertificateGenerated: 'certificate ready',
  FeedbackSubmitted: 'submitted feedback',
  FeedbackResponse: 'responded to your feedback'
};

const Notifications = () => {
  const { notifications, markNotificationsRead, fetchNotificationSummary } = useSocket();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const isVisibleNotification = useCallback(
    (item) => {
      const senderId = item.sender?._id || item.sender;
      return !senderId || senderId.toString() !== user?._id?.toString();
    },
    [user?._id]
  );

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/notifications');
      const payload = res.data?.data || res.data || {};
      const list = payload.notifications || res.data?.notifications || [];
      setItems((Array.isArray(list) ? list : []).filter(isVisibleNotification));
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isVisibleNotification]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!notifications.length) return;

    setItems((prev) => {
      const existingIds = new Set(prev.map((item) => item._id).filter(Boolean));
      const freshItems = notifications
        .filter(isVisibleNotification)
        .filter((item) => !item._id || !existingIds.has(item._id));

      return freshItems.length ? [...freshItems, ...prev] : prev;
    });
  }, [notifications, isVisibleNotification]);

  const markAllRead = async () => {
    await markNotificationsRead({});
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    fetchNotificationSummary();
  };

  const openNotification = async (item) => {
    const target = item.link || '/notifications';

    if (!item.isRead) {
      await markNotificationsRead({ id: item._id });
      setItems((prev) =>
        prev.map((notification) =>
          notification._id === item._id ? { ...notification, isRead: true } : notification
        )
      );
      fetchNotificationSummary();
    }

    navigate(target);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto min-w-0">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="orb-page-title">Notifications</h1>
          <p className="orb-page-subtitle">Stay updated on your session bookings, likes, and followers.</p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          className="orb-btn-ghost text-xs self-start sm:self-auto"
        >
          <CheckCheck size={14} />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* ── Notification Items Card ── */}
      <div className="orb-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Bell size={28} className="text-slate-300 dark:text-slate-600" />
            <span>No notifications right now.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => {
              const sender = item.sender;

              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => openNotification(item)}
                  className={`flex w-full items-start gap-3.5 p-4 text-left transition-colors cursor-pointer ${
                    !item.isRead
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {sender?.profileImage ? (
                    <img
                      src={sender.profileImage}
                      alt={sender.name}
                      className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shrink-0">
                      <Bell size={16} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!item.isRead && <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />}
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                        {sender?.name || 'Orbitus'}{' '}
                        <span className="font-normal text-slate-500">
                          {notificationLabels[item.type] || 'sent an update'}
                        </span>
                      </p>
                    </div>
                    {item.content && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                        {item.content}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
