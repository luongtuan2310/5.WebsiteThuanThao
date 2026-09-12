const db = require('../models/db');

exports.index = async (req, res) => {
  try {
    const { specialty, group, type, q } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(2000, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    let whereSql = 'WHERE is_active=1';
    const params = [];

    if (specialty && specialty.trim()) {
      whereSql += ' AND (specialty_name = ? OR specialty_id = ?)';
      params.push(specialty.trim(), specialty.trim());
    }

    if (group && group.trim()) {
      whereSql += ' AND group_name = ?';
      params.push(group.trim());
    }

    if (type && type.trim()) {
      whereSql += ' AND (patient_type = ? OR patient_type = "Tất cả")';
      params.push(type.trim());
    }

    if (q && q.trim()) {
      whereSql += ' AND (name LIKE ? OR notes LIKE ? OR group_name LIKE ? OR specialty_name LIKE ?)';
      const keyword = `%${q.trim()}%`;
      params.push(keyword, keyword, keyword, keyword);
    }

    const countSql = `SELECT COUNT(*) AS total FROM services ${whereSql}`;
    const dataSql = `SELECT * FROM services ${whereSql} ORDER BY sort_order ASC, group_name ASC, name ASC LIMIT ? OFFSET ?`;

    const dataParams = [...params, limit, offset];

    const [countResult, services, specialties, groups] = await Promise.all([
      db.queryOne(countSql, params),
      db.query(dataSql, dataParams),
      db.query('SELECT DISTINCT specialty_name FROM services WHERE specialty_name IS NOT NULL AND specialty_name != "" ORDER BY specialty_name ASC'),
      db.query('SELECT DISTINCT group_name FROM services WHERE group_name IS NOT NULL AND group_name != "" ORDER BY group_name ASC')
    ]);

    const totalServices = countResult ? countResult.total : 0;
    const totalPages = Math.ceil(totalServices / limit) || 1;

    // Format if JSON requested (for AJAX live search)
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

    res.render('services', {
      title: 'Bảng Giá Dịch Vụ Y Tế',
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
    console.error('Service page error:', err);
    res.status(500).render('500', { title: 'Lỗi máy chủ' });
  }
};

exports.apiAll = async (req, res) => {
  try {
    let services = [];
    try {
      services = await db.query('SELECT id, name, group_name, price FROM services WHERE is_active=1 OR is_active IS NULL ORDER BY group_name ASC, sort_order ASC, name ASC');
    } catch (e) {
      services = await db.query('SELECT id, name, group_name, price FROM services ORDER BY group_name ASC, name ASC');
    }
    res.json({ success: true, services: services || [] });
  } catch (err) {
    console.error('apiAll error:', err);
    res.json({ success: false, services: [] });
  }
};
