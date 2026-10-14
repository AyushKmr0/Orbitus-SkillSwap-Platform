import Skill from '../../models/Skill.js';
import Session from '../../models/Session.js';
import User from '../../models/User.js';
import SkillRequest from '../../models/SkillRequest.js';

export const DEFAULT_SKILLS = [
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

export class SkillRepository {
  async ensureDefaultSkills() {
    const count = await Skill.estimatedDocumentCount();
    if (count === 0) {
      await Skill.insertMany(DEFAULT_SKILLS, { ordered: false });
    }
  }

  async find(query = {}) {
    return Skill.find(query).lean();
  }

  async findByName(name) {
    return Skill.findOne({ name: name.trim() });
  }

  async findByNameCaseInsensitive(name) {
    return Skill.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
  }

  async findById(id) {
    return Skill.findById(id);
  }

  async findDuplicate(id, name) {
    return Skill.findOne({
      _id: { $ne: id },
      name: name.trim()
    });
  }

  async create(data) {
    return Skill.create(data);
  }

  async countAttachedSessions(skillId) {
    return Session.countDocuments({ skill: skillId });
  }

  async detachSkillFromUsers(skillId) {
    return User.updateMany(
      {},
      {
        $pull: {
          skillsTeach: { skill: skillId },
          skillsLearn: { skill: skillId }
        }
      }
    );
  }

  async delete(id) {
    return Skill.deleteOne({ _id: id });
  }

  async findPendingRequest(userId, name) {
    return SkillRequest.findOne({
      user: userId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      status: 'pending'
    });
  }

  async createSkillRequest(data) {
    return SkillRequest.create(data);
  }

  async findSkillRequests(query = {}) {
    return SkillRequest.find(query)
      .populate('user', 'name username email profileImage')
      .populate('reviewedBy', 'name username')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findSkillRequestById(id) {
    return SkillRequest.findById(id);
  }

  async findUserById(id) {
    return User.findById(id);
  }
}

export const skillRepository = new SkillRepository();
export default skillRepository;
