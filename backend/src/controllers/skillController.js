import Skill from '../models/Skill.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import SkillRequest from '../models/SkillRequest.js';
import {
  asyncHandler,
  ApiError,
  ApiResponse
} from '../utils/index.js';

const DEFAULT_SKILLS = [
  { name: 'HTML5 & CSS3', category: 'Web Development', tags: ['frontend', 'layout'], description: 'Semantic HTML and responsive CSS for modern web interfaces.' },
  { name: 'JavaScript ES6+', category: 'Web Development', tags: ['javascript', 'frontend'], description: 'Modern JavaScript with modules, async flows and clean browser APIs.' },
  { name: 'React.js', category: 'MERN Stack', tags: ['react', 'frontend'], description: 'Component-driven UI development with hooks, routing and app state.' },
  { name: 'Node.js & Express', category: 'MERN Stack', tags: ['backend', 'api'], description: 'REST API development with Express middleware and MVC patterns.' },
  { name: 'MongoDB & Mongoose', category: 'MERN Stack', tags: ['database', 'nosql'], description: 'Schema modeling, queries and relationships for MongoDB apps.' },
  { name: 'Core Java', category: 'Java', tags: ['oop', 'backend'], description: 'Object-oriented Java, collections, exceptions and multithreading basics.' },
  { name: 'Python Basics', category: 'Python', tags: ['python', 'programming'], description: 'Python fundamentals, data structures, functions and project scripting.' },
  { name: 'Figma Prototyping', category: 'UI/UX Design', tags: ['design', 'figma'], description: 'Wireframes, components, prototypes and product design handoff.' },
  { name: 'Machine Learning', category: 'AI/ML', tags: ['ml', 'ai'], description: 'Practical supervised learning, evaluation and model iteration.' },
  { name: 'React Native', category: 'Mobile Development', tags: ['mobile', 'react'], description: 'Cross-platform mobile app development with React Native.' }
];

const ensureDefaultSkills = async () => {
  const count = await Skill.estimatedDocumentCount();
  if (count === 0) {
    await Skill.insertMany(DEFAULT_SKILLS, { ordered: false });
  }
};

export const getSkills = asyncHandler(async (req, res) => {
  const { category, search } = req.query;

  await ensureDefaultSkills();
  const query = {};

  if (category) {
    query.category = category;
  }

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const skills = await Skill.find(query);

  return res.status(200).json(
    new ApiResponse(200, { skills }, 'Skills retrieved successfully')
  );
});

export const createSkill = asyncHandler(async (req, res) => {
  const { name, category, tags, description } = req.body;

  if (!name || !category) {
    throw new ApiError(400, 'Skill name and category are required');
  }

  const skillExists = await Skill.findOne({ name: name.trim() });
  if (skillExists) {
    throw new ApiError(400, 'Skill already exists in the master database');
  }

  const skill = await Skill.create({
    name: name.trim(),
    category,
    tags: tags || [],
    description: description || ''
  });

  return res.status(201).json(
    new ApiResponse(201, { skill }, 'Skill added to database successfully!')
  );
});

export const updateSkill = asyncHandler(async (req, res) => {
  const { name, category, tags, description } = req.body;

  if (!name || !category) {
    throw new ApiError(400, 'Skill name and category are required');
  }

  const skill = await Skill.findById(req.params.id);
  if (!skill) {
    throw new ApiError(404, 'Skill not found');
  }

  const duplicate = await Skill.findOne({
    _id: { $ne: skill._id },
    name: name.trim()
  });

  if (duplicate) {
    throw new ApiError(400, 'Another skill already uses this name');
  }

  skill.name = name.trim();
  skill.category = category.trim();
  skill.description = description || '';
  skill.tags = Array.isArray(tags) ? tags.map((t) => t.trim()).filter(Boolean) : [];

  await skill.save();

  return res.status(200).json(
    new ApiResponse(200, { skill }, 'Skill updated successfully')
  );
});

export const deleteSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id);
  if (!skill) {
    throw new ApiError(404, 'Skill not found');
  }

  const sessionCount = await Session.countDocuments({ skill: skill._id });
  if (sessionCount > 0) {
    throw new ApiError(400, 'This skill is attached to existing sessions, so it cannot be removed');
  }

  await User.updateMany(
    {},
    {
      $pull: {
        skillsTeach: { skill: skill._id },
        skillsLearn: { skill: skill._id }
      }
    }
  );
  await Skill.deleteOne({ _id: skill._id });

  return res.status(200).json(
    new ApiResponse(200, null, 'Skill removed successfully')
  );
});

export const requestSkill = asyncHandler(async (req, res) => {
  const { name, category, description, tags, intent, level } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Skill / Course name is required');
  }
  if (!category || !category.trim()) {
    throw new ApiError(400, 'Category is required');
  }

  const trimmedName = name.trim();
  const existingCatalogSkill = await Skill.findOne({
    name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
  });

  if (existingCatalogSkill) {
    throw new ApiError(400, `The course "${existingCatalogSkill.name}" already exists in the catalog! You can directly search and add it to your profile.`);
  }

  const existingPending = await SkillRequest.findOne({
    user: req.user._id,
    name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    status: 'pending'
  });

  if (existingPending) {
    throw new ApiError(400, 'You have already submitted a pending request for this course. Please wait for admin review.');
  }

  const tagList = Array.isArray(tags)
    ? tags
    : (typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : []);

  const request = await SkillRequest.create({
    user: req.user._id,
    name: trimmedName,
    category: category.trim(),
    description: description?.trim() || '',
    tags: tagList,
    intent: ['teach', 'learn', 'both'].includes(intent) ? intent : 'teach',
    level: ['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(level) ? level : 'Intermediate',
    status: 'pending'
  });

  return res.status(201).json(
    new ApiResponse(201, { request }, 'Your request has been submitted! We will verify if this course already exists or meets platform standards, and once approved it will be added to the catalog and your profile.')
  );
});

export const getSkillRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};

  if (req.user.role !== 'Admin') {
    query.user = req.user._id;
  }

  if (status) {
    query.status = status;
  }

  const requests = await SkillRequest.find(query)
    .populate('user', 'name username email profileImage')
    .populate('reviewedBy', 'name username')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, { requests }, 'Skill requests retrieved')
  );
});

export const approveSkillRequest = asyncHandler(async (req, res) => {
  const request = await SkillRequest.findById(req.params.id);
  if (!request) {
    throw new ApiError(404, 'Skill request not found');
  }

  if (request.status === 'approved') {
    throw new ApiError(400, 'This request has already been approved');
  }

  let skill = await Skill.findOne({
    name: { $regex: new RegExp(`^${request.name}$`, 'i') }
  });

  if (!skill) {
    skill = await Skill.create({
      name: request.name,
      category: request.category,
      description: request.description,
      tags: request.tags
    });
  }

  const requestingUser = await User.findById(request.user);
  if (requestingUser) {
    const intent = request.intent;
    const level = request.level || 'Intermediate';

    if (intent === 'teach' || intent === 'both') {
      const alreadyHas = requestingUser.skillsTeach.some((s) => s.skill.toString() === skill._id.toString());
      if (!alreadyHas) {
        requestingUser.skillsTeach.push({ skill: skill._id, level });
      }
    }

    if (intent === 'learn' || intent === 'both') {
      const alreadyHas = requestingUser.skillsLearn.some((s) => s.skill.toString() === skill._id.toString());
      if (!alreadyHas) {
        requestingUser.skillsLearn.push({ skill: skill._id, level });
      }
    }

    await requestingUser.save();
  }

  request.status = 'approved';
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  await request.save();

  return res.status(200).json(
    new ApiResponse(200, { skill, request }, `Course "${request.name}" approved and added to catalog!`)
  );
});

export const rejectSkillRequest = asyncHandler(async (req, res) => {
  const { adminFeedback } = req.body;
  const request = await SkillRequest.findById(req.params.id);
  if (!request) {
    throw new ApiError(404, 'Skill request not found');
  }

  request.status = 'rejected';
  request.adminFeedback = adminFeedback || 'Does not meet catalog criteria or is duplicate';
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  await request.save();

  return res.status(200).json(
    new ApiResponse(200, { request }, `Request for "${request.name}" rejected.`)
  );
});
