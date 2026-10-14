import Roadmap from '../../models/Roadmap.js';
import {
  asyncHandler,
  ApiError,
  ApiResponse
} from '../../shared/index.js';
import {
  findAiMatches,
  getUserCustomAiKeyStatus,
  saveUserCustomAiKey,
  generateCurriculumForTopic
} from './ai.service.js';

const PROVIDER_NAMES = {
  gemini: 'Google Gemini',
  openai: 'OpenAI (ChatGPT)',
  groq: 'Groq (Llama 3.3)',
  claude: 'Anthropic Claude'
};

export const getAiMatches = asyncHandler(async (req, res) => {
  const matches = await findAiMatches(req.user._id);
  if (!matches) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(
    new ApiResponse(200, matches, 'AI suggestions retrieved')
  );
});

export const getCustomAiKeyStatus = asyncHandler(async (req, res) => {
  const status = await getUserCustomAiKeyStatus(req.user._id);

  return res.status(200).json(
    new ApiResponse(200, status, 'Custom AI key status retrieved')
  );
});

export const saveCustomAiKey = asyncHandler(async (req, res) => {
  const { customAiKey, customAiProvider } = req.body;
  const result = await saveUserCustomAiKey(req.user._id, {
    customAiKey,
    customAiProvider
  });

  if (!result) {
    throw new ApiError(404, 'User not found');
  }

  const message = result.hasCustomKey
    ? `Your personal ${PROVIDER_NAMES[result.customAiProvider] || result.customAiProvider} AI engine has been connected!`
    : 'Custom AI key disconnected. Default platform AI and curated curriculums will be used.';

  return res.status(200).json(
    new ApiResponse(200, result, message)
  );
});

export const generateRoadmap = asyncHandler(async (req, res) => {
  const { topic, customAiProvider } = req.body;

  if (!topic) {
    throw new ApiError(400, 'Please specify a learning topic');
  }

  const roadmapData = await generateCurriculumForTopic({
    topic,
    userId: req.user._id,
    requestedProvider: customAiProvider
  });

  const roadmap = await Roadmap.create({
    user: req.user._id,
    topic,
    roadmapData,
    progress: 0
  });

  return res.status(201).json(
    new ApiResponse(201, { roadmap }, 'Roadmap generated successfully')
  );
});

export const updateRoadmap = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { roadmapData, progress } = req.body;

  const roadmap = await Roadmap.findOne({ _id: id, user: req.user._id });
  if (!roadmap) {
    throw new ApiError(404, 'Roadmap not found');
  }

  if (Array.isArray(roadmapData)) {
    roadmap.roadmapData = roadmapData;
  }

  if (typeof progress === 'number') {
    roadmap.progress = Math.max(0, Math.min(100, progress));
  }

  await roadmap.save();

  return res.status(200).json(
    new ApiResponse(200, { roadmap }, 'Roadmap updated successfully')
  );
});

export const deleteRoadmap = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const roadmap = await Roadmap.findOneAndDelete({ _id: id, user: req.user._id });
  if (!roadmap) {
    throw new ApiError(404, 'Roadmap not found');
  }

  return res.status(200).json(
    new ApiResponse(200, null, 'Roadmap removed')
  );
});
