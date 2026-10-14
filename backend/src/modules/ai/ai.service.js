import { GoogleGenerativeAI } from '@google/generative-ai';
import User from '../../models/User.js';
import { encryptText, decryptText } from '../../utils/encryption.js';
import {
  FALLBACK_ROADMAPS,
  classifyRoadmapTopic,
  normalizeRoadmapData,
  buildCustomRoadmap,
  extractJsonPayload
} from './ai.curricula.js';

const SUPPORTED_PROVIDERS = ['gemini', 'openai', 'groq', 'claude'];
const MAX_PROMPT_LENGTH = 20000;
const AI_TIMEOUT_MS = 30000;

/**
 * Service for calling multi-model AI providers with robust timeouts, cancellation, validation, and sanitized errors.
 */
export const callMultiAiProvider = async ({ provider, apiKey, prompt }) => {
  const selectedProvider = (provider || 'gemini').toLowerCase().trim();

  if (!SUPPORTED_PROVIDERS.includes(selectedProvider)) {
    throw new Error(`Unsupported AI provider: ${selectedProvider}. Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}`);
  }

  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error(`API key is required for AI provider: ${selectedProvider}`);
  }

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Prompt is required for curriculum generation');
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(`Prompt exceeds maximum allowed length of ${MAX_PROMPT_LENGTH} characters`);
  }

  const cleanApiKey = apiKey.trim();
  const cleanPrompt = prompt.trim();

  try {
    if (selectedProvider === 'gemini') {
      const abortController = new AbortController();
      let timer = null;

      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
          // Trigger client-side cancellation on the underlying request
          abortController.abort();
          const timeoutErr = new Error('AI provider request timed out');
          timeoutErr.name = 'TimeoutError';
          reject(timeoutErr);
        }, AI_TIMEOUT_MS);
        if (timer.unref) timer.unref();
      });

      try {
        const genAI = new GoogleGenerativeAI(cleanApiKey);
        // Note: SDK RequestOptions accepts timeout and SingleRequestOptions accepts signal.
        // As documented by GoogleGenerativeAI, AbortSignal is a client-side cancellation.
        const model = genAI.getGenerativeModel(
          { model: 'gemini-1.5-flash' },
          { timeout: AI_TIMEOUT_MS }
        );

        const contentPromise = model.generateContent(cleanPrompt, {
          signal: abortController.signal,
          timeout: AI_TIMEOUT_MS
        });

        const result = await Promise.race([contentPromise, timeoutPromise]);
        const text = result?.response?.text ? result.response.text() : '';
        if (!text || typeof text !== 'string') {
          throw new Error('AI provider returned an empty or invalid response shape');
        }
        return text;
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    if (selectedProvider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert curriculum architect. Return ONLY valid JSON array with no extra markdown formatting or conversational commentary.'
            },
            { role: 'user', content: cleanPrompt }
          ],
          temperature: 0.7
        }),
        signal: AbortSignal.timeout(AI_TIMEOUT_MS)
      });

      if (!res.ok) {
        mapHttpError(selectedProvider, res.status);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new Error('AI provider returned an empty or invalid response shape');
      }
      return content;
    }

    if (selectedProvider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are an expert curriculum architect. Return ONLY valid JSON array with no extra markdown formatting or conversational commentary.'
            },
            { role: 'user', content: cleanPrompt }
          ],
          temperature: 0.7
        }),
        signal: AbortSignal.timeout(AI_TIMEOUT_MS)
      });

      if (!res.ok) {
        mapHttpError(selectedProvider, res.status);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new Error('AI provider returned an empty or invalid response shape');
      }
      return content;
    }

    if (selectedProvider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': cleanApiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 3000,
          messages: [{ role: 'user', content: cleanPrompt }]
        }),
        signal: AbortSignal.timeout(AI_TIMEOUT_MS)
      });

      if (!res.ok) {
        mapHttpError(selectedProvider, res.status);
      }

      const data = await res.json();
      const content = data.content?.[0]?.text;
      if (!content || typeof content !== 'string') {
        throw new Error('AI provider returned an empty or invalid response shape');
      }
      return content;
    }
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error(`AI provider request timed out after ${AI_TIMEOUT_MS / 1000} seconds`);
    }
    // Re-throw sanitized errors without exposing keys or credentials
    throw err;
  }
};

const mapHttpError = (provider, status) => {
  if (status === 401 || status === 403) {
    throw new Error(`Authentication failed for ${provider}. Please verify your API key.`);
  }
  if (status === 429) {
    throw new Error(`Rate limit exceeded for ${provider}. Please try again later.`);
  }
  if (status >= 500) {
    throw new Error(`${provider} service is temporarily unavailable. Please try again later.`);
  }
  throw new Error(`${provider} request failed with HTTP status ${status}`);
};

/**
 * Orchestrates curriculum generation: resolves API keys, builds prompt,
 * executes multi-model generation with timeouts, and falls back to curated catalogs.
 */
export const generateCurriculumForTopic = async ({ topic, userId, requestedProvider }) => {
  const topicType = classifyRoadmapTopic(topic);

  const dbUser = await User.findById(userId).select('customAiKey customAiProvider');
  let rawDbKey = (dbUser?.customAiKey || '').trim();
  let userApiKey = '';

  if (rawDbKey) {
    if (!rawDbKey.startsWith('enc:')) {
      userApiKey = rawDbKey;
      dbUser.customAiKey = encryptText(rawDbKey);
      await dbUser.save().catch((err) => console.warn('[LAZY RE-ENCRYPT WARN]:', err.message));
    } else {
      userApiKey = decryptText(rawDbKey);
    }
  }

  const userProvider = requestedProvider || dbUser?.customAiProvider || 'gemini';

  let apiKeyToUse = userApiKey;
  let providerToUse = userProvider;

  if (!apiKeyToUse && process.env.GEMINI_API_KEY) {
    apiKeyToUse = process.env.GEMINI_API_KEY;
    providerToUse = 'gemini';
  } else if (!apiKeyToUse && process.env.OPENAI_API_KEY) {
    apiKeyToUse = process.env.OPENAI_API_KEY;
    providerToUse = 'openai';
  } else if (!apiKeyToUse && process.env.GROQ_API_KEY) {
    apiKeyToUse = process.env.GROQ_API_KEY;
    providerToUse = 'groq';
  }

  const prompt = `
    Generate an expert, high-quality, practical 6-week curriculum for mastering: "${topic}".
    CRITICAL INSTRUCTIONS:
    - STRICTLY AVOID generic filler phrases like "learn basics", "set up tools", "review principles", or "explore techniques".
    - Every week must have a concrete, insightful milestone title and 3-4 specific technical or practical subtopics (mention specific frameworks, syntax, algorithms, industry tools, or exercises).
    - Provide realistic, high-value study resources with descriptive titles and real canonical documentation URLs.
    - Structure your response strictly as a JSON array of objects without markdown formatting or surrounding text:
    [
      {
        "week": "Week 1",
        "topic": "Concrete Milestone Title",
        "details": ["Specific practical subtopic 1", "Specific practical subtopic 2", "Hands-on project task 3"],
        "resources": [
          { "title": "Authoritative Resource Name", "url": "https://example.com/guide", "type": "Docs" }
        ]
      }
    ]
  `;

  if (apiKeyToUse) {
    try {
      const responseText = await callMultiAiProvider({
        provider: providerToUse,
        apiKey: apiKeyToUse,
        prompt
      });
      const parsed = JSON.parse(extractJsonPayload(responseText));
      return normalizeRoadmapData(parsed, topic);
    } catch (aiErr) {
      console.warn(`${providerToUse} generation failed, using curated curriculum:`, aiErr.message);
      return FALLBACK_ROADMAPS[topicType] || buildCustomRoadmap(topic);
    }
  }

  return FALLBACK_ROADMAPS[topicType] || buildCustomRoadmap(topic);
};

/**
 * Calculates AI compatibility scores between currentUser and potential mentors/learners.
 */
export const findAiMatches = async (userId) => {
  const currentUser = await User.findById(userId)
    .select('name username profileImage bio experienceLevel skillsTeach skillsLearn interests')
    .populate('skillsTeach.skill skillsLearn.skill');

  if (!currentUser) {
    return null;
  }

  const teachSkillIds = (currentUser.skillsTeach || []).map((s) => s.skill?._id?.toString()).filter(Boolean);
  const learnSkillIds = (currentUser.skillsLearn || []).map((s) => s.skill?._id?.toString()).filter(Boolean);

  const [mentors, learners] = await Promise.all([
    User.find({
      role: 'User',
      _id: { $ne: currentUser._id },
      'skillsTeach.skill': { $in: learnSkillIds }
    })
      .select('name username profileImage bio experienceLevel skillsTeach skillsLearn interests points followersCount')
      .populate('skillsTeach.skill skillsLearn.skill')
      .limit(8)
      .lean(),
    User.find({
      role: 'User',
      _id: { $ne: currentUser._id },
      'skillsLearn.skill': { $in: teachSkillIds }
    })
      .select('name username profileImage bio experienceLevel skillsTeach skillsLearn interests points followersCount')
      .populate('skillsTeach.skill skillsLearn.skill')
      .limit(8)
      .lean()
  ]);

  const formatSuggestions = (list, type) => {
    return list.map((candidate) => {
      let score = 50;
      const matchReasons = [];

      const sharedInterests = (candidate.interests || []).filter((i) => (currentUser.interests || []).includes(i));
      if (sharedInterests.length > 0) {
        score += Math.min(30, sharedInterests.length * 10);
        matchReasons.push(`Shared interests in ${sharedInterests.slice(0, 2).join(', ')}`);
      }

      if (type === 'mentor') {
        const matchingTeachSkills = (candidate.skillsTeach || [])
          .filter((st) => learnSkillIds.includes(st.skill?._id?.toString()))
          .map((st) => st.skill?.name)
          .filter(Boolean);
        if (matchingTeachSkills.length > 0) {
          score += 20;
          matchReasons.push(`Teaches ${matchingTeachSkills[0]} which you want to learn`);
        }
      } else {
        const matchingLearnSkills = (candidate.skillsLearn || [])
          .filter((sl) => teachSkillIds.includes(sl.skill?._id?.toString()))
          .map((sl) => sl.skill?.name)
          .filter(Boolean);
        if (matchingLearnSkills.length > 0) {
          score += 20;
          matchReasons.push(`Wants to learn ${matchingLearnSkills[0]} which you teach`);
        }
      }

      if (candidate.experienceLevel === 'Senior' || candidate.experienceLevel === 'Lead') {
        score += 10;
        matchReasons.push(`${candidate.experienceLevel} experience level match`);
      }

      const compatibilityScore = Math.min(98, Math.max(50, score));

      return {
        user: {
          _id: candidate._id,
          name: candidate.name,
          username: candidate.username,
          profileImage: candidate.profileImage,
          bio: candidate.bio,
          experienceLevel: candidate.experienceLevel,
          skillsTeach: candidate.skillsTeach,
          skillsLearn: candidate.skillsLearn,
          points: candidate.points || 0,
          followersCount: candidate.followersCount || 0
        },
        compatibilityScore,
        matchScore: compatibilityScore,
        matchReasons,
        sharedInterests
      };
    }).sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  };

  return {
    mentors: formatSuggestions(mentors, 'mentor'),
    learners: formatSuggestions(learners, 'learner')
  };
};

export const getUserCustomAiKeyStatus = async (userId) => {
  const user = await User.findById(userId).select('customAiKey customAiProvider');
  const hasCustomKey = Boolean(user?.customAiKey && user.customAiKey.trim().length > 0);
  return {
    hasCustomKey,
    customAiProvider: user?.customAiProvider || 'gemini'
  };
};

export const saveUserCustomAiKey = async (userId, { customAiKey, customAiProvider }) => {
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  const cleanKey = (customAiKey || '').trim();
  if (cleanKey) {
    user.customAiKey = encryptText(cleanKey);
    user.customAiProvider = customAiProvider || 'gemini';
  } else {
    user.customAiKey = '';
    user.customAiProvider = 'default';
  }
  await user.save();

  const hasCustomKey = Boolean(user.customAiKey && user.customAiKey.length > 0);
  return {
    hasCustomKey,
    customAiProvider: user.customAiProvider
  };
};
