import Skill from '../models/Skill.js';
import Session from '../models/Session.js';
import User from '../models/User.js';

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

// @desc    Get all skills with optional filters
// @route   GET /api/skills
// @access  Private
export const getSkills = async (req, res) => {
  const { category, search } = req.query;

  try {
    await ensureDefaultSkills();
    let query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skills = await Skill.find(query);
    res.status(200).json({ success: true, skills });
  } catch (error) {
    console.error('Fetch Skills Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching skills database' });
  }
};

// @desc    Add a new master skill
// @route   POST /api/skills
// @access  Private/Admin
export const createSkill = async (req, res) => {
  const { name, category, tags, description } = req.body;

  try {
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Skill name and category are required' });
    }

    const skillExists = await Skill.findOne({ name: name.trim() });
    if (skillExists) {
      return res.status(400).json({ success: false, message: 'Skill already exists in the master database' });
    }

    const skill = await Skill.create({
      name: name.trim(),
      category,
      tags: tags || [],
      description: description || ''
    });

    res.status(201).json({ success: true, message: 'Skill added to database successfully!', skill });
  } catch (error) {
    console.error('Create Skill Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error creating new skill entry' });
  }
};

// @desc    Update a master skill
// @route   PUT /api/skills/:id
// @access  Private/Admin
export const updateSkill = async (req, res) => {
  const { name, category, tags, description } = req.body;

  try {
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Skill name and category are required' });
    }

    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }

    const duplicate = await Skill.findOne({
      _id: { $ne: skill._id },
      name: name.trim()
    });

    if (duplicate) {
      return res.status(400).json({ success: false, message: 'Another skill already uses this name' });
    }

    skill.name = name.trim();
    skill.category = category.trim();
    skill.description = description || '';
    skill.tags = Array.isArray(tags) ? tags.map(tag => tag.trim()).filter(Boolean) : [];

    await skill.save();

    res.status(200).json({ success: true, message: 'Skill updated successfully', skill });
  } catch (error) {
    console.error('Update Skill Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating skill entry' });
  }
};

// @desc    Remove a master skill
// @route   DELETE /api/skills/:id
// @access  Private/Admin
export const deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }

    const sessionCount = await Session.countDocuments({ skill: skill._id });
    if (sessionCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'This skill is attached to existing sessions, so it cannot be removed'
      });
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

    res.status(200).json({ success: true, message: 'Skill removed successfully' });
  } catch (error) {
    console.error('Delete Skill Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error removing skill entry' });
  }
};
