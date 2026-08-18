/**
 * One-off script: promotes an existing registered account to role 'admin'.
 * Run this once, by hand, after the very first admin has registered
 * normally through /register — every promotion after that happens from
 * the in-app admin "manage users" screen instead.
 *
 * Usage:
 *   node scripts/promote-admin.js you@example.com
 *   node scripts/promote-admin.js +8801XXXXXXXXX
 *
 * Requires MONGODB_URI to be set (reads from .env.local automatically).
 */
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function main() {
  const identifier = process.argv[2];
  if (!identifier) {
    console.error('Usage: node scripts/promote-admin.js <email-or-phone>');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const isEmail = identifier.includes('@');
  const query = isEmail ? { email: identifier.toLowerCase() } : { phone: identifier };

  const result = await mongoose.connection.collection('users').findOneAndUpdate(
    query,
    { $set: { role: 'admin' } },
    { returnDocument: 'after' }
  );

  if (!result || !result.value) {
    console.error(`No user found matching "${identifier}". Register the account first, then run this script.`);
    process.exit(1);
  }

  console.log(`Promoted "${result.value.name}" (${result.value.email}) to role: admin`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
