import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Bell, CheckCheck } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';

const notificationLabels = {
  Follow: 'followed you',
  PostLike: 'liked your post',
  PostComment: 'commented on your post',
  NewMessage: 'sent a message',
  SessionBooked: 'booked a session',
  SessionReminder: 'session reminder',
  MatchRequest: 'match request',
  BadgeUnlocked: 'badge unlocked',
  CertificateGenerated: 'certificate ready'
};

const Notifications = () => {
  const { markNotificationsRead, fetchNotificationSummary } = useSocket();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setItems((res.data.notifications || []).filter((item) => {
        const senderId = item.sender?._id || item.sender;
        return !senderId || senderId.toString() !== user?._id?.toString();
      }));
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?._id]);

  const markAllRead = async () => {
    await markNotificationsRead({});
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    fetchNotificationSummary();
  };

  const openNotification = async (item) => {
    const target = item.link || '/notifications';

    if (!item.isRead) {
      await markNotificationsRead({ id: item._id });
      setItems((prev) => prev.map((notification) => (
        notification._id === item._id ? { ...notification, isRead: true } : notification
      )));
      fetchNotificationSummary();
    }

    navigate(target);
  };

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-app">Notifications</h1>
            <p className="mt-1 text-sm text-muted">Recent activity is kept for 7 days.</p>
          </div>
          <button type="button" onClick={markAllRead} className="btn-secondary text-[10px] sm:text-[16px] px-2">
            <CheckCheck size={16} /> Mark read
          </button>
        </div>

        <div className="section-panel overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-sm text-muted">Loading notifications...</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted">No notifications right now.</div>
          ) : items.map((item) => {
            const sender = item.sender;

            return (
              <button
                key={item._id}
                type="button"
                onClick={() => openNotification(item)}
                className="flex w-full items-start gap-3 border-b p-4 text-left transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                style={{ borderColor: 'var(--app-border)' }}
              >
                {sender?.profileImage ? (
                  <img src={sender.profileImage} alt={sender.name} className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Bell size={18} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!item.isRead && <span className="h-2 w-2 rounded-full bg-red-500" />}
                    <p className="truncate text-sm font-bold text-app">
                      {sender?.name || 'Orbitus'} {notificationLabels[item.type] || 'sent an update'}
                    </p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{item.content}</p>
                  <p className="mt-1 text-xs font-semibold text-muted">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
