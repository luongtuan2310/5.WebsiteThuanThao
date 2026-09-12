const db = require('../models/db');

exports.index = async (req, res) => {
  try {
    const specialties = await db.query(
      'SELECT * FROM specialties WHERE is_active=1 ORDER BY sort_order ASC'
    );
    res.render('specialties', { title: 'Chuyên Khoa', specialties });
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { title: 'Lỗi' });
  }
};

exports.detail = async (req, res) => {
  try {
    const specialtyId = req.params.id;
    const specialty = await db.queryOne(
      'SELECT * FROM specialties WHERE id=? AND is_active=1',
      [specialtyId]
    );

    if (!specialty) {
      return res.status(404).render('404', { title: 'Không tìm thấy chuyên khoa' });
    }

    const [doctors, otherSpecialties, allPackages] = await Promise.all([
      db.query(
        'SELECT * FROM doctors WHERE specialty_id=? AND is_active=1 ORDER BY sort_order ASC',
        [specialtyId]
      ),
      db.query(
        'SELECT * FROM specialties WHERE is_active=1 AND id!=? ORDER BY sort_order ASC LIMIT 2',
        [specialtyId]
      ),
      db.query('SELECT id, name, price FROM packages WHERE is_active=1 ORDER BY sort_order ASC')
    ]);

    res.render('specialty-detail', {
      title: specialty.name,
      specialty,
      doctors,
      otherSpecialties,
      allPackages
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { title: 'Lỗi máy chủ' });
  }
};
