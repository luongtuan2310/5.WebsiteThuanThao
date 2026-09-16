-- ClinicVIP Delta Update SQL (Chỉ cập nhật thay đổi mới nhất)
SET NAMES utf8mb4;

-- 1. Bảng Roles (Phân quyền)
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL UNIQUE,
  `description` varchar(255) DEFAULT NULL,
  `permissions` longtext DEFAULT NULL,
  `is_system` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.1 Khởi tạo các vai trò mẫu nếu chưa có
INSERT IGNORE INTO `roles` (`id`, `name`, `code`, `description`, `permissions`, `is_system`) VALUES
(1, 'Quản trị viên tối cao', 'superadmin', 'Toàn quyền quản trị và điều hành mọi chức năng trong hệ thống', '["dashboard.view","banners.view","banners.create","banners.edit","banners.delete","about.view","about.edit","services.view","services.create","services.edit","services.delete","services.import_export","packages.view","packages.create","packages.edit","packages.delete","specialties.view","specialties.create","specialties.edit","specialties.delete","doctors.view","doctors.create","doctors.edit","doctors.delete","news.view","news.create","news.edit","news.delete","appointments.view","appointments.edit","appointments.delete","appointments.notes","contacts.view","contacts.edit","contacts.delete","contacts.notes","settings.view","settings.edit","users.view","users.create","users.edit","users.delete","roles.view","roles.create","roles.edit","roles.delete","logs.view","logs.delete"]', 1),
(2, 'Bác sĩ & Chuyên môn', 'doctor', 'Xem và cập nhật hồ sơ lịch hẹn, ghi chú khám bệnh, tra cứu thông tin chuyên khoa', '["dashboard.view","appointments.view","appointments.edit","appointments.notes","doctors.view","specialties.view","services.view","packages.view"]', 0),
(3, 'Lễ tân & CSKH', 'receptionist', 'Tiếp nhận, xử lý, xác nhận lịch hẹn khám và phản hồi các yêu cầu liên hệ từ bệnh nhân', '["dashboard.view","appointments.view","appointments.edit","appointments.notes","contacts.view","contacts.edit","contacts.notes","doctors.view","services.view","packages.view","news.view"]', 0),
(4, 'Biên tập viên nội dung', 'editor', 'Quản lý bài viết tin tức, banner trang chủ, bảng giá và nội dung giới thiệu', '["dashboard.view","banners.view","banners.create","banners.edit","banners.delete","about.view","about.edit","services.view","services.create","services.edit","services.delete","services.import_export","packages.view","packages.create","packages.edit","packages.delete","specialties.view","specialties.create","specialties.edit","specialties.delete","doctors.view","doctors.create","doctors.edit","doctors.delete","news.view","news.create","news.edit","news.delete"]', 0);

-- 2. Cập nhật bảng Admins (Thêm cột phân quyền, profile)
ALTER TABLE `admins` 
  ADD COLUMN IF NOT EXISTS `full_name` varchar(255) NULL AFTER `username`,
  ADD COLUMN IF NOT EXISTS `email` varchar(255) NULL AFTER `full_name`,
  ADD COLUMN IF NOT EXISTS `phone` varchar(50) NULL AFTER `email`,
  ADD COLUMN IF NOT EXISTS `avatar` varchar(255) NULL AFTER `phone`,
  ADD COLUMN IF NOT EXISTS `role_id` int(11) NULL AFTER `avatar`,
  ADD COLUMN IF NOT EXISTS `is_active` tinyint(1) DEFAULT 1 AFTER `role_id`,
  ADD COLUMN IF NOT EXISTS `last_login` datetime NULL AFTER `is_active`;

-- 2.1 Gán quyền Quản trị viên tối cao cho admin hiện tại
UPDATE `admins` SET `full_name` = IFNULL(`full_name`, 'Quản trị viên hệ thống'), `role_id` = 1, `is_active` = 1 WHERE `id` = 1 OR `username` = 'admin';

-- 3. Bảng Activity Logs (Nhật ký hoạt động)
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `action` varchar(50) NOT NULL,
  `module` varchar(50) NOT NULL,
  `target_id` varchar(100) DEFAULT NULL,
  `description` varchar(500) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng Page Views (Thống kê truy cập & biểu đồ Dashboard)
CREATE TABLE IF NOT EXISTS `page_views` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `page_path` varchar(255) NOT NULL,
  `page_title` varchar(255) DEFAULT NULL,
  `referrer` varchar(255) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `device_type` varchar(20) DEFAULT 'desktop',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_page_path` (`page_path`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Cập nhật bảng Appointments (Ghi chú quản trị viên)
ALTER TABLE `appointments` 
  ADD COLUMN IF NOT EXISTS `admin_notes` text NULL AFTER `notes`;

-- 6. Cập nhật bảng Contacts (Trạng thái và Ghi chú quản trị viên)
ALTER TABLE `contacts` 
  ADD COLUMN IF NOT EXISTS `status` varchar(50) DEFAULT 'new' AFTER `message`,
  ADD COLUMN IF NOT EXISTS `admin_notes` text NULL AFTER `status`;

-- 7. Cấu hình Cổng thông tin Sở Y tế TP.HCM
INSERT IGNORE INTO `settings` (`setting_key`, `setting_value`) VALUES ('health_department_url', '');


