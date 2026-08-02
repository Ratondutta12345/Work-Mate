import mysql from 'mysql2/promise'
import { config } from './config.js'
import { migrate } from './migrate.js'

async function setupDb() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: 'root',
    password: config.mysqlRootPassword,
    multipleStatements: true,
  })

  const dbName = mysql.escapeId(config.db.database)
  const userHost = `${mysql.escape(config.db.user)}@'localhost'`
  const password = mysql.escape(config.db.password)

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${dbName}
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )

    await connection.query(
      `CREATE USER IF NOT EXISTS ${userHost} IDENTIFIED BY ${password}`,
    )
    await connection.query(`ALTER USER ${userHost} IDENTIFIED BY ${password}`)
    await connection.query(
      `GRANT ALL PRIVILEGES ON ${dbName}.* TO ${userHost}`,
    )
    await connection.query('FLUSH PRIVILEGES')
    console.log(
      `Created database "${config.db.database}" and user "${config.db.user}".`,
    )
  } finally {
    await connection.end()
  }

  await migrate()
}

setupDb().catch((error) => {
  console.error('Database setup failed:', error.message)
  console.error(
    'Set MYSQL_ROOT_PASSWORD in .env to your MySQL root password, then run: npm run db:setup',
  )
  process.exit(1)
})
