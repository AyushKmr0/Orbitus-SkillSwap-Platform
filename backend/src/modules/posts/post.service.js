import mongoose from 'mongoose';
import Post from '../../models/Post.js';
import Notification from '../../models/Notification.js';
import postRepository, { populatePost } from './post.repository.js';
import { AppError } from '../../shared/errors/app-error.js';
import { emitNotificationToUser } from '../../socket/socketHandler.js';
import { invalidateUserDashboard, invalidateLeaderboard, invalidateAdminStats } from '../../services/cacheService.js';
import { activityService } from '../../services/activityService.js';

const MAX_POST_LENGTH = 2000;

export class PostService {
  constructor(repo = postRepository) {
    this.repo = repo;
  }

  async getFeedPosts({ userId, queryParams }) {
    const limit = Math.min(Math.max(Number(queryParams.limit) || 20, 1), 50);
    const page = Math.max(1, Number(queryParams.page) || 1);
    const skip = (page - 1) * limit;
    const before = queryParams.before ? new Date(queryParams.before) : null;
    const filter = {};

    if (before && !Number.isNaN(before.getTime())) {
      filter.createdAt = { $lt: before };
    }

    if (queryParams.scope === 'my') {
      filter.author = userId;
    } else if (queryParams.author) {
      if (mongoose.Types.ObjectId.isValid(queryParams.author)) {
        filter.author = queryParams.author;
      } else {
        const foundUser = await this.repo.findUserByUsername(queryParams.author);
        if (foundUser) {
          filter.author = foundUser._id;
        } else {
          return {
            posts: [],
            data: { posts: [], nextBefore: null, hasMore: false, page },
            nextBefore: null,
            hasMore: false,
            page
          };
        }
      }
    }

    let query = Post.find(filter);

    if (queryParams.scope === 'following') {
      const matched = await Post.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1, _id: -1 } },
        { $limit: limit * 20 },
        {
          $lookup: {
            from: 'follows',
            let: { authorId: '$author' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$follower', userId] },
                      { $eq: ['$following', '$$authorId'] }
                    ]
                  }
                }
              },
              { $limit: 1 }
            ],
            as: 'viewerFollow'
          }
        },
        {
          $match: {
            $or: [
              { author: userId },
              { viewerFollow: { $ne: [] } }
            ]
          }
        },
        { $skip: before ? 0 : skip },
        { $limit: limit },
        { $project: { _id: 1 } }
      ]);

      const orderedIds = matched.map((item) => item._id.toString());
      query = Post.find({ _id: { $in: matched.map((item) => item._id) } });
      const posts = await populatePost(query);
      posts.sort((a, b) => orderedIds.indexOf(a._id.toString()) - orderedIds.indexOf(b._id.toString()));
      const finalFollowing = posts.slice(0, limit);
      const hasMore = finalFollowing.length === limit;
      const nextBefore = hasMore ? finalFollowing[finalFollowing.length - 1].createdAt : null;

      return {
        posts: finalFollowing,
        data: { posts: finalFollowing, nextBefore, hasMore, page },
        nextBefore,
        hasMore,
        page
      };
    }

    const queryBuilder = populatePost(query).sort({ createdAt: -1 });
    if (!before && skip > 0) {
      queryBuilder.skip(skip);
    }
    const posts = await queryBuilder.limit(limit);
    const hasMore = posts.length === limit;
    const nextBefore = hasMore ? posts[posts.length - 1].createdAt : null;

    return {
      posts,
      data: { posts, nextBefore, hasMore, page },
      nextBefore,
      hasMore,
      page
    };
  }

  async createPost(userId, { content, project }) {
    if (!content?.trim()) {
      throw new AppError(400, 'Post content is required');
    }
    if (content.trim().length > MAX_POST_LENGTH) {
      throw new AppError(400, `Post content must be ${MAX_POST_LENGTH} characters or less`);
    }

    const post = await this.repo.create({
      author: userId,
      content: content.trim(),
      project: project || {}
    });

    await activityService.recordPostCreation({ userId, postId: post._id });

    const populatedPost = await this.repo.findPopulatedById(post._id);

    await Promise.allSettled([
      invalidateUserDashboard(userId),
      invalidateLeaderboard(),
      invalidateAdminStats()
    ]);

    return populatedPost;
  }

  async updatePost(userId, postId, content) {
    if (!content?.trim()) {
      throw new AppError(400, 'Post content is required');
    }
    if (content.trim().length > MAX_POST_LENGTH) {
      throw new AppError(400, `Post content must be ${MAX_POST_LENGTH} characters or less`);
    }

    const post = await this.repo.findByIdAndAuthor(postId, userId);
    if (!post) {
      throw new AppError(404, 'Post not found or not editable');
    }

    const postAgeMinutes = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60);
    if (postAgeMinutes > 15) {
      throw new AppError(403, 'Posts can only be edited within 15 minutes of posting.');
    }

    post.content = content.trim();
    await post.save();

    return this.repo.findPopulatedById(post._id);
  }

  async deletePost(userId, postId) {
    const post = await this.repo.deleteByIdAndAuthor(postId, userId);
    if (!post) {
      throw new AppError(404, 'Post not found or not deletable');
    }

    await Promise.allSettled([
      invalidateUserDashboard(userId),
      invalidateLeaderboard(),
      invalidateAdminStats()
    ]);

    return true;
  }

  async toggleLike(user, postId) {
    const post = await this.repo.findById(postId);
    if (!post) {
      throw new AppError(404, 'Post not found');
    }

    const userId = user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
      post.likesCount = Math.max((post.likesCount || post.likes.length + 1) - 1, 0);
    } else {
      post.likes.push(user._id);
      post.likesCount = (post.likesCount || post.likes.length - 1) + 1;
    }

    await post.save();

    if (!alreadyLiked && post.author.toString() !== user._id.toString()) {
      const notification = await Notification.create({
        recipient: post.author,
        sender: user._id,
        type: 'PostLike',
        content: `${user.name} liked your post.`,
        link: '/feed'
      });
      emitNotificationToUser(post.author, notification);
    }

    return this.repo.findPopulatedById(post._id);
  }

  async addComment(user, postId, payload) {
    const content = typeof payload === 'string' ? payload : payload?.content;
    let rawParentId = typeof payload === 'object' ? payload?.parentCommentId || payload?.threadRootId || null : null;
    let replyTo = typeof payload === 'object' ? payload?.replyTo || null : null;
    let replyToCommentId = typeof payload === 'object' ? payload?.replyToCommentId || null : null;

    if (!content?.trim()) {
      throw new AppError(400, 'Comment is required');
    }

    const post = await this.repo.findById(postId);
    if (!post) {
      throw new AppError(404, 'Post not found');
    }

    let threadRootId = null;
    let parentCommentId = null;

    if (rawParentId) {
      const targetComment = post.comments.id
        ? post.comments.id(rawParentId)
        : (post.comments || []).find((c) => (c._id?.toString() || '') === rawParentId.toString());

      if (targetComment) {
        // If target comment is already a reply, flatten to the thread root comment
        const resolvedRootId = targetComment.threadRootId || targetComment.parentCommentId || targetComment._id;
        threadRootId = resolvedRootId;
        parentCommentId = resolvedRootId;
        replyToCommentId = targetComment._id;
        if (!replyTo) {
          replyTo = targetComment.author;
        }
      } else {
        threadRootId = rawParentId;
        parentCommentId = rawParentId;
      }
    }

    const newComment = {
      author: user._id,
      content: content.trim(),
      parentCommentId: parentCommentId || null,
      threadRootId: threadRootId || null,
      replyToCommentId: replyToCommentId || null,
      replyTo: replyTo || null,
      likes: [],
      likesCount: 0,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    post.commentsCount = (post.commentsCount || post.comments.length - 1) + 1;
    await post.save();

    const postAuthorId = (post.author?._id || post.author || '').toString();
    const actorId = (user._id || user.id || '').toString();

    if (parentCommentId && replyTo) {
      const replyTargetId = (replyTo?._id || replyTo || '').toString();
      if (replyTargetId && replyTargetId !== actorId) {
        try {
          const notif = await Notification.create({
            recipient: replyTargetId,
            sender: user._id,
            type: 'PostCommentReply',
            content: `${user.name} replied to your comment.`,
            link: `/feed?postId=${post._id}`
          });
          emitNotificationToUser(replyTargetId, notif);
        } catch {
          // notification best-effort
        }
      }

      if (postAuthorId && postAuthorId !== actorId && postAuthorId !== replyTargetId) {
        try {
          const notif = await Notification.create({
            recipient: postAuthorId,
            sender: user._id,
            type: 'PostComment',
            content: `${user.name} commented on your post.`,
            link: `/feed?postId=${post._id}`
          });
          emitNotificationToUser(postAuthorId, notif);
        } catch {
          // notification best-effort
        }
      }
    } else {
      if (postAuthorId && postAuthorId !== actorId) {
        try {
          const notif = await Notification.create({
            recipient: postAuthorId,
            sender: user._id,
            type: 'PostComment',
            content: `${user.name} commented on your post.`,
            link: `/feed?postId=${post._id}`
          });
          emitNotificationToUser(postAuthorId, notif);
        } catch {
          // notification best-effort
        }
      }
    }

    return this.repo.findPopulatedById(post._id);
  }

  async editComment(user, postId, commentId, content) {
    if (!content?.trim()) {
      throw new AppError(400, 'Comment content is required');
    }
    const result = await this.repo.editComment(postId, commentId, { content: content.trim() }, user);
    if (result.notFound === 'post') {
      throw new AppError(404, 'Post not found');
    }
    if (result.notFound === 'comment') {
      throw new AppError(404, 'Comment not found');
    }
    if (result.forbidden) {
      throw new AppError(403, 'You can only edit your own comment');
    }
    if (result.expired) {
      throw new AppError(400, 'Comments can only be edited within 15 minutes of posting.');
    }
    return result.post;
  }

  async likeComment(user, postId, commentId) {
    const result = await this.repo.likeComment(postId, commentId, user._id);
    if (result.notFound === 'post') {
      throw new AppError(404, 'Post not found');
    }
    if (result.notFound === 'comment') {
      throw new AppError(404, 'Comment not found');
    }

    if (result.liked && result.commentAuthorId && result.commentAuthorId !== user._id.toString()) {
      try {
        const notif = await Notification.create({
          recipient: result.commentAuthorId,
          sender: user._id,
          type: 'PostCommentLike',
          content: `${user.name} liked your comment.`,
          link: `/feed?postId=${postId}`
        });
        emitNotificationToUser(result.commentAuthorId, notif);
      } catch {
        // notification best-effort
      }
    }

    return result.post;
  }

  async getCommentLikers(postId, commentId, { page = 1, limit = 20 } = {}) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const skip = (p - 1) * l;

    const result = await this.repo.getCommentLikers(postId, commentId, { skip, limit: l });
    if (!result) {
      throw new AppError(404, 'Post or comment not found');
    }

    return {
      users: result.users,
      total: result.total,
      page: p,
      limit: l,
      hasMore: result.hasMore
    };
  }

  async sharePost(postId) {
    const post = await this.repo.incrementShares(postId);
    if (!post) {
      throw new AppError(404, 'Post not found');
    }
    return this.repo.findPopulatedById(post._id);
  }

  async getPostLikers(postId, { page = 1, limit = 20 } = {}) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const skip = (p - 1) * l;

    const result = await this.repo.getPostLikers(postId, { skip, limit: l });
    if (!result) {
      throw new AppError(404, 'Post not found');
    }

    return {
      users: result.users,
      total: result.total,
      page: p,
      limit: l,
      hasMore: result.hasMore
    };
  }

  async deleteComment(user, postId, commentId) {
    const result = await this.repo.deleteComment(postId, commentId, user);
    if (result.notFound === 'post') {
      throw new AppError(404, 'Post not found');
    }
    if (result.notFound === 'comment') {
      throw new AppError(404, 'Comment not found');
    }
    if (result.forbidden) {
      throw new AppError(403, 'You do not have permission to delete this comment');
    }

    if (result.commentAuthorId && result.postAuthorId && result.commentAuthorId !== result.postAuthorId) {
      try {
        await Notification.findOneAndDelete({
          recipient: result.postAuthorId,
          sender: result.commentAuthorId,
          type: 'PostComment'
        });
      } catch {
        // Notification cleanup is best-effort
      }
    }

    return result.post;
  }

  async getPostById(postId) {
    const post = await this.repo.findPopulatedById(postId);
    if (!post) {
      throw new AppError(404, 'Post not found');
    }
    return post;
  }
}

export const postService = new PostService();
export default postService;
