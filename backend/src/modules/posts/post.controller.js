import postService from './post.service.js';
import { asyncHandler, ApiResponse } from '../../shared/index.js';

export const getFeedPosts = asyncHandler(async (req, res) => {
  const result = await postService.getFeedPosts({
    userId: req.user._id,
    queryParams: req.query
  });

  return res.status(200).json({
    success: true,
    statusCode: 200,
    posts: result.posts,
    data: result.data,
    nextBefore: result.nextBefore,
    hasMore: result.hasMore,
    page: result.page
  });
});

export const createPost = asyncHandler(async (req, res) => {
  const { content, project } = req.body;
  const post = await postService.createPost(req.user._id, { content, project });

  return res.status(201).json(
    new ApiResponse(201, { post }, 'Post created successfully')
  );
});

export const updatePost = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const post = await postService.updatePost(req.user._id, req.params.id, content);

  return res.status(200).json(
    new ApiResponse(200, { post }, 'Post updated successfully')
  );
});

export const deletePost = asyncHandler(async (req, res) => {
  await postService.deletePost(req.user._id, req.params.id);

  return res.status(200).json(
    new ApiResponse(200, null, 'Post deleted')
  );
});

export const toggleLikePost = asyncHandler(async (req, res) => {
  const post = await postService.toggleLike(req.user, req.params.id);

  return res.status(200).json(
    new ApiResponse(200, { post }, 'Like updated successfully')
  );
});

export const addCommentPost = asyncHandler(async (req, res) => {
  const { content, parentCommentId, replyTo } = req.body;
  const post = await postService.addComment(req.user, req.params.id, { content, parentCommentId, replyTo });

  return res.status(201).json(
    new ApiResponse(201, { post }, 'Comment added successfully')
  );
});

export const editCommentPost = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const post = await postService.editComment(req.user, req.params.id, req.params.commentId, content);

  return res.status(200).json(
    new ApiResponse(200, { post }, 'Comment edited successfully')
  );
});

export const toggleLikeCommentPost = asyncHandler(async (req, res) => {
  const post = await postService.likeComment(req.user, req.params.id, req.params.commentId);

  return res.status(200).json(
    new ApiResponse(200, { post }, 'Comment like updated successfully')
  );
});

export const getCommentLikers = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await postService.getCommentLikers(req.params.id, req.params.commentId, { page, limit });

  return res.status(200).json(
    new ApiResponse(200, result, 'Comment likers retrieved successfully')
  );
});

export const sharePost = asyncHandler(async (req, res) => {
  const post = await postService.sharePost(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, { post }, 'Post shared successfully')
  );
});

export const getPostLikers = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await postService.getPostLikers(req.params.id, { page, limit });

  return res.status(200).json(
    new ApiResponse(200, result, 'Likers retrieved successfully')
  );
});

export const deleteCommentPost = asyncHandler(async (req, res) => {
  const post = await postService.deleteComment(req.user, req.params.id, req.params.commentId);

  return res.status(200).json(
    new ApiResponse(200, { post, commentsCount: post.commentsCount }, 'Comment deleted successfully')
  );
});

export const getPostComments = asyncHandler(async (req, res) => {
  const post = await postService.getPostById(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, { comments: post.comments || [], commentsCount: post.commentsCount || (post.comments || []).length }, 'Comments retrieved successfully')
  );
});
