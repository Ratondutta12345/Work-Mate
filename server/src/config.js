import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootEnv = path.resolve(__dirname, '../../.env')
const serverEnv = path.resolve(__dirname, '../.env')

if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv })
else if (fs.existsSync(serverEnv)) dotenv.config({ path: serverEnv })
else dotenv.config()

export const config = {
  port: Number(process.env.PORT || 5000),
  jwtSecret: process.env.JWT_SECRET || 'workmate-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey:
    process.env.GEMINI_API_KEY || process.env.GEMINI_API || process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY || '',
  clipdropApiKey: process.env.CLIPDROP_API_KEY || '',
  cloudinaryCloudName:
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.COUDINARY_CLOUD_NAME ||
    process.env.CLOUD_NAME ||
    '',
  cloudinaryApiKey:
    process.env.CLOUDINARY_API_KEY || process.env.COUDINARY_API_KEY || '',
  cloudinaryApiSecret:
    process.env.CLOUDINARY_API_SECRET || process.env.COUDINARY_API_SECRET || '',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'workmate',
    password: process.env.DB_PASSWORD || 'workmate',
    database: process.env.DB_NAME || 'workmate',
  },
  mysqlRootPassword: process.env.MYSQL_ROOT_PASSWORD || '',
}
