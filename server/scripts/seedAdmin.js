import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDb from '../config/db.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const adminEmail = process.env.ADMIN_EMAIL || 'admin@bookstore.local';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin12345!';

async function seedAdmin() {
  await connectDb();
  console.log('Connected to MongoDB');

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: {
        passwordHash,
        role: 'admin'
      }
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true
    }
  );

  console.log(`Admin account ready: ${admin.email}`);
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seedAdmin().catch((err) => {
  console.error('Admin seeding failed:', err);
  process.exit(1);
});