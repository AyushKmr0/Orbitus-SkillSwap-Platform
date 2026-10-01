import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Import Models
import User from '../models/User.js';
import Skill from '../models/Skill.js';
import Message from '../models/Message.js';
import Session from '../models/Session.js';
import Review from '../models/Review.js';
import Certificate from '../models/Certificate.js';
import Resource from '../models/Resource.js';
import Notification from '../models/Notification.js';
import Leaderboard from '../models/Leaderboard.js';
import Badge from '../models/Badge.js';
import Roadmap from '../models/Roadmap.js';

dotenv.config();

const SKILLS_DATA = [
  // Programming & Tech
  { name: 'React.js', category: 'Programming & Tech', tags: ['Frontend', 'JavaScript', 'Web'], description: 'Building interactive modern web user interfaces using components, hooks, and virtual DOM.' },
  { name: 'Node.js & Express', category: 'Programming & Tech', tags: ['Backend', 'JavaScript', 'API'], description: 'Fast, scalable server-side JavaScript backends, RESTful APIs, and middleware development.' },
  { name: 'Python for Beginners', category: 'Programming & Tech', tags: ['Python', 'Coding', 'Automation'], description: 'Fundamentals of programming, data structures, automation scripting, and logic in Python.' },
  { name: 'TypeScript', category: 'Programming & Tech', tags: ['Frontend', 'JavaScript', 'Types'], description: 'Strict syntactical superset of JavaScript adding static typing, interfaces, and tooling.' },
  { name: 'Docker & Containers', category: 'Programming & Tech', tags: ['DevOps', 'Containers', 'Cloud'], description: 'Containerizing applications, Dockerfiles, compose multi-container orchestration, and deployment.' },
  { name: 'Redis & Caching', category: 'Programming & Tech', tags: ['Database', 'In-Memory', 'Cache'], description: 'In-memory key-value data store for high-performance caching, pub/sub, and session management.' },
  { name: 'Next.js & Fullstack React', category: 'Programming & Tech', tags: ['SSR', 'React', 'Fullstack'], description: 'Production React framework with server-side rendering, static site generation, and server actions.' },
  { name: 'PostgreSQL & Database Design', category: 'Programming & Tech', tags: ['SQL', 'Relational', 'Database'], description: 'Relational data modeling, ACID transactions, complex queries, and index optimization.' },
  { name: 'Kubernetes Fundamentals', category: 'Programming & Tech', tags: ['DevOps', 'Cloud', 'Orchestration'], description: 'Container orchestration, pods, deployments, services, ingress, and cluster management.' },
  { name: 'GraphQL APIs', category: 'Programming & Tech', tags: ['API', 'Query Language', 'Backend'], description: 'Schema design, queries, mutations, resolvers, and Apollo client/server integrations.' },
  { name: 'Cybersecurity Fundamentals', category: 'Programming & Tech', tags: ['Security', 'Ethical Hacking', 'Network'], description: 'Core principles of info security, OWASP top 10, penetration testing, and secure coding.' },

  // Languages & Speaking
  { name: 'Conversational Spanish', category: 'Languages & Speaking', tags: ['Spanish', 'Speaking', 'Conversation'], description: 'Practical day-to-day conversation, vocabulary, and grammar for travel and work.' },
  { name: 'Business English & Negotiation', category: 'Languages & Speaking', tags: ['English', 'Professional', 'Communication'], description: 'Professional corporate communication, pitch decks, interview skills, and email etiquette.' },
  { name: 'Japanese for Beginners (JLPT N5)', category: 'Languages & Speaking', tags: ['Japanese', 'Hiragana', 'Katakana'], description: 'Kana characters, basic daily greetings, grammar particles, and conversational basics.' },
  { name: 'French Fluency & Pronunciation', category: 'Languages & Speaking', tags: ['French', 'Accent', 'Fluency'], description: 'Mastering smooth pronunciation, liaison rules, idioms, and conversational French.' },
  { name: 'German Essentials (A1-A2)', category: 'Languages & Speaking', tags: ['German', 'Grammar', 'Speaking'], description: 'Sentence structure, noun genders, modal verbs, and everyday practical German.' },

  // Design & Creative Arts
  { name: 'UI/UX Design in Figma', category: 'Design & Creative Arts', tags: ['Design', 'Figma', 'UI/UX'], description: 'User interface components, wireframing, interactive prototyping, and design systems.' },
  { name: 'Graphic Design & Brand Identity', category: 'Design & Creative Arts', tags: ['Branding', 'Typography', 'Logo'], description: 'Logo creation, brand guidelines, color palettes, typography, and visual assets.' },
  { name: '3D Modeling with Blender', category: 'Design & Creative Arts', tags: ['3D', 'Blender', 'CGI'], description: 'Hard-surface modeling, sculpting, materials, lighting, and basic animation in Blender.' },
  { name: 'Motion Graphics with After Effects', category: 'Design & Creative Arts', tags: ['Animation', 'Motion', 'Video'], description: 'Keyframe animation, kinetic typography, transitions, and logo motion reveals.' },
  { name: 'Digital Illustration', category: 'Design & Creative Arts', tags: ['Art', 'Drawing', 'Digital'], description: 'Digital painting techniques, shading, character design, and brush fundamentals.' },

  // Business & Marketing
  { name: 'Product Management Fundamentals', category: 'Business & Marketing', tags: ['Product', 'Agile', 'Roadmaps'], description: 'User personas, discovery, PRDs, sprint planning, and product-market fit metrics.' },
  { name: 'Digital Marketing & SEO Growth', category: 'Business & Marketing', tags: ['Marketing', 'SEO', 'Growth'], description: 'Organic search ranking, keyword research, content funnels, and performance ads.' },
  { name: 'Startup Pitching & Fundraising', category: 'Business & Marketing', tags: ['Startup', 'Venture', 'Pitch'], description: 'Crafting investor pitch decks, financial storytelling, term sheets, and investor outreach.' },
  { name: 'Financial Modeling & Valuation', category: 'Business & Marketing', tags: ['Finance', 'Excel', 'Valuation'], description: 'Discounted cash flow, three-statement financial modeling, and company valuation.' },

  // Music & Instruments
  { name: 'Acoustic Guitar for Beginners', category: 'Music & Instruments', tags: ['Guitar', 'Acoustic', 'Chords'], description: 'Open chords, strumming rhythms, fingerpicking patterns, and song accompaniment.' },
  { name: 'Piano & Keyboard Essentials', category: 'Music & Instruments', tags: ['Piano', 'Keyboard', 'Scales'], description: 'Reading sheet music, major/minor scales, chord progressions, and two-hand independence.' },
  { name: 'Music Production in Ableton Live', category: 'Music & Instruments', tags: ['Ableton', 'Production', 'Beats'], description: 'Beat making, synth sound design, MIDI sequencing, mixing, and arrangement in Ableton.' },
  { name: 'Vocal Training & Breath Control', category: 'Music & Instruments', tags: ['Vocals', 'Singing', 'Pitch'], description: 'Diaphragmatic breathing, pitch accuracy, vocal range extension, and resonance.' },

  // Science & Academics
  { name: 'Calculus & Linear Algebra', category: 'Science & Academics', tags: ['Math', 'Calculus', 'Linear Algebra'], description: 'Derivatives, integrals, matrix transformations, eigenvalues, and vectors for STEM.' },
  { name: 'Data Analysis with Pandas', category: 'Science & Academics', tags: ['Data', 'Python', 'Analytics'], description: 'Data wrangling, cleaning, exploratory data analysis, and visualizations in Python.' },
  { name: 'Organic Chemistry Concepts', category: 'Science & Academics', tags: ['Chemistry', 'STEM', 'Science'], description: 'Reaction mechanisms, functional groups, stereochemistry, and synthesis pathways.' },

  // Health & Lifestyle
  { name: 'Mindfulness & Stress Management', category: 'Health & Lifestyle', tags: ['Mindfulness', 'Wellness', 'Meditation'], description: 'Evidence-based meditation, breathing exercises, and mental clarity practices.' },
  { name: 'Strength Training & Conditioning', category: 'Health & Lifestyle', tags: ['Fitness', 'Workout', 'Health'], description: 'Biomechanics of compound lifts, progressive overload, and hypertrophy program design.' },

  // General Learning
  { name: 'Public Speaking & Storytelling', category: 'General Learning', tags: ['Speaking', 'Confidence', 'Storytelling'], description: 'Overcoming stage fright, voice modulation, structuring memorable presentations.' },
  { name: 'Critical Thinking & Logic', category: 'General Learning', tags: ['Philosophy', 'Logic', 'Thinking'], description: 'Cognitive biases, formal argumentation, decision frameworks, and mental models.' }
];

const USERS_DATA = [
  {
    name: 'Aarav Sharma',
    username: 'aarav_sharma',
    email: 'aarav.sharma@example.com',
    profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    bio: 'Fullstack engineer & open-source contributor. Passionate about teaching modern React, Node.js, and clean code architecture.',
    experienceLevel: 'Senior',
    education: [{ degree: 'B.Tech in Computer Science', institution: 'IIT Delhi', year: 2021 }],
    socialLinks: { github: 'https://github.com/aaravsharma', linkedin: 'https://linkedin.com/in/aaravsharma', twitter: 'https://x.com/aarav_codes', website: 'https://aaravsharma.dev' },
    projects: [
      { title: 'DevFlow Kanban', description: 'Real-time collaborative task board built with React and WebSockets.', githubUrl: 'https://github.com/aaravsharma/devflow', liveUrl: 'https://devflow.example.com', featured: true }
    ],
    interests: ['React', 'TypeScript', 'System Design', 'Guitar'],
    points: 420,
    teachNames: ['React.js', 'Node.js & Express'],
    learnNames: ['Docker & Containers', 'Acoustic Guitar for Beginners']
  },
  {
    name: 'Maya Patel',
    username: 'maya_ux',
    email: 'maya.patel@example.com',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    bio: 'Lead Product Designer at a Fintech startup. I love transforming complex financial workflows into elegant, intuitive Figma prototypes.',
    experienceLevel: 'Lead',
    education: [{ degree: 'B.Des in Interaction Design', institution: 'NID Ahmedabad', year: 2020 }],
    socialLinks: { linkedin: 'https://linkedin.com/in/mayapatel', website: 'https://mayapatel.design' },
    projects: [
      { title: 'Apex Design System', description: 'Comprehensive design system token library with 100+ accessible components.', githubUrl: '', liveUrl: 'https://apexdesign.example.com', featured: true }
    ],
    interests: ['Figma', 'Typography', 'Spanish', 'Mindfulness'],
    points: 380,
    teachNames: ['UI/UX Design in Figma', 'Graphic Design & Brand Identity'],
    learnNames: ['Conversational Spanish', 'React.js']
  },
  {
    name: 'Elena Rostova',
    username: 'elena_polyglot',
    email: 'elena.rostova@example.com',
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    bio: 'Certified language instructor & polyglot fluent in 4 languages. Specializing in immersive conversational French and Spanish.',
    experienceLevel: 'Senior',
    education: [{ degree: 'M.A. in Applied Linguistics', institution: 'Sorbonne University', year: 2019 }],
    socialLinks: { linkedin: 'https://linkedin.com/in/elenarostova', twitter: 'https://x.com/elena_languages' },
    projects: [
      { title: 'LinguaSprint Podcast', description: 'Short daily audio exercises for conversational French and Spanish fluency.', liveUrl: 'https://linguasprint.example.com', featured: true }
    ],
    interests: ['Languages', 'Linguistics', 'Travel', 'Piano'],
    points: 350,
    teachNames: ['French Fluency & Pronunciation', 'Conversational Spanish'],
    learnNames: ['Piano & Keyboard Essentials', 'Digital Illustration']
  },
  {
    name: 'Marcus Johnson',
    username: 'marcus_devops',
    email: 'marcus.j@example.com',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: 'DevOps & Cloud Architect. Daily practitioner of Kubernetes, Docker containers, CI/CD pipelines, and Redis distributed architectures.',
    experienceLevel: 'Lead',
    education: [{ degree: 'B.S. in Software Engineering', institution: 'UT Austin', year: 2018 }],
    socialLinks: { github: 'https://github.com/marcusj-cloud', linkedin: 'https://linkedin.com/in/marcusj-cloud' },
    projects: [
      { title: 'KubeHelm Automator', description: 'Open-source CLI for automated Helm release canary deployments.', githubUrl: 'https://github.com/marcusj-cloud/kubehelm', featured: true }
    ],
    interests: ['Kubernetes', 'Docker', 'Redis', 'Public Speaking'],
    points: 490,
    teachNames: ['Docker & Containers', 'Kubernetes Fundamentals', 'Redis & Caching'],
    learnNames: ['Public Speaking & Storytelling', 'Conversational Spanish']
  },
  {
    name: 'Sophia Al-Mansoor',
    username: 'sophia_pm',
    email: 'sophia.m@example.com',
    profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    bio: 'Principal Product Manager. Helping early-stage founders refine value propositions, conduct user discovery, and structure product roadmaps.',
    experienceLevel: 'Senior',
    education: [{ degree: 'MBA', institution: 'INSEAD', year: 2021 }],
    socialLinks: { linkedin: 'https://linkedin.com/in/sophia-al-mansoor', twitter: 'https://x.com/sophiapm' },
    projects: [
      { title: 'ZeroToOne Discovery Framework', description: 'A structured template for running 30-minute founder problem interviews.', liveUrl: 'https://zerotoone.example.com', featured: true }
    ],
    interests: ['Product Management', 'Startups', 'Data Analysis', 'Yoga'],
    points: 310,
    teachNames: ['Product Management Fundamentals', 'Startup Pitching & Fundraising'],
    learnNames: ['Data Analysis with Pandas', 'Mindfulness & Stress Management']
  },
  {
    name: 'Kenji Takahashi',
    username: 'kenji_beats',
    email: 'kenji.t@example.com',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    bio: 'Electronic music producer and audio engineer. Teaching Ableton Live production, synthesis sound design, and Japanese language fundamentals.',
    experienceLevel: 'Mid',
    education: [{ degree: 'Audio Technology Degree', institution: 'Tokyo School of Music', year: 2022 }],
    socialLinks: { github: '', linkedin: 'https://linkedin.com/in/kenji-takahashi' },
    projects: [
      { title: 'Tokyo Lofi Soundpack', description: 'Over 200 royalty-free drum breaks and analog synth recordings.', liveUrl: 'https://kenjibeats.example.com', featured: true }
    ],
    interests: ['Ableton', 'Japanese', 'Sound Design', 'Next.js'],
    points: 290,
    teachNames: ['Music Production in Ableton Live', 'Japanese for Beginners (JLPT N5)'],
    learnNames: ['Next.js & Fullstack React', 'Python for Beginners']
  },
  {
    name: 'Devendra Rao',
    username: 'dev_rao',
    email: 'dev.rao@example.com',
    profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    bio: 'Backend & Data Engineer. Huge fan of PostgreSQL index tuning, database design, and GraphQL API construction.',
    experienceLevel: 'Mid',
    education: [{ degree: 'B.E. in Information Technology', institution: 'BITS Pilani', year: 2022 }],
    socialLinks: { github: 'https://github.com/devendra-rao', linkedin: 'https://linkedin.com/in/devendrarao' },
    projects: [
      { title: 'QueryInsight', description: 'PostgreSQL slow query log visualizer and indexing advisor.', githubUrl: 'https://github.com/devendra-rao/queryinsight', featured: true }
    ],
    interests: ['PostgreSQL', 'GraphQL', 'TypeScript', 'Piano'],
    points: 340,
    teachNames: ['PostgreSQL & Database Design', 'GraphQL APIs'],
    learnNames: ['Piano & Keyboard Essentials', 'UI/UX Design in Figma']
  },
  {
    name: 'Zoe Martin',
    username: 'zoe_creates',
    email: 'zoe.m@example.com',
    profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    bio: 'Motion designer & 3D artist. Creating branded title sequences, 3D product renders in Blender, and After Effects motion templates.',
    experienceLevel: 'Senior',
    education: [{ degree: 'B.F.A in Animation', institution: 'Savannah College of Art and Design', year: 2020 }],
    socialLinks: { website: 'https://zoemartin.art', linkedin: 'https://linkedin.com/in/zoemartincreative' },
    projects: [
      { title: 'Isometric Worlds 3D', description: 'Curated gallery of 12 detailed low-poly 3D worlds rendered in Blender Cycles.', liveUrl: 'https://zoemartin.art/isometric', featured: true }
    ],
    interests: ['Blender', 'After Effects', 'Illustration', 'Python'],
    points: 360,
    teachNames: ['3D Modeling with Blender', 'Motion Graphics with After Effects'],
    learnNames: ['Python for Beginners', 'Strength Training & Conditioning']
  },
  {
    name: 'Priya Nair',
    username: 'priya_math',
    email: 'priya.nair@example.com',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Mathematics educator & data analyst. Making Calculus, Linear Algebra, and exploratory data analysis intuitive and engaging.',
    experienceLevel: 'Mid',
    education: [{ degree: 'M.Sc. in Applied Mathematics', institution: 'IISc Bangalore', year: 2021 }],
    socialLinks: { github: 'https://github.com/priyanair-math', linkedin: 'https://linkedin.com/in/priyanairmath' },
    projects: [
      { title: 'Interactive Linear Transformations', description: 'Web-based visualizer showing matrix eigenvectors and coordinate projections.', githubUrl: 'https://github.com/priyanair-math/lin-trans', featured: true }
    ],
    interests: ['Math', 'Pandas', 'Python', 'Digital Marketing'],
    points: 275,
    teachNames: ['Calculus & Linear Algebra', 'Data Analysis with Pandas'],
    learnNames: ['Digital Marketing & SEO Growth', 'Public Speaking & Storytelling']
  },
  {
    name: 'Lucas Silva',
    username: 'lucas_coach',
    email: 'lucas.silva@example.com',
    profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    bio: 'Performance coach & fitness enthusiast. Certified in strength & conditioning, hypertrophy programming, and mindfulness habits.',
    experienceLevel: 'Junior',
    education: [{ degree: 'B.S. in Kinesiology', institution: 'University of Florida', year: 2023 }],
    socialLinks: { linkedin: 'https://linkedin.com/in/lucassilva-coach' },
    projects: [
      { title: 'LiftLog App', description: 'Minimalist progressive overload tracker for powerlifting and bodybuilding.', liveUrl: 'https://liftlog.example.com', featured: true }
    ],
    interests: ['Fitness', 'Mindfulness', 'Web Development'],
    points: 210,
    teachNames: ['Strength Training & Conditioning', 'Mindfulness & Stress Management'],
    learnNames: ['React.js', 'Node.js & Express']
  },
  {
    name: 'Clara Dupont',
    username: 'clara_dupont',
    email: 'clara.dupont@example.com',
    profileImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    bio: 'Professional classical pianist and piano pedagogue. Passionate about teaching music theory, two-hand independence, and ear training.',
    experienceLevel: 'Lead',
    education: [{ degree: 'Master of Music in Piano Performance', institution: 'Royal Academy of Music', year: 2019 }],
    socialLinks: { website: 'https://claradupontpiano.com', linkedin: 'https://linkedin.com/in/claradupont' },
    projects: [
      { title: 'Chopin Nocturne Masterclass', description: 'Detailed pedagogical breakdown of phrasing and rubato for intermediate pianists.', liveUrl: 'https://claradupontpiano.com/masterclass', featured: true }
    ],
    interests: ['Piano', 'German', 'Logic', 'Yoga'],
    points: 405,
    teachNames: ['Piano & Keyboard Essentials', 'German Essentials (A1-A2)'],
    learnNames: ['Critical Thinking & Logic', 'UI/UX Design in Figma']
  },
  {
    name: 'Rohan Mehta',
    username: 'rohan_fullstack',
    email: 'rohan.mehta@example.com',
    profileImage: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    bio: 'Next.js & TypeScript specialist. Building production web applications, exploring AI integrations, and mentoring aspiring developers.',
    experienceLevel: 'Mid',
    education: [{ degree: 'B.Tech in Computer Science', institution: 'VIT Vellore', year: 2022 }],
    socialLinks: { github: 'https://github.com/rohanmehta-dev', linkedin: 'https://linkedin.com/in/rohanmehta-dev' },
    projects: [
      { title: 'NextSaaS Boilerplate', description: 'Production-ready Next.js starter kit with auth, Stripe subscriptions, and shadcn/ui.', githubUrl: 'https://github.com/rohanmehta-dev/nextsaas', featured: true }
    ],
    interests: ['Next.js', 'TypeScript', 'Redis', 'Acoustic Guitar'],
    points: 330,
    teachNames: ['Next.js & Fullstack React', 'TypeScript'],
    learnNames: ['Redis & Caching', 'Acoustic Guitar for Beginners']
  }
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required in .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected successfully!');

    const shouldReset = process.argv.includes('--reset') || process.argv.includes('--force');

    if (shouldReset) {
      console.log('WARNING: --reset flag detected. Cleaning existing records...');
      await User.deleteMany({});
      await Skill.deleteMany({});
      await Message.deleteMany({});
      await Session.deleteMany({});
      await Review.deleteMany({});
      await Certificate.deleteMany({});
      await Resource.deleteMany({});
      await Notification.deleteMany({});
      await Leaderboard.deleteMany({});
      await Badge.deleteMany({});
      await Roadmap.deleteMany({});
      console.log('Cleaned database models successfully.');
    } else {
      console.log('SAFE SEED MODE: Existing users, sessions, chats, and custom data will be PRESERVED.');
      console.log('(To perform a full wipe and re-seed, run: npm run seed -- --reset)');
    }

    // 1. Seed or Upsert Skills
    console.log(`Syncing ${SKILLS_DATA.length} skills across all categories...`);
    const skillMap = new Map();
    for (const s of SKILLS_DATA) {
      const existing = await Skill.findOneAndUpdate(
        { name: s.name },
        { $setOnInsert: s },
        { upsert: true, new: true }
      );
      skillMap.set(existing.name, existing._id);
    }
    console.log(`Synced ${skillMap.size} skills in database.`);

    // 2. Seed Admin User (Safe)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@orbitus.com';
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      console.log('Creating default admin user...');
      let adminPassword = process.env.ADMIN_PASSWORD;
      let isAutoGenerated = false;

      if (!adminPassword) {
        adminPassword = crypto.randomBytes(6).toString('hex') + 'A1!';
        isAutoGenerated = true;
      }

      const adminUserData = {
        name: process.env.ADMIN_NAME || 'Orbitus Administrator',
        email: adminEmail,
        username: 'admin',
        password: adminPassword,
        role: 'Admin',
        profileImage: 'https://ui-avatars.com/api/?name=Orbitus+Admin&background=4f46e5&color=fff',
        bio: 'Platform administrator account for Orbitus SkillSwap.',
        skillsTeach: [],
        skillsLearn: [],
        socialLinks: { linkedin: '', github: '', twitter: '', website: '' },
        experienceLevel: 'Lead',
        education: [{ degree: 'Platform Administration', institution: 'Orbitus Core', year: 2024 }],
        interests: ['Platform management', 'Operations', 'Fullstack Architecture'],
        points: 1000,
        isVerified: true,
        dailyLoginTracker: new Date()
      };

      adminUser = await User.create(adminUserData);
      console.log(`Admin account created: ${adminEmail}`);
      if (isAutoGenerated) {
        console.log(`Admin Temporary Password: ${adminPassword}`);
      }
    } else {
      console.log(`Admin account already exists: ${adminEmail} (Preserved).`);
    }

    // 3. Seed Realistic Human Users (Safe)
    console.log(`Checking ${USERS_DATA.length} community members...`);
    const dummyPassword = 'Password123!';

    const createdUsers = [];
    for (const u of USERS_DATA) {
      const existingUser = await User.findOne({ email: u.email });
      if (existingUser) {
        createdUsers.push(existingUser);
        continue;
      }

      const skillsTeach = (u.teachNames || [])
        .map((name) => {
          const id = skillMap.get(name);
          return id ? { skill: id, level: 'Advanced' } : null;
        })
        .filter(Boolean);

      const skillsLearn = (u.learnNames || [])
        .map((name) => {
          const id = skillMap.get(name);
          return id ? { skill: id, level: 'Beginner' } : null;
        })
        .filter(Boolean);

      const userDoc = await User.create({
        name: u.name,
        username: u.username,
        email: u.email,
        password: dummyPassword,
        profileImage: u.profileImage,
        bio: u.bio,
        experienceLevel: u.experienceLevel,
        education: u.education,
        socialLinks: u.socialLinks,
        projects: u.projects,
        interests: u.interests,
        points: u.points,
        skillsTeach,
        skillsLearn,
        isVerified: true,
        dailyLoginTracker: new Date()
      });
      createdUsers.push(userDoc);
    }
    console.log(`Successfully verified ${createdUsers.length} community members.`);

    // 4. Seed Leaderboard Entries
    console.log('Creating leaderboard entries...');
    const allUsersForLeaderboard = [adminUser, ...createdUsers].sort((a, b) => b.points - a.points);
    const leaderboardDocs = allUsersForLeaderboard.map((usr, index) => ({
      user: usr._id,
      points: usr.points,
      weeklyRank: index + 1,
      monthlyRank: index + 1,
      allTimeRank: index + 1
    }));
    await Leaderboard.insertMany(leaderboardDocs);
    console.log('Leaderboard initialized with all users.');

    console.log('==================================================');
    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`Admin Email: ${adminEmail}`);
    if (isAutoGenerated) {
      console.log(`Auto-generated Admin Password: ${adminPassword}`);
      console.log('NOTE: Store this password securely or define ADMIN_PASSWORD in your backend/.env file');
    } else {
      console.log('Admin Password: [Configured via ADMIN_PASSWORD in backend/.env]');
    }
    console.log('Default community users password: Password123!');
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error('DATABASE SEEDING FAILED:', error);
    process.exit(1);
  }
};

seedDatabase();
