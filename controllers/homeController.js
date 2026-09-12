const db = require('../models/db');

exports.index = async (req, res) => {
  try {
    // Fetch all data needed for homepage in parallel
    const [banners, packages, specialties, doctors, news] = await Promise.all([
      db.query('SELECT * FROM banners WHERE is_active=1 ORDER BY sort_order ASC LIMIT 10'),
      db.query('SELECT * FROM packages WHERE is_active=1 AND is_featured=1 ORDER BY sort_order ASC LIMIT 6'),
      db.query('SELECT * FROM specialties WHERE is_active=1 ORDER BY sort_order ASC LIMIT 8'),
      db.query(`
        SELECT d.*, s.name AS specialty_name
        FROM doctors d
        LEFT JOIN specialties s ON d.specialty_id = s.id
        WHERE d.is_active=1 AND d.is_featured=1
        ORDER BY d.sort_order ASC LIMIT 6
      `),
      db.query('SELECT id, title, slug, excerpt, image_url, category, published_at FROM news WHERE is_active=1 ORDER BY published_at DESC LIMIT 6')
    ]);

    res.render('index', {
      title: 'Trang Chủ',
      banners,
      packages,
      specialties,
      doctors,
      news
    });
  } catch (err) {
    console.error('Home error:', err);
    res.status(500).render('500', { title: 'Lỗi' });
  }
};

exports.about = async (req, res) => {
  try {
    const [doctors, specialties, aboutSetting] = await Promise.all([
      db.query(`
        SELECT d.*, s.name AS specialty_name
        FROM doctors d
        LEFT JOIN specialties s ON d.specialty_id = s.id
        WHERE d.is_active=1
        ORDER BY d.sort_order ASC LIMIT 4
      `),
      db.query('SELECT * FROM specialties WHERE is_active=1 ORDER BY sort_order ASC LIMIT 6'),
      db.queryOne("SELECT setting_value FROM settings WHERE setting_key='page_about'")
    ]);

    let aboutData = {
      greeting_badge: 'Lời chào từ Phòng Khám VIP',
      main_title: 'Đồng Hành Cùng Sức Khỏe Gia Đình Bạn',
      lead_text: 'Chào mừng Quý khách đến với Phòng Khám VIP. Chúng tôi vinh hạnh được là người bạn đồng hành tin cậy trên hành trình chăm sóc và bảo vệ sức khỏe cho bạn cùng những người thân yêu.',
      mission_title: 'Sứ Mệnh Của Chúng Tôi',
      mission_desc: 'Mang đến dịch vụ y tế toàn diện, chuẩn mực và nhân văn. Chúng tôi đặt y đức, sự an toàn và trải nghiệm thoải mái của bệnh nhân làm kim chỉ nam trong mọi hoạt động khám và điều trị.',
      values: 'Tận Tâm, Chuyên Nghiệp, Hiện Đại, Trách Nhiệm',
      image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800'
    };

    if (aboutSetting && aboutSetting.setting_value) {
      try {
        const parsed = JSON.parse(aboutSetting.setting_value);
        aboutData = { ...aboutData, ...parsed };
      } catch (e) {}
    }

    res.render('about', {
      title: 'Về Chúng Tôi',
      aboutData,
      doctors,
      specialties
    });
  } catch (err) {
    console.error('About error:', err);
    res.status(500).render('500', { title: 'Lỗi' });
  }
};
