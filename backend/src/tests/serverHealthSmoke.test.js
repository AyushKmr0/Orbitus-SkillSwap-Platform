import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Server Health Probes & CORS Smoke Tests', () => {
  it('GET /health/live should respond with 200 OK and status ALIVE', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ALIVE');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('GET /health/ready should report structured readiness status', async () => {
    const res = await request(app).get('/health/ready');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('services');
    expect(res.body.services).toHaveProperty('api', 'healthy');
    expect(res.body.services).toHaveProperty('database');
    expect(res.body.services).toHaveProperty('cache');
  });

  it('GET /health should return overall health contract', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('services');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('CORS should permit allowed dev origin http://localhost:5173', async () => {
    const res = await request(app)
      .get('/health/live')
      .set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});
