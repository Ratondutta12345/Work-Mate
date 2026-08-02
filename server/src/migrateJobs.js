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

async function migrateJobs() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true,
  })

  try {
    if (!(await tableExists(connection, 'companies'))) {
      await connection.query(`
        CREATE TABLE companies (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          user_id BIGINT UNSIGNED NULL,
          name VARCHAR(200) NOT NULL,
          logo_url VARCHAR(500) NULL,
          website VARCHAR(300) NULL,
          description TEXT NULL,
          industry VARCHAR(120) NULL,
          company_size VARCHAR(60) NULL,
          headquarters VARCHAR(200) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_companies_user (user_id),
          CONSTRAINT fk_companies_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
        ) ENGINE=InnoDB
      `)
    }

    if (!(await tableExists(connection, 'employer_profiles'))) {
      await connection.query(`
        CREATE TABLE employer_profiles (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          user_id BIGINT UNSIGNED NOT NULL,
          company_id BIGINT UNSIGNED NULL,
          job_title VARCHAR(120) NULL,
          phone VARCHAR(40) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_employer_user (user_id),
          CONSTRAINT fk_employer_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          CONSTRAINT fk_employer_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL
        ) ENGINE=InnoDB
      `)
    }

    if (!(await tableExists(connection, 'job_seeker_profiles'))) {
      await connection.query(`
        CREATE TABLE job_seeker_profiles (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          user_id BIGINT UNSIGNED NOT NULL,
          headline VARCHAR(200) NULL,
          summary TEXT NULL,
          phone VARCHAR(40) NULL,
          location VARCHAR(200) NULL,
          city VARCHAR(100) NULL,
          state VARCHAR(100) NULL,
          country VARCHAR(100) NULL,
          zip_code VARCHAR(20) NULL,
          desired_salary VARCHAR(80) NULL,
          job_type_preference ENUM('full-time','part-time','contract','internship','remote','any') DEFAULT 'any',
          resume_text TEXT NULL,
          linkedin_url VARCHAR(300) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_seeker_user (user_id),
          CONSTRAINT fk_seeker_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `)
    }

    if (!(await tableExists(connection, 'resume_education'))) {
      await connection.query(`
        CREATE TABLE resume_education (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          profile_id BIGINT UNSIGNED NOT NULL,
          school VARCHAR(200) NOT NULL,
          degree VARCHAR(120) NULL,
          field_of_study VARCHAR(120) NULL,
          start_date DATE NULL,
          end_date DATE NULL,
          grade VARCHAR(40) NULL,
          description TEXT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          PRIMARY KEY (id),
          KEY idx_education_profile (profile_id),
          CONSTRAINT fk_education_profile FOREIGN KEY (profile_id) REFERENCES job_seeker_profiles (id) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `)
    }

    if (!(await tableExists(connection, 'resume_experience'))) {
      await connection.query(`
        CREATE TABLE resume_experience (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          profile_id BIGINT UNSIGNED NOT NULL,
          company VARCHAR(200) NOT NULL,
          title VARCHAR(160) NOT NULL,
          location VARCHAR(160) NULL,
          start_date DATE NULL,
          end_date DATE NULL,
          is_current TINYINT(1) NOT NULL DEFAULT 0,
          description TEXT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          PRIMARY KEY (id),
          KEY idx_experience_profile (profile_id),
          CONSTRAINT fk_experience_profile FOREIGN KEY (profile_id) REFERENCES job_seeker_profiles (id) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `)
    }

    if (!(await tableExists(connection, 'resume_skills'))) {
      await connection.query(`
        CREATE TABLE resume_skills (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          profile_id BIGINT UNSIGNED NOT NULL,
          skill_name VARCHAR(100) NOT NULL,
          proficiency ENUM('beginner','intermediate','advanced','expert') DEFAULT 'intermediate',
          PRIMARY KEY (id),
          KEY idx_skills_profile (profile_id),
          CONSTRAINT fk_skills_profile FOREIGN KEY (profile_id) REFERENCES job_seeker_profiles (id) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `)
    }

    if (!(await tableExists(connection, 'job_postings'))) {
      await connection.query(`
        CREATE TABLE job_postings (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          company_id BIGINT UNSIGNED NOT NULL,
          posted_by_user_id BIGINT UNSIGNED NOT NULL,
          title VARCHAR(200) NOT NULL,
          description TEXT NOT NULL,
          requirements TEXT NULL,
          responsibilities TEXT NULL,
          job_type ENUM('full-time','part-time','contract','internship','temporary','remote') NOT NULL DEFAULT 'full-time',
          experience_level ENUM('entry','mid','senior','lead','executive') DEFAULT 'mid',
          salary_min DECIMAL(12,2) NULL,
          salary_max DECIMAL(12,2) NULL,
          salary_period ENUM('hourly','monthly','yearly') DEFAULT 'yearly',
          location VARCHAR(200) NULL,
          city VARCHAR(100) NULL,
          state VARCHAR(100) NULL,
          country VARCHAR(100) NULL,
          is_remote TINYINT(1) NOT NULL DEFAULT 0,
          status ENUM('active','closed','draft') NOT NULL DEFAULT 'active',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_postings_company (company_id),
          KEY idx_postings_status (status),
          KEY idx_postings_location (city, state),
          CONSTRAINT fk_postings_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
          CONSTRAINT fk_postings_user FOREIGN KEY (posted_by_user_id) REFERENCES users (id) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `)
    }

    if (!(await tableExists(connection, 'job_applications'))) {
      await connection.query(`
        CREATE TABLE job_applications (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          job_posting_id BIGINT UNSIGNED NOT NULL,
          user_id BIGINT UNSIGNED NOT NULL,
          cover_letter TEXT NULL,
          resume_snapshot JSON NULL,
          status ENUM('applied','reviewed','interview','rejected','hired','withdrawn') NOT NULL DEFAULT 'applied',
          applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_application (job_posting_id, user_id),
          KEY idx_applications_user (user_id),
          KEY idx_applications_status (status),
          CONSTRAINT fk_applications_job FOREIGN KEY (job_posting_id) REFERENCES job_postings (id) ON DELETE CASCADE,
          CONSTRAINT fk_applications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `)
    }

    if (!(await tableExists(connection, 'saved_job_listings'))) {
      await connection.query(`
        CREATE TABLE saved_job_listings (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          user_id BIGINT UNSIGNED NOT NULL,
          job_posting_id BIGINT UNSIGNED NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_saved_listing (user_id, job_posting_id),
          CONSTRAINT fk_saved_listing_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          CONSTRAINT fk_saved_listing_job FOREIGN KEY (job_posting_id) REFERENCES job_postings (id) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `)
    }

    // Seed sample companies and jobs if empty
    const [existing] = await connection.query(`SELECT COUNT(*) AS c FROM job_postings`)
    if (Number(existing[0].c) === 0) {
      await connection.query(`
        INSERT INTO companies (name, website, description, industry, company_size, headquarters) VALUES
        ('Amazon.com, Inc.', 'https://amazon.com', 'Global e-commerce and cloud computing leader.', 'Technology', '10,000+', 'Seattle, WA'),
        ('The Walt Disney Company', 'https://disney.com', 'Entertainment and media company.', 'Entertainment', '10,000+', 'Burbank, CA'),
        ('Meta Platforms, Inc.', 'https://meta.com', 'Social technology company building the metaverse.', 'Technology', '10,000+', 'Menlo Park, CA'),
        ('Work Mate Labs', 'https://workmate.local', 'AI-powered career and content platform.', 'Technology', '51-200', 'Remote')
      `)
      await connection.query(`
        INSERT INTO job_postings (company_id, posted_by_user_id, title, description, requirements, responsibilities, job_type, experience_level, salary_min, salary_max, salary_period, location, city, state, country, is_remote, status)
        SELECT c.id, (SELECT id FROM users ORDER BY id LIMIT 1), j.title, j.description, j.requirements, j.responsibilities, j.job_type, j.experience_level, j.salary_min, j.salary_max, 'yearly', j.location, j.city, j.state, 'USA', j.is_remote, 'active'
        FROM companies c
        JOIN (
          SELECT 'Software Engineer' AS title, 'Amazon.com, Inc.' AS company_name,
            'Build scalable services for millions of customers worldwide.' AS description,
            'BS in CS or equivalent. 2+ years experience. Strong in Java or Python.' AS requirements,
            'Design, develop, and deploy production systems. Collaborate with cross-functional teams.' AS responsibilities,
            'full-time' AS job_type, 'mid' AS experience_level, 120000 AS salary_min, 180000 AS salary_max,
            'Seattle, WA' AS location, 'Seattle' AS city, 'WA' AS state, 0 AS is_remote
          UNION ALL SELECT 'Content Writer', 'Work Mate Labs',
            'Create engaging articles and marketing copy using AI-assisted workflows.',
            'Excellent writing skills. Portfolio required. Familiarity with SEO.',
            'Write blog posts, landing pages, and product descriptions.',
            'full-time', 'entry', 45000, 65000, 'Remote', 'Remote', 'CA', 1
          UNION ALL SELECT 'UX Designer', 'The Walt Disney Company',
            'Design magical digital experiences for Disney+ and related products.',
            '3+ years UX design. Figma proficiency. Portfolio required.',
            'Create wireframes, prototypes, and user flows. Conduct user research.',
            'full-time', 'mid', 90000, 130000, 'Burbank, CA', 'Burbank', 'CA', 0
          UNION ALL SELECT 'Data Analyst', 'Meta Platforms, Inc.',
            'Analyze product metrics and drive data-informed decisions.',
            'SQL, Python, statistics. Bachelor degree in quantitative field.',
            'Build dashboards, run A/B tests, present insights to stakeholders.',
            'full-time', 'entry', 85000, 115000, 'Menlo Park, CA', 'Menlo Park', 'CA', 0
          UNION ALL SELECT 'Frontend Developer', 'Work Mate Labs',
            'Build beautiful React interfaces for our AI and job search products.',
            'React, TypeScript, CSS. 1+ years experience.',
            'Implement UI components, integrate APIs, optimize performance.',
            'remote', 'mid', 70000, 95000, 'Remote', 'Remote', 'CA', 1
        ) j ON c.name = j.company_name
        WHERE EXISTS (SELECT 1 FROM users LIMIT 1)
      `)
    }

    console.log('Job platform migration applied successfully.')
  } finally {
    await connection.end()
  }
}

migrateJobs().catch((error) => {
  console.error('Job migration failed:', error.message)
  process.exit(1)
})
