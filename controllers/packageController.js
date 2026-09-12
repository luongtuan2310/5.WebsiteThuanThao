const db = require('../models/db');

exports.index = async (req, res) => {
  try {
    const packages = await db.query(
      'SELECT * FROM packages WHERE is_active=1 ORDER BY sort_order ASC'
    );
    res.render('packages', { title: 'Gói Khám', packages });
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { title: 'Lỗi' });
  }
};

exports.detail = async (req, res) => {
  try {
    const id = req.params.id;
    const [pkg, allPackages, doctors, otherPackages] = await Promise.all([
      db.queryOne('SELECT * FROM packages WHERE id=? AND is_active=1', [id]),
      db.query('SELECT id, name, price FROM packages WHERE is_active=1 ORDER BY sort_order ASC'),
      db.query('SELECT id, name, title FROM doctors WHERE is_active=1 ORDER BY name ASC'),
      db.query('SELECT * FROM packages WHERE is_active=1 AND id!=? ORDER BY sort_order ASC LIMIT 4', [id])
    ]);
    if (!pkg) {
      return res.status(404).render('404', { title: 'Không tìm thấy gói khám' });
    }

    res.render('package-detail', {
      title: pkg.name,
      pkg,
      allPackages,
      doctors,
      otherPackages
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { title: 'Lỗi' });
  }
};
