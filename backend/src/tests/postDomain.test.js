import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postService } from '../modules/posts/post.service.js';
import {
  createPostSchema,
  updatePostSchema,
  addCommentSchema,
  deleteCommentSchema,
  getPostLikersQuerySchema
} from '../modules/posts/post.schema.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

describe('Post Domain Unit & Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation Schemas', () => {
    it('should reject post with empty content', () => {
      const result = createPostSchema.safeParse({
        body: { content: '   ' }
      });
      expect(result.success).toBe(false);
    });

    it('should reject post exceeding 2000 characters', () => {
      const result = createPostSchema.safeParse({
        body: { content: 'a'.repeat(2001) }
      });
      expect(result.success).toBe(false);
    });

    it('should reject comment with empty content', () => {
      const result = addCommentSchema.safeParse({
        params: { id: '65f123456789abcdef123456' },
        body: { content: '' }
      });
      expect(result.success).toBe(false);
    });

    it('should validate updatePostSchema', () => {
      const result = updatePostSchema.safeParse({
        params: { id: '65f123456789abcdef123456' },
        body: { content: 'Updated post content' }
      });
      expect(result.success).toBe(true);
    });

    it('should validate deleteCommentSchema with valid ObjectIds', () => {
      const valid = deleteCommentSchema.safeParse({
        params: {
          id: '65f123456789abcdef123456',
          commentId: '65f123456789abcdef123457'
        }
      });
      expect(valid.success).toBe(true);

      const invalid = deleteCommentSchema.safeParse({
        params: {
          id: 'invalid-id',
          commentId: '65f123456789abcdef123457'
        }
      });
      expect(invalid.success).toBe(false);
    });

    it('should validate getPostLikersQuerySchema with page and limit', () => {
      const valid = getPostLikersQuerySchema.safeParse({
        params: { id: '65f123456789abcdef123456' },
        query: { page: '2', limit: '15' }
      });
      expect(valid.success).toBe(true);
      expect(valid.data.query.page).toBe(2);
      expect(valid.data.query.limit).toBe(15);
    });
  });

  describe('Post Service', () => {
    it('should reject editing post after 15-minute window', async () => {
      const eighteenMinutesAgo = new Date(Date.now() - 18 * 60 * 1000);
      vi.spyOn(Post, 'findOne').mockResolvedValue({
        _id: 'post-1',
        author: 'user-1',
        createdAt: eighteenMinutesAgo,
        content: 'Old text'
      });

      await expect(
        postService.updatePost('user-1', 'post-1', 'New text')
      ).rejects.toThrow('Posts can only be edited within 15 minutes');
    });

    it('should throw 404 when deleting post belonging to another author', async () => {
      vi.spyOn(Post, 'findOneAndDelete').mockResolvedValue(null);

      await expect(
        postService.deletePost('user-attacker', 'post-1')
      ).rejects.toThrow('Post not found or not deletable');
    });

    it('should get post likers paginated without sensitive fields', async () => {
      const mockPost = {
        _id: 'post-likers-1',
        likes: ['u1', 'u2', 'u3'],
        likesCount: 3
      };
      vi.spyOn(Post, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockPost)
      });
      vi.spyOn(User, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { _id: 'u1', name: 'Alice', username: 'alice', profileImage: 'alice.jpg' },
            { _id: 'u2', name: 'Bob', username: 'bob', profileImage: 'bob.jpg' }
          ])
        })
      });

      const res = await postService.getPostLikers('post-likers-1', { page: 1, limit: 2 });
      expect(res.total).toBe(3);
      expect(res.users.length).toBe(2);
      expect(res.hasMore).toBe(true);
      expect(res.users[0].name).toBe('Alice');
    });

    it('should throw 404 when getting likers for nonexistent post', async () => {
      vi.spyOn(Post, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      });

      await expect(
        postService.getPostLikers('nonexistent-post')
      ).rejects.toThrow('Post not found');
    });

    it('should allow comment owner to delete their comment and decrement commentsCount', async () => {
      const saveMock = vi.fn().mockResolvedValue(true);
      const mockPost = {
        _id: 'p1',
        author: 'post-author-1',
        comments: [
          { _id: 'c1', author: 'user-commenter', content: 'Great post!' },
          { _id: 'c2', author: 'user-other', content: 'Nice!' }
        ],
        commentsCount: 2,
        save: saveMock
      };
      mockPost.populate = vi.fn().mockReturnThis();
      mockPost.lean = vi.fn().mockResolvedValue(mockPost);
      mockPost.comments.pull = vi.fn().mockImplementation(() => {
        mockPost.comments = mockPost.comments.filter(c => c._id !== 'c1');
      });

      vi.spyOn(Post, 'findById').mockReturnValue(mockPost);

      const user = { _id: 'user-commenter', role: 'user' };
      const _res = await postService.deleteComment(user, 'p1', 'c1');
      expect(saveMock).toHaveBeenCalled();
      expect(mockPost.commentsCount).toBe(1);
    });

    it('should allow post author (moderator) to delete comments on their post', async () => {
      const saveMock = vi.fn().mockResolvedValue(true);
      const mockPost = {
        _id: 'p1',
        author: 'post-author-1',
        comments: [
          { _id: 'c1', author: 'user-commenter', content: 'Spam comment' }
        ],
        commentsCount: 1,
        save: saveMock
      };
      mockPost.populate = vi.fn().mockReturnThis();
      mockPost.lean = vi.fn().mockResolvedValue(mockPost);
      mockPost.comments.pull = vi.fn().mockImplementation(() => {
        mockPost.comments = [];
      });

      vi.spyOn(Post, 'findById').mockReturnValue(mockPost);

      const postOwnerUser = { _id: 'post-author-1', role: 'user' };
      await postService.deleteComment(postOwnerUser, 'p1', 'c1');
      expect(saveMock).toHaveBeenCalled();
      expect(mockPost.commentsCount).toBe(0);
    });

    it('should reject unauthorized user trying to delete another user comment with 403', async () => {
      const mockPost = {
        _id: 'p1',
        author: 'post-author-1',
        comments: [
          { _id: 'c1', author: 'user-commenter', content: 'My private thought' }
        ],
        commentsCount: 1,
        save: vi.fn()
      };

      vi.spyOn(Post, 'findById').mockResolvedValue(mockPost);

      const attacker = { _id: 'random-stranger', role: 'user' };
      await expect(
        postService.deleteComment(attacker, 'p1', 'c1')
      ).rejects.toThrow('You do not have permission to delete this comment');
    });

    it('should throw 404 when deleting comment from nonexistent post', async () => {
      vi.spyOn(Post, 'findById').mockResolvedValue(null);

      await expect(
        postService.deleteComment({ _id: 'u1' }, 'p-missing', 'c1')
      ).rejects.toThrow('Post not found');
    });

    it('should throw 404 when comment does not exist on post', async () => {
      const mockPost = {
        _id: 'p1',
        author: 'post-author-1',
        comments: [],
        commentsCount: 0
      };
      vi.spyOn(Post, 'findById').mockResolvedValue(mockPost);

      await expect(
        postService.deleteComment({ _id: 'post-author-1' }, 'p1', 'nonexistent-comment')
      ).rejects.toThrow('Comment not found');
    });

    it('should allow author to edit comment within 15-minute window', async () => {
      const saveMock = vi.fn().mockResolvedValue(true);
      const mockPost = {
        _id: 'p1',
        comments: [
          {
            _id: 'c1',
            author: 'u1',
            content: 'Original comment',
            createdAt: new Date(Date.now() - 5 * 60 * 1000) // 5 mins ago
          }
        ],
        save: saveMock
      };

      vi.spyOn(Post, 'findById').mockResolvedValue(mockPost);
      vi.spyOn(postService.repo, 'findPopulatedById').mockResolvedValue(mockPost);

      const _res = await postService.editComment({ _id: 'u1' }, 'p1', 'c1', 'Updated comment content');
      expect(saveMock).toHaveBeenCalled();
      expect(mockPost.comments[0].content).toBe('Updated comment content');
      expect(mockPost.comments[0].editedAt).toBeInstanceOf(Date);
    });

    it('should reject editing comment after 15 minutes with 400', async () => {
      const mockPost = {
        _id: 'p1',
        comments: [
          {
            _id: 'c1',
            author: 'u1',
            content: 'Old comment',
            createdAt: new Date(Date.now() - 16 * 60 * 1000) // 16 mins ago
          }
        ]
      };

      vi.spyOn(Post, 'findById').mockResolvedValue(mockPost);

      await expect(
        postService.editComment({ _id: 'u1' }, 'p1', 'c1', 'Attempt to edit after 16m')
      ).rejects.toThrow('Comments can only be edited within 15 minutes of posting.');
    });

    it('should reject editing another user comment with 403', async () => {
      const mockPost = {
        _id: 'p1',
        comments: [
          {
            _id: 'c1',
            author: 'author-original',
            content: 'Original comment',
            createdAt: new Date()
          }
        ]
      };

      vi.spyOn(Post, 'findById').mockResolvedValue(mockPost);

      await expect(
        postService.editComment({ _id: 'attacker-user' }, 'p1', 'c1', 'Hacked text')
      ).rejects.toThrow('You can only edit your own comment');
    });

    it('should toggle comment like and maintain correct counts', async () => {
      const saveMock = vi.fn().mockResolvedValue(true);
      const mockPost = {
        _id: 'p1',
        author: 'post-author-1',
        comments: [
          {
            _id: 'c1',
            author: 'u1',
            likes: [],
            likesCount: 0
          }
        ],
        save: saveMock
      };

      vi.spyOn(Post, 'findById').mockResolvedValue(mockPost);
      vi.spyOn(postService.repo, 'findPopulatedById').mockResolvedValue(mockPost);

      // 1. Like comment
      await postService.likeComment({ _id: 'liker-1', name: 'Liker User' }, 'p1', 'c1');
      expect(mockPost.comments[0].likesCount).toBe(1);
      expect(mockPost.comments[0].likes.length).toBe(1);

      // 2. Unlike comment (toggle)
      await postService.likeComment({ _id: 'liker-1', name: 'Liker User' }, 'p1', 'c1');
      expect(mockPost.comments[0].likesCount).toBe(0);
      expect(mockPost.comments[0].likes.length).toBe(0);
    });

    it('should correctly handle legacy comments without new schema fields', async () => {
      const saveMock = vi.fn().mockResolvedValue(true);
      // Legacy comment object lacking likes, likesCount, parentCommentId, editedAt
      const mockPost = {
        _id: 'p1',
        author: 'post-author-1',
        comments: [
          {
            _id: 'legacy-c1',
            author: 'legacy-user',
            content: 'Historic comment from earlier version',
            createdAt: new Date(Date.now() - 60000)
          }
        ],
        save: saveMock
      };

      vi.spyOn(Post, 'findById').mockResolvedValue(mockPost);
      vi.spyOn(postService.repo, 'findPopulatedById').mockResolvedValue(mockPost);

      // Liking legacy comment adds likes cleanly without error
      await postService.likeComment({ _id: 'new-user', name: 'New User' }, 'p1', 'legacy-c1');
      expect(mockPost.comments[0].likesCount).toBe(1);
    });

    it('should ensure reply to root appears under root with single depth threadRootId', async () => {
      const saveMock = vi.fn().mockResolvedValue(true);
      const rootCommentId = '65f123456789abcdef111111';
      const rootAuthorId = '65f123456789abcdef222222';
      const mockPost = {
        _id: 'p1',
        author: 'post-author-1',
        comments: [
          {
            _id: rootCommentId,
            author: rootAuthorId,
            content: 'Root comment',
            parentCommentId: null,
            threadRootId: null
          }
        ],
        save: saveMock
      };

      vi.spyOn(Post, 'findById').mockResolvedValue(mockPost);
      vi.spyOn(postService.repo, 'findPopulatedById').mockResolvedValue(mockPost);

      await postService.addComment(
        { _id: 'replier-1', name: 'Replier One' },
        'p1',
        { content: 'First reply', parentCommentId: rootCommentId }
      );

      expect(mockPost.comments.length).toBe(2);
      const reply = mockPost.comments[1];
      expect(reply.parentCommentId?.toString()).toBe(rootCommentId);
      expect(reply.threadRootId?.toString()).toBe(rootCommentId);
      expect(reply.replyTo?.toString()).toBe(rootAuthorId);
    });

    it('should ensure reply to a reply flattens to the same single reply depth under thread root', async () => {
      const saveMock = vi.fn().mockResolvedValue(true);
      const rootCommentId = '65f123456789abcdef111111';
      const reply1Id = '65f123456789abcdef333333';
      const reply1AuthorId = '65f123456789abcdef444444';

      const mockPost = {
        _id: 'p1',
        author: 'post-author-1',
        comments: [
          {
            _id: rootCommentId,
            author: 'root-author',
            content: 'Root comment',
            parentCommentId: null,
            threadRootId: null
          },
          {
            _id: reply1Id,
            author: reply1AuthorId,
            content: 'First reply under root',
            parentCommentId: rootCommentId,
            threadRootId: rootCommentId
          }
        ],
        save: saveMock
      };

      vi.spyOn(Post, 'findById').mockResolvedValue(mockPost);
      vi.spyOn(postService.repo, 'findPopulatedById').mockResolvedValue(mockPost);

      // Reply to Reply1
      await postService.addComment(
        { _id: 'replier-2', name: 'Replier Two' },
        'p1',
        { content: 'Second reply replying to reply1', parentCommentId: reply1Id }
      );

      expect(mockPost.comments.length).toBe(3);
      const reply2 = mockPost.comments[2];
      // CRITICAL: Remains at the same single hierarchy depth under rootCommentId
      expect(reply2.parentCommentId?.toString()).toBe(rootCommentId);
      expect(reply2.threadRootId?.toString()).toBe(rootCommentId);
      // Direct recipient correctly targets reply1 author
      expect(reply2.replyTo?.toString()).toBe(reply1AuthorId);
      expect(reply2.replyToCommentId?.toString()).toBe(reply1Id);
    });

    it('should maintain correct counts and safe delete behavior without orphaned replies', async () => {
      const saveMock = vi.fn().mockResolvedValue(true);
      const rootCommentId = '65f123456789abcdef111111';
      const reply1Id = '65f123456789abcdef222222';
      const reply2Id = '65f123456789abcdef333333';

      const mockPost = {
        _id: 'p1',
        author: 'post-author-1',
        comments: [
          {
            _id: rootCommentId,
            author: 'u-root',
            content: 'Root comment',
            parentCommentId: null,
            threadRootId: null
          },
          {
            _id: reply1Id,
            author: 'u-reply-1',
            content: 'Reply 1',
            parentCommentId: rootCommentId,
            threadRootId: rootCommentId
          },
          {
            _id: reply2Id,
            author: 'u-reply-2',
            content: 'Reply 2',
            parentCommentId: rootCommentId,
            threadRootId: rootCommentId
          }
        ],
        commentsCount: 3,
        save: saveMock
      };

      vi.spyOn(Post, 'findById').mockResolvedValue(mockPost);
      vi.spyOn(postService.repo, 'findPopulatedById').mockResolvedValue(mockPost);

      // 1. Delete single reply (reply1) -> only reply1 is removed
      await postService.deleteComment({ _id: 'u-reply-1' }, 'p1', reply1Id);
      expect(mockPost.comments.length).toBe(2);
      expect(mockPost.commentsCount).toBe(2);
      expect(mockPost.comments.some((c) => c._id === reply1Id)).toBe(false);
      expect(mockPost.comments.some((c) => c._id === rootCommentId)).toBe(true);

      // 2. Delete root comment -> cascade removes root comment AND remaining child replies
      await postService.deleteComment({ _id: 'u-root' }, 'p1', rootCommentId);
      expect(mockPost.comments.length).toBe(0);
      expect(mockPost.commentsCount).toBe(0);
    });

    it('should send notification to directly mentioned comment author, never to actor, and avoid duplicates when recipient is post author', async () => {
      const saveMock = vi.fn().mockResolvedValue(true);
      const postAuthorId = '65f123456789abcdef111111';
      const rootCommentId = '65f123456789abcdef222222';
      const actorId = '65f123456789abcdef333333';

      const mockPost = {
        _id: 'p1',
        author: postAuthorId,
        comments: [
          {
            _id: rootCommentId,
            author: postAuthorId,
            content: 'Post author root comment',
            parentCommentId: null,
            threadRootId: null
          }
        ],
        save: saveMock
      };

      vi.spyOn(Post, 'findById').mockResolvedValue(mockPost);
      vi.spyOn(postService.repo, 'findPopulatedById').mockResolvedValue(mockPost);
      const notifCreateMock = vi.spyOn(Notification, 'create').mockResolvedValue({ _id: 'notif-1' });

      await postService.addComment(
        { _id: actorId, name: 'Replying Member' },
        'p1',
        { content: 'Reply to post author', parentCommentId: rootCommentId, replyTo: postAuthorId }
      );

      // Notification must be created for postAuthorId exactly ONCE (no duplicates)
      expect(notifCreateMock).toHaveBeenCalledTimes(1);
      expect(notifCreateMock).toHaveBeenCalledWith(expect.objectContaining({
        recipient: postAuthorId,
        sender: actorId,
        type: 'PostCommentReply'
      }));
    });

    it('should reject comment deletion if user is neither comment author nor post author nor admin', async () => {
      const mockPost = {
        _id: 'p1',
        author: 'post-author-1',
        comments: [
          {
            _id: 'c1',
            author: 'comment-author-1',
            content: 'Original comment'
          }
        ]
      };

      vi.spyOn(Post, 'findById').mockResolvedValue(mockPost);

      await expect(
        postService.deleteComment({ _id: 'random-unauthorized-user', role: 'user' }, 'p1', 'c1')
      ).rejects.toThrow('You do not have permission to delete this comment');
    });
  });
});
