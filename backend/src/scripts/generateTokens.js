import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
  const { generateAccessToken } = await import('../modules/auth/auth.service.js');

  const admin = await User.findOne({ email: 'admin@orbitus.com' }).lean();
  let user = await User.findOne({ email: 'john@example.com' }).lean();
  if (!user) {
    user = await User.findOne({ email: { $ne: 'admin@orbitus.com' } }).lean();
  }

  if (!admin || !user) {
    console.error('Could not find admin or user in DB');
    process.exit(1);
  }

  const adminToken = generateAccessToken(admin._id.toString());
  const userToken = generateAccessToken(user._id.toString());

  const creds = {
    admin: {
      user: {
        _id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        profileImage: admin.profileImage,
        isProfileComplete: true
      },
      token: adminToken
    },
    user: {
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        profileImage: user.profileImage,
        isProfileComplete: true
      },
      token: userToken
    }
  };

  const targetPath = path.resolve(__dirname, '../../../scratch/test_tokens.json');
  fs.writeFileSync(targetPath, JSON.stringify(creds, null, 2));
  console.log('Credentials written to:', targetPath);
  console.log('Admin:', admin.email, 'Role:', admin.role);
  console.log('User:', user.email, 'Role:', user.role);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
