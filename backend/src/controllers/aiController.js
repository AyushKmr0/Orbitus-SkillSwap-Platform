import { GoogleGenerativeAI } from '@google/generative-ai';
import User from '../models/User.js';
import Roadmap from '../models/Roadmap.js';
import Review from '../models/Review.js';

let geminiClient = null;

const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
};

// Helper standard roadmaps for fallback
const FALLBACK_ROADMAPS = {
  react: [
    { week: 'Week 1', topic: 'React Mental Model & Tooling', details: ['Set up Vite + React and understand JSX', 'Break UI into reusable components', 'Use props to pass data cleanly'], resources: ['React.dev Learn', 'Vite React Guide'] },
    { week: 'Week 2', topic: 'State, Events & Rendering', details: ['Handle events and controlled inputs', 'Use useState for local UI state', 'Understand render cycles and conditional rendering'], resources: ['React.dev: Adding Interactivity', 'React.dev: Managing State'] },
    { week: 'Week 3', topic: 'Effects, Data Fetching & Forms', details: ['Use useEffect for external synchronization', 'Fetch API data with loading and error states', 'Build validated forms without messy state'], resources: ['React.dev: Synchronizing with Effects', 'React Hook Form Docs'] },
    { week: 'Week 4', topic: 'Routing & App Structure', details: ['Create nested routes with React Router', 'Split pages, components and services', 'Handle protected routes and redirects'], resources: ['React Router Docs', 'Kent C. Dodds React Patterns'] },
    { week: 'Week 5', topic: 'Performance & Production Patterns', details: ['Use memoization only where it helps', 'Avoid prop drilling with context or state libraries', 'Test components and user flows'], resources: ['React.dev: Performance', 'Testing Library React Docs'] },
    { week: 'Week 6', topic: 'React Capstone', details: ['Build a dashboard or marketplace UI', 'Connect real APIs and persist auth state', 'Deploy and review bundle quality'], resources: ['Vercel React Deploy Guide', 'Web.dev Performance'] }
  ],
  aiMl: [
    { week: 'Week 1', topic: 'Python for Data & Math Refresh', details: ['Use NumPy arrays and vectorized operations', 'Work with Pandas dataframes', 'Review probability, linear algebra and gradients at a practical level'], resources: ['Kaggle Python', '3Blue1Brown Linear Algebra'] },
    { week: 'Week 2', topic: 'Data Preparation & Evaluation', details: ['Clean datasets and handle missing values', 'Create train/validation/test splits', 'Use metrics such as accuracy, precision, recall, F1 and RMSE'], resources: ['Kaggle Intro to Machine Learning', 'Google ML Crash Course'] },
    { week: 'Week 3', topic: 'Classical Machine Learning', details: ['Train regression and classification models', 'Understand overfitting, regularization and cross-validation', 'Tune models with scikit-learn pipelines'], resources: ['Scikit-learn User Guide', 'StatQuest Machine Learning'] },
    { week: 'Week 4', topic: 'Deep Learning Foundations', details: ['Build neural networks with PyTorch or TensorFlow', 'Understand loss functions, optimizers and backpropagation', 'Train small image or text models'], resources: ['PyTorch Tutorials', 'Dive into Deep Learning'] },
    { week: 'Week 5', topic: 'Modern AI & LLM Basics', details: ['Understand embeddings, transformers and attention', 'Use LLM APIs responsibly', 'Build a retrieval-based mini project'], resources: ['Hugging Face Course', 'OpenAI Cookbook Concepts'] },
    { week: 'Week 6', topic: 'Portfolio ML Project', details: ['Pick one real dataset and define success metrics', 'Train, evaluate and document the model', 'Ship a small demo with clear limitations'], resources: ['Kaggle Datasets', 'Papers with Code'] }
  ],
  mern: [
    { week: 'Week 1', topic: 'HTML5 & CSS3 Layouts', details: ['Flexbox and Grid layout systems', 'Responsive breakpoints', 'Semantic HTML5 structure'], resources: ['MDN Web Docs', 'CSS-Tricks'] },
    { week: 'Week 2', topic: 'JavaScript ES6+ Basics', details: ['Async/Await & Promises', 'Array Methods (map, filter, reduce)', 'DOM events & manipulations'], resources: ['Eloquent JavaScript', 'javascript.info'] },
    { week: 'Week 3', topic: 'React.js Fundamentals', details: ['JSX syntax and Component design', 'State & Props hooks (useState, useEffect)', 'React Router navigation'], resources: ['React Docs', 'Scrimba React Course'] },
    { week: 'Week 4', topic: 'Node.js & Express API Development', details: ['Creating Express servers', 'REST API routing & controllers', 'Middleware integration'], resources: ['Node.js Guide', 'Express Docs'] },
    { week: 'Week 5', topic: 'MongoDB & Database Modeling', details: ['Mongoose model design & schemas', 'Atlas connection and CRUD operations', 'Data relationships'], resources: ['MongoDB University', 'Mongoose Guides'] },
    { week: 'Week 6', topic: 'MERN Capstone Projects Deployment', details: ['Redux Toolkit state management', 'Authentication guards & JWT cookie handling', 'Render/Vercel production setups'], resources: ['Full Stack Open', 'Vercel Deployment Guide'] }
  ],
  python: [
    { week: 'Week 1', topic: 'Python Language Fundamentals', details: ['Data structures (lists, dicts, tuples)', 'Loops, conditions & custom modules', 'Writing basic functions'], resources: ['Python.org Tutorial', 'Real Python'] },
    { week: 'Week 2', topic: 'Object-Oriented Python', details: ['Classes and Inheritance', 'Magic methods & decorators', 'File operations & error handling'], resources: ['Python OOP Guide', 'Corey Schafer OOP Series'] },
    { week: 'Week 3', topic: 'Database Integration & SQL', details: ['SQLite3 standard library', 'PostgreSQL database connectors', 'Introduction to SQLAlchemy ORM'], resources: ['SQLAlchemy Docs', 'Full Stack Python'] },
    { week: 'Week 4', topic: 'Django Web Framework Core', details: ['MVC architecture & pattern routing', 'Django Admin console', 'ORM migrations & templates'], resources: ['Django Girls Tutorial', 'Django Project Docs'] },
    { week: 'Week 5', topic: 'Django REST Framework APIs', details: ['Serialization methods', 'Viewsets & Router routing', 'Token authentication integrations'], resources: ['DRF Docs', 'TestDriven.io Guides'] },
    { week: 'Week 6', topic: 'Testing & Production Deployments', details: ['Writing unit tests with PyTest', 'Dockerizing Python apps', 'Heroku/DigitalOcean deployments'], resources: ['Docker Web Guide', 'Django Security Checklist'] }
  ]
};

const classifyRoadmapTopic = (topic) => {
  const normalized = topic.toLowerCase();

  if (/\b(react|react\.js|reactjs)\b/.test(normalized) && !/\b(mern|full[-\s]?stack|node|express|mongodb)\b/.test(normalized)) {
    return 'react';
  }

  if (/\b(ai|a\.i\.|ml|machine learning|deep learning|artificial intelligence|llm|data science)\b/.test(normalized)) {
    return 'aiMl';
  }

  if (/\b(mern|full[-\s]?stack|node|express|mongodb)\b/.test(normalized)) {
    return 'mern';
  }

  if (/\b(python|django)\b/.test(normalized)) {
    return 'python';
  }

  return 'custom';
};

const normalizeRoadmapData = (roadmapData, topic) => {
  if (!Array.isArray(roadmapData) || roadmapData.length === 0) {
    throw new Error('Roadmap response was not a valid array');
  }

  return roadmapData.slice(0, 8).map((week, index) => ({
    week: week.week || `Week ${index + 1}`,
    topic: week.topic || `${topic} - Week ${index + 1}`,
    details: Array.isArray(week.details) ? week.details.slice(0, 5) : [],
    resources: Array.isArray(week.resources) ? week.resources.slice(0, 4) : []
  }));
};

const buildCustomRoadmap = (topic) => [
  { week: 'Week 1', topic: `${topic} Foundations`, details: [`Understand what ${topic} is used for`, 'Install the required tools', 'Build the smallest working example'], resources: [`Official ${topic} documentation`, `${topic} beginner guide`] },
  { week: 'Week 2', topic: `Core ${topic} Concepts`, details: ['Learn the most-used terminology', 'Practice the core workflow', 'Create notes from examples you can explain'], resources: [`${topic} fundamentals course`, 'Official examples'] },
  { week: 'Week 3', topic: `Hands-on ${topic} Practice`, details: ['Build two small exercises', 'Debug common beginner mistakes', 'Compare your solution with accepted patterns'], resources: [`${topic} practice projects`, 'GitHub example repositories'] },
  { week: 'Week 4', topic: `Intermediate ${topic}`, details: ['Learn common architecture patterns', 'Use libraries or tools used in real projects', 'Refactor an earlier exercise'], resources: [`Intermediate ${topic} guide`, 'Community best practices'] },
  { week: 'Week 5', topic: `${topic} Project Build`, details: ['Choose a realistic project scope', 'Implement the core feature set', 'Document tradeoffs and known limitations'], resources: [`${topic} project tutorial`, 'Code review checklist'] },
  { week: 'Week 6', topic: `Polish, Test & Share`, details: ['Add tests or validation checks', 'Improve usability and performance', 'Publish your project and write a short case study'], resources: ['Testing documentation', 'Deployment guide'] }
];

const normalizeEducation = (education) => {
  if (Array.isArray(education)) {
    return education
      .filter(item => item?.degree || item?.institution || item?.year)
      .map(item => [item.degree, item.institution, item.year].filter(Boolean).join(' - '));
  }

  return education ? [education] : [];
};

const normalizeResumeProjects = (projects = []) => (
  Array.isArray(projects)
    ? projects
        .filter(project => project?.title || project?.name || project?.description || project?.githubUrl || project?.liveUrl || project?.link || project?.url)
        .map(project => ({
          name: project.name || project.title || '',
          title: project.title || project.name || '',
          role: project.role || project.techStack || '',
          link: project.link || project.url || project.githubUrl || project.liveUrl || '',
          githubUrl: project.githubUrl || '',
          liveUrl: project.liveUrl || '',
          description: project.description || ''
        }))
    : []
);

const extractJsonPayload = (text) => {
  let cleanJsonString = text.trim();
  if (cleanJsonString.startsWith('```')) {
    cleanJsonString = cleanJsonString.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
  }
  return cleanJsonString;
};

const shuffle = (items) => {
  const nextItems = [...items];
  for (let i = nextItems.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [nextItems[i], nextItems[j]] = [nextItems[j], nextItems[i]];
  }
  return nextItems;
};

const normalizeQuestionKey = (question = '') => question
  .toLowerCase()
  .replace(/[^a-z0-9+#.\s]/g, ' ')
  .replace(/\b(the|a|an|and|or|of|in|on|for|to|with|using|use|how|what|why|when|would|you|your|skill)\b/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const isSimilarQuestion = (question, acceptedQuestions) => {
  const key = normalizeQuestionKey(question);
  if (!key) return true;
  const words = new Set(key.split(' ').filter(word => word.length > 2));

  return acceptedQuestions.some(existing => {
    const existingKey = normalizeQuestionKey(existing.question);
    if (key === existingKey) return true;

    const existingWords = new Set(existingKey.split(' ').filter(word => word.length > 2));
    const overlap = [...words].filter(word => existingWords.has(word)).length;
    const smallerSetSize = Math.max(1, Math.min(words.size, existingWords.size));
    return overlap / smallerSetSize >= 0.72;
  });
};

const buildFallbackInterviewQuestions = (skillName) => {
  const scenario = shuffle(['dashboard', 'booking flow', 'chat module', 'profile editor', 'analytics panel', 'notification feature'])[0];
  const technical = shuffle([
    `In a ${scenario}, how would you use ${skillName} to design data flow, state ownership, and error recovery?`,
    `A ${skillName} feature is slow after deployment. Which metrics, logs, or profiling steps would you check first, and why?`,
    `Compare two practical patterns in ${skillName}. Give one situation where each pattern is the better choice.`,
    `You find a bug that only appears for some users in a ${skillName} project. Walk through your debugging plan from reproduction to fix.`,
    `How would you make a ${skillName}-based feature secure against invalid input, permission mistakes, or misuse?`,
    `Design a test strategy for a ${skillName} feature, including unit, integration, and edge-case checks.`,
    `What tradeoffs would you consider before refactoring an existing ${skillName} codebase under a deadline?`,
    `Explain one advanced ${skillName} concept through a real implementation example, including a failure mode.`
  ]).slice(0, 3);

  const behavioral = shuffle([
    'Tell me about a time you improved technical work after critical feedback. What exactly changed?',
    'Describe a project where requirements were unclear. How did you clarify scope and communicate tradeoffs?',
    'Tell me about a time you were blocked by a bug or missing knowledge. How did you move forward honestly?',
    'Describe a situation where you disagreed on a technical decision. How did you handle the discussion?',
    'Tell me about a time you had to explain a technical decision to a non-technical teammate.',
    'Describe a deadline pressure moment. How did you protect quality while still shipping something useful?'
  ]).slice(0, 2);

  return [...technical.map((question, index) => ({
    id: index + 1,
    type: 'Technical',
    question
  })), ...behavioral.map((question, index) => ({
    id: index + 4,
    type: 'Behavioral',
    question
  }))];
};

const normalizeQuestions = (questions, skillName) => {
  const seen = new Set();
  const accepted = [];
  const normalized = (Array.isArray(questions) ? questions : [])
    .map((item, index) => ({
      id: Number(item?.id) || index + 1,
      type: /behavio|hr/i.test(item?.type || '') ? 'Behavioral' : 'Technical',
      question: String(item?.question || '').trim()
    }))
    .filter(item => {
      const key = normalizeQuestionKey(item.question);
      if (item.question.length < 20 || seen.has(key) || isSimilarQuestion(item.question, accepted)) return false;
      seen.add(key);
      accepted.push(item);
      return true;
    });

  const fallback = buildFallbackInterviewQuestions(skillName);
  const technical = [...normalized.filter(q => q.type === 'Technical'), ...fallback.filter(q => q.type === 'Technical')]
    .filter((question, index, list) => !list.slice(0, index).some(existing => isSimilarQuestion(question.question, [existing])))
    .slice(0, 3);
  const behavioral = [...normalized.filter(q => q.type === 'Behavioral'), ...fallback.filter(q => q.type === 'Behavioral')]
    .filter((question, index, list) => !list.slice(0, index).some(existing => isSimilarQuestion(question.question, [existing])))
    .slice(0, 2);

  if (technical.length < 3 || behavioral.length < 2) {
    return buildFallbackInterviewQuestions(skillName);
  }

  return [...technical, ...behavioral].map((question, index) => ({ ...question, id: index + 1 }));
};

const genericPositivePatterns = [
  /\b(good|great|nice|excellent|awesome|best|perfect|ok|okay|yes|no)\b/gi,
  /\b(i know|i can do|i will do|i am good|hard work|team player)\b/gi
];

const scoreSingleAnswer = (answer) => {
  const text = String(answer.userResponse || '').trim();
  const words = text.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words.map(word => word.toLowerCase().replace(/[^a-z0-9+#.]/gi, ''))).size;
  const hasGibberish = words.some(word => /(.)\1{3,}/.test(word) || /^[^a-z0-9]+$/i.test(word));
  const genericMatches = genericPositivePatterns.reduce((count, pattern) => count + (text.match(pattern) || []).length, 0);
  const hasSpecificSignal = /because|for example|tradeoff|test|debug|measure|error|state|api|database|security|performance|component|function|class|memory|async|cache|index|schema|hook|render|route|server|client/i.test(text);

  let score = 0;
  if (words.length >= 12) score += 20;
  if (words.length >= 30) score += 15;
  if (words.length >= 60) score += 10;
  if (uniqueWords >= Math.min(10, Math.floor(words.length * 0.55))) score += 10;
  if (hasSpecificSignal) score += 25;
  if (/for example|for instance|in my project|i would|i used|first|then|finally/i.test(text)) score += 10;
  if (/test|metric|benchmark|logs|profil|unit|integration|edge case/i.test(text)) score += 10;

  if (words.length < 8) score = Math.min(score, 15);
  if (hasGibberish) score = Math.min(score, 10);
  if (genericMatches >= 3 && !hasSpecificSignal) score = Math.min(score, 25);

  return Math.max(0, Math.min(100, score));
};

const buildFallbackEvaluation = (answers) => {
  const perQuestion = answers.map((answer, index) => ({
    questionId: answer.questionId || index + 1,
    questionText: answer.questionText,
    score: scoreSingleAnswer(answer),
    feedback: ''
  }));

  const score = Math.round(perQuestion.reduce((sum, item) => sum + item.score, 0) / perQuestion.length);
  const lowEffortCount = perQuestion.filter(item => item.score <= 25).length;

  perQuestion.forEach((item) => {
    if (item.score <= 25) {
      item.feedback = 'Answer is too short, generic, or unrelated. Add specific concepts, reasoning, and an example.';
    } else if (item.score <= 55) {
      item.feedback = 'Some effort is visible, but the answer needs clearer technical depth and concrete evidence.';
    } else if (item.score <= 75) {
      item.feedback = 'Solid direction. Improve with sharper tradeoffs, testing details, and real-world constraints.';
    } else {
      item.feedback = 'Strong answer with useful structure and relevant detail.';
    }
  });

  return {
    score,
    verdict: score >= 75 ? 'Strong' : score >= 50 ? 'Needs polish' : 'Needs serious practice',
    strengths: score >= 50
      ? ['Some answers show relevant structure or topic awareness', 'You attempted to respond to the interview flow']
      : ['You completed the interview flow'],
    weaknesses: [
      lowEffortCount > 0 ? `${lowEffortCount} answer(s) look too short, generic, or random to grade positively` : 'Several answers need more specific examples',
      'Technical responses should explain reasoning, tradeoffs, edge cases, and validation steps'
    ],
    detailedFeedback: score < 35
      ? `Honest review: this attempt does not demonstrate interview-ready knowledge yet. The score is ${score}% because multiple answers were too short, generic, or not tied to the question.`
      : `Honest review: your score is ${score}%. The attempt has some useful signals, but stronger answers need topic-specific concepts, examples, and testing or debugging detail.`,
    suggestions: [
      'Use the structure: direct answer, why it matters, example, tradeoff, test or metric.',
      'Avoid one-line positive claims. Interview scoring now rewards evidence, not confidence words.',
      'For technical questions, mention concrete APIs, failure modes, and how you would verify the solution.'
    ],
    perQuestion
  };
};

// @desc    Get AI-suggested matches
// @route   GET /api/ai/match
// @access  Private
export const getAiMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate('skillsTeach.skill skillsLearn.skill');
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const teachSkillIds = currentUser.skillsTeach.map(s => s.skill._id.toString());
    const learnSkillIds = currentUser.skillsLearn.map(s => s.skill._id.toString());

    // 1. Suggest Mentors (Users who teach what I want to learn)
    const mentors = await User.find({
      role: 'User',
      _id: { $ne: currentUser._id },
      'skillsTeach.skill': { $in: learnSkillIds }
    }).populate('skillsTeach.skill skillsLearn.skill').limit(5);

    // 2. Suggest Learners (Users who want to learn what I teach)
    const learners = await User.find({
      role: 'User',
      _id: { $ne: currentUser._id },
      'skillsLearn.skill': { $in: teachSkillIds }
    }).populate('skillsTeach.skill skillsLearn.skill').limit(5);

    // Formulate scores based on shared interests & points
    const formatSuggestions = (list) => {
      return list.map(user => {
        let matchScore = 50; // Baseline score
        
        // Check shared interests
        const sharedInterests = user.interests.filter(i => currentUser.interests.includes(i));
        matchScore += sharedInterests.length * 10;
        
        // Experience level factors
        if (user.experienceLevel === 'Senior' || user.experienceLevel === 'Lead') {
          matchScore += 15;
        }

        // Add caps
        matchScore = Math.min(98, matchScore);

        return {
          user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            profileImage: user.profileImage,
            bio: user.bio,
            experienceLevel: user.experienceLevel,
            skillsTeach: user.skillsTeach,
            skillsLearn: user.skillsLearn,
            education: user.education,
            resumeFile: user.resumeFile,
            socialLinks: user.socialLinks,
            projects: user.projects,
            points: user.points,
            followersCount: user.followers?.length || 0,
            followingCount: user.following?.length || 0,
            isFollowing: (user.followers || []).some(id => id.toString() === currentUser._id.toString())
          },
          matchScore,
          sharedInterests
        };
      }).sort((a, b) => b.matchScore - a.matchScore);
    };

    res.status(200).json({
      success: true,
      mentors: formatSuggestions(mentors),
      learners: formatSuggestions(learners)
    });
  } catch (error) {
    console.error('AI Matching Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error generating AI matches' });
  }
};

// @desc    Generate AI learning roadmap
// @route   POST /api/ai/roadmap
// @access  Private
export const generateRoadmap = async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ success: false, message: 'Please specify a learning topic' });
  }

  try {
    let roadmapData = [];
    const normalizedTopic = topic.toLowerCase();

    const topicType = classifyRoadmapTopic(topic);
    const genAI = getGeminiClient();

    // Use Gemini if configured, else use fallbacks or smart algorithmic planner
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `
          Generate a focused 6-week learning curriculum for a student wanting to learn exactly this topic: "${topic}".
          Keep the roadmap tightly scoped to the requested topic. Do not expand React into MERN/full-stack unless the user explicitly asked for MERN/full-stack. Do not suggest Django for AI/ML unless the user explicitly asks for Django web development.
          Include prerequisites only as small review items inside Week 1 when they are truly required.
          Prefer modern, practical learning steps and project outcomes.
          Format your response as a strict JSON array of objects. Do not include markdown code block wrapper or any words outside the JSON array.
          The output must match this exact structure:
          [
            {
              "week": "Week 1",
              "topic": "Fundamental Concept Title",
              "details": ["Specific subtopic detail 1", "Specific subtopic detail 2", "Specific subtopic detail 3"],
              "resources": ["Specific online learning resource 1", "Specific online learning resource 2"]
            }
          ]
          Make details and resources highly practical, robust and educational.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        
        // Clean JSON formatting if Gemini wrapped it in markdown code blocks
        roadmapData = normalizeRoadmapData(JSON.parse(extractJsonPayload(responseText)), topic);
      } catch (geminiError) {
        console.warn('Gemini API Error, falling back to preconfigured roadmaps:', geminiError.message);
        roadmapData = FALLBACK_ROADMAPS[topicType] || buildCustomRoadmap(topic);
      }
    } else {
      // Offline fallback simulations
      roadmapData = FALLBACK_ROADMAPS[topicType] || buildCustomRoadmap(topic);
    }

    // Save newly generated roadmap
    const roadmap = await Roadmap.create({
      user: req.user._id,
      topic,
      roadmapData,
      progress: 0
    });

    res.status(201).json({ success: true, roadmap });
  } catch (error) {
    console.error('Roadmap Generation Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error generating learning roadmap' });
  }
};

export const updateRoadmap = async (req, res) => {
  const { id } = req.params;
  const { roadmapData, progress } = req.body;

  try {
    const roadmap = await Roadmap.findOne({ _id: id, user: req.user._id });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }

    if (Array.isArray(roadmapData)) {
      roadmap.roadmapData = roadmapData;
    }

    if (typeof progress === 'number') {
      roadmap.progress = Math.max(0, Math.min(100, progress));
    }

    await roadmap.save();
    res.status(200).json({ success: true, roadmap });
  } catch (error) {
    console.error('Roadmap Update Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating roadmap' });
  }
};

export const deleteRoadmap = async (req, res) => {
  const { id } = req.params;

  try {
    const roadmap = await Roadmap.findOneAndDelete({ _id: id, user: req.user._id });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }

    res.status(200).json({ success: true, message: 'Roadmap removed' });
  } catch (error) {
    console.error('Roadmap Delete Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error removing roadmap' });
  }
};

// @desc    Generate AI Resume details
// @route   POST /api/ai/resume
// @access  Private
export const generateResume = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('skillsTeach.skill skillsLearn.skill');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user reviews to extract testimonials
    const reviews = await Review.find({ reviewee: user._id }).limit(3);
    const testimonials = reviews.map(r => `"${r.feedback}" - Rating: ${r.rating}/5`);

    // Compile resume structured JSON
    const resumeData = {
      personalInfo: {
        name: user.name,
        email: user.email,
        bio: user.bio,
        socialLinks: user.socialLinks
      },
      summary: `A motivated ${user.experienceLevel}-level specialist in ${user.skillsTeach.map(s => s.skill.name).join(', ')}. Focused on mutual skill exchanges and continuous growth.`,
      experienceLevel: user.experienceLevel,
      skills: user.skillsTeach.map(s => ({ name: s.skill.name, level: s.level })),
      skillsLookingToLearn: user.skillsLearn.map(s => ({ name: s.skill.name, level: s.level })),
      education: normalizeEducation(user.education),
      resumeFile: user.resumeFile,
      projects: normalizeResumeProjects(user.projects),
      interests: user.interests,
      testimonials,
      earnedPoints: user.points
    };

    res.status(200).json({ success: true, resume: resumeData });
  } catch (error) {
    console.error('Resume Compilation Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error formulating resume data' });
  }
};

// @desc    AI Mock Interview Simulation questions
// @route   POST /api/ai/mock-interview/start
// @access  Private
export const startMockInterview = async (req, res) => {
  const { skillName } = req.body;

  if (!skillName) {
    return res.status(400).json({ success: false, message: 'Please specify a skill/topic for the interview' });
  }

  try {
    let questions = [];
    const genAI = getGeminiClient();
    const interviewSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `
          Generate exactly 5 fresh mock interview questions (3 Technical, 2 Behavioral) for an interview on: "${skillName}".
          Unique interview seed: ${interviewSeed}. Use this seed to vary scenario, wording, and concept coverage from previous runs.
          Make this set feel different from common generic interview lists by varying scenario, depth, and wording.
          Include at least one debugging/troubleshooting question and one design/tradeoff question.
          Avoid duplicate or near-duplicate questions, yes/no questions, and vague prompts such as "What is ${skillName}?".
          Do not ask two questions about the same concept, same scenario, or same expected answer.
          Format your response as a strict JSON array of objects. Do not include markdown code block wrapper or any words outside the JSON array.
          The output must match this exact structure:
          [
            {
              "id": 1,
              "type": "Technical",
              "question": "The actual question text here"
            }
          ]
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        
        questions = normalizeQuestions(JSON.parse(extractJsonPayload(responseText)), skillName);
      } catch (geminiError) {
        console.warn('Gemini API Error, creating algorithm questions:', geminiError.message);
      }
    }

    // Standard static questions fallbacks if Gemini not present/fails
    if (questions.length === 0) {
      questions = buildFallbackInterviewQuestions(skillName);
    }

    res.status(200).json({ success: true, questions });
  } catch (error) {
    console.error('Start Interview Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error starting mock interview session' });
  }
};

// @desc    AI Mock Interview Evaluation
// @route   POST /api/ai/mock-interview/evaluate
// @access  Private
export const evaluateInterview = async (req, res) => {
  const { answers } = req.body; // Array of { questionId, questionText, userResponse }

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ success: false, message: 'Please provide answers to evaluate' });
  }

  try {
    let evaluation = null;
    const genAI = getGeminiClient();

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `
          Evaluate the following interview responses as a strict, honest interviewer.
          Responses: ${JSON.stringify(answers)}
          
          Grade only the submitted answer quality. Do not reward confidence, positivity, or attempt completion.
          Penalize random typing, unrelated text, generic one-liners, copied buzzwords, and answers that do not address the question.
          Very short or meaningless answers should receive 0-20, weak generic answers 20-45, partially correct answers 45-70, and strong specific answers 70-100.
          Include per-question feedback and a clear verdict.
          Format your response as a strict JSON object. Do not include markdown code block wrapper or any words outside the JSON object.
          The output must match this exact structure:
          {
            "score": 85,
            "verdict": "Strong",
            "strengths": ["Clear technical explanations", "Patient structure"],
            "weaknesses": ["Missed explaining specific memory leak controls"],
            "detailedFeedback": "Overall feedback text",
            "suggestions": ["Brush up on thread handling", "Write shorter answers"],
            "perQuestion": [
              {
                "questionId": 1,
                "score": 80,
                "feedback": "Specific feedback for this answer"
              }
            ]
          }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        
        evaluation = JSON.parse(extractJsonPayload(responseText));
      } catch (geminiError) {
        console.warn('Gemini API Error during evaluation, running fallback grading:', geminiError.message);
      }
    }

    // Static fallback grading if Gemini not configured/fails
    if (!evaluation) {
      evaluation = buildFallbackEvaluation(answers);
    }

    const honestFallback = buildFallbackEvaluation(answers);
    const score = Number(evaluation.score);
    evaluation.score = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : honestFallback.score;

    if (honestFallback.score < 35 && evaluation.score > 40) {
      evaluation = {
        ...honestFallback,
        detailedFeedback: `${honestFallback.detailedFeedback} The automated AI grade was capped because the submitted answers contained too little reliable evidence.`
      };
    } else {
      evaluation.verdict = evaluation.verdict || (evaluation.score >= 75 ? 'Strong' : evaluation.score >= 50 ? 'Needs polish' : 'Needs serious practice');
      evaluation.perQuestion = Array.isArray(evaluation.perQuestion) && evaluation.perQuestion.length
        ? evaluation.perQuestion
        : honestFallback.perQuestion;
    }

    res.status(200).json({ success: true, evaluation });
  } catch (error) {
    console.error('Evaluate Interview Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error evaluating interview results' });
  }
};
