import { describe, expect, it } from 'vitest';
import { protect } from '../middlewares/authMiddleware.js';
import skillRoutes from '../modules/skills/skill.routes.js';

describe('Protected skill catalog', () => {
  it('requires authentication for catalog reads and writes', () => {
    const collectionRoute = skillRoutes.stack.find((layer) => layer.route?.path === '/').route;
    const getHandlers = collectionRoute.stack.filter((layer) => layer.method === 'get');
    const postHandlers = collectionRoute.stack.filter((layer) => layer.method === 'post');

    expect(getHandlers[0].handle).toBe(protect);
    expect(postHandlers.length).toBeGreaterThan(1);
    expect(postHandlers[0].handle).toBe(protect);
  });
});
