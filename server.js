require('dotenv').config();
const express = require('express');
const path = require('path');
const compression = require('compression');
const session = require('express-session');
const flash = require('connect-flash');
const morgan = require('morgan');

const dbPool = require('./config/database');
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');
const { trackTraffic } = require('./middlewares/trafficTracker');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Prevent process from crashing on unhandled errors ─────
process.on('uncaughtException', (err) => {
  console.error('⚠️ [Uncaught Exception]:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [Unhandled Rejection]:', reason);
});

// ── Reverse Proxy Trust (cPanel Passenger / Nginx / Cloudflare) ─
app.set('trust proxy', 1);

// ── Compression (gzip) ─────────────────────────────────────
app.use(compression());

// ── Logger (dev only) ─────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── View engine ───────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
if (process.env.NODE_ENV === 'production') {
  app.set('view cache', true);
}

// ── Static files ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  etag: true
}));

// ── Body parser ───────────────────────────────────────────
app.use(express.urlencoded({ extended: false, limit: '25mb' }));
app.use(express.json({ limit: '25mb' }));

// ── Session store with graceful fallback ──────────────────
let sessionConfig = {
  key: 'cvip_session',
  secret: process.env.SESSION_SECRET || 'clinicvip_super_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // Không đặt maxAge để biến thành Session Cookie (Tắt trình duyệt tự động logout)
    secure: false      // Phù hợp cả khi qua Reverse Proxy của cPanel
  }
};

try {
  const MySQLStore = require('express-mysql-session')(session);
  const sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 900000,  // Dọn dẹp session rác mỗi 15 phút
    expiration: 1800000,              // 30 phút (1,800,000ms)
    createDatabaseTable: true
  }, dbPool);

  sessionStore.on('error', function(error) {
    console.warn('⚠️ [Session Store Warning]: MySQL Session gặp lỗi, hệ thống vẫn đang hoạt động.');
  });

  sessionConfig.store = sessionStore;
} catch (e) {
  console.warn('⚠️ Sử dụng MemoryStore cho session.');
}

app.use(session(sessionConfig));

// ── Flash messages ────────────────────────────────────────
app.use(flash());

// ── Global template defaults (Available to all templates and error handlers) ─
app.locals.clinicName = process.env.CLINIC_NAME || 'Phòng Khám VIP';
app.locals.clinicPhone = process.env.CLINIC_PHONE || '+84 28 3822 1234';
app.locals.clinicEmail = process.env.CLINIC_EMAIL || 'contact@clinicvip.vn';
app.locals.clinicAddress = process.env.CLINIC_ADDRESS || '123 Đường ABC, Quận 1, TP.HCM';
app.locals.clinicLogo = '/images/logo.svg';
app.locals.admin = null;
app.locals.success = [];
app.locals.error = [];

const db = require('./models/db');
let cachedLogo = '/images/logo.svg';

app.use(async (req, res, next) => {
  res.locals.success = req.flash ? req.flash('success') : [];
  res.locals.error = req.flash ? req.flash('error') : [];
  res.locals.admin = req.session && req.session.adminId ? { username: req.session.adminUsername } : null;

  try {
    const settingsRows = await db.query('SELECT * FROM settings');
    const settingsMap = {};
    if (settingsRows && settingsRows.length) {
      settingsRows.forEach(s => { settingsMap[s.setting_key] = s.setting_value; });
    }

    res.locals.clinicName = settingsMap.clinic_name || process.env.CLINIC_NAME || 'Phòng Khám VIP';
    res.locals.clinicPhone = settingsMap.clinic_phone || process.env.CLINIC_PHONE || '+84 28 3822 1234';
    res.locals.clinicEmail = settingsMap.clinic_email || process.env.CLINIC_EMAIL || 'contact@clinicvip.vn';
    res.locals.clinicAddress = settingsMap.clinic_address || process.env.CLINIC_ADDRESS || '123 Đường ABC, Quận 1, TP.HCM';
    res.locals.clinicTaxCode = settingsMap.clinic_tax_code || '';
    res.locals.clinicWorkingHours = settingsMap.clinic_working_hours || 'Thứ 2 — Thứ 7: 7:00 — 17:00';
    res.locals.primaryColor = settingsMap.primary_color || '#0090a1';
    res.locals.primaryDark = settingsMap.primary_dark || '#007a8a';
    res.locals.clinicLogo = settingsMap.clinic_logo || '/images/logo.svg';
    res.locals.clinicFavicon = settingsMap.clinic_favicon || settingsMap.clinic_logo || '/images/logo.svg';
    res.locals.socialFacebook = settingsMap.social_facebook || '#';
    res.locals.socialZalo = settingsMap.social_zalo || '#';
    res.locals.socialYoutube = settingsMap.social_youtube || '#';
    res.locals.socialTiktok = settingsMap.social_tiktok || '';
    res.locals.clinicMapUrl = settingsMap.clinic_map_url || '';

    // Cache app defaults
    app.locals.clinicName = res.locals.clinicName;
    app.locals.clinicLogo = res.locals.clinicLogo;
    app.locals.clinicFavicon = res.locals.clinicFavicon;
    app.locals.primaryColor = res.locals.primaryColor;
    app.locals.primaryDark = res.locals.primaryDark;

    const [pkgCount, svcCount, spCount, docCount, newsCount] = await Promise.all([
      db.queryOne('SELECT COUNT(*) AS total FROM packages WHERE is_active=1'),
      db.queryOne('SELECT COUNT(*) AS total FROM services WHERE is_active=1'),
      db.queryOne('SELECT COUNT(*) AS total FROM specialties WHERE is_active=1'),
      db.queryOne('SELECT COUNT(*) AS total FROM doctors WHERE is_active=1'),
      db.queryOne('SELECT COUNT(*) AS total FROM news WHERE is_active=1')
    ]);

    res.locals.hasPackages = pkgCount && pkgCount.total > 0;
    res.locals.hasServices = svcCount && svcCount.total > 0;
    res.locals.hasSpecialties = spCount && spCount.total > 0;
    res.locals.hasDoctors = docCount && docCount.total > 0;
    res.locals.hasNews = newsCount && newsCount.total > 0;
  } catch (e) {
    res.locals.clinicName = process.env.CLINIC_NAME || 'Phòng Khám VIP';
    res.locals.clinicPhone = process.env.CLINIC_PHONE || '+84 28 3822 1234';
    res.locals.clinicEmail = process.env.CLINIC_EMAIL || 'contact@clinicvip.vn';
    res.locals.clinicAddress = process.env.CLINIC_ADDRESS || '123 Đường ABC, Quận 1, TP.HCM';
    res.locals.clinicTaxCode = '';
    res.locals.clinicWorkingHours = 'Thứ 2 — Thứ 7: 7:00 — 17:00';
    res.locals.primaryColor = '#0090a1';
    res.locals.primaryDark = '#007a8a';
    res.locals.clinicLogo = '/images/logo.svg';
    res.locals.clinicFavicon = '/images/logo.svg';
    res.locals.socialFacebook = '#';
    res.locals.socialZalo = '#';
    res.locals.socialYoutube = '#';
    res.locals.socialTiktok = '';
    res.locals.clinicMapUrl = '';
    res.locals.hasPackages = true;
    res.locals.hasServices = true;
    res.locals.hasSpecialties = true;
    res.locals.hasDoctors = true;
    res.locals.hasNews = true;
  }

  res.locals.currentPath = req.originalUrl || req.url || '';

  next();
});

// ── Routes ────────────────────────────────────────────────
app.use(trackTraffic);
app.use('/', indexRoutes);
app.use('/admin', adminRoutes);

// ── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('404', { title: 'Trang không tìm thấy' });
});

// ── Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ [Server Error]:', err.message);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    if (req.flash) req.flash('error', 'Kích thước file quá lớn (tối đa 25MB). Vui lòng chọn file nhẹ hơn.');
    return res.redirect(req.get('Referrer') || '/admin/dashboard');
  }

  if (err.message && err.message.includes('Chỉ chấp nhận file')) {
    if (req.flash) req.flash('error', err.message);
    return res.redirect(req.get('Referrer') || '/admin/dashboard');
  }

  if (err.code === 'ER_BAD_DB_ERROR' || err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(500).send(`
      <div style="font-family:Segoe UI,sans-serif;max-width:600px;margin:50px auto;padding:30px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);border-left:5px solid #e53e3e;">
        <h2 style="color:#e53e3e;margin-top:0;">⚠️ Chưa kết nối được MySQL</h2>
        <p>Hệ thống không thể kết nối tới cơ sở dữ liệu MySQL: <strong>${err.message}</strong></p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <h3>Hướng dẫn thiết lập:</h3>
        <ol style="line-height:1.8;">
          <li>Mở phần mềm <strong>XAMPP / Laragon / MySQL</strong> và bấm <strong>Start</strong> MySQL.</li>
          <li>Tạo Database tên: <code>clinicvip</code></li>
          <li>Import file: <code>database/schema.sql</code> vào database vừa tạo.</li>
          <li>Kiểm tra lại thông tin <code>DB_USER</code> và <code>DB_PASSWORD</code> trong file <code>.env</code>.</li>
        </ol>
      </div>
    `);
  }

  if (req.originalUrl && req.originalUrl.startsWith('/admin') && req.flash) {
    req.flash('error', 'Có lỗi xử lý: ' + err.message);
    return res.redirect(req.get('Referrer') || '/admin/dashboard');
  }

  res.status(500).render('500', { title: 'Lỗi máy chủ' });
});

// ── Start server ──────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🏥 CLINIC VIP SERVER ĐANG CHẠY TẠI CỔNG: ${PORT}`);
  console.log(`📍 Trang chủ:   http://localhost:${PORT}`);
  console.log(`🔐 Trang Admin: http://localhost:${PORT}/admin`);
  console.log(`🔧 Môi trường:  ${process.env.NODE_ENV || 'development'}`);
  console.log('====================================================');
});

module.exports = app;
