import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { GitBranch, Globe, Heart, MessageCircle, MoreVertical, Pencil, Send, Share2, Trash2, UserRound, Users, X } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';

const MAX_POST_LENGTH = 1200;
const PREVIEW_LENGTH = 360;

const Feed = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { sendMessage } = useSocket();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [commentDrafts, setCommentDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState('');
  const [editingPostId, setEditingPostId] = useState('');
  const [editContent, setEditContent] = useState('');
  const [sharePostTarget, setSharePostTarget] = useState(null);
  const [activeChats, setActiveChats] = useState([]);
  const [shareMessage, setShareMessage] = useState('');
  const [expandedPosts, setExpandedPosts] = useState({});
  const [feedScope, setFeedScope] = useState('all');

  useEffect(() => {
    fetchPosts();
    fetchActiveChats();
  }, [token, feedScope]);

  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchPosts = async () => {
    try {
      const res = await axios.get('/api/posts', {
        ...authConfig,
        params: { scope: feedScope }
      });
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const res = await axios.post('/api/posts', { content }, authConfig);
      setPosts((prev) => [res.data.post, ...prev]);
      setContent('');
    } catch (err) {
      console.error('Error creating post:', err);
    }
  };

  const fetchActiveChats = async () => {
    try {
      const res = await axios.get('/api/messages/active', authConfig);
      setActiveChats(res.data.chats || []);
    } catch (err) {
      console.error('Error fetching share contacts:', err);
    }
  };

  const replacePost = (nextPost) => {
    setPosts((prev) => prev.map((post) => post._id === nextPost._id ? nextPost : post));
  };

  const likePost = async (postId) => {
    const res = await axios.put(`/api/posts/${postId}/like`, {}, authConfig);
    replacePost(res.data.post);
  };

  const startEditPost = (post) => {
    setEditingPostId(post._id);
    setEditContent(post.content);
    setOpenMenuId('');
  };

  const savePostEdit = async (postId) => {
    if (!editContent.trim()) return;

    const res = await axios.put(`/api/posts/${postId}`, { content: editContent }, authConfig);
    replacePost(res.data.post);
    setEditingPostId('');
    setEditContent('');
  };

  const deletePost = async (postId) => {
    setOpenMenuId('');
    if (!window.confirm('Delete this post permanently?')) return;

    await axios.delete(`/api/posts/${postId}`, authConfig);
    setPosts((prev) => prev.filter((post) => post._id !== postId));
  };

  const openShareModal = (post) => {
    setSharePostTarget(post);
    setShareMessage('');
  };

  const sharePost = async (recipientId) => {
    if (!sharePostTarget) return;

    const postUrl = `${window.location.origin}/feed?post=${sharePostTarget._id}`;
    const profileUrl = `${window.location.origin}/profile/${sharePostTarget.author._id}`;
    const message = [
      `${user.name} shared ${sharePostTarget.author.name}'s feed post:`,
      sharePostTarget.content,
      `Post: ${postUrl}`,
      `Author profile: ${profileUrl}`,
      `Message or book ${sharePostTarget.author.name} from their profile.`
    ].join('\n\n');

    sendMessage(message, recipientId);
    const res = await axios.put(`/api/posts/${sharePostTarget._id}/share`, {}, authConfig);
    replacePost(res.data.post);
    setShareMessage('Post shared in chat.');
    setTimeout(() => {
      setSharePostTarget(null);
      setShareMessage('');
    }, 900);
  };

  const addComment = async (postId) => {
    const draft = commentDrafts[postId]?.trim();
    if (!draft) return;

    const res = await axios.post(`/api/posts/${postId}/comments`, { content: draft }, authConfig);
    replacePost(res.data.post);
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-app">Daily Posts</h1>
            <p className="mt-1 text-sm text-muted">Share progress, projects, wins and questions with Orbitus users.</p>
          </div>
          <div className="flex rounded-lg border p-1" style={{ borderColor: 'var(--app-border)' }}>
            <button type="button" onClick={() => setFeedScope('all')} className={`rounded-md px-3 py-2 text-xs font-bold ${feedScope === 'all' ? 'bg-blue-600 text-white' : 'text-muted-strong hover:bg-slate-100 dark:hover:bg-white/5'}`}>
              <Globe size={14} className="inline" /> All
            </button>
            <button type="button" onClick={() => setFeedScope('following')} className={`rounded-md px-3 py-2 text-xs font-bold ${feedScope === 'following' ? 'bg-blue-600 text-white' : 'text-muted-strong hover:bg-slate-100 dark:hover:bg-white/5'}`}>
              <Users size={14} className="inline" /> Following
            </button>
            <button type="button" onClick={() => setFeedScope('my')} className={`rounded-md px-3 py-2 text-xs font-bold ${feedScope === 'my' ? 'bg-blue-600 text-white' : 'text-muted-strong hover:bg-slate-100 dark:hover:bg-white/5'}`}>
              <UserRound size={14} className="inline" /> My Posts
            </button>
          </div>
        </div>

        <form onSubmit={createPost} className="section-panel sticky top-0 z-20 space-y-4 p-4 shadow-sm">
          <div className="flex gap-3">
            <img src={user.profileImage} alt={user.name} className="h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-800" />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_POST_LENGTH}
              rows={3}
              placeholder="Share your daily learning update..."
              className="field-input resize px-4 py-3 text-sm"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className={`text-xs font-semibold ${content.length > MAX_POST_LENGTH - 80 ? 'text-amber-600' : 'text-muted'}`}>
              {content.length}/{MAX_POST_LENGTH} characters
            </p>
            <button type="submit" disabled={!content.trim()} className="btn-primary disabled:opacity-50">
              <Send size={16} /> Post
            </button>
          </div>
        </form>

        {loading ? (
          <div className="section-panel p-10 text-center text-sm text-muted">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="section-panel p-10 text-center text-sm text-muted">No posts yet. Start the first update.</div>
        ) : posts.map((post) => {
          const liked = post.likes?.some((id) => id === user._id || id?._id === user._id);
          const isExpanded = Boolean(expandedPosts[post._id]);
          const shouldClamp = post.content.length > PREVIEW_LENGTH;
          const displayContent = shouldClamp && !isExpanded ? `${post.content.slice(0, PREVIEW_LENGTH).trim()}...` : post.content;
          return (
            <article key={post._id} className="section-panel space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Link to={`/profile/${post.author._id}`} title={`View ${post.author.name}'s profile`}>
                    <img src={post.author.profileImage} alt={post.author.name} className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800" />
                  </Link>
                  <div>
                    <Link to={`/profile/${post.author._id}`} className="text-sm font-bold text-app hover:text-blue-600">
                      {post.author.name}
                    </Link>
                    <p className="text-xs text-muted">{new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {post.author?._id === user._id && (
                  <div className="relative">
                    <button type="button" onClick={() => setOpenMenuId(openMenuId === post._id ? '' : post._id)} className="rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-app dark:hover:bg-white/5" title="Post actions">
                      <MoreVertical size={17} />
                    </button>
                    {openMenuId === post._id && (
                      <div className="absolute right-0 top-10 z-20 w-36 rounded-lg border bg-white p-1 text-sm shadow-xl dark:bg-slate-900" style={{ borderColor: 'var(--app-border)' }}>
                        <button type="button" onClick={() => startEditPost(post)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-app hover:bg-slate-100 dark:hover:bg-white/5">
                          <Pencil size={14} /> Edit
                        </button>
                        <button type="button" onClick={() => deletePost(post._id)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {editingPostId === post._id ? (
                <div className="space-y-2">
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} className="field-input resize px-3 py-2 text-sm" />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingPostId('')} className="btn-secondary min-h-0 px-3 py-2 text-xs">Cancel</button>
                    <button type="button" onClick={() => savePostEdit(post._id)} className="btn-primary min-h-0 px-3 py-2 text-xs">Save</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-app">{displayContent}</p>
                  {shouldClamp && (
                    <button
                      type="button"
                      onClick={() => setExpandedPosts((prev) => ({ ...prev, [post._id]: !prev[post._id] }))}
                      className="mt-1 text-xs font-bold text-blue-600 hover:text-blue-500"
                    >
                      {isExpanded ? 'See less' : 'See more'}
                    </button>
                  )}
                </div>
              )}

              {post.project?.title && (
                <div className="rounded-lg border p-3" style={{ borderColor: 'var(--app-border)' }}>
                  <p className="text-sm font-bold text-app">{post.project.title}</p>
                  <div className="mt-2 flex gap-3">
                    {post.project.githubUrl && <a href={post.project.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600"><GitBranch size={13} /> GitHub</a>}
                    {post.project.liveUrl && <a href={post.project.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600"><Globe size={13} /> Website</a>}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 border-y py-2" style={{ borderColor: 'var(--app-border)' }}>
                <button type="button" onClick={() => likePost(post._id)} className={`btn-secondary min-h-0 px-3 py-2 text-xs ${liked ? 'border-red-500 bg-red-600 text-white hover:bg-red-500' : ''}`}>
                  <Heart size={14} fill={liked ? 'currentColor' : 'none'} /> {post.likes?.length || 0} Like
                </button>
                <button type="button" className="btn-secondary min-h-0 px-3 py-2 text-xs">
                  <MessageCircle size={14} /> {post.comments?.length || 0}
                </button>
                <button type="button" onClick={() => openShareModal(post)} className="btn-secondary min-h-0 px-3 py-2 text-xs">
                  <Share2 size={14} /> {post.shares || 0}
                </button>
              </div>

              <div className="space-y-3">
                {(post.comments || []).length > 4 && (
                  <p className="text-xs font-semibold text-muted">Showing latest 4 of {post.comments.length} comments</p>
                )}
                {(post.comments || []).slice(-4).map((comment) => (
                  <div key={comment._id || `${comment.author?._id}-${comment.createdAt}`} className="flex gap-2 text-sm">
                    <img src={comment.author?.profileImage} alt="" className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    <div className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-900">
                      <p className="text-xs font-bold text-app">{comment.author?.name}</p>
                      <p className="text-xs text-muted-strong">{comment.content}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={commentDrafts[post._id] || ''}
                    onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post._id]: e.target.value }))}
                    placeholder="Write a comment..."
                    className="field-input px-3 py-2 text-sm"
                  />
                  <button type="button" onClick={() => addComment(post._id)} className="btn-primary min-h-0 px-3 py-2">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {sharePostTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border bg-white p-5 shadow-2xl dark:bg-slate-900" style={{ borderColor: 'var(--app-border)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-app">Share post with</h3>
              <button type="button" onClick={() => setSharePostTarget(null)} className="rounded-lg p-1.5 text-muted hover:text-app">
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-muted">{sharePostTarget.content}</p>
            <Link to={`/profile/${sharePostTarget.author._id}`} className="mt-3 flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-100 dark:hover:bg-white/5" style={{ borderColor: 'var(--app-border)' }}>
              <img src={sharePostTarget.author.profileImage} alt={sharePostTarget.author.name} className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-app">{sharePostTarget.author.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted"><UserRound size={12} /> Profile will be shared too</p>
              </div>
            </Link>
            {shareMessage && <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-600">{shareMessage}</p>}

            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
              {activeChats.length === 0 ? (
                <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted" style={{ borderColor: 'var(--app-border)' }}>
                  No chat contacts yet. Start a chat from AI Matches first.
                </div>
              ) : activeChats.map((chat) => (
                <button key={chat.chatRoomId} type="button" onClick={() => sharePost(chat.partner._id)} className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-white/5" style={{ borderColor: 'var(--app-border)' }}>
                  <img src={chat.partner.profileImage} alt={chat.partner.name} className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-app">{chat.partner.name}</p>
                    <p className="truncate text-xs text-muted">Send in chat</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
