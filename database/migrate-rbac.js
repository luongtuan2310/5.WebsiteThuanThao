const db = require('../models/db');

async function migrate() {
  try {
    console.log('Starting RBAC & Activity Logs migration...');

    // 1. Create roles table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255) NULL,
        permissions LONGTEXT NULL,
        is_system TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('-> Checked/Created roles table');

    // 2. Default permissions
    const allPermissions = [
      'dashboard.view',
      'banners.view', 'banners.create', 'banners.edit', 'banners.delete',
      'about.view', 'about.edit',
      'services.view', 'services.create', 'services.edit', 'services.delete', 'services.import_export',
      'packages.view', 'packages.create', 'packages.edit', 'packages.delete',
      'specialties.view', 'specialties.create', 'specialties.edit', 'specialties.delete',
      'doctors.view', 'doctors.create', 'doctors.edit', 'doctors.delete',
      'news.view', 'news.create', 'news.edit', 'news.delete',
      'appointments.view', 'appointments.edit', 'appointments.delete', 'appointments.notes',
      'contacts.view', 'contacts.edit', 'contacts.delete', 'contacts.notes',
      'settings.view', 'settings.edit',
      'users.view', 'users.create', 'users.edit', 'users.delete',
      'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
      'logs.view', 'logs.delete'
    ];

    const doctorPermissions = [
      'dashboard.view',
      'appointments.view', 'appointments.edit', 'appointments.notes',
      'doctors.view', 'specialties.view', 'services.view', 'packages.view'
    ];

    const receptionistPermissions = [
      'dashboard.view',
      'appointments.view', 'appointments.edit', 'appointments.notes',
      'contacts.view', 'contacts.edit', 'contacts.notes',
      'doctors.view', 'services.view', 'packages.view', 'news.view'
    ];

    const editorPermissions = [
      'dashboard.view',
      'banners.view', 'banners.create', 'banners.edit', 'banners.delete',
      'about.view', 'about.edit',
      'services.view', 'services.create', 'services.edit', 'services.delete', 'services.import_export',
      'packages.view', 'packages.create', 'packages.edit', 'packages.delete',
      'specialties.view', 'specialties.create', 'specialties.edit', 'specialties.delete',
      'doctors.view', 'doctors.create', 'doctors.edit', 'doctors.delete',
      'news.view', 'news.create', 'news.edit', 'news.delete'
    ];

    // Seed default roles if not exists
    const superAdminRole = await db.queryOne("SELECT id FROM roles WHERE code='superadmin'");
    if (!superAdminRole) {
      await db.execute(
        "INSERT INTO roles (name, code, description, permissions, is_system) VALUES (?, ?, ?, ?, 1)",
        ['Quản trị viên tối cao', 'superadmin', 'Toàn quyền quản trị và điều hành mọi chức năng trong hệ thống', JSON.stringify(allPermissions)]
      );
    }

    const docRole = await db.queryOne("SELECT id FROM roles WHERE code='doctor'");
    if (!docRole) {
      await db.execute(
        "INSERT INTO roles (name, code, description, permissions, is_system) VALUES (?, ?, ?, ?, 0)",
        ['Bác sĩ & Chuyên môn', 'doctor', 'Xem và cập nhật hồ sơ lịch hẹn, ghi chú khám bệnh, tra cứu thông tin chuyên khoa', JSON.stringify(doctorPermissions)]
      );
    }

    const recRole = await db.queryOne("SELECT id FROM roles WHERE code='receptionist'");
    if (!recRole) {
      await db.execute(
        "INSERT INTO roles (name, code, description, permissions, is_system) VALUES (?, ?, ?, ?, 0)",
        ['Lễ tân & CSKH', 'receptionist', 'Tiếp nhận, xử lý, xác nhận lịch hẹn khám và phản hồi các yêu cầu liên hệ từ bệnh nhân', JSON.stringify(receptionistPermissions)]
      );
    }

    const editRole = await db.queryOne("SELECT id FROM roles WHERE code='editor'");
    if (!editRole) {
      await db.execute(
        "INSERT INTO roles (name, code, description, permissions, is_system) VALUES (?, ?, ?, ?, 0)",
        ['Biên tập viên nội dung', 'editor', 'Quản lý bài viết tin tức, banner trang chủ, bảng giá và nội dung giới thiệu', JSON.stringify(editorPermissions)]
      );
    }
    console.log('-> Seeded default roles');

    // 3. Update admins table
    const adminCols = await db.query('DESCRIBE admins');
    const colNames = adminCols.map(c => c.Field);

    if (!colNames.includes('full_name')) {
      await db.execute("ALTER TABLE admins ADD COLUMN full_name VARCHAR(255) NULL AFTER username");
    }
    if (!colNames.includes('email')) {
      await db.execute("ALTER TABLE admins ADD COLUMN email VARCHAR(255) NULL AFTER full_name");
    }
    if (!colNames.includes('phone')) {
      await db.execute("ALTER TABLE admins ADD COLUMN phone VARCHAR(50) NULL AFTER email");
    }
    if (!colNames.includes('avatar')) {
      await db.execute("ALTER TABLE admins ADD COLUMN avatar VARCHAR(255) NULL AFTER phone");
    }
    if (!colNames.includes('role_id')) {
      await db.execute("ALTER TABLE admins ADD COLUMN role_id INT NULL AFTER avatar");
    }
    if (!colNames.includes('is_active')) {
      await db.execute("ALTER TABLE admins ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER role_id");
    }
    if (!colNames.includes('last_login')) {
      await db.execute("ALTER TABLE admins ADD COLUMN last_login DATETIME NULL AFTER is_active");
    }
    console.log('-> Updated admins table columns');

    // Link default admin to superadmin role
    const sRole = await db.queryOne("SELECT id FROM roles WHERE code='superadmin'");
    if (sRole) {
      await db.execute("UPDATE admins SET full_name='Quản trị viên hệ thống', role_id=?, is_active=1 WHERE id=1", [sRole.id]);
    }

    // 4. Create activity_logs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NULL,
        username VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        module VARCHAR(50) NOT NULL,
        target_id VARCHAR(100) NULL,
        description VARCHAR(500) NOT NULL,
        ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(255) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('-> Checked/Created activity_logs table');

    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  }
  process.exit(0);
}

migrate();
