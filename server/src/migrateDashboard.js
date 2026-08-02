import mysql from 'mysql2/promise'
import { config } from './config.js'

async function columnExists(connection, table, column) {
  const [rows] = await connection.query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [config.db.database, table, column],
  )
  return rows.length > 0
}

async function indexExists(connection, table, indexName) {
  const [rows] = await connection.query(
    `SELECT 1
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
     LIMIT 1`,
    [config.db.database, table, indexName],
  )
  return rows.length > 0
}

async function tableExists(connection, table) {
  const [rows] = await connection.query(
    `SELECT 1
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
     LIMIT 1`,
    [config.db.database, table],
  )
  return rows.length > 0
}

async function migrateDashboard() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true,
  })

  try {
    if (!(await columnExists(connection, 'tools', 'category'))) {
      await connection.query(
        `ALTER TABLE tools
         ADD COLUMN category ENUM('writing', 'image', 'resume', 'other')
         NOT NULL DEFAULT 'other' AFTER result_action`,
      )
    }

    await connection.query(
      `UPDATE tools SET category = 'writing' WHERE slug IN ('article-writer', 'title-generator')`,
    )
    await connection.query(
      `UPDATE tools SET category = 'image'
       WHERE slug IN ('image-generation', 'background-removal', 'object-removal')`,
    )
    await connection.query(
      `UPDATE tools SET category = 'resume' WHERE slug = 'resume-reviewer'`,
    )

    if (!(await columnExists(connection, 'tool_runs', 'title'))) {
      await connection.query(
        `ALTER TABLE tool_runs
         ADD COLUMN title VARCHAR(200) NULL AFTER tool_id`,
      )
    }
    if (!(await columnExists(connection, 'tool_runs', 'category'))) {
      await connection.query(
        `ALTER TABLE tool_runs
         ADD COLUMN category ENUM('writing', 'image', 'resume', 'other')
         NOT NULL DEFAULT 'other' AFTER title`,
      )
    }
    if (!(await columnExists(connection, 'tool_runs', 'result_action'))) {
      await connection.query(
        `ALTER TABLE tool_runs
         ADD COLUMN result_action ENUM('copy', 'download')
         NOT NULL DEFAULT 'copy' AFTER status`,
      )
    }
    if (!(await columnExists(connection, 'tool_runs', 'updated_at'))) {
      await connection.query(
        `ALTER TABLE tool_runs
         ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
         ON UPDATE CURRENT_TIMESTAMP AFTER created_at`,
      )
    }

    // Backfill existing runs from tools
    await connection.query(
      `UPDATE tool_runs tr
       JOIN tools t ON t.id = tr.tool_id
       SET tr.category = t.category,
           tr.result_action = t.result_action,
           tr.title = COALESCE(tr.title, LEFT(tr.input_text, 80))
       WHERE tr.user_id IS NOT NULL`,
    )

    if (!(await indexExists(connection, 'tool_runs', 'idx_tool_runs_user_created'))) {
      await connection.query(
        `CREATE INDEX idx_tool_runs_user_created ON tool_runs (user_id, created_at)`,
      )
    }
    if (!(await indexExists(connection, 'tool_runs', 'idx_tool_runs_user_category'))) {
      await connection.query(
        `CREATE INDEX idx_tool_runs_user_category ON tool_runs (user_id, category)`,
      )
    }

    if (!(await tableExists(connection, 'saved_jobs'))) {
      await connection.query(`
        CREATE TABLE saved_jobs (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          user_id BIGINT UNSIGNED NOT NULL,
          tool_run_id BIGINT UNSIGNED NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_saved_job (user_id, tool_run_id),
          CONSTRAINT fk_saved_jobs_user
            FOREIGN KEY (user_id) REFERENCES users (id)
            ON DELETE CASCADE,
          CONSTRAINT fk_saved_jobs_run
            FOREIGN KEY (tool_run_id) REFERENCES tool_runs (id)
            ON DELETE CASCADE
        ) ENGINE=InnoDB
      `)
    }

    if (!(await tableExists(connection, 'user_daily_stats'))) {
      await connection.query(`
        CREATE TABLE user_daily_stats (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          user_id BIGINT UNSIGNED NOT NULL,
          stat_date DATE NOT NULL,
          total_jobs INT UNSIGNED NOT NULL DEFAULT 0,
          writing_jobs INT UNSIGNED NOT NULL DEFAULT 0,
          image_jobs INT UNSIGNED NOT NULL DEFAULT 0,
          resume_jobs INT UNSIGNED NOT NULL DEFAULT 0,
          PRIMARY KEY (id),
          UNIQUE KEY uq_user_day (user_id, stat_date),
          CONSTRAINT fk_daily_stats_user
            FOREIGN KEY (user_id) REFERENCES users (id)
            ON DELETE CASCADE
        ) ENGINE=InnoDB
      `)
    }

    console.log('Dashboard migration applied successfully.')
  } finally {
    await connection.end()
  }
}

migrateDashboard().catch((error) => {
  console.error('Dashboard migration failed:', error.message)
  process.exit(1)
})
