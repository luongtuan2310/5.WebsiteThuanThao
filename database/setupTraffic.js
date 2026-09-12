const db = require('../models/db');

async function setupTraffic() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS page_views (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NULL,
        session_id VARCHAR(100) NULL,
        page_path VARCHAR(255) NOT NULL,
        page_title VARCHAR(255) NULL,
        referrer VARCHAR(255) NULL,
        user_agent VARCHAR(255) NULL,
        device_type VARCHAR(20) DEFAULT 'desktop',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at),
        INDEX idx_page_path (page_path),
        INDEX idx_session (session_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table page_views created / verified successfully.');

    // Check count
    const count = await db.queryOne('SELECT COUNT(*) AS total FROM page_views');
    if (!count || count.total < 50) {
      console.log('🌱 Seeding initial baseline traffic for realistic dashboard metrics...');
      const paths = ['/', '/gioi-thieu', '/bac-si', '/dich-vu', '/goi-kham', '/tin-tuc', '/lien-he', '/dat-lich'];
      const titles = ['Trang chủ', 'Giới thiệu phòng khám', 'Đội ngũ bác sĩ', 'Bảng giá dịch vụ', 'Gói khám tổng quát', 'Tin tức y khoa', 'Liên hệ tư vấn', 'Đặt lịch trực tuyến'];
      const devices = ['desktop', 'mobile', 'mobile', 'desktop', 'tablet'];

      const now = new Date();
      let totalInserted = 0;
      
      for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
        const date = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
        const dayViews = Math.floor(Math.random() * 35) + (dayOffset === 0 ? 38 : 45); // 35-80 views per day
        
        for (let i = 0; i < dayViews; i++) {
          const pathIdx = Math.floor(Math.random() * paths.length);
          const p = paths[pathIdx];
          const t = titles[pathIdx];
          const dev = devices[Math.floor(Math.random() * devices.length)];
          const ip = '192.168.1.' + Math.floor(Math.random() * 250);
          const sess = 'sess_' + dayOffset + '_' + Math.floor(Math.random() * 20);
          
          const viewHour = Math.floor(Math.random() * 14) + 8; // 8:00 - 22:00
          const viewMin = Math.floor(Math.random() * 60);
          const viewDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), viewHour, viewMin);
          
          await db.execute(
            'INSERT INTO page_views (ip_address, session_id, page_path, page_title, referrer, user_agent, device_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [ip, sess, p, t, 'https://google.com', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', dev, viewDate]
          );
          totalInserted++;
        }
      }
      console.log(`✅ Seeded ${totalInserted} initial page views.`);
    } else {
      console.log(`ℹ️ Table page_views already contains ${count.total} records.`);
    }
  } catch (err) {
    console.error('❌ setupTraffic Error:', err);
  }
}

setupTraffic().then(() => {
  console.log('Done.');
  process.exit(0);
});
