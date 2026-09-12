const db = require('../models/db');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');
const { processImage } = require('../middlewares/imageProcessor');
const { logActivity } = require('../utils/activityLogger');
const { PERMISSION_MODULES } = require('../config/permissions');

// ========== AUTH ==========
exports.loginPage = (req, res) => {
  const isLocked = req.query.locked === '1';
  const isTimeout = req.query.timeout === '1';
  if (isLocked) {
    req.flash('error', 'Tài khoản của bạn đã bị tạm khóa hoặc không tồn tại.');
  } else if (isTimeout) {
    req.flash('error', 'Phiên làm việc đã tự động kết thúc sau 30 phút không hoạt động. Vui lòng đăng nhập lại.');
  }
  res.render('admin/login', { 
    title: 'Admin Đăng nhập',
    isTimeout,
    isLocked
  });
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      req.flash('error', 'Vui lòng nhập đầy đủ thông tin.');
      return res.redirect('/admin/login');
    }

    const admin = await db.queryOne('SELECT * FROM admins WHERE username=?', [username]);
    if (!admin) {
      await logActivity(req, {
        action: 'login_failed',
        module: 'auth',
        description: `Đăng nhập thất bại: Tên đăng nhập "${username}" không tồn tại`,
        username
      });
      req.flash('error', 'Tên đăng nhập hoặc mật khẩu không đúng.');
      return res.redirect('/admin/login');
    }

    if (admin.is_active === 0) {
      await logActivity(req, {
        action: 'login_failed',
        module: 'auth',
        adminId: admin.id,
        username: admin.username,
        description: `Đăng nhập bị từ chối: Tài khoản "${username}" đang bị tạm khóa`
      });
      req.flash('error', 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên.');
      return res.redirect('/admin/login');
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      await logActivity(req, {
        action: 'login_failed',
        module: 'auth',
        adminId: admin.id,
        username: admin.username,
        description: `Đăng nhập thất bại: Nhập sai mật khẩu cho tài khoản "${username}"`
      });
      req.flash('error', 'Tên đăng nhập hoặc mật khẩu không đúng.');
      return res.redirect('/admin/login');
    }

    // Update last_login
    await db.execute('UPDATE admins SET last_login=NOW() WHERE id=?', [admin.id]);

    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    req.session.lastActivity = Date.now();
    const returnTo = req.session.returnTo || '/admin/dashboard';
    delete req.session.returnTo;
    
    await logActivity(req, {
      action: 'login',
      module: 'auth',
      adminId: admin.id,
      username: admin.username,
      description: `Đăng nhập thành công vào hệ thống quản trị`
    });

    req.session.save((saveErr) => {
      if (saveErr) console.error('Session save error:', saveErr);
      res.redirect(returnTo);
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra.');
    res.redirect('/admin/login');
  }
};

exports.logout = async (req, res) => {
  if (req.session && req.session.adminId) {
    try {
      await logActivity(req, {
        action: 'logout',
        module: 'auth',
        adminId: req.session.adminId,
        username: req.session.adminUsername,
        description: `Đăng xuất khỏi hệ thống`
      });
    } catch(e) {}
  }
  req.session.destroy(() => {
    res.clearCookie('cvip_session');
    res.redirect('/admin/login');
  });
};

// ========== DASHBOARD ==========
exports.dashboard = async (req, res) => {
  try {
    const [
      viewsTotalRow,
      visitorsTotalRow,
      viewsTodayRow,
      visitorsTodayRow,
      viewsYesterdayRow,
      apptTotalRow,
      apptTodayRow,
      apptPendingRow,
      apptConfirmedRow,
      apptCancelledRow,
      contactsNewRow,
      doctorCountRow,
      serviceCountRow,
      packageCountRow,
      newsCountRow,
      traffic7Days,
      topPages,
      deviceStats,
      recentAppointments,
      recentContacts,
      recentActivityLogs
    ] = await Promise.all([
      db.queryOne('SELECT COUNT(*) AS total FROM page_views').catch(() => ({ total: 0 })),
      db.queryOne('SELECT COUNT(DISTINCT session_id) AS total FROM page_views').catch(() => ({ total: 0 })),
      db.queryOne('SELECT COUNT(*) AS total FROM page_views WHERE DATE(created_at) = CURDATE()').catch(() => ({ total: 0 })),
      db.queryOne('SELECT COUNT(DISTINCT session_id) AS total FROM page_views WHERE DATE(created_at) = CURDATE()').catch(() => ({ total: 0 })),
      db.queryOne('SELECT COUNT(*) AS total FROM page_views WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)').catch(() => ({ total: 0 })),
      db.queryOne('SELECT COUNT(*) AS total FROM appointments').catch(() => ({ total: 0 })),
      db.queryOne('SELECT COUNT(*) AS total FROM appointments WHERE DATE(appointment_date) = CURDATE() OR DATE(created_at) = CURDATE()').catch(() => ({ total: 0 })),
      db.queryOne("SELECT COUNT(*) AS total FROM appointments WHERE status='pending'").catch(() => ({ total: 0 })),
      db.queryOne("SELECT COUNT(*) AS total FROM appointments WHERE status='confirmed'").catch(() => ({ total: 0 })),
      db.queryOne("SELECT COUNT(*) AS total FROM appointments WHERE status='cancelled'").catch(() => ({ total: 0 })),
      db.queryOne("SELECT COUNT(*) AS total FROM contacts WHERE status='new'").catch(() => ({ total: 0 })),
      db.queryOne('SELECT COUNT(*) AS total FROM doctors WHERE is_active=1').catch(() => ({ total: 0 })),
      db.queryOne('SELECT COUNT(*) AS total FROM services WHERE is_active=1').catch(() => ({ total: 0 })),
      db.queryOne('SELECT COUNT(*) AS total FROM packages WHERE is_active=1').catch(() => ({ total: 0 })),
      db.queryOne('SELECT COUNT(*) AS total FROM news WHERE is_active=1').catch(() => ({ total: 0 })),
      db.query(`
        SELECT 
          DATE_FORMAT(created_at, '%d/%m') AS date_label,
          COUNT(*) AS page_views,
          COUNT(DISTINCT session_id) AS visitors
        FROM page_views 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(created_at), DATE_FORMAT(created_at, '%d/%m')
        ORDER BY DATE(created_at) ASC
      `).catch(() => []),
      db.query(`
        SELECT page_path, page_title, COUNT(*) AS view_count 
        FROM page_views 
        GROUP BY page_path, page_title 
        ORDER BY view_count DESC 
        LIMIT 5
      `).catch(() => []),
      db.query(`
        SELECT device_type, COUNT(*) AS count 
        FROM page_views 
        GROUP BY device_type
      `).catch(() => []),
      db.query(`
        SELECT a.*, d.name AS doctor_name, p.name AS package_name 
        FROM appointments a 
        LEFT JOIN doctors d ON a.doctor_id=d.id 
        LEFT JOIN packages p ON a.package_id=p.id 
        ORDER BY a.created_at DESC 
        LIMIT 6
      `).catch(() => []),
      db.query(`
        SELECT * FROM contacts 
        ORDER BY created_at DESC 
        LIMIT 4
      `).catch(() => []),
      db.query(`
        SELECT * FROM activity_logs 
        ORDER BY created_at DESC 
        LIMIT 5
      `).catch(() => [])
    ]);

    const viewsToday = viewsTodayRow?.total || 0;
    const viewsYesterday = viewsYesterdayRow?.total || 0;
    let viewsGrowth = 0;
    if (viewsYesterday > 0) {
      viewsGrowth = Math.round(((viewsToday - viewsYesterday) / viewsYesterday) * 100);
    } else if (viewsToday > 0) {
      viewsGrowth = 100;
    }

    const apptTotal = apptTotalRow?.total || 0;
    const apptConfirmed = apptConfirmedRow?.total || 0;
    const apptConversionRate = apptTotal > 0 ? Math.round((apptConfirmed / apptTotal) * 100) : 0;

    res.render('admin/dashboard', {
      title: 'Bảng Điều Khiển Tổng Quan',
      stats: {
        viewsTotal: viewsTotalRow?.total || 0,
        visitorsTotal: visitorsTotalRow?.total || 0,
        viewsToday,
        visitorsToday: visitorsTodayRow?.total || 0,
        viewsGrowth,
        apptTotal,
        apptToday: apptTodayRow?.total || 0,
        apptPending: apptPendingRow?.total || 0,
        apptConfirmed,
        apptCancelled: apptCancelledRow?.total || 0,
        apptConversionRate,
        contactsNew: contactsNewRow?.total || 0,
        doctorCount: doctorCountRow?.total || 0,
        serviceCount: serviceCountRow?.total || 0,
        packageCount: packageCountRow?.total || 0,
        newsCount: newsCountRow?.total || 0
      },
      traffic7Days,
      topPages,
      deviceStats,
      recentAppointments,
      recentContacts,
      recentActivityLogs
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).render('500', { title: 'Lỗi máy chủ' });
  }
};

// ========== BANNERS ==========
exports.bannersList = async (req, res) => {
  const banners = await db.query('SELECT * FROM banners ORDER BY sort_order ASC');
  res.render('admin/banners', { title: 'Quản lý Banner', banners });
};
exports.bannersCreate = (req, res) => res.render('admin/banner-form', { title: 'Thêm Banner', banner: null });
exports.bannersStore = async (req, res) => {
  try {
    let image_url = '';
    if (req.file) {
      const result = await processImage(req.file.path, 'banners', req.file.filename);
      image_url = result.full;
    }
    const { title, subtitle, layers_json, sort_order, is_active } = req.body;
    const activeVal = (is_active !== undefined && is_active !== null) ? parseInt(is_active) : 1;
    
    let content_style = layers_json || '{}';
    let content_title = '';
    let content = '';

    try {
      const data = JSON.parse(layers_json || '{}');
      if (data.layers && Array.isArray(data.layers)) {
        const titles = data.layers.filter(l => l.type === 'title').map(l => l.text);
        const bodies = data.layers.filter(l => l.type === 'body').map(l => l.text);
        content_title = titles.join(' | ');
        content = bodies.join('\n');
      }
    } catch (e) {}

    await db.insert('INSERT INTO banners (title, subtitle, content_title, content, content_style, image_url, sort_order, is_active) VALUES (?,?,?,?,?,?,?,?)',
      [title, subtitle || '', content_title, content, content_style, image_url, parseInt(sort_order) || 0, activeVal]);
    req.flash('success', 'Thêm banner thành công!');
    res.redirect('/admin/banners');
  } catch (err) { console.error(err); req.flash('error', 'Có lỗi xảy ra.'); res.redirect('/admin/banners'); }
};
exports.bannersEdit = async (req, res) => {
  const banner = await db.queryOne('SELECT * FROM banners WHERE id=?', [req.params.id]);
  if (!banner) return res.redirect('/admin/banners');
  if (banner.content_style) {
    try {
      banner.parsedStyle = JSON.parse(banner.content_style);
    } catch(e) {
      banner.parsedStyle = {};
    }
  } else {
    banner.parsedStyle = {};
  }
  res.render('admin/banner-form', { title: 'Sửa Banner', banner });
};
exports.bannersUpdate = async (req, res) => {
  try {
    const { title, subtitle, layers_json, sort_order, is_active } = req.body;
    const activeVal = (is_active !== undefined && is_active !== null) ? parseInt(is_active) : 1;

    let content_style = layers_json || '{}';
    let content_title = '';
    let content = '';

    try {
      const data = JSON.parse(layers_json || '{}');
      if (data.layers && Array.isArray(data.layers)) {
        const titles = data.layers.filter(l => l.type === 'title').map(l => l.text);
        const bodies = data.layers.filter(l => l.type === 'body').map(l => l.text);
        content_title = titles.join(' | ');
        content = bodies.join('\n');
      }
    } catch (e) {}

    let updates = 'title=?, subtitle=?, content_title=?, content=?, content_style=?, sort_order=?, is_active=?';
    let params = [title, subtitle || '', content_title, content, content_style, parseInt(sort_order) || 0, activeVal];
    if (req.file) {
      const result = await processImage(req.file.path, 'banners', req.file.filename);
      updates += ', image_url=?';
      params.push(result.full);
    }
    params.push(req.params.id);
    await db.execute(`UPDATE banners SET ${updates} WHERE id=?`, params);
    req.flash('success', 'Cập nhật thành công!');
    res.redirect('/admin/banners');
  } catch (err) { console.error(err); req.flash('error', 'Có lỗi xảy ra.'); res.redirect('/admin/banners'); }
};
exports.bannersDelete = async (req, res) => {
  await db.execute('DELETE FROM banners WHERE id=?', [req.params.id]);
  req.flash('success', 'Đã xóa banner.');
  res.redirect('/admin/banners');
};
exports.bannersToggle = async (req, res) => {
  const banner = await db.queryOne('SELECT is_active FROM banners WHERE id=?', [req.params.id]);
  if (!banner) return res.json({ success: false });
  await db.execute('UPDATE banners SET is_active=? WHERE id=?', [banner.is_active ? 0 : 1, req.params.id]);
  res.json({ success: true, is_active: !banner.is_active });
};

// ========== PACKAGES ==========
exports.packagesList = async (req, res) => {
  const packages = await db.query('SELECT * FROM packages ORDER BY sort_order ASC');
  res.render('admin/packages', { title: 'Quản lý Gói Khám', packages });
};
exports.packagesCreate = async (req, res) => {
  try {
    let services = [];
    try {
      services = await db.query('SELECT id, name, group_name, price FROM services WHERE is_active=1 OR is_active IS NULL ORDER BY group_name ASC, sort_order ASC, name ASC');
    } catch (e) {
      services = await db.query('SELECT id, name, group_name, price FROM services ORDER BY group_name ASC, name ASC');
    }
    res.render('admin/package-form', { title: 'Thêm Gói Khám', pkg: null, services: services || [] });
  } catch (err) {
    console.error(err);
    res.render('admin/package-form', { title: 'Thêm Gói Khám', pkg: null, services: [] });
  }
};
exports.packagesStore = async (req, res) => {
  try {
    let image_url = '';
    let detailImages = [];

    if (Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file.fieldname === 'image') {
          const result = await processImage(file.path, 'packages', file.filename);
          image_url = result.full;
        } else if (file.fieldname === 'detail_images') {
          const result = await processImage(file.path, 'packages', file.filename);
          detailImages.push(result.full);
        }
      }
    } else if (req.files) {
      if (req.files.image && req.files.image[0]) {
        const result = await processImage(req.files.image[0].path, 'packages', req.files.image[0].filename);
        image_url = result.full;
      }
      if (req.files.detail_images && req.files.detail_images.length > 0) {
        for (const file of req.files.detail_images) {
          const result = await processImage(file.path, 'packages', file.filename);
          detailImages.push(result.full);
        }
      }
    } else if (req.file) {
      const result = await processImage(req.file.path, 'packages', req.file.filename);
      image_url = result.full;
    }

    const { name, description, target_audience, is_featured, sort_order } = req.body;
    const priceNum = parseInt(String(req.body.price || 0).replace(/[^0-9]/g, '')) || 0;
    
    let featuresJson = '[]';
    if (req.body.features) {
      if (Array.isArray(req.body.features)) {
        featuresJson = JSON.stringify(req.body.features.filter(Boolean));
      } else if (typeof req.body.features === 'string') {
        try {
          const parsed = JSON.parse(req.body.features);
          featuresJson = JSON.stringify(Array.isArray(parsed) ? parsed : [req.body.features]);
        } catch (e) {
          featuresJson = JSON.stringify(req.body.features.split('\n').map(s => s.trim()).filter(Boolean));
        }
      }
    }

    const detailImagesJson = JSON.stringify(detailImages);

    await db.insert(
      'INSERT INTO packages (name, description, target_audience, price, image_url, detail_images, features, is_featured, sort_order) VALUES (?,?,?,?,?,?,?,?,?)',
      [name, description || '', target_audience || '', priceNum, image_url, detailImagesJson, featuresJson, is_featured ? 1 : 0, parseInt(sort_order) || 0]
    );
    req.flash('success', 'Thêm gói khám thành công!');
    res.redirect('/admin/packages');
  } catch (err) { console.error(err); req.flash('error', 'Có lỗi.'); res.redirect('/admin/packages'); }
};
exports.packagesEdit = async (req, res) => {
  try {
    const pkg = await db.queryOne('SELECT * FROM packages WHERE id=?', [req.params.id]);
    if (!pkg) return res.redirect('/admin/packages');
    let services = [];
    try {
      services = await db.query('SELECT id, name, group_name, price FROM services WHERE is_active=1 OR is_active IS NULL ORDER BY group_name ASC, sort_order ASC, name ASC');
    } catch (e) {
      services = await db.query('SELECT id, name, group_name, price FROM services ORDER BY group_name ASC, name ASC');
    }
    res.render('admin/package-form', { title: 'Sửa Gói Khám', pkg, services: services || [] });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/packages');
  }
};
exports.packagesUpdate = async (req, res) => {
  try {
    const { name, description, target_audience, is_featured, sort_order, existing_detail_images } = req.body;
    const priceNum = parseInt(String(req.body.price || 0).replace(/[^0-9]/g, '')) || 0;
    
    let featuresJson = '[]';
    if (req.body.features) {
      if (Array.isArray(req.body.features)) {
        featuresJson = JSON.stringify(req.body.features.filter(Boolean));
      } else if (typeof req.body.features === 'string') {
        try {
          const parsed = JSON.parse(req.body.features);
          featuresJson = JSON.stringify(Array.isArray(parsed) ? parsed : [req.body.features]);
        } catch (e) {
          featuresJson = JSON.stringify(req.body.features.split('\n').map(s => s.trim()).filter(Boolean));
        }
      }
    }

    // Existing detail images
    let detailImages = [];
    if (existing_detail_images) {
      if (Array.isArray(existing_detail_images)) {
        detailImages = existing_detail_images.filter(Boolean);
      } else if (typeof existing_detail_images === 'string') {
        try {
          const parsed = JSON.parse(existing_detail_images);
          detailImages = Array.isArray(parsed) ? parsed : [existing_detail_images];
        } catch(e) {
          detailImages = [existing_detail_images];
        }
      }
    }

    let updates = 'name=?, description=?, target_audience=?, price=?, features=?, is_featured=?, sort_order=?';
    let params = [name, description || '', target_audience || '', priceNum, featuresJson, is_featured ? 1 : 0, parseInt(sort_order) || 0];
    
    if (Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file.fieldname === 'image') {
          const result = await processImage(file.path, 'packages', file.filename);
          updates += ', image_url=?';
          params.push(result.full);
        } else if (file.fieldname === 'detail_images') {
          const result = await processImage(file.path, 'packages', file.filename);
          detailImages.push(result.full);
        }
      }
    } else if (req.files) {
      if (req.files.image && req.files.image[0]) {
        const result = await processImage(req.files.image[0].path, 'packages', req.files.image[0].filename);
        updates += ', image_url=?';
        params.push(result.full);
      }
      if (req.files.detail_images && req.files.detail_images.length > 0) {
        for (const file of req.files.detail_images) {
          const result = await processImage(file.path, 'packages', file.filename);
          detailImages.push(result.full);
        }
      }
    } else if (req.file) {
      const result = await processImage(req.file.path, 'packages', req.file.filename);
      updates += ', image_url=?';
      params.push(result.full);
    }

    updates += ', detail_images=?';
    params.push(JSON.stringify(detailImages));

    params.push(req.params.id);
    await db.execute(`UPDATE packages SET ${updates} WHERE id=?`, params);
    req.flash('success', 'Cập nhật thành công!');
    res.redirect('/admin/packages');
  } catch (err) { console.error(err); req.flash('error', 'Có lỗi.'); res.redirect('/admin/packages'); }
};
exports.packagesDelete = async (req, res) => {
  await db.execute('DELETE FROM packages WHERE id=?', [req.params.id]);
  req.flash('success', 'Đã xóa gói khám.');
  res.redirect('/admin/packages');
};
exports.packagesToggleFeatured = async (req, res) => {
  try {
    const pkg = await db.queryOne('SELECT is_featured FROM packages WHERE id=?', [req.params.id]);
    if (!pkg) return res.json({ success: false, message: 'Gói khám không tồn tại' });
    const newFeatured = pkg.is_featured ? 0 : 1;
    await db.execute('UPDATE packages SET is_featured=? WHERE id=?', [newFeatured, req.params.id]);
    res.json({ success: true, is_featured: Boolean(newFeatured) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ========== SPECIALTIES ==========
exports.specialtiesList = async (req, res) => {
  const specialties = await db.query('SELECT * FROM specialties ORDER BY sort_order ASC');
  res.render('admin/specialties', { title: 'Quản lý Chuyên Khoa', specialties });
};
exports.specialtiesCreate = (req, res) => res.render('admin/specialty-form', { title: 'Thêm Chuyên Khoa', specialty: null });
exports.specialtiesStore = async (req, res) => {
  try {
    let image_url = '';
    if (req.file) {
      const result = await processImage(req.file.path, 'specialties', req.file.filename);
      image_url = result.full;
    }
    const { name, description, icon, sort_order } = req.body;
    await db.insert('INSERT INTO specialties (name, description, icon, image_url, sort_order) VALUES (?,?,?,?,?)',
      [name, description || '', icon || 'fa-stethoscope', image_url, parseInt(sort_order) || 0]);
    req.flash('success', 'Thêm chuyên khoa thành công!');
    res.redirect('/admin/specialties');
  } catch (err) { console.error(err); req.flash('error', 'Có lỗi.'); res.redirect('/admin/specialties'); }
};
exports.specialtiesEdit = async (req, res) => {
  const specialty = await db.queryOne('SELECT * FROM specialties WHERE id=?', [req.params.id]);
  if (!specialty) return res.redirect('/admin/specialties');
  res.render('admin/specialty-form', { title: 'Sửa Chuyên Khoa', specialty });
};
exports.specialtiesUpdate = async (req, res) => {
  try {
    const { name, description, icon, sort_order } = req.body;
    let updates = 'name=?, description=?, icon=?, sort_order=?';
    let params = [name, description || '', icon || 'fa-stethoscope', parseInt(sort_order) || 0];
    if (req.file) {
      const result = await processImage(req.file.path, 'specialties', req.file.filename);
      updates += ', image_url=?';
      params.push(result.full);
    }
    params.push(req.params.id);
    await db.execute(`UPDATE specialties SET ${updates} WHERE id=?`, params);
    req.flash('success', 'Cập nhật thành công!');
    res.redirect('/admin/specialties');
  } catch (err) { console.error(err); req.flash('error', 'Có lỗi.'); res.redirect('/admin/specialties'); }
};
exports.specialtiesDelete = async (req, res) => {
  await db.execute('DELETE FROM specialties WHERE id=?', [req.params.id]);
  req.flash('success', 'Đã xóa chuyên khoa.');
  res.redirect('/admin/specialties');
};
exports.specialtiesToggle = async (req, res) => {
  try {
    const specialty = await db.queryOne('SELECT is_active FROM specialties WHERE id=?', [req.params.id]);
    if (!specialty) return res.json({ success: false, message: 'Chuyên khoa không tồn tại' });
    const newActive = specialty.is_active ? 0 : 1;
    await db.execute('UPDATE specialties SET is_active=? WHERE id=?', [newActive, req.params.id]);
    res.json({ success: true, is_active: Boolean(newActive) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ========== DOCTORS ==========
exports.doctorsList = async (req, res) => {
  const doctors = await db.query(`SELECT d.*, s.name AS specialty_name FROM doctors d LEFT JOIN specialties s ON d.specialty_id=s.id ORDER BY d.sort_order ASC`);
  res.render('admin/doctors', { title: 'Quản lý Bác Sĩ', doctors });
};
exports.doctorsCreate = async (req, res) => {
  const specialties = await db.query('SELECT id, name FROM specialties WHERE is_active=1 ORDER BY sort_order ASC');
  res.render('admin/doctor-form', { title: 'Thêm Bác Sĩ', doctor: null, specialties });
};
exports.doctorsStore = async (req, res) => {
  try {
    let image_url = '';
    if (req.file) {
      const result = await processImage(req.file.path, 'doctors', req.file.filename);
      image_url = result.full;
    }
    const { name, title, specialty_id, description, certificates, experience, is_featured, sort_order } = req.body;
    await db.insert(
      'INSERT INTO doctors (name, title, specialty_id, description, certificates, experience, image_url, is_featured, sort_order) VALUES (?,?,?,?,?,?,?,?,?)',
      [name, title || '', specialty_id || null, description || '', certificates || '', experience || '', image_url, is_featured ? 1 : 0, parseInt(sort_order) || 0]
    );
    req.flash('success', 'Thêm bác sĩ thành công!');
    res.redirect('/admin/doctors');
  } catch (err) { console.error(err); req.flash('error', 'Có lỗi.'); res.redirect('/admin/doctors'); }
};
exports.doctorsEdit = async (req, res) => {
  const [doctor, specialties] = await Promise.all([
    db.queryOne('SELECT * FROM doctors WHERE id=?', [req.params.id]),
    db.query('SELECT id, name FROM specialties WHERE is_active=1 ORDER BY sort_order ASC')
  ]);
  if (!doctor) return res.redirect('/admin/doctors');
  res.render('admin/doctor-form', { title: 'Sửa Bác Sĩ', doctor, specialties });
};
exports.doctorsUpdate = async (req, res) => {
  try {
    const { name, title, specialty_id, description, certificates, experience, is_featured, sort_order } = req.body;
    let updates = 'name=?, title=?, specialty_id=?, description=?, certificates=?, experience=?, is_featured=?, sort_order=?';
    let params = [name, title || '', specialty_id || null, description || '', certificates || '', experience || '', is_featured ? 1 : 0, parseInt(sort_order) || 0];
    if (req.file) {
      const result = await processImage(req.file.path, 'doctors', req.file.filename);
      updates += ', image_url=?';
      params.push(result.full);
    }
    params.push(req.params.id);
    await db.execute(`UPDATE doctors SET ${updates} WHERE id=?`, params);
    req.flash('success', 'Cập nhật thành công!');
    res.redirect('/admin/doctors');
  } catch (err) { console.error(err); req.flash('error', 'Có lỗi.'); res.redirect('/admin/doctors'); }
};
exports.doctorsDelete = async (req, res) => {
  await db.execute('DELETE FROM doctors WHERE id=?', [req.params.id]);
  req.flash('success', 'Đã xóa bác sĩ.');
  res.redirect('/admin/doctors');
};
exports.doctorsToggleFeatured = async (req, res) => {
  try {
    const doctor = await db.queryOne('SELECT is_featured FROM doctors WHERE id=?', [req.params.id]);
    if (!doctor) return res.json({ success: false, message: 'Bác sĩ không tồn tại' });
    const newFeatured = doctor.is_featured ? 0 : 1;
    await db.execute('UPDATE doctors SET is_featured=? WHERE id=?', [newFeatured, req.params.id]);
    res.json({ success: true, is_featured: Boolean(newFeatured) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ========== NEWS ==========
exports.newsList = async (req, res) => {
  const newsList = await db.query('SELECT * FROM news ORDER BY published_at DESC');
  res.render('admin/news', { title: 'Quản lý Tin Tức', newsList });
};
exports.newsCreate = (req, res) => res.render('admin/news-form', { title: 'Viết bài mới', article: null });
exports.newsStore = async (req, res) => {
  try {
    let image_url = '';
    if (req.file) {
      const result = await processImage(req.file.path, 'news', req.file.filename);
      image_url = result.full;
    }
    const { title, excerpt, content, category, is_active } = req.body;
    const activeStatus = (is_active !== undefined && (is_active == '1' || is_active == 'true' || is_active == 'on')) ? 1 : 0;
    const slug = slugify(title, { lower: true, locale: 'vi', strict: true }) + '-' + Date.now();
    await db.insert(
      'INSERT INTO news (title, slug, excerpt, content, image_url, category, is_active) VALUES (?,?,?,?,?,?,?)',
      [title, slug, excerpt || '', content || '', image_url, category || 'Tin tức', activeStatus]
    );
    req.flash('success', activeStatus ? 'Đăng bài thành công!' : 'Đã lưu bản nháp thành công!');
    res.redirect('/admin/news');
  } catch (err) { console.error(err); req.flash('error', 'Có lỗi xảy ra khi tạo bài viết.'); res.redirect('/admin/news'); }
};
exports.newsEdit = async (req, res) => {
  const article = await db.queryOne('SELECT * FROM news WHERE id=?', [req.params.id]);
  if (!article) return res.redirect('/admin/news');
  res.render('admin/news-form', { title: 'Sửa bài viết', article });
};
exports.newsUpdate = async (req, res) => {
  try {
    const { title, excerpt, content, category, is_active } = req.body;
    const activeStatus = (is_active !== undefined && (is_active == '1' || is_active == 'true' || is_active == 'on')) ? 1 : 0;
    let updates = 'title=?, excerpt=?, content=?, category=?, is_active=?';
    let params = [title, excerpt || '', content || '', category || 'Tin tức', activeStatus];
    if (req.file) {
      const result = await processImage(req.file.path, 'news', req.file.filename);
      updates += ', image_url=?';
      params.push(result.full);
    }
    params.push(req.params.id);
    await db.execute(`UPDATE news SET ${updates} WHERE id=?`, params);
    req.flash('success', 'Cập nhật bài viết thành công!');
    res.redirect('/admin/news');
  } catch (err) { console.error(err); req.flash('error', 'Có lỗi xảy ra khi cập nhật bài viết.'); res.redirect('/admin/news'); }
};
exports.newsDelete = async (req, res) => {
  await db.execute('DELETE FROM news WHERE id=?', [req.params.id]);
  req.flash('success', 'Đã xóa bài viết.');
  res.redirect('/admin/news');
};
exports.newsToggle = async (req, res) => {
  try {
    const article = await db.queryOne('SELECT is_active FROM news WHERE id=?', [req.params.id]);
    if (!article) return res.json({ success: false, message: 'Bài viết không tồn tại' });
    const newStatus = article.is_active ? 0 : 1;
    await db.execute('UPDATE news SET is_active=? WHERE id=?', [newStatus, req.params.id]);
    res.json({ success: true, is_active: Boolean(newStatus) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ========== APPOINTMENTS ==========
exports.appointmentsList = async (req, res) => {
  try {
    const [appointments, statsTotal, statsPending, statsConfirmed, statsCancelled, statsToday] = await Promise.all([
      db.query(`
        SELECT a.*, d.name AS doctor_name, p.name AS package_name 
        FROM appointments a 
        LEFT JOIN doctors d ON a.doctor_id=d.id 
        LEFT JOIN packages p ON a.package_id=p.id 
        ORDER BY a.created_at DESC
      `),
      db.queryOne('SELECT COUNT(*) AS total FROM appointments'),
      db.queryOne("SELECT COUNT(*) AS total FROM appointments WHERE status='pending'"),
      db.queryOne("SELECT COUNT(*) AS total FROM appointments WHERE status='confirmed'"),
      db.queryOne("SELECT COUNT(*) AS total FROM appointments WHERE status='cancelled'"),
      db.queryOne("SELECT COUNT(*) AS total FROM appointments WHERE DATE(appointment_date) = CURDATE() OR DATE(created_at) = CURDATE()")
    ]);

    const stats = {
      total: statsTotal ? statsTotal.total : 0,
      pending: statsPending ? statsPending.total : 0,
      confirmed: statsConfirmed ? statsConfirmed.total : 0,
      cancelled: statsCancelled ? statsCancelled.total : 0,
      today: statsToday ? statsToday.total : 0
    };

    res.render('admin/appointments', { title: 'Quản lý Lịch Hẹn', appointments, stats });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi khi tải danh sách lịch hẹn.');
    res.render('admin/appointments', { title: 'Quản lý Lịch Hẹn', appointments: [], stats: { total: 0, pending: 0, confirmed: 0, cancelled: 0, today: 0 } });
  }
};

exports.appointmentDetail = async (req, res) => {
  try {
    const appointment = await db.queryOne(`
      SELECT a.*, 
             d.name AS doctor_name, d.title AS doctor_title, d.image_url AS doctor_image,
             s.name AS specialty_name,
             p.name AS package_name, p.price AS package_price, p.image_url AS package_image
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN specialties s ON d.specialty_id = s.id
      LEFT JOIN packages p ON a.package_id = p.id
      WHERE a.id = ?
    `, [req.params.id]);

    if (!appointment) {
      req.flash('error', 'Lịch hẹn không tồn tại.');
      return res.redirect('/admin/appointments');
    }

    res.render('admin/appointment-detail', {
      title: `Chi tiết lịch hẹn #${appointment.id} - ${appointment.patient_name}`,
      appointment
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra khi tải chi tiết lịch hẹn.');
    res.redirect('/admin/appointments');
  }
};

exports.appointmentsUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute('UPDATE appointments SET status=? WHERE id=?', [status, req.params.id]);
    req.flash('success', 'Cập nhật trạng thái lịch hẹn thành công!');
    const referer = req.get('Referrer');
    if (referer && referer.includes('/admin/appointments')) {
      return res.redirect(referer);
    }
    res.redirect('/admin/appointments');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra khi đổi trạng thái.');
    res.redirect('/admin/appointments');
  }
};

exports.appointmentUpdateNotes = async (req, res) => {
  try {
    const { admin_notes, status } = req.body;
    let updates = 'admin_notes=?';
    let params = [admin_notes || null];
    if (status) {
      updates += ', status=?';
      params.push(status);
    }
    params.push(req.params.id);
    await db.execute(`UPDATE appointments SET ${updates} WHERE id=?`, params);
    req.flash('success', 'Đã lưu ghi chú lịch hẹn thành công!');
    res.redirect(`/admin/appointments/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra khi lưu ghi chú.');
    res.redirect(`/admin/appointments/${req.params.id}`);
  }
};

exports.appointmentDelete = async (req, res) => {
  try {
    await db.execute('DELETE FROM appointments WHERE id=?', [req.params.id]);
    req.flash('success', 'Đã xóa lịch hẹn thành công.');
    res.redirect('/admin/appointments');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi khi xóa lịch hẹn.');
    res.redirect('/admin/appointments');
  }
};

// ========== CONTACTS ==========
exports.contactsList = async (req, res) => {
  try {
    const [contacts, statsTotal, statsNew, statsInProgress, statsContacted, statsSpam, statsToday] = await Promise.all([
      db.query('SELECT * FROM contacts ORDER BY created_at DESC'),
      db.queryOne('SELECT COUNT(*) AS total FROM contacts'),
      db.queryOne("SELECT COUNT(*) AS total FROM contacts WHERE status='new' OR status IS NULL OR status=''"),
      db.queryOne("SELECT COUNT(*) AS total FROM contacts WHERE status='in_progress'"),
      db.queryOne("SELECT COUNT(*) AS total FROM contacts WHERE status='contacted'"),
      db.queryOne("SELECT COUNT(*) AS total FROM contacts WHERE status='spam'"),
      db.queryOne("SELECT COUNT(*) AS total FROM contacts WHERE DATE(created_at) = CURDATE()")
    ]);

    const stats = {
      total: statsTotal ? statsTotal.total : 0,
      new: statsNew ? statsNew.total : 0,
      in_progress: statsInProgress ? statsInProgress.total : 0,
      contacted: statsContacted ? statsContacted.total : 0,
      spam: statsSpam ? statsSpam.total : 0,
      today: statsToday ? statsToday.total : 0
    };

    res.render('admin/contacts', { title: 'Quản lý Liên Hệ', contacts, stats });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi khi tải danh sách liên hệ.');
    res.render('admin/contacts', { title: 'Quản lý Liên Hệ', contacts: [], stats: { total: 0, new: 0, in_progress: 0, contacted: 0, spam: 0, today: 0 } });
  }
};

exports.contactDetail = async (req, res) => {
  try {
    const contact = await db.queryOne('SELECT * FROM contacts WHERE id=?', [req.params.id]);
    if (!contact) {
      req.flash('error', 'Yêu cầu liên hệ không tồn tại.');
      return res.redirect('/admin/contacts');
    }

    if (!contact.is_read) {
      await db.execute('UPDATE contacts SET is_read=1 WHERE id=?', [contact.id]);
    }

    res.render('admin/contact-detail', {
      title: `Chi tiết liên hệ #${contact.id} - ${contact.full_name}`,
      contact
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi khi tải chi tiết liên hệ.');
    res.redirect('/admin/contacts');
  }
};

exports.contactUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute('UPDATE contacts SET status=?, is_read=1 WHERE id=?', [status, req.params.id]);
    req.flash('success', 'Cập nhật trạng thái liên hệ thành công!');
    const referer = req.get('Referrer');
    if (referer && referer.includes('/admin/contacts')) {
      return res.redirect(referer);
    }
    res.redirect('/admin/contacts');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra khi đổi trạng thái liên hệ.');
    res.redirect('/admin/contacts');
  }
};

exports.contactUpdateNotes = async (req, res) => {
  try {
    const { admin_notes, status } = req.body;
    let updates = 'admin_notes=?, is_read=1';
    let params = [admin_notes || null];
    if (status) {
      updates += ', status=?';
      params.push(status);
    }
    params.push(req.params.id);
    await db.execute(`UPDATE contacts SET ${updates} WHERE id=?`, params);
    req.flash('success', 'Đã lưu ghi chú xử lý liên hệ thành công!');
    res.redirect(`/admin/contacts/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra khi lưu ghi chú liên hệ.');
    res.redirect(`/admin/contacts/${req.params.id}`);
  }
};

exports.contactDelete = async (req, res) => {
  try {
    await db.execute('DELETE FROM contacts WHERE id=?', [req.params.id]);
    req.flash('success', 'Đã xóa yêu cầu liên hệ thành công.');
    res.redirect('/admin/contacts');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi khi xóa yêu cầu liên hệ.');
    res.redirect('/admin/contacts');
  }
};

// ========== ABOUT US (GIỚI THIỆU) ==========
exports.aboutPage = async (req, res) => {
  try {
    const row = await db.queryOne("SELECT setting_value FROM settings WHERE setting_key='page_about'");
    let about = {
      greeting_badge: 'Lời chào từ Phòng Khám VIP',
      main_title: 'Đồng Hành Cùng Sức Khỏe Gia Đình Bạn',
      lead_text: 'Chào mừng Quý khách đến với Phòng Khám VIP. Chúng tôi vinh hạnh được là người bạn đồng hành tin cậy trên hành trình chăm sóc và bảo vệ sức khỏe cho bạn cùng những người thân yêu.',
      mission_title: 'Sứ Mệnh Của Chúng Tôi',
      mission_desc: 'Mang đến dịch vụ y tế toàn diện, chuẩn mực và nhân văn. Chúng tôi đặt y đức, sự an toàn và trải nghiệm thoải mái của bệnh nhân làm kim chỉ nam trong mọi hoạt động khám và điều trị.',
      values: 'Tận Tâm, Chuyên Nghiệp, Hiện Đại, Trách Nhiệm',
      image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800'
    };

    if (row && row.setting_value) {
      try {
        const parsed = JSON.parse(row.setting_value);
        about = { ...about, ...parsed };
      } catch (e) {}
    }

    res.render('admin/about', { title: 'Quản Lý Trang Giới Thiệu', about });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra.');
    res.redirect('/admin/dashboard');
  }
};

exports.aboutUpdate = async (req, res) => {
  try {
    const row = await db.queryOne("SELECT setting_value FROM settings WHERE setting_key='page_about'");
    let currentData = {};
    if (row && row.setting_value) {
      try { currentData = JSON.parse(row.setting_value); } catch (e) {}
    }

    let image_url = currentData.image_url || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800';
    if (req.file) {
      const result = await processImage(req.file.path, 'banners', req.file.filename);
      image_url = result.full;
    }

    const {
      greeting_badge,
      main_title,
      lead_text,
      mission_title,
      mission_desc,
      values
    } = req.body;

    const aboutData = {
      greeting_badge: greeting_badge || '',
      main_title: main_title || '',
      lead_text: lead_text || '',
      mission_title: mission_title || 'Sứ Mệnh Của Chúng Tôi',
      mission_desc: mission_desc || '',
      values: values || '',
      image_url: image_url
    };

    const jsonStr = JSON.stringify(aboutData);
    await db.execute(
      "INSERT INTO settings (setting_key, setting_value) VALUES ('page_about', ?) ON DUPLICATE KEY UPDATE setting_value=?",
      [jsonStr, jsonStr]
    );

    req.flash('success', 'Cập nhật trang Giới thiệu thành công!');
    res.redirect('/admin/about');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật.');
    res.redirect('/admin/about');
  }
};

// ========== SETTINGS (BRAND IDENTITY & CLINIC INFO) ==========
exports.settingsPage = async (req, res) => {
  try {
    const settingsRows = await db.query('SELECT * FROM settings');
    const settings = {};
    settingsRows.forEach(s => { settings[s.setting_key] = s.setting_value; });

    // Defaults if not set
    if (!settings.clinic_name) settings.clinic_name = process.env.CLINIC_NAME || 'Phòng Khám VIP';
    if (!settings.clinic_phone) settings.clinic_phone = process.env.CLINIC_PHONE || '+84 28 3822 1234';
    if (!settings.clinic_email) settings.clinic_email = process.env.CLINIC_EMAIL || 'contact@clinicvip.vn';
    if (!settings.clinic_address) settings.clinic_address = process.env.CLINIC_ADDRESS || '123 Đường ABC, Quận 1, TP.HCM';
    if (!settings.clinic_tax_code) settings.clinic_tax_code = '';
    if (!settings.clinic_working_hours) settings.clinic_working_hours = 'Thứ 2 — Thứ 7: 7:00 — 17:00';
    if (!settings.primary_color) settings.primary_color = '#0090a1';
    if (!settings.primary_dark) settings.primary_dark = '#007a8a';
    if (!settings.clinic_logo) settings.clinic_logo = '/images/logo.svg';
    if (!settings.clinic_favicon) settings.clinic_favicon = '/images/logo.svg';
    if (!settings.social_facebook) settings.social_facebook = '#';
    if (!settings.social_zalo) settings.social_zalo = '#';
    if (!settings.social_youtube) settings.social_youtube = '#';
    if (!settings.social_tiktok) settings.social_tiktok = '';
    if (!settings.clinic_map_url) settings.clinic_map_url = '';

    res.render('admin/settings', {
      title: 'Nhận Diện Thương Hiệu',
      settings
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/dashboard');
  }
};

exports.settingsUpdate = async (req, res) => {
  try {
    const brandingDir = path.join(__dirname, '../public/uploads/branding');
    if (!fs.existsSync(brandingDir)) {
      fs.mkdirSync(brandingDir, { recursive: true });
    }

    // Handle Logo Upload
    if (req.files && req.files.logo && req.files.logo[0]) {
      const logoFile = req.files.logo[0];
      const ext = path.extname(logoFile.originalname).toLowerCase() || '.png';
      const fileName = 'logo_' + Date.now() + ext;
      const targetPath = path.join(brandingDir, fileName);
      fs.copyFileSync(logoFile.path, targetPath);
      fs.unlink(logoFile.path, () => {});
      const logoUrl = '/uploads/branding/' + fileName;
      await db.execute(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=?',
        ['clinic_logo', logoUrl, logoUrl]
      );
    }

    // Handle Favicon Upload
    if (req.files && req.files.favicon && req.files.favicon[0]) {
      const faviconFile = req.files.favicon[0];
      const ext = path.extname(faviconFile.originalname).toLowerCase() || '.png';
      const fileName = 'favicon_' + Date.now() + ext;
      const targetPath = path.join(brandingDir, fileName);
      fs.copyFileSync(faviconFile.path, targetPath);
      fs.unlink(faviconFile.path, () => {});
      const faviconUrl = '/uploads/branding/' + fileName;
      await db.execute(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=?',
        ['clinic_favicon', faviconUrl, faviconUrl]
      );
    }

    // Text & Color & Social fields
    const keysToSave = [
      'clinic_name',
      'clinic_phone',
      'clinic_email',
      'clinic_address',
      'clinic_tax_code',
      'clinic_working_hours',
      'primary_color',
      'primary_dark',
      'social_facebook',
      'social_zalo',
      'social_youtube',
      'social_tiktok',
      'clinic_map_url'
    ];

    for (const key of keysToSave) {
      if (req.body[key] !== undefined) {
        const val = req.body[key].toString().trim();
        await db.execute(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=?',
          [key, val, val]
        );
      }
    }

    req.flash('success', 'Cập nhật thông tin nhận diện thương hiệu thành công!');
    res.redirect('/admin/settings');
  } catch (err) {
    console.error('Settings update error:', err);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật: ' + err.message);
    res.redirect('/admin/settings');
  }
};

// ========== SERVICES (BẢNG GIÁ DỊCH VỤ) ==========
exports.servicesList = async (req, res) => {
  try {
    const { specialty, group, type, q } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(2000, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    let whereSql = 'WHERE 1=1';
    const params = [];

    if (specialty && specialty.trim()) {
      whereSql += ' AND specialty_name = ?';
      params.push(specialty.trim());
    }

    if (group && group.trim()) {
      whereSql += ' AND group_name = ?';
      params.push(group.trim());
    }

    if (type && type.trim()) {
      whereSql += ' AND patient_type = ?';
      params.push(type.trim());
    }

    if (q && q.trim()) {
      whereSql += ' AND (name LIKE ? OR notes LIKE ? OR group_name LIKE ? OR specialty_name LIKE ?)';
      const keyword = `%${q.trim()}%`;
      params.push(keyword, keyword, keyword, keyword);
    }

    const countSql = `SELECT COUNT(*) AS total FROM services ${whereSql}`;
    const dataSql = `SELECT * FROM services ${whereSql} ORDER BY sort_order ASC, group_name ASC, id DESC LIMIT ? OFFSET ?`;
    const dataParams = [...params, limit, offset];

    const [countResult, services, specialties, groups] = await Promise.all([
      db.queryOne(countSql, params),
      db.query(dataSql, dataParams),
      db.query('SELECT DISTINCT specialty_name FROM services WHERE specialty_name IS NOT NULL AND specialty_name != "" ORDER BY specialty_name ASC'),
      db.query('SELECT DISTINCT group_name FROM services WHERE group_name IS NOT NULL AND group_name != "" ORDER BY group_name ASC')
    ]);

    const totalServices = countResult ? countResult.total : 0;
    const totalPages = Math.ceil(totalServices / limit) || 1;

    // JSON response for live search
    if (req.xhr || req.headers.accept?.includes('application/json') || req.query.format === 'json') {
      return res.json({
        success: true,
        count: totalServices,
        page,
        totalPages,
        limit,
        services
      });
    }

    res.render('admin/services', {
      title: 'Quản Lý Bảng Giá Dịch Vụ',
      services,
      specialties: specialties.map(s => s.specialty_name),
      groups: groups.map(g => g.group_name),
      currentSpecialty: specialty || '',
      currentGroup: group || '',
      currentType: type || '',
      searchQuery: q || '',
      currentPage: page,
      totalPages,
      totalServices,
      limit
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { title: 'Lỗi' });
  }
};

exports.servicesCreate = async (req, res) => {
  try {
    const specialties = await db.query('SELECT id, name FROM specialties WHERE is_active=1 ORDER BY sort_order ASC');
    const groups = await db.query('SELECT DISTINCT group_name FROM services WHERE group_name IS NOT NULL AND group_name != "" ORDER BY group_name ASC');
    res.render('admin/service-form', {
      title: 'Thêm Dịch Vụ Mới',
      service: null,
      specialties,
      groups: groups.map(g => g.group_name)
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/services');
  }
};

exports.servicesStore = async (req, res) => {
  try {
    const { specialty_name, group_name, name, patient_type, price, notes, sort_order, is_active } = req.body;
    if (!name || !group_name) {
      req.flash('error', 'Vui lòng nhập tên dịch vụ và nhóm dịch vụ.');
      return res.redirect('/admin/services/create');
    }

    await db.insert(
      'INSERT INTO services (specialty_name, group_name, name, patient_type, price, notes, sort_order, is_active) VALUES (?,?,?,?,?,?,?,?)',
      [
        specialty_name || 'Nội Tổng Hợp',
        group_name || 'Khám Bệnh',
        name.trim(),
        patient_type || 'Dịch vụ',
        parseFloat(price) || 0,
        notes || null,
        parseInt(sort_order) || 0,
        is_active !== undefined ? (is_active ? 1 : 0) : 1
      ]
    );

    req.flash('success', 'Thêm dịch vụ thành công!');
    res.redirect('/admin/services');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra khi lưu dịch vụ.');
    res.redirect('/admin/services');
  }
};

exports.servicesEdit = async (req, res) => {
  try {
    const service = await db.queryOne('SELECT * FROM services WHERE id=?', [req.params.id]);
    if (!service) {
      req.flash('error', 'Không tìm thấy dịch vụ.');
      return res.redirect('/admin/services');
    }
    const specialties = await db.query('SELECT id, name FROM specialties WHERE is_active=1 ORDER BY sort_order ASC');
    const groups = await db.query('SELECT DISTINCT group_name FROM services WHERE group_name IS NOT NULL AND group_name != "" ORDER BY group_name ASC');
    res.render('admin/service-form', {
      title: 'Chỉnh Sửa Dịch Vụ',
      service,
      specialties,
      groups: groups.map(g => g.group_name)
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/services');
  }
};

exports.servicesUpdate = async (req, res) => {
  try {
    const { specialty_name, group_name, name, patient_type, price, notes, sort_order, is_active } = req.body;
    if (!name || !group_name) {
      req.flash('error', 'Vui lòng nhập tên dịch vụ và nhóm dịch vụ.');
      return res.redirect(`/admin/services/${req.params.id}/edit`);
    }

    await db.execute(
      'UPDATE services SET specialty_name=?, group_name=?, name=?, patient_type=?, price=?, notes=?, sort_order=?, is_active=? WHERE id=?',
      [
        specialty_name || 'Nội Tổng Hợp',
        group_name || 'Khám Bệnh',
        name.trim(),
        patient_type || 'Dịch vụ',
        parseFloat(price) || 0,
        notes || null,
        parseInt(sort_order) || 0,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        req.params.id
      ]
    );

    req.flash('success', 'Cập nhật dịch vụ thành công!');
    res.redirect('/admin/services');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật.');
    res.redirect('/admin/services');
  }
};

exports.servicesDelete = async (req, res) => {
  try {
    await db.execute('DELETE FROM services WHERE id=?', [req.params.id]);
    req.flash('success', 'Đã xóa dịch vụ.');
    res.redirect('/admin/services');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Không thể xóa dịch vụ.');
    res.redirect('/admin/services');
  }
};

exports.servicesToggle = async (req, res) => {
  try {
    const service = await db.queryOne('SELECT is_active FROM services WHERE id=?', [req.params.id]);
    if (!service) return res.json({ success: false, message: 'Dịch vụ không tồn tại' });
    const newStatus = service.is_active ? 0 : 1;
    await db.execute('UPDATE services SET is_active=? WHERE id=?', [newStatus, req.params.id]);
    res.json({ success: true, is_active: newStatus });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.servicesToggleAll = async (req, res) => {
  try {
    const { is_active, specialty, group, type, q } = req.body;
    const targetStatus = is_active ? 1 : 0;

    let whereSql = 'WHERE 1=1';
    const params = [targetStatus];

    if (specialty && specialty.trim()) {
      whereSql += ' AND specialty_name = ?';
      params.push(specialty.trim());
    }

    if (group && group.trim()) {
      whereSql += ' AND group_name = ?';
      params.push(group.trim());
    }

    if (type && type.trim()) {
      whereSql += ' AND patient_type = ?';
      params.push(type.trim());
    }

    if (q && q.trim()) {
      whereSql += ' AND (name LIKE ? OR notes LIKE ? OR group_name LIKE ? OR specialty_name LIKE ?)';
      const keyword = `%${q.trim()}%`;
      params.push(keyword, keyword, keyword, keyword);
    }

    await db.execute(`UPDATE services SET is_active=? ${whereSql}`, params);

    res.json({ success: true, is_active: targetStatus });
  } catch (err) {
    console.error('servicesToggleAll error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Export Template Excel for admin to fill (populated with current services)
exports.servicesExportTemplate = async (req, res) => {
  try {
    const xlsx = require('xlsx');

    // Lấy toàn bộ danh sách dịch vụ hiện có trong hệ thống
    const services = await db.query(
      'SELECT specialty_name, group_name, name, patient_type, price, notes FROM services ORDER BY specialty_name ASC, group_name ASC, sort_order ASC, id ASC'
    );

    let templateData = [];
    if (services && services.length > 0) {
      templateData = services.map(s => ({
        'Chuyên khoa/Loại dịch vụ': s.specialty_name || 'Nội Tổng Hợp',
        'Nhóm dịch vụ': s.group_name || 'Khám Bệnh',
        'Tên dịch vụ': s.name || '',
        'Đối tượng': s.patient_type || 'Dịch vụ',
        'Đơn giá': parseFloat(s.price) || 0,
        'Ghi chú': s.notes || ''
      }));
    } else {
      // Dữ liệu mẫu ban đầu nếu hệ thống chưa có dịch vụ nào
      templateData = [
        {
          'Chuyên khoa/Loại dịch vụ': 'Nội Tổng Hợp',
          'Nhóm dịch vụ': 'Khám Bệnh',
          'Tên dịch vụ': 'Khám Nội Tổng Quát',
          'Đối tượng': 'Dịch vụ',
          'Đơn giá': 150000,
          'Ghi chú': 'Khám và tư vấn sức khỏe tổng thể'
        },
        {
          'Chuyên khoa/Loại dịch vụ': 'Nội Tổng Hợp',
          'Nhóm dịch vụ': 'Khám Bệnh',
          'Tên dịch vụ': 'Khám Nội Tổng Quát (BHYT)',
          'Đối tượng': 'BHYT',
          'Đơn giá': 42000,
          'Ghi chú': 'Áp dụng theo danh mục BHYT'
        },
        {
          'Chuyên khoa/Loại dịch vụ': 'Tim Mạch',
          'Nhóm dịch vụ': 'Chẩn Đoán Hình Ảnh',
          'Tên dịch vụ': 'Siêu Âm Tim Doppler Màu 4D',
          'Đối tượng': 'Dịch vụ',
          'Đơn giá': 450000,
          'Ghi chú': 'Đánh giá cấu trúc tim và lưu lượng máu'
        },
        {
          'Chuyên khoa/Loại dịch vụ': 'Nội Tổng Hợp',
          'Nhóm dịch vụ': 'Xét Nghiệm',
          'Tên dịch vụ': 'Tổng Phân Tích Tế Bào Máu Ngoại Vi',
          'Đối tượng': 'Dịch vụ',
          'Đơn giá': 120000,
          'Ghi chú': 'Đánh giá thiếu máu, nhiễm trùng'
        }
      ];
    }

    const worksheet = xlsx.utils.json_to_sheet(templateData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'BangGiaDichVu');

    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 22 },
      { wch: 40 },
      { wch: 15 },
      { wch: 16 },
      { wch: 40 }
    ];

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="File_Mau_Bang_Gia_Dich_Vu.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi khi tạo file mẫu Excel.');
    res.redirect('/admin/services');
  }
};

// Import Excel or CSV (Smart Upsert: Update if exists, Insert if new)
exports.servicesImport = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Vui lòng chọn file Excel hoặc CSV để tải lên.');
      return res.redirect('/admin/services');
    }

    const xlsx = require('xlsx');
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    if (!rows || rows.length === 0) {
      req.flash('error', 'File không có dữ liệu hoặc định dạng không đúng.');
      fs.unlink(req.file.path, () => {});
      return res.redirect('/admin/services');
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const row of rows) {
      const specialty = row['Chuyên khoa/Loại dịch vụ'] || row['Chuyên khoa / Loại dịch vụ'] || row['Chuyen khoa/Loai dich vu'] || row['Chuyên khoa'] || row['Chuyen khoa'] || row['chuyen_khoa'] || row['Specialty'] || 'Nội Tổng Hợp';
      const group = row['Nhóm dịch vụ'] || row['Nhom dich vu'] || row['nhom_dich_vu'] || row['Group'] || 'Khám Bệnh';
      const name = row['Tên dịch vụ'] || row['Ten dich vu'] || row['ten_dich_vu'] || row['Name'] || row['Dịch vụ'];
      const patientType = row['Đối tượng'] || row['Doi tuong'] || row['doi_tuong'] || row['Type'] || 'Dịch vụ';
      const rawPrice = row['Đơn giá'] || row['Đơn giá (VNĐ)'] || row['Don gia'] || row['don_gia'] || row['Price'] || 0;
      const notes = row['Ghi chú'] || row['Ghi chu'] || row['ghi_chu'] || row['Notes'] || '';

      if (name && name.toString().trim()) {
        const cleanName = name.toString().trim();
        const cleanType = patientType.toString().trim();
        const cleanSpecialty = specialty.toString().trim();
        const cleanGroup = group.toString().trim();
        const cleanNotes = notes.toString().trim();
        const price = parseFloat(rawPrice.toString().replace(/[^0-9.-]+/g, '')) || 0;

        // Kiểm tra xem dịch vụ đã tồn tại theo Tên + Đối tượng chưa
        const existing = await db.queryOne(
          'SELECT id FROM services WHERE LOWER(TRIM(name)) = LOWER(?) AND LOWER(TRIM(patient_type)) = LOWER(?)',
          [cleanName, cleanType]
        );

        if (existing) {
          await db.execute(
            'UPDATE services SET specialty_name=?, group_name=?, price=?, notes=? WHERE id=?',
            [cleanSpecialty, cleanGroup, price, cleanNotes, existing.id]
          );
          updatedCount++;
        } else {
          await db.execute(
            'INSERT INTO services (specialty_name, group_name, name, patient_type, price, notes, is_active) VALUES (?,?,?,?,?,?,1)',
            [cleanSpecialty, cleanGroup, cleanName, cleanType, price, cleanNotes]
          );
          insertedCount++;
        }
      }
    }

    fs.unlink(req.file.path, () => {});

    if (updatedCount > 0 && insertedCount > 0) {
      req.flash('success', `Đã xử lý file Excel thành công: Cập nhật ${updatedCount} dịch vụ và thêm mới ${insertedCount} dịch vụ!`);
    } else if (updatedCount > 0) {
      req.flash('success', `Đã cập nhật thành công thông tin ${updatedCount} dịch vụ từ file Excel!`);
    } else {
      req.flash('success', `Đã thêm mới thành công ${insertedCount} dịch vụ từ file Excel!`);
    }
    
    res.redirect('/admin/services');
  } catch (err) {
    console.error('Import error:', err);
    req.flash('error', 'Lỗi khi đọc file: ' + err.message);
    res.redirect('/admin/services');
  }
};

// Export All Services to Excel
exports.servicesExport = async (req, res) => {
  try {
    const xlsx = require('xlsx');
    const services = await db.query('SELECT specialty_name, group_name, name, patient_type, price, notes FROM services ORDER BY group_name ASC, sort_order ASC');
    
    const exportData = services.map(s => ({
      'Chuyên khoa/Loại dịch vụ': s.specialty_name || '',
      'Nhóm dịch vụ': s.group_name || '',
      'Tên dịch vụ': s.name || '',
      'Đối tượng': s.patient_type || 'Dịch vụ',
      'Đơn giá (VNĐ)': parseFloat(s.price) || 0,
      'Ghi chú': s.notes || ''
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'BangGiaDichVu');

    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 22 },
      { wch: 40 },
      { wch: 15 },
      { wch: 18 },
      { wch: 40 }
    ];

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="Bang_Gia_Dich_Vu_Phong_Kham.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi khi xuất dữ liệu ra Excel.');
    res.redirect('/admin/services');
  }
};

// ==========================================
// ========== QUẢN LÝ NGƯỜI DÙNG ============
// ==========================================
exports.usersList = async (req, res) => {
  try {
    const [users, rolesCountRow, statsTotal, statsActive, statsLocked] = await Promise.all([
      db.query(`
        SELECT a.*, r.name AS role_name, r.code AS role_code 
        FROM admins a 
        LEFT JOIN roles r ON a.role_id = r.id 
        ORDER BY a.id ASC
      `),
      db.queryOne('SELECT COUNT(*) AS total FROM roles'),
      db.queryOne('SELECT COUNT(*) AS total FROM admins'),
      db.queryOne('SELECT COUNT(*) AS total FROM admins WHERE is_active=1'),
      db.queryOne('SELECT COUNT(*) AS total FROM admins WHERE is_active=0')
    ]);

    const stats = {
      total: statsTotal ? statsTotal.total : 0,
      active: statsActive ? statsActive.total : 0,
      locked: statsLocked ? statsLocked.total : 0,
      roles: rolesCountRow ? rolesCountRow.total : 0
    };

    res.render('admin/users', {
      title: 'Quản lý Người Dùng',
      users,
      stats
    });
  } catch (err) {
    console.error('usersList error:', err);
    req.flash('error', 'Có lỗi khi tải danh sách người dùng.');
    res.render('admin/users', { title: 'Quản lý Người Dùng', users: [], stats: { total: 0, active: 0, locked: 0, roles: 0 } });
  }
};

exports.usersCreate = async (req, res) => {
  try {
    const roles = await db.query('SELECT * FROM roles ORDER BY id ASC');
    res.render('admin/user-form', {
      title: 'Thêm Người Dùng Mới',
      user: null,
      roles
    });
  } catch (err) {
    console.error('usersCreate error:', err);
    req.flash('error', 'Có lỗi xảy ra.');
    res.redirect('/admin/users');
  }
};

exports.usersStore = async (req, res) => {
  try {
    const { username, full_name, email, phone, password, role_id, is_active } = req.body;
    
    if (!username || !username.trim() || !password || !password.trim()) {
      req.flash('error', 'Tên đăng nhập và mật khẩu là bắt buộc.');
      return res.redirect('/admin/users/create');
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await db.queryOne('SELECT id FROM admins WHERE LOWER(username)=?', [cleanUsername]);
    if (existing) {
      req.flash('error', `Tên đăng nhập "${cleanUsername}" đã tồn tại. Vui lòng chọn tên khác.`);
      return res.redirect('/admin/users/create');
    }

    let avatar_url = '';
    if (req.file) {
      const result = await processImage(req.file.path, 'avatars', req.file.filename);
      avatar_url = result.full;
    }

    const password_hash = await bcrypt.hash(password.trim(), 10);
    const activeVal = (is_active !== undefined && is_active !== null) ? parseInt(is_active) : 1;
    const roleVal = role_id ? parseInt(role_id) : null;

    const insertResult = await db.insert(
      'INSERT INTO admins (username, full_name, email, phone, password_hash, avatar, role_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [cleanUsername, full_name || cleanUsername, email || null, phone || null, password_hash, avatar_url || null, roleVal, activeVal]
    );

    await logActivity(req, {
      action: 'create',
      module: 'users',
      targetId: insertResult.insertId,
      description: `Tạo tài khoản người dùng mới: ${cleanUsername} (${full_name || ''})`
    });

    req.flash('success', `Đã tạo tài khoản "${cleanUsername}" thành công!`);
    res.redirect('/admin/users');
  } catch (err) {
    console.error('usersStore error:', err);
    req.flash('error', 'Có lỗi khi tạo người dùng: ' + err.message);
    res.redirect('/admin/users/create');
  }
};

exports.usersEdit = async (req, res) => {
  try {
    const [user, roles] = await Promise.all([
      db.queryOne('SELECT * FROM admins WHERE id=?', [req.params.id]),
      db.query('SELECT * FROM roles ORDER BY id ASC')
    ]);

    if (!user) {
      req.flash('error', 'Người dùng không tồn tại.');
      return res.redirect('/admin/users');
    }

    res.render('admin/user-form', {
      title: `Sửa Người Dùng: ${user.username}`,
      user,
      roles
    });
  } catch (err) {
    console.error('usersEdit error:', err);
    req.flash('error', 'Có lỗi xảy ra.');
    res.redirect('/admin/users');
  }
};

exports.usersUpdate = async (req, res) => {
  try {
    const user = await db.queryOne('SELECT * FROM admins WHERE id=?', [req.params.id]);
    if (!user) {
      req.flash('error', 'Người dùng không tồn tại.');
      return res.redirect('/admin/users');
    }

    const { full_name, email, phone, password, role_id, is_active } = req.body;
    let updates = 'full_name=?, email=?, phone=?, role_id=?';
    let params = [full_name || user.username, email || null, phone || null, role_id ? parseInt(role_id) : null];

    // Root superadmin (id=1) cannot be deactivated
    if (user.id === 1) {
      updates += ', is_active=1';
    } else if (is_active !== undefined) {
      updates += ', is_active=?';
      params.push(parseInt(is_active) ? 1 : 0);
    }

    if (password && password.trim()) {
      const password_hash = await bcrypt.hash(password.trim(), 10);
      updates += ', password_hash=?';
      params.push(password_hash);
    }

    if (req.file) {
      const result = await processImage(req.file.path, 'avatars', req.file.filename);
      updates += ', avatar=?';
      params.push(result.full);
    }

    params.push(user.id);
    await db.execute(`UPDATE admins SET ${updates} WHERE id=?`, params);

    await logActivity(req, {
      action: 'update',
      module: 'users',
      targetId: user.id,
      description: `Cập nhật thông tin người dùng: ${user.username}`
    });

    req.flash('success', `Đã cập nhật thông tin tài khoản "${user.username}" thành công!`);
    res.redirect('/admin/users');
  } catch (err) {
    console.error('usersUpdate error:', err);
    req.flash('error', 'Có lỗi khi cập nhật: ' + err.message);
    res.redirect(`/admin/users/${req.params.id}/edit`);
  }
};

exports.usersDelete = async (req, res) => {
  try {
    const user = await db.queryOne('SELECT * FROM admins WHERE id=?', [req.params.id]);
    if (!user) {
      req.flash('error', 'Người dùng không tồn tại.');
      return res.redirect('/admin/users');
    }

    if (user.id === 1) {
      req.flash('error', 'Không thể xóa tài khoản Quản trị viên gốc của hệ thống.');
      return res.redirect('/admin/users');
    }

    if (req.currentUser && req.currentUser.id === user.id) {
      req.flash('error', 'Bạn không thể tự xóa tài khoản đang đăng nhập của chính mình.');
      return res.redirect('/admin/users');
    }

    await db.execute('DELETE FROM admins WHERE id=?', [user.id]);

    await logActivity(req, {
      action: 'delete',
      module: 'users',
      targetId: user.id,
      description: `Xóa vĩnh viễn tài khoản người dùng: ${user.username}`
    });

    req.flash('success', `Đã xóa tài khoản "${user.username}" thành công.`);
    res.redirect('/admin/users');
  } catch (err) {
    console.error('usersDelete error:', err);
    req.flash('error', 'Có lỗi khi xóa người dùng.');
    res.redirect('/admin/users');
  }
};

exports.usersToggle = async (req, res) => {
  try {
    const user = await db.queryOne('SELECT id, username, is_active FROM admins WHERE id=?', [req.params.id]);
    if (!user) {
      return res.json({ success: false, message: 'Người dùng không tồn tại' });
    }

    if (user.id === 1) {
      return res.json({ success: false, message: 'Không thể khóa tài khoản Quản trị viên gốc' });
    }

    if (req.currentUser && req.currentUser.id === user.id) {
      return res.json({ success: false, message: 'Bạn không thể tự khóa tài khoản của chính mình' });
    }

    const newStatus = user.is_active ? 0 : 1;
    await db.execute('UPDATE admins SET is_active=? WHERE id=?', [newStatus, user.id]);

    await logActivity(req, {
      action: 'toggle',
      module: 'users',
      targetId: user.id,
      description: `${newStatus ? 'Mở khóa' : 'Khóa'} tài khoản người dùng: ${user.username}`
    });

    res.json({ success: true, is_active: newStatus });
  } catch (err) {
    console.error('usersToggle error:', err);
    res.json({ success: false, error: err.message });
  }
};

exports.usersResetPassword = async (req, res) => {
  try {
    const user = await db.queryOne('SELECT id, username, full_name FROM admins WHERE id=?', [req.params.id]);
    if (!user) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: false, message: 'Người dùng không tồn tại.' });
      }
      req.flash('error', 'Người dùng không tồn tại.');
      return res.redirect('/admin/users');
    }

    const { new_password } = req.body;
    if (!new_password || new_password.trim().length < 6) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
      }
      req.flash('error', 'Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return res.redirect('/admin/users');
    }

    const password_hash = await bcrypt.hash(new_password.trim(), 10);
    await db.execute('UPDATE admins SET password_hash=? WHERE id=?', [password_hash, user.id]);

    await logActivity(req, {
      action: 'update',
      module: 'users',
      targetId: user.id,
      description: `Reset mật khẩu tùy chọn cho tài khoản: @${user.username}`
    });

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ 
        success: true, 
        message: `Đã đặt lại mật khẩu mới cho tài khoản @${user.username} thành công!` 
      });
    }

    req.flash('success', `Đã đặt lại mật khẩu mới cho tài khoản @${user.username} thành công!`);
    res.redirect('/admin/users');
  } catch (err) {
    console.error('usersResetPassword error:', err);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: false, message: 'Có lỗi xảy ra: ' + err.message });
    }
    req.flash('error', 'Có lỗi khi reset mật khẩu: ' + err.message);
    res.redirect('/admin/users');
  }
};

// ==========================================
// ====== THÔNG TIN TÀI KHOẢN CÁ NHÂN =======
// ==========================================
exports.profileView = async (req, res) => {
  try {
    const user = await db.queryOne(`
      SELECT a.*, r.name AS role_name, r.code AS role_code, r.description AS role_description
      FROM admins a
      LEFT JOIN roles r ON a.role_id = r.id
      WHERE a.id = ?
    `, [req.session.adminId]);

    if (!user) {
      req.flash('error', 'Không tìm thấy thông tin tài khoản.');
      return res.redirect('/admin/dashboard');
    }

    // Lấy 5 nhật ký hoạt động gần nhất của chính user này
    const recentLogs = await db.query(`
      SELECT * FROM activity_logs 
      WHERE admin_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [user.id]);

    res.render('admin/profile', {
      title: 'Thông Tin Tài Khoản',
      user,
      recentLogs
    });
  } catch (err) {
    console.error('profileView error:', err);
    res.status(500).render('500', { title: 'Lỗi' });
  }
};

exports.profileUpdate = async (req, res) => {
  try {
    const userId = req.session.adminId;
    const { full_name, email, phone } = req.body;

    let updates = 'full_name=?, email=?, phone=?';
    let params = [full_name ? full_name.trim() : null, email ? email.trim() : null, phone ? phone.trim() : null];

    if (req.file) {
      const result = await processImage(req.file.path, 'avatars', req.file.filename);
      updates += ', avatar=?';
      params.push(result.full);
    }

    params.push(userId);
    await db.execute(`UPDATE admins SET ${updates} WHERE id=?`, params);

    await logActivity(req, {
      action: 'update',
      module: 'users',
      targetId: userId,
      description: `Cập nhật thông tin tài khoản cá nhân`
    });

    req.flash('success', 'Cập nhật thông tin tài khoản thành công!');
    res.redirect('/admin/profile');
  } catch (err) {
    console.error('profileUpdate error:', err);
    req.flash('error', 'Có lỗi khi cập nhật thông tin: ' + err.message);
    res.redirect('/admin/profile');
  }
};

exports.profileChangePassword = async (req, res) => {
  try {
    const userId = req.session.adminId;
    const user = await db.queryOne('SELECT id, username, password_hash FROM admins WHERE id=?', [userId]);
    
    if (!user) {
      req.flash('error', 'Tài khoản không tồn tại.');
      return res.redirect('/admin/profile');
    }

    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      req.flash('error', 'Vui lòng điền đầy đủ mật khẩu hiện tại và mật khẩu mới.');
      return res.redirect('/admin/profile');
    }

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      req.flash('error', 'Mật khẩu hiện tại không chính xác!');
      return res.redirect('/admin/profile');
    }

    if (new_password.length < 6) {
      req.flash('error', 'Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return res.redirect('/admin/profile');
    }

    if (new_password !== confirm_password) {
      req.flash('error', 'Xác nhận mật khẩu mới không trùng khớp!');
      return res.redirect('/admin/profile');
    }

    const newHash = await bcrypt.hash(new_password.trim(), 10);
    await db.execute('UPDATE admins SET password_hash=? WHERE id=?', [newHash, userId]);

    await logActivity(req, {
      action: 'update',
      module: 'users',
      targetId: userId,
      description: `Đổi mật khẩu tài khoản cá nhân (@${user.username})`
    });

    req.flash('success', 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới.');
    res.redirect('/admin/profile');
  } catch (err) {
    console.error('profileChangePassword error:', err);
    req.flash('error', 'Có lỗi khi đổi mật khẩu: ' + err.message);
    res.redirect('/admin/profile');
  }
};

// ==========================================
// ========== NHÓM QUYỀN & MA TRẬN ==========
// ==========================================
exports.rolesList = async (req, res) => {
  try {
    const roles = await db.query(`
      SELECT r.*, COUNT(a.id) AS user_count 
      FROM roles r 
      LEFT JOIN admins a ON r.id = a.role_id 
      GROUP BY r.id 
      ORDER BY r.id ASC
    `);

    res.render('admin/roles', {
      title: 'Nhóm Quyền & Ma Trận Phân Quyền',
      roles,
      permissionModules: PERMISSION_MODULES
    });
  } catch (err) {
    console.error('rolesList error:', err);
    req.flash('error', 'Có lỗi khi tải danh sách nhóm quyền.');
    res.render('admin/roles', { title: 'Nhóm Quyền & Phân Quyền', roles: [], permissionModules: PERMISSION_MODULES });
  }
};

exports.rolesCreate = (req, res) => {
  res.render('admin/role-form', {
    title: 'Thêm Nhóm Quyền Mới',
    role: null,
    permissionModules: PERMISSION_MODULES,
    selectedPermissions: []
  });
};

exports.rolesStore = async (req, res) => {
  try {
    const { name, code, description, permissions } = req.body;
    if (!name || !name.trim()) {
      req.flash('error', 'Tên nhóm quyền là bắt buộc.');
      return res.redirect('/admin/roles/create');
    }

    let finalCode = (code && code.trim()) ? slugify(code.trim(), { lower: true, strict: true }) : slugify(name.trim(), { lower: true, strict: true });
    
    // Check duplicate code
    const existing = await db.queryOne('SELECT id FROM roles WHERE code=?', [finalCode]);
    if (existing) {
      finalCode = finalCode + '-' + Math.floor(Math.random() * 1000);
    }

    let permsArray = [];
    if (permissions) {
      if (Array.isArray(permissions)) {
        permsArray = permissions;
      } else if (typeof permissions === 'string') {
        permsArray = [permissions];
      }
    }

    const insertResult = await db.insert(
      'INSERT INTO roles (name, code, description, permissions, is_system) VALUES (?, ?, ?, ?, 0)',
      [name.trim(), finalCode, description || '', JSON.stringify(permsArray)]
    );

    await logActivity(req, {
      action: 'create',
      module: 'roles',
      targetId: insertResult.insertId,
      description: `Tạo nhóm quyền mới: ${name.trim()} (Mã: ${finalCode})`
    });

    req.flash('success', `Đã tạo nhóm quyền "${name.trim()}" thành công!`);
    res.redirect('/admin/roles');
  } catch (err) {
    console.error('rolesStore error:', err);
    req.flash('error', 'Có lỗi khi tạo nhóm quyền: ' + err.message);
    res.redirect('/admin/roles/create');
  }
};

exports.rolesEdit = async (req, res) => {
  try {
    const role = await db.queryOne('SELECT * FROM roles WHERE id=?', [req.params.id]);
    if (!role) {
      req.flash('error', 'Nhóm quyền không tồn tại.');
      return res.redirect('/admin/roles');
    }

    let selectedPermissions = [];
    if (role.permissions) {
      try {
        selectedPermissions = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions;
        if (!Array.isArray(selectedPermissions)) selectedPermissions = [];
      } catch (e) {
        selectedPermissions = [];
      }
    }

    res.render('admin/role-form', {
      title: `Sửa Nhóm Quyền: ${role.name}`,
      role,
      permissionModules: PERMISSION_MODULES,
      selectedPermissions
    });
  } catch (err) {
    console.error('rolesEdit error:', err);
    req.flash('error', 'Có lỗi xảy ra.');
    res.redirect('/admin/roles');
  }
};

exports.rolesUpdate = async (req, res) => {
  try {
    const role = await db.queryOne('SELECT * FROM roles WHERE id=?', [req.params.id]);
    if (!role) {
      req.flash('error', 'Nhóm quyền không tồn tại.');
      return res.redirect('/admin/roles');
    }

    const { name, description, permissions } = req.body;
    if (!name || !name.trim()) {
      req.flash('error', 'Tên nhóm quyền là bắt buộc.');
      return res.redirect(`/admin/roles/${role.id}/edit`);
    }

    let permsArray = [];
    if (permissions) {
      if (Array.isArray(permissions)) {
        permsArray = permissions;
      } else if (typeof permissions === 'string') {
        permsArray = [permissions];
      }
    }

    await db.execute(
      'UPDATE roles SET name=?, description=?, permissions=? WHERE id=?',
      [name.trim(), description || '', JSON.stringify(permsArray), role.id]
    );

    await logActivity(req, {
      action: 'update',
      module: 'roles',
      targetId: role.id,
      description: `Cập nhật nhóm quyền & ma trận: ${name.trim()}`
    });

    req.flash('success', `Đã cập nhật nhóm quyền "${name.trim()}" thành công!`);
    res.redirect('/admin/roles');
  } catch (err) {
    console.error('rolesUpdate error:', err);
    req.flash('error', 'Có lỗi khi cập nhật nhóm quyền: ' + err.message);
    res.redirect(`/admin/roles/${req.params.id}/edit`);
  }
};

exports.rolesDelete = async (req, res) => {
  try {
    const role = await db.queryOne('SELECT * FROM roles WHERE id=?', [req.params.id]);
    if (!role) {
      req.flash('error', 'Nhóm quyền không tồn tại.');
      return res.redirect('/admin/roles');
    }

    if (role.is_system || role.code === 'superadmin') {
      req.flash('error', 'Không thể xóa nhóm quyền mặc định của hệ thống.');
      return res.redirect('/admin/roles');
    }

    const usersInRole = await db.queryOne('SELECT COUNT(*) AS total FROM admins WHERE role_id=?', [role.id]);
    if (usersInRole && usersInRole.total > 0) {
      req.flash('error', `Không thể xóa nhóm quyền "${role.name}" vì đang có ${usersInRole.total} người dùng được gán vào nhóm này. Hãy chuyển nhóm quyền cho các người dùng trước.`);
      return res.redirect('/admin/roles');
    }

    await db.execute('DELETE FROM roles WHERE id=?', [role.id]);

    await logActivity(req, {
      action: 'delete',
      module: 'roles',
      targetId: role.id,
      description: `Xóa nhóm quyền: ${role.name}`
    });

    req.flash('success', `Đã xóa nhóm quyền "${role.name}" thành công.`);
    res.redirect('/admin/roles');
  } catch (err) {
    console.error('rolesDelete error:', err);
    req.flash('error', 'Có lỗi khi xóa nhóm quyền.');
    res.redirect('/admin/roles');
  }
};

// ==========================================
// ========== NHẬT KÝ HOẠT ĐỘNG (LOGS) ======
// ==========================================
exports.logsList = async (req, res) => {
  try {
    const { q, user, module: mod, action, from_date, to_date } = req.query;

    let whereSql = 'WHERE 1=1';
    let params = [];

    if (q && q.trim()) {
      whereSql += ' AND (description LIKE ? OR username LIKE ? OR ip_address LIKE ?)';
      const keyword = `%${q.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    if (user && user.trim()) {
      whereSql += ' AND username = ?';
      params.push(user.trim());
    }

    if (mod && mod.trim()) {
      whereSql += ' AND module = ?';
      params.push(mod.trim());
    }

    if (action && action.trim()) {
      whereSql += ' AND action = ?';
      params.push(action.trim());
    }

    if (from_date && from_date.trim()) {
      whereSql += ' AND DATE(created_at) >= ?';
      params.push(from_date.trim());
    }

    if (to_date && to_date.trim()) {
      whereSql += ' AND DATE(created_at) <= ?';
      params.push(to_date.trim());
    }

    const [logs, statsTotal, statsToday, statsLogins, statsChanges, usersList] = await Promise.all([
      db.query(`SELECT * FROM activity_logs ${whereSql} ORDER BY created_at DESC LIMIT 300`, params),
      db.queryOne('SELECT COUNT(*) AS total FROM activity_logs'),
      db.queryOne('SELECT COUNT(*) AS total FROM activity_logs WHERE DATE(created_at) = CURDATE()'),
      db.queryOne("SELECT COUNT(*) AS total FROM activity_logs WHERE action IN ('login', 'login_failed')"),
      db.queryOne("SELECT COUNT(*) AS total FROM activity_logs WHERE action IN ('create', 'update', 'delete', 'toggle', 'status_change')"),
      db.query('SELECT DISTINCT username FROM activity_logs ORDER BY username ASC')
    ]);

    const stats = {
      total: statsTotal ? statsTotal.total : 0,
      today: statsToday ? statsToday.total : 0,
      logins: statsLogins ? statsLogins.total : 0,
      changes: statsChanges ? statsChanges.total : 0
    };

    res.render('admin/logs', {
      title: 'Nhật Ký Hoạt Động & Audit Trail',
      logs,
      stats,
      filters: req.query,
      usersList: usersList ? usersList.map(u => u.username) : []
    });
  } catch (err) {
    console.error('logsList error:', err);
    req.flash('error', 'Có lỗi khi tải nhật ký hoạt động.');
    res.render('admin/logs', { title: 'Nhật Ký Hoạt Động', logs: [], stats: { total: 0, today: 0, logins: 0, changes: 0 }, filters: {}, usersList: [] });
  }
};

exports.logsClear = async (req, res) => {
  try {
    const { days } = req.body;
    let sql = 'DELETE FROM activity_logs';
    let params = [];

    if (days && parseInt(days) > 0) {
      sql += ' WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)';
      params.push(parseInt(days));
    }

    await db.execute(sql, params);

    await logActivity(req, {
      action: 'delete',
      module: 'logs',
      description: `Dọn dẹp nhật ký hoạt động cũ (${days ? 'trước ' + days + ' ngày' : 'toàn bộ'})`
    });

    req.flash('success', 'Đã dọn dẹp nhật ký hoạt động thành công.');
    res.redirect('/admin/logs');
  } catch (err) {
    console.error('logsClear error:', err);
    req.flash('error', 'Có lỗi khi dọn dẹp nhật ký: ' + err.message);
    res.redirect('/admin/logs');
  }
};


