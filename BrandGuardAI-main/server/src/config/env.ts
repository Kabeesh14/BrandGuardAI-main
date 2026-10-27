import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV?.trim() || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN?.trim() || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim() || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash',
  
  // Authentication Configuration
  AUTH_SECRET: process.env.AUTH_SECRET?.trim() || 'brandguard_ai_production_auth_secret_key_928174',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID?.trim() || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL?.trim() || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() || '',

  // MySQL Database Configuration
  MYSQL_HOST: process.env.MYSQL_HOST?.trim() || 'localhost',
  MYSQL_PORT: parseInt(process.env.MYSQL_PORT || '3306', 10),
  MYSQL_USER: process.env.MYSQL_USER?.trim() || 'root',
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || '',
  MYSQL_DATABASE: process.env.MYSQL_DATABASE?.trim() || 'brandguard_db',

  // MySQL SSL Configuration for Remote Cloud Databases
  MYSQL_SSL: process.env.MYSQL_SSL?.trim() || '',
  MYSQL_SSL_CA: process.env.MYSQL_SSL_CA?.trim() || '',
  MYSQL_SSL_CA_PATH: process.env.MYSQL_SSL_CA_PATH?.trim() || '',
  MYSQL_SSL_REJECT_UNAUTHORIZED: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED?.trim() !== 'false',
};
