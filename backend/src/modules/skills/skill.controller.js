import skillService from './skill.service.js';
import { asyncHandler, ApiResponse } from '../../shared/index.js';

export const getSkills = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const skills = await skillService.getSkills({ category, search });

  return res.status(200).json(
    new ApiResponse(200, { skills }, 'Skills retrieved successfully')
  );
});

export const createSkill = asyncHandler(async (req, res) => {
  const { name, category, tags, description } = req.body;
  const skill = await skillService.createSkill({ name, category, tags, description });

  return res.status(201).json(
    new ApiResponse(201, { skill }, 'Skill added to database successfully!')
  );
});

export const updateSkill = asyncHandler(async (req, res) => {
  const { name, category, tags, description } = req.body;
  const skill = await skillService.updateSkill(req.params.id, { name, category, tags, description });

  return res.status(200).json(
    new ApiResponse(200, { skill }, 'Skill updated successfully')
  );
});

export const deleteSkill = asyncHandler(async (req, res) => {
  await skillService.deleteSkill(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, null, 'Skill removed successfully')
  );
});

export const requestSkill = asyncHandler(async (req, res) => {
  const { name, category, description, tags, intent, level } = req.body;
  const request = await skillService.requestSkill({
    userId: req.user._id,
    name,
    category,
    description,
    tags,
    intent,
    level
  });

  return res.status(201).json(
    new ApiResponse(201, { request }, 'Your request has been submitted! We will verify if this course already exists or meets platform standards, and once approved it will be added to the catalog and your profile.')
  );
});

export const getSkillRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const requests = await skillService.getSkillRequests({
    userRole: req.user.role,
    userId: req.user._id,
    status
  });

  return res.status(200).json(
    new ApiResponse(200, { requests }, 'Skill requests retrieved')
  );
});

export const approveSkillRequest = asyncHandler(async (req, res) => {
  const result = await skillService.approveSkillRequest(req.params.id, req.user._id);

  return res.status(200).json(
    new ApiResponse(200, result, `Course "${result.request.name}" approved and added to catalog!`)
  );
});

export const rejectSkillRequest = asyncHandler(async (req, res) => {
  const { adminFeedback } = req.body;
  const request = await skillService.rejectSkillRequest(req.params.id, req.user._id, adminFeedback);

  return res.status(200).json(
    new ApiResponse(200, { request }, `Request for "${request.name}" rejected.`)
  );
});
