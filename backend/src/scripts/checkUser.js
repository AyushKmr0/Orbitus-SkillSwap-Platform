import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {}

async function run() {
  const mongoose = (await import('mongoose')).default;
  await mongoose.connect(process.env.MONGODB_URI);
  const User = (await import('../models/User.js')).default;
  const UserActivity = (await import('../models/UserActivity.js')).default;
  const Session = (await import('../models/Session.js')).default;
  const Post = (await import('../models/Post.js')).default;

  const users = await User.find({
    $or: [{ username: 'ayush' }, { name: /ayush/i }]
  });

  console.log('--- USERS MATCHING AYUSH ---');
  for (const u of users) {
    console.log({
      id: u._id.toString(),
      name: u.name,
      username: u.username,
      email: u.email,
      points: u.points,
      dailyLoginTracker: u.dailyLoginTracker,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    });

    const acts = await UserActivity.find({ user: u._id }).sort({ createdAt: -1 });
    console.log(`UserActivity count for ${u.username} (${u._id}):`, acts.length);
    console.log(acts.map(a => ({
      id: a._id.toString(),
      type: a.activityType,
      dateKey: a.dateKey,
      points: a.pointsAwarded,
      createdAt: a.createdAt,
      metadata: a.metadata,
      idempotencyKey: a.idempotencyKey
    })));

    const sessions = await Session.find({ $or: [{ mentor: u._id }, { mentee: u._id }, { learner: u._id }] });
    console.log(`Sessions count for ${u.username}:`, sessions.length);

    const posts = await Post.find({ user: u._id });
    console.log(`Posts count for ${u.username}:`, posts.length);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
