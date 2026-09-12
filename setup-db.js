require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('====================================================');
  console.log('🚀 ĐANG TỰ ĐỘNG KHỞI TẠO CƠ SỞ DỮ LIỆU CLINICVIP...');
  console.log('====================================================');

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'clinicvip';

  try {
    // 1. Kết nối không cần chọn database trước
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    console.log('✅ Đã kết nối tới MySQL Server thành công.');

    // 2. Đọc file schema.sql
    const sqlPath = path.join(__dirname, 'database', 'schema.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Không tìm thấy file schema.sql tại: ${sqlPath}`);
    }
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log(`📦 Đang khởi tạo CSDL "${dbName}" và import dữ liệu mẫu...`);

    // 3. Thực thi toàn bộ lệnh SQL trong schema.sql
    await connection.query(sqlContent);

    console.log('====================================================');
    console.log('🎉 KHỞI TẠO DATABASE THÀNH CÔNG 100%!');
    console.log(`- CSDL:       ${dbName}`);
    console.log(`- Tài khoản:  admin`);
    console.log(`- Mật khẩu:   Admin@123`);
    console.log('====================================================');
    console.log('👉 Bây giờ bạn có thể nhấp đúp file "start.bat" để mở website!');

    await connection.end();
  } catch (err) {
    console.error('❌ LỖI KHI KHỞI TẠO DATABASE:');
    console.error(`   ${err.message}`);
    console.log('----------------------------------------------------');
    console.log('💡 Gợi ý:');
    console.log('1. Đảm bảo MySQL (XAMPP / Laragon / MySQL Service) đang BẬT.');
    console.log('2. Kiểm tra lại DB_USER và DB_PASSWORD trong file ".env".');
  }
}

setupDatabase();
