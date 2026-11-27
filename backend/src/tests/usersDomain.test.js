import { describe, it, expect } from 'vitest';
import { UsersService, getResumeContentType } from '../modules/users/users.service.js';
import {
  updateProfileSchema,
  deleteAccountSchema,
  searchUsersQuerySchema
} from '../modules/users/users.schema.js';

describe('Users Domain & Schemas', () => {
  it('validates profile update payload', () => {
    const valid = {
      body: {
        name: 'Updated Name',
        bio: 'Updated Bio',
        experienceLevel: 'Advanced',
        interests: ['react', 'node']
      }
    };
    expect(updateProfileSchema.safeParse(valid).success).toBe(true);
  });

  it('validates account deletion schema requiring username', () => {
    expect(deleteAccountSchema.safeParse({ body: { username: 'testuser' } }).success).toBe(true);
    expect(deleteAccountSchema.safeParse({ body: { username: '' } }).success).toBe(false);
  });

  it('validates search query schema', () => {
    expect(searchUsersQuerySchema.safeParse({ query: { q: 'alice' } }).success).toBe(true);
  });

  it('determines resume content type correctly from filename or extension', () => {
    expect(getResumeContentType('https://example.com/resumes/my_resume.pdf')).toBe('application/pdf');
    expect(getResumeContentType('https://example.com/resumes/my_resume.docx')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(getResumeContentType('https://example.com/resumes/my_resume.doc')).toBe('application/msword');
  });

  it('blocks self-following in toggleFollowUser', async () => {
    const service = new UsersService({});
    await expect(
      service.toggleFollowUser('user123', 'user123')
    ).rejects.toThrow('You cannot follow yourself');
  });

  it.each([
    ['followers', 'getFollowersList', 'findFollowers'],
    ['following', 'getFollowingList', 'findFollowing']
  ])('returns compact %s entries with the current follow state', async (listType, serviceMethod, repoMethod) => {
    const listedUser = {
      _id: 'listed-user',
      name: 'Listed User',
      username: 'listed',
      profileImage: '/profile.png',
      experienceLevel: 'Advanced'
    };
    const repo = {
      [repoMethod]: async () => ({ [listType]: [listedUser] }),
      findFollowedUserIds: async (viewerId, userIds) => {
        expect(viewerId).toBe('viewer');
        expect(userIds).toEqual(['listed-user']);
        return new Set(['listed-user']);
      }
    };
    const service = new UsersService(repo);

    await expect(service[serviceMethod]('profile', 'viewer')).resolves.toEqual([
      { ...listedUser, isFollowing: true }
    ]);
  });
});
