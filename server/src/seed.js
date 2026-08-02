import { pathToFileURL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import { config } from './config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function seed() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true,
  })

  try {
    const sql = fs.readFileSync(
      path.resolve(__dirname, '../sql/seed.sql'),
      'utf8',
    )
    await connection.query(sql)
    console.log('Seed data applied.')
  } finally {
    await connection.end()
  }
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  seed().catch((error) => {
    console.error('Seed failed:', error.message)
    process.exit(1)
  })
}
