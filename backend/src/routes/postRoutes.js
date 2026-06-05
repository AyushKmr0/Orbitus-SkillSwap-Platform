import express from 'express';
import {
  addCommentPost,
  createPost,
  deletePost,
  getFeedPosts,
  sharePost,
  toggleLikePost,
  updatePost
} from '../controllers/postController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getFeedPosts);
router.post('/', createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);
router.put('/:id/like', toggleLikePost);
router.post('/:id/comments', addCommentPost);
router.put('/:id/share', sharePost);

export default router;
