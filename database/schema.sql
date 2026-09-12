-- ClinicVIP Database Schema
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Drop & recreate
CREATE DATABASE IF NOT EXISTS clinicvip CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinicvip;

-- Banners
DROP TABLE IF EXISTS banners;
CREATE TABLE banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),
  image_url VARCHAR(500) NOT NULL,
  image_url_mobile VARCHAR(500),
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Specialties (needed before doctors FK)
DROP TABLE IF EXISTS specialties;
CREATE TABLE specialties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100) DEFAULT 'fa-stethoscope',
  image_url VARCHAR(500),
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Doctors
DROP TABLE IF EXISTS doctors;
CREATE TABLE doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  specialty_id INT,
  description TEXT,
  image_url VARCHAR(500),
  is_featured TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE SET NULL
);

-- Packages
DROP TABLE IF EXISTS packages;
CREATE TABLE packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(15,0) DEFAULT 0,
  image_url VARCHAR(500),
  features TEXT COMMENT 'JSON array',
  is_featured TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- News
DROP TABLE IF EXISTS news;
CREATE TABLE news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  excerpt TEXT,
  content LONGTEXT,
  image_url VARCHAR(500),
  category VARCHAR(100) DEFAULT 'Tin tức',
  is_active TINYINT(1) DEFAULT 1,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Appointments
DROP TABLE IF EXISTS appointments;
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  doctor_id INT,
  package_id INT,
  appointment_date DATE,
  appointment_time TIME,
  notes TEXT,
  status ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL
);

-- Admins
DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contacts
DROP TABLE IF EXISTS contacts;
CREATE TABLE contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  message TEXT,
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings (Logo, info, config)
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================
-- SEED DATA
-- =====================

-- Admin: admin / Admin@123
-- Hash generated with bcrypt rounds=10
INSERT INTO admins (username, password_hash) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Banners (using placeholder images)
INSERT INTO banners (title, subtitle, image_url, sort_order) VALUES
('Chăm Sóc Sức Khỏe Toàn Diện', 'Đội ngũ bác sĩ chuyên nghiệp, trang thiết bị hiện đại', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&h=700&fit=crop', 1),
('Gói Khám Sức Khỏe Ưu Đãi', 'Bảo vệ sức khỏe bản thân và gia đình với chi phí hợp lý', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1920&h=700&fit=crop', 2),
('Đội Ngũ Bác Sĩ Tận Tâm', 'Hơn 20 năm kinh nghiệm trong lĩnh vực y tế', 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1920&h=700&fit=crop', 3);

-- Specialties
INSERT INTO specialties (name, description, icon, image_url, sort_order) VALUES
('Tim Mạch', 'Chẩn đoán và điều trị các bệnh lý tim mạch với thiết bị hiện đại', 'fa-heart-pulse', 'https://images.unsplash.com/photo-1628348070889-cb656235b4eb?w=600&h=400&fit=crop', 1),
('Nhi Khoa', 'Chăm sóc sức khỏe toàn diện cho trẻ từ sơ sinh đến vị thành niên', 'fa-baby', 'https://images.unsplash.com/photo-1576765608866-5b51046452be?w=600&h=400&fit=crop', 2),
('Sản Phụ Khoa', 'Chăm sóc thai sản toàn diện: thai kỳ an toàn, sinh con và hậu sản', 'fa-venus', 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=600&h=400&fit=crop', 3),
('Ngoại Tổng Hợp', 'Phẫu thuật chỉnh hình hiện đại, xử lý chấn thương và bệnh lý ngoại khoa', 'fa-scalpel', 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&h=400&fit=crop', 4),
('Ung Bướu', 'Tầm soát, chẩn đoán và điều trị ung thư với phác đồ tiên tiến', 'fa-ribbon', 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=600&h=400&fit=crop', 5),
('Nội Tổng Hợp', 'Khám và điều trị các bệnh lý nội khoa, tư vấn sức khỏe định kỳ', 'fa-stethoscope', 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&h=400&fit=crop', 6);

-- Packages
INSERT INTO packages (name, description, price, image_url, features, is_featured, sort_order) VALUES
('Gói Khám Sức Khỏe Cơ Bản', 'Khám tổng quát định kỳ giúp phát hiện sớm các bệnh lý thường gặp', 500000, 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=600&fit=crop', '["Khám lâm sàng toàn diện","Xét nghiệm máu cơ bản","Đo huyết áp & điện tim","Tư vấn sức khỏe"]', 1, 1),
('Gói Tầm Soát Ung Thư Nam', 'Tầm soát nguy cơ ung thư và bệnh mạn tính cho nam giới', 2500000, 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop', '["Xét nghiệm máu toàn phần","Siêu âm bụng tổng quát","X-quang phổi","Xét nghiệm PSA","Nội soi dạ dày"]', 1, 2),
('Gói Tầm Soát Ung Thư Nữ', 'Chăm sóc sức khỏe phụ nữ với các xét nghiệm chuyên biệt', 2800000, 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&h=600&fit=crop', '["Siêu âm tuyến vú","Xét nghiệm HPV","PAP Smear","Xét nghiệm nội tiết","Siêu âm phụ khoa"]', 1, 3),
('Gói Khám Tim Mạch', 'Đánh giá toàn diện sức khỏe tim mạch với thiết bị hiện đại', 1500000, 'https://images.unsplash.com/photo-1628348070889-cb656235b4eb?w=800&h=600&fit=crop', '["Điện tim 12 chuyển đạo","Siêu âm tim","Xét nghiệm mỡ máu","Đo huyết áp 24h"]', 1, 4),
('Gói Tầm Soát Đột Quỵ', 'Sàng lọc nguy cơ đột quỵ với siêu âm và xét nghiệm chuyên sâu', 1800000, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop', '["Siêu âm Doppler mạch cảnh","MRI não bộ","Xét nghiệm đông máu","Tư vấn chuyên gia"]', 1, 5);

-- Doctors
INSERT INTO doctors (name, title, specialty_id, description, image_url, is_featured, sort_order) VALUES
('Nguyễn Văn An', 'TS. BS. CKII', 1, 'Bác sĩ chuyên khoa Tim Mạch với hơn 20 năm kinh nghiệm, từng tu nghiệp tại Pháp và Singapore.', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&h=800&fit=crop', 1, 1),
('Trần Thị Bình', 'ThS. BS. CKI', 2, 'Bác sĩ Nhi khoa tận tâm, chuyên điều trị các bệnh lý hô hấp và tiêu hóa ở trẻ em.', 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600&h=800&fit=crop', 1, 2),
('Lê Minh Cường', 'BS. CKII', 3, 'Chuyên gia Sản Phụ Khoa, có kinh nghiệm phong phú trong phẫu thuật nội soi và sinh mổ phức tạp.', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&h=800&fit=crop', 1, 3),
('Phạm Thị Dung', 'GS. TS. BS', 5, 'Giáo sư đầu ngành Ung Bướu, tham gia nhiều hội nghị y khoa quốc tế, chuyên gia điều trị ung thư vú.', 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=600&h=800&fit=crop', 1, 4);

-- News
INSERT INTO news (title, slug, excerpt, content, image_url, category) VALUES
('Phòng Khám VIP Khai Trương Thêm Cơ Sở Mới Tại Quận 7', 'phong-kham-vip-khai-truong-co-so-moi-quan-7', 'Phòng Khám VIP chính thức khai trương cơ sở thứ 2 tại Quận 7, TP.HCM với trang thiết bị y tế hiện đại bậc nhất.', '<p>Phòng Khám VIP chính thức khai trương cơ sở thứ 2 tại Quận 7, TP.HCM...</p>', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=630&fit=crop', 'Tin tức'),
('5 Dấu Hiệu Cảnh Báo Bạn Cần Đi Khám Tim Mạch Ngay', '5-dau-hieu-canh-bao-di-kham-tim-mach', 'Nhiều người bỏ qua các triệu chứng cảnh báo bệnh tim. Hãy cùng tìm hiểu 5 dấu hiệu quan trọng cần lưu ý.', '<p>Tim mạch là cơ quan quan trọng nhất của cơ thể...</p>', 'https://images.unsplash.com/photo-1628348070889-cb656235b4eb?w=1200&h=630&fit=crop', 'Sức khỏe'),
('Tầm Quan Trọng Của Việc Tầm Soát Ung Thư Định Kỳ', 'tam-quan-trong-tam-soat-ung-thu-dinh-ky', 'Phát hiện ung thư sớm có thể tăng tỷ lệ chữa khỏi lên đến 90%. Tìm hiểu tại sao bạn nên tầm soát định kỳ.', '<p>Ung thư là căn bệnh nguy hiểm nhưng hoàn toàn có thể điều trị...</p>', 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=1200&h=630&fit=crop', 'Sức khỏe');

-- Settings
INSERT INTO settings (setting_key, setting_value) VALUES
('clinic_logo', '/images/logo.svg'),
('clinic_slogan', 'Chăm sóc tận tâm');

SET FOREIGN_KEY_CHECKS = 1;
