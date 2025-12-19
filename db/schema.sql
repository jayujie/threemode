-- 手指模态特征管理系统数据库设计

CREATE DATABASE IF NOT EXISTS finger_feature_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE finger_feature_db;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  real_name VARCHAR(50) NULL,
  email VARCHAR(100) NULL,
  phone VARCHAR(20) NULL,
  role ENUM('USER', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'USER',
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'DISABLED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 手指模态特征表
CREATE TABLE IF NOT EXISTS finger_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  fingerprint_path VARCHAR(255) NOT NULL,
  finger_joint_path VARCHAR(255) NOT NULL,
  finger_vein_path VARCHAR(255) NOT NULL,
  fingerprint_hash CHAR(64) NOT NULL,
  finger_joint_hash CHAR(64) NOT NULL,
  finger_vein_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_finger_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_fingerprint_hash (fingerprint_hash),
  INDEX idx_finger_joint_hash (finger_joint_hash),
  INDEX idx_finger_vein_hash (finger_vein_hash)
) ENGINE=InnoDB;

-- Python模态特征表（新增4图片识别系统）
CREATE TABLE IF NOT EXISTS python_finger_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  fingerprint_path VARCHAR(255) NOT NULL,
  vein_aug_path VARCHAR(255) NOT NULL,
  vein_bin_path VARCHAR(255) NOT NULL,
  knuckle_path VARCHAR(255) NOT NULL,
  fingerprint_hash CHAR(64) NOT NULL,
  vein_aug_hash CHAR(64) NOT NULL,
  vein_bin_hash CHAR(64) NOT NULL,
  knuckle_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_python_finger_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_python_features (user_id),
  INDEX idx_python_fingerprint_hash (fingerprint_hash),
  INDEX idx_python_vein_aug_hash (vein_aug_hash),
  INDEX idx_python_vein_bin_hash (vein_bin_hash),
  INDEX idx_python_knuckle_hash (knuckle_hash)
) ENGINE=InnoDB;

-- 审核记录表
CREATE TABLE IF NOT EXISTS audit_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  admin_id INT NOT NULL,
  action ENUM('APPROVE', 'REJECT') NOT NULL,
  reason VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 超级管理员操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- 注意：由于外键使用 ON DELETE SET NULL，这里必须允许为 NULL
  operator_id INT NULL,
  target_user_id INT NULL,
  operation_type VARCHAR(50) NOT NULL,
  before_data TEXT NULL,
  after_data TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_operator FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_log_target FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

