import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import { emitNotificationToUser } from '../socket/socketHandler.js';

const MAX_POST_LENGTH = 1200;
const MAX_FEED_LIMIT = 25;

const populatePost = (query) => query
  .populate('author', 'name profileImage bio experienceLevel followersCount followingCount')
  .populate('comments.author', 'name profileImage');

export const getFeedPosts = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || MAX_FEED_LIMIT, MAX_FEED_LIMIT);
    const before = req.query.before ? new Date(req.query.before) : null;
    const filter = {};

    if (before && !Number.isNaN(before.getTime())) {
      filter.createdAt = { $lt: before };
    }

    if (req.query.scope === 'my') {
      filter.author = req.user._id;
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
        { $limit: limit },
        { $project: { _id: 1 } }
      ]);

      const orderedIds = matched.map(item => item._id.toString());
      query = Post.find({ _id: { $in: matched.map(item => item._id) } });
      const posts = await populatePost(query);
      posts.sort((a, b) => orderedIds.indexOf(a._id.toString()) - orderedIds.indexOf(b._id.toString()));

      return res.status(200).json({
        success: true,
        posts,
        nextBefore: posts.length === limit ? posts[posts.length - 1].createdAt : null
      });
    }

    const posts = await populatePost(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      posts,
      nextBefore: posts.length === limit ? posts[posts.length - 1].createdAt : null
    });
  } catch (error) {
    console.error('Feed Fetch Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching posts' });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content, project } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Post content is required' });
    }
    if (content.trim().length > MAX_POST_LENGTH) {
      return res.status(400).json({ success: false, message: `Post content must be ${MAX_POST_LENGTH} characters or less` });
    }

    const post = await Post.create({
      author: req.user._id,
      content: content.trim(),
      project: project || {}
    });

    const populatedPost = await populatePost(Post.findById(post._id));
    res.status(201).json({ success: true, post: populatedPost });
  } catch (error) {
    console.error('Post Create Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error creating post' });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Post content is required' });
    }
    if (content.trim().length > MAX_POST_LENGTH) {
      return res.status(400).json({ success: false, message: `Post content must be ${MAX_POST_LENGTH} characters or less` });
    }

    const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found or not editable' });
    }

    post.content = content.trim();
    await post.save();

    const populatedPost = await populatePost(Post.findById(post._id));
    res.status(200).json({ success: true, post: populatedPost });
  } catch (error) {
    console.error('Post Update Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating post' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, author: req.user._id });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found or not deletable' });
    }

    res.status(200).json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Post Delete Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting post' });
  }
};

export const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.some(id => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
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
    res.status(200).json({ success: true, post: populatedPost });
  } catch (error) {
    console.error('Post Like Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating like' });
  }
};

export const addCommentPost = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Comment is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
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
    res.status(201).json({ success: true, post: populatedPost });
  } catch (error) {
    console.error('Post Comment Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error adding comment' });
  }
};

export const sharePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { shares: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const populatedPost = await populatePost(Post.findById(post._id));
    res.status(200).json({ success: true, post: populatedPost });
  } catch (error) {
    console.error('Post Share Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error sharing post' });
  }
};
