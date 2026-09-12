const db = require('../models/db');

// Thời gian hết hạn phiên do không hoạt động: 30 phút (1,800,000 ms)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Admin authentication middleware
const requireAuth = async (req, res, next) => {
  if (!req.session || !req.session.adminId) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/admin/login');
  }

  // Kiểm tra thời gian không hoạt động (Inactivity Timeout 30 phút)
  const now = Date.now();
  if (req.session.lastActivity && (now - req.session.lastActivity > INACTIVITY_TIMEOUT)) {
    delete req.session.adminId;
    delete req.session.adminUsername;
    delete req.session.lastActivity;
    return res.redirect('/admin/login?timeout=1');
  }

  // Cập nhật mốc hoạt động gần nhất
  req.session.lastActivity = now;

  try {
    const admin = await db.queryOne(`
      SELECT a.*, r.name AS role_name, r.code AS role_code, r.permissions AS role_permissions
      FROM admins a
      LEFT JOIN roles r ON a.role_id = r.id
      WHERE a.id = ?
    `, [req.session.adminId]);

    if (!admin || !admin.is_active) {
      req.session.destroy(() => {});
      return res.redirect('/admin/login?locked=1');
    }

    let permissions = [];
    const isSuperadmin = admin.role_code === 'superadmin' || admin.id === 1;

    if (isSuperadmin) {
      permissions = ['*']; // Superadmin has all permissions
    } else if (admin.role_permissions) {
      try {
        permissions = typeof admin.role_permissions === 'string' ? JSON.parse(admin.role_permissions) : admin.role_permissions;
        if (!Array.isArray(permissions)) permissions = [];
      } catch (e) {
        permissions = [];
      }
    }

    req.currentUser = {
      id: admin.id,
      username: admin.username,
      full_name: admin.full_name || admin.username,
      email: admin.email,
      phone: admin.phone,
      avatar: admin.avatar,
      role_id: admin.role_id,
      role_name: admin.role_name || 'Nhân viên',
      role_code: admin.role_code || 'staff',
      is_superadmin: isSuperadmin,
      permissions
    };

    res.locals.currentUser = req.currentUser;
    res.locals.userPermissions = permissions;
    res.locals.hasPermission = (perm) => {
      if (isSuperadmin) return true;
      return permissions.includes(perm);
    };

    next();
  } catch (err) {
    console.error('requireAuth error:', err);
    res.redirect('/admin/login');
  }
};

const requireGuest = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  next();
};

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.currentUser) {
      return res.redirect('/admin/login');
    }

    if (req.currentUser.is_superadmin) {
      return next();
    }

    const hasPerm = req.currentUser.permissions && (
      req.currentUser.permissions.includes('*') ||
      req.currentUser.permissions.includes(requiredPermission)
    );

    if (hasPerm) {
      return next();
    }

    // If AJAX request
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này.' });
    }

    req.flash('error', 'Bạn không có quyền truy cập chức năng này.');
    const referer = req.get('Referrer');
    if (referer && referer.includes('/admin')) {
      return res.redirect(referer);
    }
    return res.redirect('/admin/dashboard');
  };
};

module.exports = { requireAuth, requireGuest, checkPermission };
