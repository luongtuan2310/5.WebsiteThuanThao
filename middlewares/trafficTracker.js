const db = require('../models/db');

/**
 * Middleware to track public website visits & page views
 */
function trackTraffic(req, res, next) {
  // Only track GET requests
  if (req.method !== 'GET') return next();

  const url = req.originalUrl || req.url;

  // Ignore admin pages, API endpoints, uploads and static assets
  if (
    url.startsWith('/admin') ||
    url.startsWith('/api') ||
    url.startsWith('/uploads') ||
    url.startsWith('/css') ||
    url.startsWith('/js') ||
    url.startsWith('/images') ||
    url.startsWith('/fonts') ||
    url.includes('.')
  ) {
    return next();
  }

  // Asynchronously record page view without delaying response
  setImmediate(async () => {
    try {
      let ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '';
      if (ip.includes(',')) ip = ip.split(',')[0].trim();
      ip = ip.substring(0, 45);

      const ua = req.headers['user-agent'] || '';
      let device = 'desktop';
      if (/mobile/i.test(ua)) device = 'mobile';
      else if (/tablet|ipad/i.test(ua)) device = 'tablet';

      const referrer = (req.headers['referer'] || req.headers['referrer'] || '').substring(0, 255);
      const sessionId = (req.sessionID || 'sess_' + Math.random().toString(36).substring(2, 12)).substring(0, 100);
      const pagePath = url.split('?')[0].substring(0, 255) || '/';

      let pageTitle = 'Trang chủ';
      if (pagePath.startsWith('/gioi-thieu') || pagePath.startsWith('/about')) pageTitle = 'Giới thiệu';
      else if (pagePath.startsWith('/bac-si') || pagePath.startsWith('/doctors')) pageTitle = 'Bác sĩ';
      else if (pagePath.startsWith('/dich-vu') || pagePath.startsWith('/services')) pageTitle = 'Dịch vụ';
      else if (pagePath.startsWith('/goi-kham') || pagePath.startsWith('/packages')) pageTitle = 'Gói khám';
      else if (pagePath.startsWith('/chuyen-khoa') || pagePath.startsWith('/specialties')) pageTitle = 'Chuyên khoa';
      else if (pagePath.startsWith('/tin-tuc') || pagePath.startsWith('/news')) pageTitle = 'Tin tức';
      else if (pagePath.startsWith('/lien-he') || pagePath.startsWith('/contact')) pageTitle = 'Liên hệ';
      else if (pagePath.startsWith('/dat-lich') || pagePath.startsWith('/booking')) pageTitle = 'Đặt lịch';

      await db.execute(
        'INSERT INTO page_views (ip_address, session_id, page_path, page_title, referrer, user_agent, device_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [ip, sessionId, pagePath, pageTitle, referrer || null, ua.substring(0, 255) || null, device]
      );
    } catch (err) {
      // Silently ignore traffic tracking error to prevent disrupting user experience
    }
  });

  next();
}

module.exports = { trackTraffic };
