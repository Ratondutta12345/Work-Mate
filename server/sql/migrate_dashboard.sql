USE workmate;

-- Tool categories for dashboard grouping
ALTER TABLE tools
  ADD COLUMN IF NOT EXISTS category ENUM('writing', 'image', 'resume', 'other')
    NOT NULL DEFAULT 'other' AFTER result_action;

UPDATE tools SET category = 'writing' WHERE slug IN ('article-writer', 'title-generator');
UPDATE tools SET category = 'image' WHERE slug IN ('image-generation', 'background-removal', 'object-removal');
UPDATE tools SET category = 'resume' WHERE slug = 'resume-reviewer';

-- Richer job history fields
ALTER TABLE tool_runs
  ADD COLUMN IF NOT EXISTS title VARCHAR(200) NULL AFTER tool_id,
  ADD COLUMN IF NOT EXISTS category ENUM('writing', 'image', 'resume', 'other')
    NOT NULL DEFAULT 'other' AFTER title,
  ADD COLUMN IF NOT EXISTS result_action ENUM('copy', 'download')
    NOT NULL DEFAULT 'copy' AFTER status,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

CREATE INDEX IF NOT EXISTS idx_tool_runs_user_created ON tool_runs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_runs_user_category ON tool_runs (user_id, category);
CREATE INDEX IF NOT EXISTS idx_tool_runs_user_tool ON tool_runs (user_id, tool_id);

-- Saved / favorite jobs for profile
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

-- Daily activity counters (optional rollup for overview charts)
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
