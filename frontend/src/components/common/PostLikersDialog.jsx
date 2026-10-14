import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../ui/dialog.jsx';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar.jsx';
import { Badge } from '../ui/badge.jsx';
import { Skeleton } from '../ui/skeleton.jsx';
import { Heart, Users, AlertCircle } from 'lucide-react';

export const PostLikersDialog = ({ postId, commentId = null, isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const fetchLikers = useCallback(async (pageNum = 1, append = false) => {
    if (!postId) return;
    if (pageNum === 1) {
      setLoading(true);
      setError('');
    } else {
      setLoadingMore(true);
    }

    try {
      const endpoint = commentId
        ? `/api/posts/${postId}/comments/${commentId}/likes`
        : `/api/posts/${postId}/likes`;

      const res = await apiClient.get(endpoint, {
        params: { page: pageNum, limit: 15 }
      });

      const data = res.data?.data || res.data || {};
      const fetchedUsers = data.users || [];

      if (append) {
        setUsers((prev) => [...prev, ...fetchedUsers]);
      } else {
        setUsers(fetchedUsers);
      }

      setTotal(data.total || fetchedUsers.length);
      setHasMore(Boolean(data.hasMore));
      setPage(pageNum);
    } catch (err) {
      console.warn('Failed to fetch likers:', err);
      setError(err?.response?.data?.message || 'Could not load likers. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [postId, commentId]);

  useEffect(() => {
    if (isOpen && postId) {
      setUsers([]);
      setTotal(0);
      setPage(1);
      setHasMore(false);
      setError('');
      fetchLikers(1, false);
    }
  }, [isOpen, postId, commentId, fetchLikers]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchLikers(page + 1, true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full rounded-3xl bg-white dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
        <DialogHeader className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500">
              <Heart size={18} fill="currentColor" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white font-outfit">
                {commentId ? 'Likes on Comment' : 'Likes on Post'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                {total} {total === 1 ? 'person liked' : 'people liked'} this {commentId ? 'comment' : 'update'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Likers List Body */}
        <div className="py-2 max-h-[60vh] overflow-y-auto space-y-2.5">
          {loading ? (
            <div className="space-y-3 py-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-32 rounded" />
                    <Skeleton className="h-2.5 w-20 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/50 text-center space-y-2">
              <AlertCircle size={20} className="mx-auto text-red-500" />
              <p className="text-xs text-red-500 font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => fetchLikers(1, false)}
                className="text-xs font-bold text-red-600 dark:text-red-400 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 space-y-2 text-slate-400 dark:text-slate-500">
              <Users size={32} className="mx-auto stroke-[1.5]" />
              <p className="text-xs font-medium">No one has liked this post yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {users.map((u) => {
                const profileUrl = u._id ? `/profile/${u._id}` : (u.username ? `/profile/${u.username}` : '#');
                return (
                  <div key={u._id} className="flex items-center justify-between py-2.5 px-1 gap-3">
                    <Link
                      to={profileUrl}
                      onClick={onClose}
                      className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-85 transition-opacity"
                    >
                      <Avatar className="w-10 h-10 border border-slate-200 dark:border-slate-700 shrink-0">
                        <AvatarImage src={u.profileImage} alt={u.name} />
                        <AvatarFallback className="bg-indigo-600 text-white font-bold text-xs">
                          {u.name?.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {u.name}
                          </span>
                          {u.experienceLevel && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              {u.experienceLevel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                          @{u.username || 'user'}
                        </p>
                        {u.headline && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {u.headline}
                          </p>
                        )}
                      </div>
                    </Link>

                    <Link
                      to={profileUrl}
                      onClick={onClose}
                      className="px-3 py-1 rounded-lg text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors shrink-0"
                    >
                      View
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {hasMore && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading more...' : 'Load more likers'}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostLikersDialog;
