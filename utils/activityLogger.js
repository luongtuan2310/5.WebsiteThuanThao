const db = require('../models/db');

/**
 * Log user activity into activity_logs table
 * @param {Object} req Express request object
 * @param {Object} options Activity details
 * @param {string} options.action Action type: login, logout, create, update, delete, toggle, status_change
 * @param {string} options.module Module name: auth, users, roles, appointments, contacts, doctors, services, news, banners, settings, packages, specialties, about
 * @param {string|number} [options.targetId] ID or code of affected target
 * @param {string} options.description Human-readable description of what happened
 * @param {number} [options.adminId] Explicit admin ID (optional, defaults to req.session.adminId)
 * @param {string} [options.username] Explicit username (optional, defaults to req.session.adminUsername)
 */
async function logActivity(req, { action, module, targetId = null, description, adminId = null, username = null }) {
  try {
    const finalAdminId = adminId || (req && req.session ? req.session.adminId : null);
    const finalUsername = username || (req && req.session && req.session.adminUsername ? req.session.adminUsername : 'System');

    let ipAddress = '';
    let userAgent = '';

    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '';
      if (ipAddress.includes(',')) {
        ipAddress = ipAddress.split(',')[0].trim();
      }
      userAgent = (req.headers['user-agent'] || '').substring(0, 255);
    }

    await db.execute(
      `INSERT INTO activity_logs (admin_id, username, action, module, target_id, description, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalAdminId,
        finalUsername,
        action || 'action',
        module || 'general',
        targetId ? String(targetId) : null,
        description || '',
        ipAddress ? String(ipAddress).substring(0, 45) : null,
        userAgent || null
      ]
    );
  } catch (err) {
    console.error('⚠️ [Activity Logger Error]:', err.message);
  }
}

module.exports = { logActivity };
