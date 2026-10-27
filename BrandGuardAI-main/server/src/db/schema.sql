CREATE DATABASE IF NOT EXISTS brandguard_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE brandguard_db;

CREATE TABLE IF NOT EXISTS brands (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS guidelines (
  id VARCHAR(64) PRIMARY KEY,
  brand_id VARCHAR(64) NOT NULL,
  description TEXT,
  approved_slogans JSON,
  voice_and_tone JSON,
  preferred_words JSON,
  prohibited_words JSON,
  approved_facts JSON,
  restricted_claims JSON,
  required_disclaimers JSON,
  logo_rules JSON,
  brand_colors JSON,
  accessibility_requirements JSON,
  INDEX idx_brand (brand_id)
);

CREATE TABLE IF NOT EXISTS audits (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  campaign VARCHAR(255) NOT NULL,
  content_type VARCHAR(64) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  revised_content MEDIUMTEXT NOT NULL,
  reference_url TEXT,
  brand_id VARCHAR(64) NOT NULL,
  brand_name VARCHAR(255) NOT NULL,
  image_url MEDIUMTEXT,
  image_name VARCHAR(255),
  status VARCHAR(64) NOT NULL,
  risk_score INT NOT NULL,
  compliance_status VARCHAR(64) NOT NULL,
  summary TEXT,
  submitter VARCHAR(255) NOT NULL,
  reviewer VARCHAR(255),
  review_comment TEXT,
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL,
  audited_at VARCHAR(64),
  reviewed_at VARCHAR(64),
  simulated TINYINT(1) DEFAULT 1,
  INDEX idx_status (status),
  INDEX idx_brand (brand_id)
);

CREATE TABLE IF NOT EXISTS findings (
  id VARCHAR(64) PRIMARY KEY,
  audit_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  severity VARCHAR(32) NOT NULL,
  problematic_text TEXT,
  explanation TEXT,
  brand_rule TEXT,
  evidence TEXT,
  recommendation TEXT,
  suggested_fix TEXT,
  status VARCHAR(32) NOT NULL,
  simulated TINYINT(1) DEFAULT 1,
  INDEX idx_audit (audit_id)
);

CREATE TABLE IF NOT EXISTS revisions (
  id VARCHAR(64) PRIMARY KEY,
  audit_id VARCHAR(64) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  note TEXT,
  source VARCHAR(64) NOT NULL,
  created_at VARCHAR(64) NOT NULL,
  INDEX idx_audit (audit_id)
);

CREATE TABLE IF NOT EXISTS approval_events (
  id VARCHAR(64) PRIMARY KEY,
  audit_id VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  reviewer VARCHAR(255) NOT NULL,
  comment TEXT,
  created_at VARCHAR(64) NOT NULL,
  INDEX idx_audit (audit_id)
);
