import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../ui/dialog.jsx';
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
import { PulseHeart } from './react-bits/PulseHeart.jsx';
import PostLikersDialog from './PostLikersDialog.jsx';
import {
  MessageCircle,
  Trash2,
  Send,
  Loader2,
  AlertCircle,
  Reply,
  Pencil,
  Share2,
  Check,
  X,
  CornerDownRight
} from 'lucide-react';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export const PostCommentsModal = ({
  post,
  isOpen,
  onClose,
  currentUser,
  onCommentAdded,
  onCommentDeleted,
  onCommentEdited
}) => {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Replying state: { threadRootId, replyToCommentId, username, authorId }
  const [replyTarget, setReplyTarget] = useState(null);

  // Editing state: { commentId, originalContent }
  const [editingTarget, setEditingTarget] = useState(null);

  // Deleting confirmation state: comment object or commentId
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState('');

  // Comment Likers dialog state: commentId
  const [activeCommentLikersId, setActiveCommentLikersId] = useState(null);

  // Copied share status per commentId
  const [copiedCommentId, setCopiedCommentId] = useState('');

  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setCommentText('');
      setReplyTarget(null);
      setEditingTarget(null);
      setCommentToDelete(null);
      setError('');
    }
  }, [isOpen]);

  if (!post) return null;

  const comments = post.comments || [];
  const currentUserId = (currentUser?._id || currentUser?.id || '').toString();
  const postAuthorId = (post.author?._id || post.author || '').toString();
  const isAdmin = (currentUser?.role || '').toLowerCase() === 'admin';

  // Organize comments into single-hierarchy thread roots and direct sibling replies
  const topLevelComments = [];
  const repliesByRootId = {};

  comments.forEach((comment) => {
    // If it has threadRootId or parentCommentId, it belongs under that root thread
    const rootId = (comment.threadRootId || comment.parentCommentId)?.toString() || null;
    if (rootId) {
      if (!repliesByRootId[rootId]) {
        repliesByRootId[rootId] = [];
      }
      repliesByRootId[rootId].push(comment);
    } else {
      // Legacy or root comments without parentCommentId
      topLevelComments.push(comment);
    }
  });

  const handleStartReply = (comment, rootCommentId = null) => {
    const author = comment.author || {};
    const authorUsername = author.username || author.name || 'user';
    // Thread root is the rootCommentId, or target comment's threadRootId/parentCommentId, or target comment itself
    const resolvedRootId = rootCommentId || comment.threadRootId || comment.parentCommentId || comment._id;

    setEditingTarget(null);
    setReplyTarget({
      threadRootId: resolvedRootId,
      replyToCommentId: comment._id,
      username: authorUsername,
      authorId: author._id || author
    });
    setCommentText(`@${authorUsername} `);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleStartEdit = (comment) => {
    setReplyTarget(null);
    setEditingTarget({
      commentId: comment._id,
      originalContent: comment.content
    });
    setCommentText(comment.content);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleCancelComposerAction = () => {
    setReplyTarget(null);
    setEditingTarget(null);
    setCommentText('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      if (editingTarget) {
        // Edit existing comment (within 15 min window)
        const res = await apiClient.put(
          `/api/posts/${post._id}/comments/${editingTarget.commentId}`,
          { content: commentText.trim() }
        );
        const updatedPost = res.data?.data?.post || res.data?.post || res.data;
        if (onCommentEdited) {
          onCommentEdited(updatedPost);
        } else if (onCommentAdded) {
          onCommentAdded(updatedPost);
        }
        handleCancelComposerAction();
      } else {
        // Add new root comment or reply (single hierarchy depth)
        const payload = {
          content: commentText.trim()
        };
        if (replyTarget) {
          payload.threadRootId = replyTarget.threadRootId;
          payload.parentCommentId = replyTarget.threadRootId;
          payload.replyToCommentId = replyTarget.replyToCommentId;
          if (replyTarget.authorId) {
            payload.replyTo = replyTarget.authorId;
          }
        }

        const res = await apiClient.post(`/api/posts/${post._id}/comments`, payload);
        const updatedPost = res.data?.data?.post || res.data?.post || res.data;
        if (onCommentAdded) {
          onCommentAdded(updatedPost);
        }
        handleCancelComposerAction();
      }
    } catch (err) {
      console.warn('Comment action failed:', err);
      setError(err?.response?.data?.message || 'Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete) return;
    const commentId = commentToDelete._id || commentToDelete;

    setDeletingCommentId(commentId);
    setError('');
    try {
      const res = await apiClient.delete(`/api/posts/${post._id}/comments/${commentId}`);
      const updatedPost = res.data?.data?.post || res.data?.post;
      if (onCommentDeleted) {
        onCommentDeleted(post._id, commentId, updatedPost);
      }
      setCommentToDelete(null);
    } catch (err) {
      console.warn('Failed to delete comment:', err);
      setError(err?.response?.data?.message || 'Failed to delete comment.');
    } finally {
      setDeletingCommentId('');
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    try {
      const res = await apiClient.put(`/api/posts/${post._id}/comments/${commentId}/like`);
      const updatedPost = res.data?.data?.post || res.data?.post;
      if (updatedPost) {
        if (onCommentEdited) {
          onCommentEdited(updatedPost);
        } else if (onCommentAdded) {
          onCommentAdded(updatedPost);
        }
      }
    } catch (err) {
      console.warn('Failed to toggle comment like:', err);
    }
  };

  const handleShareComment = (comment) => {
    const shareUrl = `${window.location.origin}/feed#post-${post._id}-comment-${comment._id}`;
    if (navigator.share) {
      navigator.share({
        title: 'Orbitus Discussion',
        text: `Check out this comment by ${comment.author?.name || 'a member'} on Orbitus:`,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedCommentId(comment._id);
      setTimeout(() => setCopiedCommentId(''), 2000);
    }
  };

  const renderCommentCard = (comment, isReply = false, rootCommentId = null) => {
    const cAuthor = comment.author || {};
    const commentAuthorId = (cAuthor._id || cAuthor || '').toString();
    const isAuthor = commentAuthorId === currentUserId;
    const canDelete = isAuthor || postAuthorId === currentUserId || isAdmin;

    const createdAtMs = comment.createdAt ? new Date(comment.createdAt).getTime() : Date.now();
    const isWithin15Min = Date.now() - createdAtMs <= FIFTEEN_MINUTES_MS;
    const canEdit = isAuthor && isWithin15Min;

    const likes = Array.isArray(comment.likes) ? comment.likes : [];
    const liked = likes.some((l) => (l?._id || l || '').toString() === currentUserId);
    const likesCount = typeof comment.likesCount === 'number' ? comment.likesCount : likes.length;

    const profileUrl = cAuthor._id ? `/profile/${cAuthor._id}` : (cAuthor.username ? `/profile/${cAuthor.username}` : '#');
    const replyUsername = comment.replyTo?.username || comment.replyTo?.name;

    return (
      <div
        key={comment._id}
        className={`rounded-2xl border p-3 space-y-2 transition-all ${
          isReply
            ? 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/60 dark:border-slate-800/40 ml-4 sm:ml-6 mt-2'
            : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/60'
        }`}
      >
        {/* Upper Row: Author avatar, name, @username; Right: PulseHeart without unwanted border */}
        <div className="flex items-center justify-between gap-2">
          <Link
            to={profileUrl}
            onClick={onClose}
            className="flex items-center gap-2 min-w-0 hover:opacity-85 transition-opacity"
            title={`View ${cAuthor.name || 'Member'}'s profile`}
          >
            <Avatar className="w-7 h-7 border border-slate-200 dark:border-slate-700 shrink-0">
              <AvatarImage src={cAuthor.profileImage} alt={cAuthor.name} />
              <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">
                {cAuthor.name?.slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {cAuthor.name || 'Member'}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                @{cAuthor.username || 'user'}
              </span>
            </div>
          </Link>

          {/* Upper Right: Clean PulseHeart toggle with liker count and zero click border */}
          <PulseHeart
            liked={liked}
            count={likesCount}
            onToggle={() => handleToggleCommentLike(comment._id)}
            onCountClick={() => setActiveCommentLikersId(comment._id)}
            ariaLabel="Like comment"
            countAriaLabel="View who liked this comment"
            size={16}
          />
        </div>

        {/* Content Row: Direct recipient @username mention + comment text with readable wrapping */}
        <div className="pl-9 pr-1">
          {replyUsername && (
            <span className="inline-block text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mr-1.5 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.2 rounded">
              @{replyUsername}
            </span>
          )}
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>

        {/* Bottom Row: Timestamp, Edited badge, Reply, Edit, Delete, Share */}
        <div className="flex items-center justify-between gap-2 pt-1 pl-9 border-t border-slate-100 dark:border-slate-800/40 text-[11px]">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <span>
              {comment.createdAt
                ? new Date(comment.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Just now'}
            </span>
            {comment.editedAt && (
              <span className="text-[10px] font-medium text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1 py-0.2 rounded" title={`Edited on ${new Date(comment.editedAt).toLocaleString()}`}>
                Edited
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Reply action: targets conversation thread root while citing specific recipient */}
            <button
              type="button"
              onClick={() => handleStartReply(comment, isReply ? rootCommentId : comment._id)}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
              title="Reply to comment"
            >
              <Reply size={12} />
              <span>Reply</span>
            </button>

            {/* 15-Minute Edit action */}
            {canEdit && (
              <button
                type="button"
                onClick={() => handleStartEdit(comment)}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
                title="Edit comment (available for 15 minutes)"
              >
                <Pencil size={12} />
                <span>Edit</span>
              </button>
            )}

            {/* Delete action: opens accessible AlertDialog modal */}
            {canDelete && (
              <button
                type="button"
                onClick={() => setCommentToDelete(comment)}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-red-500 font-medium transition-colors cursor-pointer"
                title="Delete comment"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            )}

            {/* Share action */}
            <button
              type="button"
              onClick={() => handleShareComment(comment)}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-app font-medium transition-colors cursor-pointer"
              title="Share comment link"
            >
              {copiedCommentId === comment._id ? (
                <>
                  <Check size={12} className="text-emerald-500" />
                  <span className="text-emerald-500 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Share2 size={12} />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Single-depth child replies container: all replies stay siblings under the root comment */}
        {!isReply && repliesByRootId[comment._id] && repliesByRootId[comment._id].length > 0 && (
          <div className="relative pl-2 sm:pl-3 pt-1 border-l-2 border-indigo-200/50 dark:border-indigo-900/40 space-y-2 mt-2">
            {repliesByRootId[comment._id].map((child) => renderCommentCard(child, true, comment._id))}
          </div>
        )}
      </div>
    );
  };

  const isDeletingRootWithReplies =
    commentToDelete &&
    !commentToDelete.parentCommentId &&
    !commentToDelete.threadRootId &&
    (repliesByRootId[commentToDelete._id]?.length || 0) > 0;

  const repliesCount = commentToDelete ? repliesByRootId[commentToDelete._id]?.length || 0 : 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-xl w-full rounded-3xl bg-white dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col max-h-[85vh]">
          <DialogHeader className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                <MessageCircle size={18} />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white font-outfit">
                  Post Discussion
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                  {comments.length} {comments.length === 1 ? 'comment' : 'comments'} on this update
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Post Summary Preview */}
          <div className="p-3 my-2 rounded-2xl bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 shrink-0">
            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
              {post.content}
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-500 font-medium">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Scrollable Comments Stream */}
          <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 min-h-[140px]">
            {topLevelComments.length === 0 ? (
              <div className="text-center py-10 space-y-1.5 text-slate-400 dark:text-slate-500">
                <MessageCircle size={28} className="mx-auto stroke-[1.5]" />
                <p className="text-xs font-medium">No comments yet. Be the first to join the conversation!</p>
              </div>
            ) : (
              topLevelComments.map((comment) => renderCommentCard(comment, false, null))
            )}
          </div>

          {/* Composer Mode Banner (Replying or Editing) */}
          {(replyTarget || editingTarget) && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/60 dark:border-indigo-900/50 text-xs text-indigo-700 dark:text-indigo-300 shrink-0">
              <div className="flex items-center gap-1.5">
                {replyTarget ? (
                  <>
                    <CornerDownRight size={13} className="text-indigo-500" />
                    <span>Replying to <strong>@{replyTarget.username}</strong></span>
                  </>
                ) : (
                  <>
                    <Pencil size={13} className="text-indigo-500" />
                    <span>Editing your comment (15-min window)</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={handleCancelComposerAction}
                className="p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 cursor-pointer"
                title="Cancel"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Comment Composer Input Footer */}
          <form onSubmit={handleSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder={replyTarget ? `Reply to @${replyTarget.username}...` : editingTarget ? 'Edit comment...' : 'Write a comment...'}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={submitting}
                className="flex-1 bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm cursor-pointer shrink-0"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                <span>{editingTarget ? 'Save' : replyTarget ? 'Reply' : 'Post'}</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog with Thread Cascade Warning */}
      <AlertDialog open={Boolean(commentToDelete)} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl bg-white dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              {isDeletingRootWithReplies ? 'Delete Discussion Thread?' : 'Delete Comment?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {isDeletingRootWithReplies
                ? `This comment has ${repliesCount} ${repliesCount === 1 ? 'reply' : 'replies'}. Deleting it will permanently remove the entire discussion thread. Are you sure?`
                : 'Are you sure you want to permanently delete this comment? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:justify-end pt-4">
            <AlertDialogCancel
              onClick={() => setCommentToDelete(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-0"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={Boolean(deletingCommentId)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm border-0"
            >
              {deletingCommentId ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Comment Likers Dialog */}
      <PostLikersDialog
        postId={post._id}
        commentId={activeCommentLikersId}
        isOpen={Boolean(activeCommentLikersId)}
        onClose={() => setActiveCommentLikersId(null)}
      />
    </>
  );
};

export default PostCommentsModal;
