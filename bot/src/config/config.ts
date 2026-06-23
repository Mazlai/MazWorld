import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['TOKEN', 'BOT_ID', 'API_URL', 'BOT_API_SECRET'] as const;
const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing environment variables:', missing);
  process.exit(1);
}

export const TOKEN          = process.env.TOKEN!;
export const BOT_ID         = process.env.BOT_ID!;
export const GUILD_ID       = process.env.GUILD_ID!;
export const API_URL        = process.env.API_URL!;
export const BOT_API_SECRET = process.env.BOT_API_SECRET!;
