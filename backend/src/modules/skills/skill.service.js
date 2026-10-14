import skillRepository from './skill.repository.js';
import { AppError } from '../../shared/errors/app-error.js';

export class SkillService {
  constructor(repo = skillRepository) {
    this.repo = repo;
  }

  async getSkills({ category, search }) {
    await this.repo.ensureDefaultSkills();
    const query = {};

    if (category) {
      query.category = category;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    return this.repo.find(query);
  }

  async createSkill({ name, category, tags, description }) {
    if (!name || !category) {
      throw new AppError(400, 'Skill name and category are required');
    }

    const skillExists = await this.repo.findByName(name);
    if (skillExists) {
      throw new AppError(400, 'Skill already exists in the master database');
    }

    return this.repo.create({
      name: name.trim(),
      category: category.trim(),
      tags: tags || [],
      description: description || ''
    });
  }

  async updateSkill(id, { name, category, tags, description }) {
    if (!name || !category) {
      throw new AppError(400, 'Skill name and category are required');
    }

    const skill = await this.repo.findById(id);
    if (!skill) {
      throw new AppError(404, 'Skill not found');
    }

    const duplicate = await this.repo.findDuplicate(skill._id, name);
    if (duplicate) {
      throw new AppError(400, 'Another skill already uses this name');
    }

    skill.name = name.trim();
    skill.category = category.trim();
    skill.description = description || '';
    skill.tags = Array.isArray(tags) ? tags.map((t) => t.trim()).filter(Boolean) : [];

    await skill.save();
    return skill;
  }

  async deleteSkill(id) {
    const skill = await this.repo.findById(id);
    if (!skill) {
      throw new AppError(404, 'Skill not found');
    }

    const sessionCount = await this.repo.countAttachedSessions(skill._id);
    if (sessionCount > 0) {
      throw new AppError(400, 'This skill is attached to existing sessions, so it cannot be removed');
    }

    await this.repo.detachSkillFromUsers(skill._id);
    await this.repo.delete(skill._id);
    return true;
  }

  async requestSkill({ userId, name, category, description, tags, intent, level }) {
    if (!name || !name.trim()) {
      throw new AppError(400, 'Skill / Course name is required');
    }
    if (!category || !category.trim()) {
      throw new AppError(400, 'Category is required');
    }

    const trimmedName = name.trim();
    const existingCatalogSkill = await this.repo.findByNameCaseInsensitive(trimmedName);
    if (existingCatalogSkill) {
      throw new AppError(400, `The course "${existingCatalogSkill.name}" already exists in the catalog! You can directly search and add it to your profile.`);
    }

    const existingPending = await this.repo.findPendingRequest(userId, trimmedName);
    if (existingPending) {
      throw new AppError(400, 'You have already submitted a pending request for this course. Please wait for admin review.');
    }

    const tagList = Array.isArray(tags)
      ? tags
      : (typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : []);

    return this.repo.createSkillRequest({
      user: userId,
      name: trimmedName,
      category: category.trim(),
      description: description?.trim() || '',
      tags: tagList,
      intent: ['teach', 'learn', 'both'].includes(intent) ? intent : 'teach',
      level: ['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(level) ? level : 'Intermediate',
      status: 'pending'
    });
  }

  async getSkillRequests({ userRole, userId, status }) {
    const query = {};
    if (userRole !== 'Admin') {
      query.user = userId;
    }
    if (status) {
      query.status = status;
    }
    return this.repo.findSkillRequests(query);
  }

  async approveSkillRequest(requestId, adminId) {
    const request = await this.repo.findSkillRequestById(requestId);
    if (!request) {
      throw new AppError(404, 'Skill request not found');
    }

    if (request.status === 'approved') {
      throw new AppError(400, 'This request has already been approved');
    }

    let skill = await this.repo.findByNameCaseInsensitive(request.name);
    if (!skill) {
      skill = await this.repo.create({
        name: request.name,
        category: request.category,
        description: request.description,
        tags: request.tags
      });
    }

    const requestingUser = await this.repo.findUserById(request.user);
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
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await request.save();

    return { skill, request };
  }

  async rejectSkillRequest(requestId, adminId, adminFeedback) {
    const request = await this.repo.findSkillRequestById(requestId);
    if (!request) {
      throw new AppError(404, 'Skill request not found');
    }

    request.status = 'rejected';
    request.adminFeedback = adminFeedback || 'Does not meet catalog criteria or is duplicate';
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await request.save();

    return request;
  }
}

export const skillService = new SkillService();
export default skillService;
