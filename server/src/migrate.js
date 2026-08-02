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
  // Connect without a database first, since the target database may not
  // exist yet. Explicitly create it here rather than relying solely on the
  // "CREATE DATABASE IF NOT EXISTS" / "USE" statements inside schema.sql,
  // since those depend on the same connection carrying the session state
  // and can otherwise fail with "Unknown database" on a fresh MySQL
  // instance (e.g. a newly provisioned Railway MySQL service).
  const bootstrapConnection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  })

  try {
    await bootstrapConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
  } finally {
    await bootstrapConnection.end()
  }

  // Now that the database is guaranteed to exist, reconnect with it
  // selected explicitly so every subsequent statement runs against it.
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
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
