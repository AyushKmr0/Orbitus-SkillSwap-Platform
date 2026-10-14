import { describe, it, expect } from 'vitest';

describe('Backend Route Import Smoke Tests', () => {
  it('should successfully import app.js and all route modules without export mismatches', async () => {
    const [
      appModule,
      authRoutes,
      usersRoutes,
      chatRoutes,
      skillRoutes,
      aiRoutes,
      sessionRoutes,
      dashboardRoutes,
      reviewRoutes,
      notificationRoutes,
      postRoutes,
      certificateRoutes,
      groupRoutes,
      feedbackRoutes
    ] = await Promise.all([
      import('../app.js'),
      import('../modules/auth/auth.routes.js'),
      import('../modules/users/users.routes.js'),
      import('../modules/chat/chat.routes.js'),
      import('../modules/skills/skill.routes.js'),
      import('../modules/ai/ai.routes.js'),
      import('../modules/sessions/session.routes.js'),
      import('../modules/dashboard/dashboard.routes.js'),
      import('../modules/reviews/review.routes.js'),
      import('../modules/notifications/notification.routes.js'),
      import('../modules/posts/post.routes.js'),
      import('../modules/certificates/certificate.routes.js'),
      import('../modules/groups/group.routes.js'),
      import('../modules/feedback/feedback.routes.js')
    ]);

    expect(appModule.default).toBeDefined();
    expect(authRoutes.default).toBeDefined();
    expect(usersRoutes.default).toBeDefined();
    expect(chatRoutes.default).toBeDefined();
    expect(skillRoutes.default).toBeDefined();
    expect(aiRoutes.default).toBeDefined();
    expect(sessionRoutes.default).toBeDefined();
    expect(dashboardRoutes.default).toBeDefined();
    expect(reviewRoutes.default).toBeDefined();
    expect(notificationRoutes.default).toBeDefined();
    expect(postRoutes.default).toBeDefined();
    expect(certificateRoutes.default).toBeDefined();
    expect(groupRoutes.default).toBeDefined();
    expect(feedbackRoutes.default).toBeDefined();
  }, 15000);
});
