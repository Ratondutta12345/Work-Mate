import mysql from 'mysql2/promise'
import { config } from './config.js'

async function tableExists(connection, table) {
  const [rows] = await connection.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`,
    [config.db.database, table],
  )
  return rows.length > 0
}

async function columnExists(connection, table, column) {
  const [rows] = await connection.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [config.db.database, table, column],
  )
  return rows.length > 0
}

async function migrateJobsProfiles() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true,
  })

  try {
    if (!(await tableExists(connection, 'application_status_history'))) {
      await connection.query(`
        CREATE TABLE application_status_history (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          application_id BIGINT UNSIGNED NOT NULL,
          old_status ENUM('applied','reviewed','interview','rejected','hired','withdrawn') NULL,
          new_status ENUM('applied','reviewed','interview','rejected','hired','withdrawn') NOT NULL,
          changed_by_user_id BIGINT UNSIGNED NULL,
          note TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_status_history_app (application_id),
          KEY idx_status_history_created (created_at),
          CONSTRAINT fk_status_history_app
            FOREIGN KEY (application_id) REFERENCES job_applications (id) ON DELETE CASCADE,
          CONSTRAINT fk_status_history_user
            FOREIGN KEY (changed_by_user_id) REFERENCES users (id) ON DELETE SET NULL
        ) ENGINE=InnoDB
      `)
    }

    if (!(await tableExists(connection, 'resume_files'))) {
      await connection.query(`
        CREATE TABLE resume_files (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          user_id BIGINT UNSIGNED NOT NULL,
          profile_id BIGINT UNSIGNED NULL,
          file_name VARCHAR(255) NOT NULL,
          file_url VARCHAR(500) NULL,
          file_size INT UNSIGNED NULL,
          mime_type VARCHAR(120) NULL,
          is_primary TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_resume_files_user (user_id),
          KEY idx_resume_files_profile (profile_id),
          CONSTRAINT fk_resume_files_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          CONSTRAINT fk_resume_files_profile FOREIGN KEY (profile_id) REFERENCES job_seeker_profiles (id) ON DELETE SET NULL
        ) ENGINE=InnoDB
      `)
    }

    const employerColumns = [
      ['department', 'VARCHAR(120) NULL'],
      ['bio', 'TEXT NULL'],
      ['linkedin_url', 'VARCHAR(300) NULL'],
      ['notification_email', 'VARCHAR(190) NULL'],
    ]
    for (const [col, def] of employerColumns) {
      if (!(await columnExists(connection, 'employer_profiles', col))) {
        await connection.query(`ALTER TABLE employer_profiles ADD COLUMN ${col} ${def}`)
      }
    }

    const seekerColumns = [
      ['resume_file_name', 'VARCHAR(255) NULL'],
      ['resume_file_url', 'VARCHAR(500) NULL'],
    ]
    for (const [col, def] of seekerColumns) {
      if (!(await columnExists(connection, 'job_seeker_profiles', col))) {
        await connection.query(`ALTER TABLE job_seeker_profiles ADD COLUMN ${col} ${def}`)
      }
    }

    // Backfill status history for existing applications
    const [missingHistory] = await connection.query(`
      SELECT ja.id, ja.status, ja.applied_at
      FROM job_applications ja
      LEFT JOIN application_status_history ash ON ash.application_id = ja.id
      WHERE ash.id IS NULL
    `)
    for (const row of missingHistory) {
      await connection.query(
        `INSERT INTO application_status_history (application_id, old_status, new_status, note)
         VALUES (?, NULL, ?, 'Initial application submitted')`,
        [row.id, row.status],
      )
    }

    console.log('Job profiles migration applied successfully.')
  } finally {
    await connection.end()
  }
}

migrateJobsProfiles().catch((error) => {
  console.error('Job profiles migration failed:', error.message)
  process.exit(1)
})
