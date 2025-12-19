-- 创建Python模态特征表
USE finger_feature_db;

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
