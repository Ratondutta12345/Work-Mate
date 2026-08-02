import { pathToFileURL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import { config } from './config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function runSqlFile(connection, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8')
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !part.startsWith('--'))

  for (const statement of statements) {
    await connection.query(statement)
  }
}

export async function migrate() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  })

  try {
    await runSqlFile(connection, path.resolve(__dirname, '../sql/schema.sql'))
    await runSqlFile(connection, path.resolve(__dirname, '../sql/seed.sql'))
    console.log('Database migrated and seeded successfully.')
  } finally {
    await connection.end()
  }
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  migrate().catch((error) => {
    console.error('Migration failed:', error.message)
    process.exit(1)
  })
}
