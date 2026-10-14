import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import User from '../models/User.js';
import Follow from '../models/Follow.js';

const isApplyMode = process.argv.includes('--apply');
const isDryRun = process.argv.includes('--dry-run') || !isApplyMode;

async function runMigration() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/orbitus';
  console.log(`[FOLLOW DATA MIGRATION]: Connecting to MongoDB (${mongoUri})...`);

  await mongoose.connect(mongoUri);
  console.log(`[FOLLOW DATA MIGRATION]: Connected.`);
  console.log(`[MODE]: ${isApplyMode ? 'APPLY (Writing changes to DB)' : 'DRY RUN (Previewing only, no DB writes)'}`);

  const users = await User.find({
    $or: [
      { following: { $exists: true, $not: { $size: 0 } } },
      { followers: { $exists: true, $not: { $size: 0 } } }
    ]
  }).select('_id following followers').lean();

  console.log(`[FOUND]: ${users.length} users with non-empty following/followers arrays.`);

  let createdFollowCount = 0;
  let skippedDuplicates = 0;

  for (const user of users) {
    const followingIds = user.following || [];
    for (const targetId of followingIds) {
      if (!targetId) continue;
      const exists = await Follow.exists({ follower: user._id, following: targetId });
      if (exists) {
        skippedDuplicates++;
      } else {
        createdFollowCount++;
        console.log(`  - Missing Follow record: follower ${user._id} -> following ${targetId}`);

        if (isApplyMode) {
          await Follow.create({ follower: user._id, following: targetId }).catch((err) => {
            if (err.code !== 11000) {
              console.error(`    [ERROR CREATING FOLLOW RECORD]:`, err.message);
            }
          });
        }
      }
    }
  }

  console.log('\n--- FOLLOW MIGRATION SUMMARY ---');
  console.log(`Users scanned:         ${users.length}`);
  console.log(`Existing Follows:      ${skippedDuplicates}`);
  console.log(`New Follows needed:    ${createdFollowCount}`);
  if (isDryRun && createdFollowCount > 0) {
    console.log('\nNotice: Run with --apply to insert these missing Follow documents into MongoDB.');
    console.log('Ensure you take a database backup before executing --apply.');
  }

  await mongoose.disconnect();
  console.log('[FOLLOW DATA MIGRATION]: Disconnected and finished.');
}

runMigration().catch((err) => {
  console.error('[MIGRATION ERROR]:', err);
  process.exit(1);
});
