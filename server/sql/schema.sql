-- Work Mate MySQL schema
CREATE DATABASE IF NOT EXISTS workmate
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE workmate;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NULL,
  avatar_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_providers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('email', 'google', 'facebook', 'apple', 'github', 'microsoft', 'x') NOT NULL,
  provider_user_id VARCHAR(190) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_provider_identity (provider, provider_user_id),
  KEY idx_auth_providers_user (user_id),
  CONSTRAINT fk_auth_providers_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tools (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(80) NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(16) NOT NULL,
  hint VARCHAR(255) NOT NULL,
  result_action ENUM('copy', 'download') NOT NULL DEFAULT 'copy',
  category ENUM('writing', 'image', 'resume', 'other') NOT NULL DEFAULT 'other',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tools_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tool_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  tool_id INT UNSIGNED NOT NULL,
  title VARCHAR(200) NULL,
  category ENUM('writing', 'image', 'resume', 'other') NOT NULL DEFAULT 'other',
  input_text MEDIUMTEXT NOT NULL,
  output_text MEDIUMTEXT NOT NULL,
  status ENUM('completed', 'failed') NOT NULL DEFAULT 'completed',
  result_action ENUM('copy', 'download') NOT NULL DEFAULT 'copy',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tool_runs_user (user_id),
  KEY idx_tool_runs_tool (tool_id),
  KEY idx_tool_runs_user_created (user_id, created_at),
  KEY idx_tool_runs_user_category (user_id, category),
  CONSTRAINT fk_tool_runs_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_tool_runs_tool
    FOREIGN KEY (tool_id) REFERENCES tools (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS saved_jobs (
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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_daily_stats (
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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS testimonials (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  quote TEXT NOT NULL,
  author_name VARCHAR(120) NOT NULL,
  company VARCHAR(160) NOT NULL,
  rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
  published_on DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token (token_hash),
  KEY idx_sessions_user (user_id),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
