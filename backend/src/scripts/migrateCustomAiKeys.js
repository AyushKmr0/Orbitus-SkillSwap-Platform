import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import User from '../models/User.js';
import { encryptText } from '../utils/encryption.js';

const isApplyMode = process.argv.includes('--apply');
const isDryRun = process.argv.includes('--dry-run') || !isApplyMode;

async function runMigration() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/orbitus';
  console.log(`[CUSTOM AI KEY MIGRATION]: Connecting to MongoDB (${mongoUri})...`);

  await mongoose.connect(mongoUri);
  console.log(`[CUSTOM AI KEY MIGRATION]: Connected.`);
  console.log(`[MODE]: ${isApplyMode ? 'APPLY (Writing changes to DB)' : 'DRY RUN (Previewing only, no DB writes)'}`);

  const users = await User.find({
    customAiKey: { $exists: true, $ne: '' }
  }).select('_id email customAiKey customAiProvider');

  console.log(`[FOUND]: ${users.length} users with custom AI key field populated.`);

  let unencryptedCount = 0;
  let alreadyEncryptedCount = 0;

  for (const user of users) {
    if (user.customAiKey && !user.customAiKey.startsWith('enc:')) {
      unencryptedCount++;
      console.log(`  - User ${user._id} (${user.email}): Plaintext key found (${user.customAiKey.slice(0, 4)}...).`);

      if (isApplyMode) {
        user.customAiKey = encryptText(user.customAiKey);
        await user.save();
        console.log(`    -> [ENCRYPTED & SAVED]`);
      }
    } else if (user.customAiKey.startsWith('enc:')) {
      alreadyEncryptedCount++;
    }
  }

  console.log('\n--- MIGRATION SUMMARY ---');
  console.log(`Total checked:       ${users.length}`);
  console.log(`Already encrypted:   ${alreadyEncryptedCount}`);
  console.log(`Plaintext keys:      ${unencryptedCount}`);
  if (isDryRun && unencryptedCount > 0) {
    console.log('\nNotice: Run with --apply to encrypt these keys in the database.');
    console.log('Ensure you take a database backup before executing --apply.');
  }

  await mongoose.disconnect();
  console.log('[CUSTOM AI KEY MIGRATION]: Disconnected and finished.');
}

runMigration().catch((err) => {
  console.error('[MIGRATION ERROR]:', err);
  process.exit(1);
});
