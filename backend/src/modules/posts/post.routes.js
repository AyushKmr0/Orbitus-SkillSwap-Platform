import express from 'express';
import {
  getFeedPosts,
  createPost,
  updatePost,
  deletePost,
  toggleLikePost,
  addCommentPost,
  editCommentPost,
  toggleLikeCommentPost,
  getCommentLikers,
  sharePost,
  getPostLikers,
  deleteCommentPost,
  getPostComments
} from './post.controller.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../shared/validation/validate-request.js';
import {
  createPostSchema,
  updatePostSchema,
  postIdParamSchema,
  addCommentSchema,
  editCommentSchema,
  likeCommentSchema,
  getCommentLikersQuerySchema,
  deleteCommentSchema,
  getPostLikersQuerySchema,
  getFeedPostsQuerySchema
} from './post.schema.js';

const router = express.Router();

router.use(protect);

router.get('/', validateRequest(getFeedPostsQuerySchema), getFeedPosts);
router.post('/', validateRequest(createPostSchema), createPost);
router.put('/:id', validateRequest(updatePostSchema), updatePost);
router.delete('/:id', validateRequest(postIdParamSchema), deletePost);
router.put('/:id/like', validateRequest(postIdParamSchema), toggleLikePost);
router.get('/:id/likes', validateRequest(getPostLikersQuerySchema), getPostLikers);
router.get('/:id/comments', validateRequest(postIdParamSchema), getPostComments);
router.post('/:id/comments', validateRequest(addCommentSchema), addCommentPost);
router.put('/:id/comments/:commentId', validateRequest(editCommentSchema), editCommentPost);
router.put('/:id/comments/:commentId/like', validateRequest(likeCommentSchema), toggleLikeCommentPost);
router.get('/:id/comments/:commentId/likes', validateRequest(getCommentLikersQuerySchema), getCommentLikers);
router.delete('/:id/comments/:commentId', validateRequest(deleteCommentSchema), deleteCommentPost);
router.put('/:id/share', validateRequest(postIdParamSchema), sharePost);

export default router;
