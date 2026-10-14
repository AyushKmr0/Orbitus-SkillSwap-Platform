import Post from '../../models/Post.js';
import User from '../../models/User.js';

export const populatePost = (query) => {
  if (!query || typeof query.populate !== 'function') return query;
  return query
    .populate('author', 'name username profileImage bio experienceLevel followersCount followingCount isVerified points')
    .populate('comments.author', 'name username profileImage bio isVerified points')
    .populate('comments.replyTo', 'name username profileImage bio isVerified')
    .lean();
};

export class PostRepository {
  async create(data) {
    return Post.create(data);
  }

  async findById(id) {
    return Post.findById(id);
  }

  async findPopulatedById(id) {
    return populatePost(Post.findById(id));
  }

  async findByIdAndAuthor(id, authorId) {
    return Post.findOne({ _id: id, author: authorId });
  }

  async deleteByIdAndAuthor(id, authorId) {
    return Post.findOneAndDelete({ _id: id, author: authorId });
  }

  async findUserByUsername(username) {
    return User.findOne({ username: username.toLowerCase() }).select('_id name username');
  }

  async incrementShares(id) {
    return Post.findByIdAndUpdate(
      id,
      { $inc: { shares: 1 } },
      { new: true }
    );
  }

  async getPostLikers(id, { skip = 0, limit = 20 }) {
    const post = await Post.findById(id).select('likes likesCount');
    if (!post) return null;
    const total = post.likes ? post.likes.length : 0;
    const pagedIds = (post.likes || []).slice(skip, skip + limit);
    const users = await User.find({ _id: { $in: pagedIds } })
      .select('_id name username profileImage bio experienceLevel isVerified points')
      .lean();

    const idMap = new Map(users.map((u) => [u._id.toString(), u]));
    const orderedUsers = pagedIds.map((lid) => idMap.get(lid.toString())).filter(Boolean);

    return {
      users: orderedUsers,
      total,
      hasMore: skip + limit < total
    };
  }

  async getCommentLikers(id, commentId, { skip = 0, limit = 20 }) {
    const post = await Post.findById(id).select('comments');
    if (!post) return null;

    const comment = post.comments.id
      ? post.comments.id(commentId)
      : (post.comments || []).find((c) => (c._id?.toString() || '') === (commentId?.toString() || ''));
    if (!comment) return null;

    const total = comment.likes ? comment.likes.length : 0;
    const pagedIds = (comment.likes || []).slice(skip, skip + limit);
    const users = await User.find({ _id: { $in: pagedIds } })
      .select('_id name username profileImage bio experienceLevel isVerified points')
      .lean();

    const idMap = new Map(users.map((u) => [u._id.toString(), u]));
    const orderedUsers = pagedIds.map((lid) => idMap.get(lid.toString())).filter(Boolean);

    return {
      users: orderedUsers,
      total,
      hasMore: skip + limit < total
    };
  }

  async editComment(id, commentId, { content }, user) {
    const post = await Post.findById(id);
    if (!post) return { notFound: 'post' };

    const comment = post.comments.id
      ? post.comments.id(commentId)
      : (post.comments || []).find((c) => (c._id?.toString() || '') === (commentId?.toString() || ''));
    if (!comment) return { notFound: 'comment' };

    const userId = (user._id || user.id || '').toString();
    const commentAuthorId = (comment.author?._id || comment.author || '').toString();

    if (userId !== commentAuthorId) {
      return { forbidden: true };
    }

    const ageMs = Date.now() - new Date(comment.createdAt).getTime();
    if (ageMs > 15 * 60 * 1000) {
      return { expired: true };
    }

    comment.content = content;
    comment.editedAt = new Date();
    await post.save();

    const populated = await populatePost(Post.findById(id));
    return { post: populated, comment };
  }

  async likeComment(id, commentId, userId) {
    const post = await Post.findById(id);
    if (!post) return { notFound: 'post' };

    const comment = post.comments.id
      ? post.comments.id(commentId)
      : (post.comments || []).find((c) => (c._id?.toString() || '') === (commentId?.toString() || ''));
    if (!comment) return { notFound: 'comment' };

    const uIdStr = (userId?._id || userId || '').toString();
    comment.likes = comment.likes || [];
    const alreadyLiked = comment.likes.some((lid) => (lid?._id || lid || '').toString() === uIdStr);

    if (alreadyLiked) {
      if (typeof comment.likes.pull === 'function') {
        comment.likes.pull(userId);
      }
      comment.likes = comment.likes.filter((lid) => (lid?._id || lid || '').toString() !== uIdStr);
      comment.likesCount = Math.max(0, (comment.likesCount || comment.likes.length + 1) - 1);
    } else {
      comment.likes.push(userId);
      comment.likesCount = (comment.likesCount || comment.likes.length - 1) + 1;
    }

    await post.save();
    const populated = await populatePost(Post.findById(id));
    const commentAuthorId = (comment.author?._id || comment.author || '').toString();

    return {
      post: populated,
      liked: !alreadyLiked,
      commentAuthorId
    };
  }

  async deleteComment(id, commentId, user) {
    const post = await Post.findById(id);
    if (!post) return { notFound: 'post' };

    const comment = post.comments.id
      ? post.comments.id(commentId)
      : post.comments.find((c) => (c._id?.toString() || '') === (commentId?.toString() || ''));
    if (!comment) return { notFound: 'comment' };

    const userId = (user._id || user.id || '').toString();
    const commentAuthorId = (comment.author?._id || comment.author || '').toString();
    const postAuthorId = (post.author?._id || post.author || '').toString();
    const role = (user.role || '').toLowerCase();
    const isAdmin = role === 'admin';

    if (userId !== commentAuthorId && userId !== postAuthorId && !isAdmin) {
      return { forbidden: true };
    }

    const commentIdStr = (commentId?._id || commentId || '').toString();
    const isRoot = !comment.parentCommentId && !comment.threadRootId;

    if (isRoot) {
      if (typeof post.comments.pull === 'function') {
        post.comments.pull({ _id: commentId });
      }
      post.comments = (post.comments || []).filter((c) => {
        const cIdStr = (c._id?.toString() || '');
        const cRootStr = (c.threadRootId?.toString() || c.parentCommentId?.toString() || '');
        return cIdStr !== commentIdStr && cRootStr !== commentIdStr;
      });
    } else {
      if (typeof post.comments.pull === 'function') {
        post.comments.pull({ _id: commentId });
      }
      post.comments = (post.comments || []).filter((c) => (c._id?.toString() || '') !== commentIdStr);
    }

    post.commentsCount = Math.max(0, post.comments.length);
    await post.save();

    const populated = await populatePost(Post.findById(id));
    return {
      post: populated,
      commentsCount: post.commentsCount,
      commentAuthorId,
      postAuthorId
    };
  }
}

export const postRepository = new PostRepository();
export default postRepository;
