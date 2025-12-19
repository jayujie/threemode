-- 迁移脚本：移除二值化相关字段
USE finger_feature_db;

-- 删除二值化相关索引（忽略不存在的情况）
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'finger_feature_db' AND table_name = 'finger_features' AND index_name = 'idx_finger_vein_binary_hash');
SET @sql := IF(@exist > 0, 'ALTER TABLE finger_features DROP INDEX idx_finger_vein_binary_hash', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 删除二值化相关字段（忽略不存在的情况）
SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'finger_feature_db' AND table_name = 'finger_features' AND column_name = 'finger_vein_binary_path');
SET @sql := IF(@exist > 0, 'ALTER TABLE finger_features DROP COLUMN finger_vein_binary_path', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'finger_feature_db' AND table_name = 'finger_features' AND column_name = 'finger_vein_binary_hash');
SET @sql := IF(@exist > 0, 'ALTER TABLE finger_features DROP COLUMN finger_vein_binary_hash', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
