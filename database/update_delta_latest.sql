-- ClinicVIP Delta Update SQL (Chỉ cập nhật thay đổi mới nhất)
SET NAMES utf8mb4;

-- Cấu hình Cổng thông tin Sở Y tế TP.HCM
INSERT IGNORE INTO `settings` (`setting_key`, `setting_value`) VALUES ('health_department_url', '');
