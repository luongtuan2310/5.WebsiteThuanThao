-- ClinicVIP Database Export for Cloud Hosting Deployment
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('clinic_address', '123 Đường Nguyễn Thị Minh Khai, Quận 1, TP.HCM', '2026-09-04 15:24:30');
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('clinic_email', 'contactus.tamthientam@gmail.com', '2026-09-04 15:27:30');
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('clinic_logo', '/uploads/banners/1788165256805-969559926.webp', '2026-08-31 08:34:17');
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('clinic_map_url', '', '2026-09-04 15:24:30');
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('clinic_name', 'Phòng khám đa khoa Tâm Thiện Tâm', '2026-09-04 15:24:30');
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('clinic_phone', '+84 28 3822 1234 (Cấp cứu), 0962834892 (YHCT)', '2026-09-04 15:28:04');
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('clinic_slogan', 'Chăm sóc tận tâm', '2026-08-31 03:26:16');
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('clinic_tax_code', '', '2026-09-04 15:24:30');
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('clinic_working_hours', 'Thứ 2 — Thứ 7: 7:00 — 17:00', '2026-09-04 15:24:30');
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('page_about', '{"greeting_badge":"Lời chào từ Phòng Khám VIP","main_title":"Đồng Hành Cùng Sức Khỏe Gia Đình Bạn","lead_text":"Chào mừng Quý khách đến với Phòng Khám VIP. Chúng tôi vinh hạnh được là người bạn đồng hành tin cậy trên hành trình chăm sóc và bảo vệ sức khỏe cho bạn cùng những người thân yêu.","mission_title":"Sứ Mệnh Của Chúng Tôi","mission_desc":"Mang đến dịch vụ y tế toàn diện, chuẩn mực và nhân văn. Chúng tôi đặt y đức, sự an toàn và trải nghiệm thoải mái của bệnh nhân làm kim chỉ nam trong mọi hoạt động khám và điều trị.","values":"Tận Tâm, Chuyên Nghiệp, Hiện Đại, Trách Nhiệm, Hihi","image_url":"/uploads/banners/1788166794999-434540928.webp"}', '2026-08-31 08:59:55');
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('primary_color', '#116600', '2026-09-04 15:28:25');
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('primary_dark', '#8a0029', '2026-09-04 15:28:57');
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('social_facebook', '#', '2026-09-04 15:24:30');
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('social_tiktok', '', '2026-09-04 15:24:30');
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('social_youtube', '#', '2026-09-04 15:24:30');
INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES ('social_zalo', '#', '2026-09-04 15:24:30');

DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admins` (`id`, `username`, `password_hash`, `created_at`) VALUES (1, 'admin', '$2a$10$55Wwg52kaIbFI8qDST8iieHF./23d6fmsl0HBGwxjDSkpmE7u0rqS', '2026-08-31 03:26:16');

DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(500) DEFAULT NULL,
  `image_url` varchar(500) NOT NULL,
  `image_url_mobile` varchar(500) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `content` text DEFAULT NULL,
  `content_title` varchar(500) DEFAULT NULL,
  `content_style` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `banners` (`id`, `title`, `subtitle`, `image_url`, `image_url_mobile`, `sort_order`, `is_active`, `created_at`, `content`, `content_title`, `content_style`) VALUES (4, 'Banner', '', '/uploads/banners/1788163806593-836503536.webp', NULL, 0, 1, '2026-08-31 08:10:07', '', '', '{"layout":{"position":"left","align":"left","box_bg":"transparent"},"layers":[]}');

DROP TABLE IF EXISTS `specialties`;
CREATE TABLE `specialties` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT 'fa-stethoscope',
  `image_url` varchar(500) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `specialties` (`id`, `name`, `description`, `icon`, `image_url`, `sort_order`, `is_active`, `created_at`) VALUES (1, 'Tim Mạch', 'Chẩn đoán và điều trị các bệnh lý tim mạch với thiết bị hiện đại', 'fa-heart-pulse', 'https://images.unsplash.com/photo-1628348070889-cb656235b4eb?w=600&h=400&fit=crop', 1, 1, '2026-08-31 03:26:16');
INSERT INTO `specialties` (`id`, `name`, `description`, `icon`, `image_url`, `sort_order`, `is_active`, `created_at`) VALUES (2, 'Nhi Khoa', 'Chăm sóc sức khỏe toàn diện cho trẻ từ sơ sinh đến vị thành niên', 'fa-baby', 'https://images.unsplash.com/photo-1576765608866-5b51046452be?w=600&h=400&fit=crop', 2, 1, '2026-08-31 03:26:16');
INSERT INTO `specialties` (`id`, `name`, `description`, `icon`, `image_url`, `sort_order`, `is_active`, `created_at`) VALUES (3, 'Sản Phụ Khoa', 'Chăm sóc thai sản toàn diện: thai kỳ an toàn, sinh con và hậu sản', 'fa-venus', 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=600&h=400&fit=crop', 3, 1, '2026-08-31 03:26:16');
INSERT INTO `specialties` (`id`, `name`, `description`, `icon`, `image_url`, `sort_order`, `is_active`, `created_at`) VALUES (4, 'Ngoại Tổng Hợp', 'Phẫu thuật chỉnh hình hiện đại, xử lý chấn thương và bệnh lý ngoại khoa', 'fa-scalpel', 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&h=400&fit=crop', 4, 1, '2026-08-31 03:26:16');
INSERT INTO `specialties` (`id`, `name`, `description`, `icon`, `image_url`, `sort_order`, `is_active`, `created_at`) VALUES (5, 'Ung Bướu', 'Tầm soát, chẩn đoán và điều trị ung thư với phác đồ tiên tiến', 'fa-ribbon', 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=600&h=400&fit=crop', 5, 1, '2026-08-31 03:26:16');
INSERT INTO `specialties` (`id`, `name`, `description`, `icon`, `image_url`, `sort_order`, `is_active`, `created_at`) VALUES (6, 'Nội Tổng Hợp', 'Khám và điều trị các bệnh lý nội khoa, tư vấn sức khỏe định kỳ', 'fa-stethoscope', 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&h=400&fit=crop', 6, 1, '2026-08-31 03:26:16');

DROP TABLE IF EXISTS `doctors`;
CREATE TABLE `doctors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `specialty_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `specialty_id` (`specialty_id`),
  CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `doctors` (`id`, `name`, `title`, `specialty_id`, `description`, `image_url`, `is_featured`, `is_active`, `sort_order`, `created_at`) VALUES (3, 'Lê Minh Cường', 'BS. CKII', 3, 'Chuyên gia Sản Phụ Khoa, có kinh nghiệm phong phú trong phẫu thuật nội soi và sinh mổ phức tạp.', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&h=800&fit=crop', 1, 1, 3, '2026-08-31 03:26:16');
INSERT INTO `doctors` (`id`, `name`, `title`, `specialty_id`, `description`, `image_url`, `is_featured`, `is_active`, `sort_order`, `created_at`) VALUES (4, 'Phạm Thị Dung', 'GS. TS. BS', 5, 'Giáo sư đầu ngành Ung Bướu, tham gia nhiều hội nghị y khoa quốc tế, chuyên gia điều trị ung thư vú.', 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=600&h=800&fit=crop', 1, 1, 4, '2026-08-31 03:26:16');

DROP TABLE IF EXISTS `packages`;
CREATE TABLE `packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(15,0) DEFAULT 0,
  `image_url` varchar(500) DEFAULT NULL,
  `features` text DEFAULT NULL COMMENT 'JSON array',
  `is_featured` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `services`;
CREATE TABLE `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `specialty_id` int(11) DEFAULT NULL,
  `specialty_name` varchar(255) DEFAULT NULL,
  `group_name` varchar(255) NOT NULL,
  `name` varchar(500) NOT NULL,
  `patient_type` varchar(100) DEFAULT 'Dịch vụ',
  `price` decimal(15,0) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `specialty_id` (`specialty_id`),
  CONSTRAINT `services_ibfk_1` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `services` (`id`, `specialty_id`, `specialty_name`, `group_name`, `name`, `patient_type`, `price`, `notes`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES (27, NULL, 'Nội Tổng Hợp', 'Khám Bệnh', 'Khám Nội Tổng Quát', 'Dịch vụ', '150000', 'Khám và tư vấn sức khỏe tổng thể', 0, 1, '2026-09-04 14:52:31', '2026-09-04 14:58:06');
INSERT INTO `services` (`id`, `specialty_id`, `specialty_name`, `group_name`, `name`, `patient_type`, `price`, `notes`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES (28, NULL, 'Nội Tổng Hợp', 'Khám Bệnh', 'Khám Nội Tổng Quát (BHYT)', 'BHYT', '42000', 'Áp dụng theo danh mục BHYT', 0, 1, '2026-09-04 14:52:31', '2026-09-04 14:58:06');
INSERT INTO `services` (`id`, `specialty_id`, `specialty_name`, `group_name`, `name`, `patient_type`, `price`, `notes`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES (29, NULL, 'Tim Mạch', 'Chẩn Đoán Hình Ảnh', 'Siêu Âm Tim Doppler Màu 4D', 'Dịch vụ', '450000', 'Đánh giá cấu trúc tim và lưu lượng máu', 0, 1, '2026-09-04 14:52:31', '2026-09-04 14:58:06');
INSERT INTO `services` (`id`, `specialty_id`, `specialty_name`, `group_name`, `name`, `patient_type`, `price`, `notes`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES (30, NULL, 'Nội Tổng Hợp', 'Xét Nghiệm', 'Tổng Phân Tích Tế Bào Máu Ngoại Vi', 'Dịch vụ', '120000', 'Đánh giá thiếu máu, nhiễm trùng', 0, 1, '2026-09-04 14:52:31', '2026-09-04 14:58:06');
INSERT INTO `services` (`id`, `specialty_id`, `specialty_name`, `group_name`, `name`, `patient_type`, `price`, `notes`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES (31, NULL, 'Cấp cứu', 'Cấp cứu', 'Cấp Cứu Ngoại Viện', 'Dịch vụ', '500000', '', 0, 1, '2026-09-04 14:52:31', '2026-09-04 14:59:14');

DROP TABLE IF EXISTS `news`;
CREATE TABLE `news` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(500) NOT NULL,
  `slug` varchar(500) NOT NULL,
  `excerpt` text DEFAULT NULL,
  `content` longtext DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `category` varchar(100) DEFAULT 'Tin tức',
  `is_active` tinyint(1) DEFAULT 1,
  `published_at` datetime DEFAULT current_timestamp(),
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `appointments`;
CREATE TABLE `appointments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  `appointment_date` date DEFAULT NULL,
  `appointment_time` time DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  `birthday` date DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `insurance` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `package_id` (`package_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `contacts`;
CREATE TABLE `contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
