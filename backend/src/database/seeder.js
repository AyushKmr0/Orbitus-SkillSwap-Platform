import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

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

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected successfully!');

    // Clean current databases
    console.log('Cleaning existing records...');
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

    // 1. Seed Admin User Only
    console.log('Seeding admin user only...');

    const adminUserData = {
      name: 'Orbitus Administrator',
      email: 'admin@orbitus.com',
      password: 'password123', // Will be hashed by pre-save hook
      role: 'Admin',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Orbitus-Admin',
      bio: 'Platform administrator account for Orbitus.',
      skillsTeach: [],
      skillsLearn: [],
      socialLinks: {
        linkedin: '',
        github: '',
        twitter: '',
        website: ''
      },
      experienceLevel: 'Lead',
      education: 'Platform Admin',
      interests: ['Platform management', 'Operations'],
      points: 1000,
      isVerified: true,
      dailyLoginTracker: new Date()
    };

    const [adminUser] = await User.create([adminUserData]);
    console.log('Admin account created: admin@orbitus.com');

    await Leaderboard.create({
      user: adminUser._id,
      points: adminUser.points,
      weeklyRank: 1,
      monthlyRank: 1,
      allTimeRank: 1
    });
    console.log('Admin leaderboard entry created.');

    console.log('==================================================');
    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('System is ready with a single admin account.');
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error('DATABASE SEEDING FAILED:', error);
    process.exit(1);
  }
};

seedDatabase();
