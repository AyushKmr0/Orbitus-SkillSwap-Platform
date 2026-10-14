import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  callMultiAiProvider,
  generateCurriculumForTopic,
  findAiMatches
} from '../modules/ai/ai.service.js';
import {
  classifyRoadmapTopic
} from '../modules/ai/ai.curricula.js';
import User from '../models/User.js';

describe('AI Service Hardening & Provider Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should reject unsupported AI providers', async () => {
    await expect(
      callMultiAiProvider({ provider: 'unsupported-ai', apiKey: 'key-123', prompt: 'test' })
    ).rejects.toThrow(/Unsupported AI provider/);
  });

  it('should require an API key', async () => {
    await expect(
      callMultiAiProvider({ provider: 'openai', apiKey: '', prompt: 'test' })
    ).rejects.toThrow(/API key is required/);

    await expect(
      callMultiAiProvider({ provider: 'groq', apiKey: null, prompt: 'test' })
    ).rejects.toThrow(/API key is required/);
  });

  it('should require a non-empty prompt', async () => {
    await expect(
      callMultiAiProvider({ provider: 'openai', apiKey: 'valid-key', prompt: '' })
    ).rejects.toThrow(/Prompt is required/);
  });

  it('should reject prompts exceeding maximum allowed character limit', async () => {
    const hugePrompt = 'a'.repeat(25000);
    await expect(
      callMultiAiProvider({ provider: 'openai', apiKey: 'valid-key', prompt: hugePrompt })
    ).rejects.toThrow(/exceeds maximum allowed length/);
  });

  it('should map 401/403 HTTP errors into sanitized authentication error without leaking keys', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue('{"error": "Unauthorized key: sk-secret-12345"}')
    });

    await expect(
      callMultiAiProvider({ provider: 'openai', apiKey: 'sk-secret-12345', prompt: 'Build curriculum' })
    ).rejects.toThrow(/Authentication failed for openai\. Please verify your API key\./);
  });

  it('should map 429 HTTP errors into rate limit error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: vi.fn().mockResolvedValue('Rate limit exceeded')
    });

    await expect(
      callMultiAiProvider({ provider: 'groq', apiKey: 'gsk-key', prompt: 'Build curriculum' })
    ).rejects.toThrow(/Rate limit exceeded for groq/);
  });

  it('should map 5xx HTTP errors into service unavailable error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: vi.fn().mockResolvedValue('Overloaded')
    });

    await expect(
      callMultiAiProvider({ provider: 'claude', apiKey: 'sk-ant-key', prompt: 'Build curriculum' })
    ).rejects.toThrow(/claude service is temporarily unavailable/);
  });

  it('should successfully parse valid response from OpenAI format', async () => {
    const mockContent = JSON.stringify([
      { week: 'Week 1', topic: 'Fundamentals', details: ['Item 1'], resources: [] }
    ]);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: mockContent } }]
      })
    });

    const result = await callMultiAiProvider({
      provider: 'openai',
      apiKey: 'valid-openai-key',
      prompt: 'Generate curriculum for Rust'
    });

    expect(result).toBe(mockContent);
  });

  it('should successfully parse valid response from Claude format', async () => {
    const mockContent = JSON.stringify([
      { week: 'Week 1', topic: 'Claude Intro', details: ['Detail 1'], resources: [] }
    ]);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        content: [{ text: mockContent }]
      })
    });

    const result = await callMultiAiProvider({
      provider: 'claude',
      apiKey: 'valid-claude-key',
      prompt: 'Generate curriculum for Go'
    });

    expect(result).toBe(mockContent);
  });

  it('should reject responses with empty or invalid payload shape', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: null } }]
      })
    });

    await expect(
      callMultiAiProvider({
        provider: 'openai',
        apiKey: 'valid-key',
        prompt: 'Generate curriculum'
      })
    ).rejects.toThrow(/empty or invalid response shape/);
  });

  it('should accurately classify topics into domain catalogs', () => {
    expect(classifyRoadmapTopic('Learn Python and FastApi')).toBe('python');
    expect(classifyRoadmapTopic('React with Redux state management')).toBe('react');
    expect(classifyRoadmapTopic('Next.js App Router and Server Components')).toBe('nextjs');
    expect(classifyRoadmapTopic('Data Structures and LeetCode')).toBe('dsa');
    expect(classifyRoadmapTopic('UI/UX and Figma Product Design')).toBe('design');
    expect(classifyRoadmapTopic('Machine Learning and Deep Learning with PyTorch')).toBe('aiMl');
    expect(classifyRoadmapTopic('Unknown exotic topic XYZ')).toBe('custom');
  });

  it('should fallback to curated roadmap when no provider keys are configured', async () => {
    const savedGemini = process.env.GEMINI_API_KEY;
    const savedOpenai = process.env.OPENAI_API_KEY;
    const savedGroq = process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GROQ_API_KEY;

    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue({ customAiKey: '', customAiProvider: 'gemini' })
    });

    const roadmap = await generateCurriculumForTopic({
      topic: 'Data Structures and Algorithms',
      userId: 'mock-user-123'
    });

    expect(Array.isArray(roadmap)).toBe(true);
    expect(roadmap.length).toBeGreaterThan(0);
    expect(roadmap[0]).toHaveProperty('week');
    expect(roadmap[0]).toHaveProperty('topic');
    expect(roadmap[0]).toHaveProperty('details');
    expect(roadmap[0]).toHaveProperty('resources');

    if (savedGemini) process.env.GEMINI_API_KEY = savedGemini;
    if (savedOpenai) process.env.OPENAI_API_KEY = savedOpenai;
    if (savedGroq) process.env.GROQ_API_KEY = savedGroq;
  });

  it('should calculate AI compatibility scores and return sorted matches', async () => {
    const mockCurrentUser = {
      _id: 'user-me',
      name: 'Alice',
      skillsTeach: [{ skill: { _id: 'skill-react', name: 'React' } }],
      skillsLearn: [{ skill: { _id: 'skill-python', name: 'Python' } }],
      interests: ['Web Development', 'Open Source']
    };

    const mockMentors = [
      {
        _id: 'user-mentor-1',
        name: 'Bob',
        username: 'bob',
        skillsTeach: [{ skill: { _id: 'skill-python', name: 'Python' } }],
        skillsLearn: [],
        interests: ['Web Development'],
        experienceLevel: 'Senior',
        points: 120,
        followersCount: 5
      }
    ];

    const mockLearners = [
      {
        _id: 'user-learner-1',
        name: 'Charlie',
        username: 'charlie',
        skillsTeach: [],
        skillsLearn: [{ skill: { _id: 'skill-react', name: 'React' } }],
        interests: ['Open Source'],
        experienceLevel: 'Beginner',
        points: 40,
        followersCount: 1
      }
    ];

    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCurrentUser)
      })
    });

    vi.spyOn(User, 'find').mockImplementation((query) => {
      const isMentorQuery = query['skillsTeach.skill'] !== undefined;
      return {
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(isMentorQuery ? mockMentors : mockLearners)
            })
          })
        })
      };
    });

    const result = await findAiMatches('user-me');

    expect(result).not.toBeNull();
    expect(result.mentors.length).toBe(1);
    expect(result.learners.length).toBe(1);
    expect(result.mentors[0].user.name).toBe('Bob');
    expect(result.mentors[0].compatibilityScore).toBeGreaterThanOrEqual(50);
    expect(result.mentors[0].matchReasons.length).toBeGreaterThan(0);
    expect(result.learners[0].user.name).toBe('Charlie');
  });
});
