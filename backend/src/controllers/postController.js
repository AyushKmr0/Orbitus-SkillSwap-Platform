import mongoose from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { emitNotificationToUser } from '../socket/socketHandler.js';
import {
  asyncHandler,
  ApiError,
  ApiResponse
} from '../utils/index.js';

const MAX_POST_LENGTH = 2000;
const MAX_FEED_LIMIT = 25;

const populatePost = (query) => query
  .populate('author', 'name username profileImage bio experienceLevel followersCount followingCount')
  .populate('comments.author', 'name username profileImage')
  .lean();

const timeAwareShufflePosts = (posts) => {
  if (!posts || posts.length <= 1) return posts;

  const now = Date.now();
  const ONE_MIN = 60 * 1000;
  const ONE_HOUR = 60 * ONE_MIN;

  const fresh = [];
  const recent = [];
  const earlier = [];
  const older = [];

  for (const post of posts) {
    const postTime = new Date(post.createdAt).getTime();
    const age = now - postTime;
    if (age <= 30 * ONE_MIN) {
      fresh.push(post);
    } else if (age <= 6 * ONE_HOUR) {
      recent.push(post);
    } else if (age <= 24 * ONE_HOUR) {
      earlier.push(post);
    } else {
      older.push(post);
    }
  }

  fresh.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  let topGuaranteed = null;
  if (fresh.length === 0 && posts.length > 0) {
    const sorted = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    topGuaranteed = sorted[0];
  }

  const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

  const combined = [
    ...fresh,
    ...shuffle(recent),
    ...shuffle(earlier),
    ...shuffle(older)
  ];

  if (topGuaranteed && !fresh.some((p) => p._id.toString() === topGuaranteed._id.toString())) {
    const remaining = combined.filter((p) => p._id.toString() !== topGuaranteed._id.toString());
    return [topGuaranteed, ...remaining];
  }

  return combined;
};

export const getFeedPosts = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const page = Math.max(1, Number(req.query.page) || 1);
  const skip = (page - 1) * limit;
  const before = req.query.before ? new Date(req.query.before) : null;
  const filter = {};

  if (before && !Number.isNaN(before.getTime())) {
    filter.createdAt = { $lt: before };
  }

  if (req.query.scope === 'my') {
    filter.author = req.user._id;
  } else if (req.query.author) {
    if (mongoose.Types.ObjectId.isValid(req.query.author)) {
      filter.author = req.query.author;
    } else {
      const foundUser = await User.findOne({ username: req.query.author.toLowerCase() }).select('_id');
      if (foundUser) {
        filter.author = foundUser._id;
      } else {
        return res.status(200).json({
          success: true,
          statusCode: 200,
          posts: [],
          data: { posts: [], nextBefore: null, hasMore: false, page },
          nextBefore: null,
          hasMore: false,
          page
        });
      }
    }
  }

  let query = Post.find(filter);

  if (req.query.scope === 'following') {
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
                    { $eq: ['$follower', req.user._id] },
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
            { author: req.user._id },
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

    return res.status(200).json({
      success: true,
      statusCode: 200,
      posts: finalFollowing,
      data: { posts: finalFollowing, nextBefore, hasMore, page },
      nextBefore,
      hasMore,
      page
    });
  }

  if (req.query.scope === 'my' || req.query.author) {
    const queryBuilder = populatePost(query).sort({ createdAt: -1 });
    if (!before && skip > 0) {
      queryBuilder.skip(skip);
    }
    const posts = await queryBuilder.limit(limit);
    const hasMore = posts.length === limit;
    const nextBefore = hasMore ? posts[posts.length - 1].createdAt : null;

    return res.status(200).json({
      success: true,
      statusCode: 200,
      posts,
      data: { posts, nextBefore, hasMore, page },
      nextBefore,
      hasMore,
      page
    });
  }

  // General feed scope 'all'
  const queryBuilder = populatePost(query).sort({ createdAt: -1 });
  if (!before && skip > 0) {
    queryBuilder.skip(skip);
  }
  const posts = await queryBuilder.limit(limit);
  const hasMore = posts.length === limit;
  const nextBefore = hasMore ? posts[posts.length - 1].createdAt : null;

  return res.status(200).json({
    success: true,
    statusCode: 200,
    posts,
    data: { posts, nextBefore, hasMore, page },
    nextBefore,
    hasMore,
    page
  });
});

export const createPost = asyncHandler(async (req, res) => {
  const { content, project } = req.body;
  if (!content?.trim()) {
    throw new ApiError(400, 'Post content is required');
  }
  if (content.trim().length > MAX_POST_LENGTH) {
    throw new ApiError(400, `Post content must be ${MAX_POST_LENGTH} characters or less`);
  }

  const post = await Post.create({
    author: req.user._id,
    content: content.trim(),
    project: project || {}
  });

  const populatedPost = await populatePost(Post.findById(post._id));

  return res.status(201).json(
    new ApiResponse(201, { post: populatedPost }, 'Post created successfully')
  );
});

export const updatePost = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) {
    throw new ApiError(400, 'Post content is required');
  }
  if (content.trim().length > MAX_POST_LENGTH) {
    throw new ApiError(400, `Post content must be ${MAX_POST_LENGTH} characters or less`);
  }

  const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
  if (!post) {
    throw new ApiError(404, 'Post not found or not editable');
  }

  const postAgeMinutes = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60);
  if (postAgeMinutes > 15) {
    throw new ApiError(403, 'Posts can only be edited within 15 minutes of posting.');
  }

  post.content = content.trim();
  await post.save();

  const populatedPost = await populatePost(Post.findById(post._id));

  return res.status(200).json(
    new ApiResponse(200, { post: populatedPost }, 'Post updated successfully')
  );
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findOneAndDelete({ _id: req.params.id, author: req.user._id });
  if (!post) {
    throw new ApiError(404, 'Post not found or not deletable');
  }

  return res.status(200).json(
    new ApiResponse(200, null, 'Post deleted')
  );
});

export const toggleLikePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  const userId = req.user._id.toString();
  const alreadyLiked = post.likes.some((id) => id.toString() === userId);

  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => id.toString() !== userId);
    post.likesCount = Math.max((post.likesCount || post.likes.length + 1) - 1, 0);
  } else {
    post.likes.push(req.user._id);
    post.likesCount = (post.likesCount || post.likes.length - 1) + 1;
  }

  await post.save();

  if (!alreadyLiked && post.author.toString() !== req.user._id.toString()) {
    const notification = await Notification.create({
      recipient: post.author,
      sender: req.user._id,
      type: 'PostLike',
      content: `${req.user.name} liked your post.`,
      link: '/feed'
    });
    emitNotificationToUser(post.author, notification);
  }

  const populatedPost = await populatePost(Post.findById(post._id));

  return res.status(200).json(
    new ApiResponse(200, { post: populatedPost }, 'Like updated successfully')
  );
});

export const addCommentPost = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) {
    throw new ApiError(400, 'Comment is required');
  }

  const post = await Post.findById(req.params.id);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  post.comments.push({ author: req.user._id, content: content.trim() });
  post.commentsCount = (post.commentsCount || post.comments.length - 1) + 1;
  await post.save();

  if (post.author.toString() !== req.user._id.toString()) {
    const notification = await Notification.create({
      recipient: post.author,
      sender: req.user._id,
      type: 'PostComment',
      content: `${req.user.name} commented on your post.`,
      link: '/feed'
    });
    emitNotificationToUser(post.author, notification);
  }

  const populatedPost = await populatePost(Post.findById(post._id));

  return res.status(201).json(
    new ApiResponse(201, { post: populatedPost }, 'Comment added successfully')
  );
});

export const sharePost = asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { shares: 1 } },
    { new: true }
  );

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  const populatedPost = await populatePost(Post.findById(post._id));

  return res.status(200).json(
    new ApiResponse(200, { post: populatedPost }, 'Post shared successfully')
  );
});
