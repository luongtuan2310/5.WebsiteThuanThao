const db = require('../models/db');

exports.index = async (req, res) => {
  try {
    const [doctors, specialties] = await Promise.all([
      db.query(`
        SELECT d.*, s.name AS specialty_name
        FROM doctors d
        LEFT JOIN specialties s ON d.specialty_id = s.id
        WHERE d.is_active=1
        ORDER BY d.sort_order ASC
      `),
      db.query('SELECT id, name FROM specialties WHERE is_active=1 ORDER BY sort_order ASC')
    ]);
    res.render('doctors', { title: 'Đội Ngũ Bác Sĩ', doctors, specialties });
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { title: 'Lỗi' });
  }
};

exports.detail = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await db.queryOne(`
      SELECT d.*, s.name AS specialty_name
      FROM doctors d
      LEFT JOIN specialties s ON d.specialty_id = s.id
      WHERE d.id=? AND d.is_active=1
    `, [doctorId]);

    if (!doctor) {
      return res.status(404).render('404', { title: 'Không tìm thấy thông tin bác sĩ' });
    }

    const [otherDoctors, allPackages] = await Promise.all([
      db.query(`
        SELECT d.*, s.name AS specialty_name
        FROM doctors d
        LEFT JOIN specialties s ON d.specialty_id = s.id
        WHERE d.is_active=1 AND d.id!=?
        ORDER BY d.sort_order ASC LIMIT 4
      `, [doctorId]),
      db.query('SELECT id, name, price FROM packages WHERE is_active=1 ORDER BY sort_order ASC')
    ]);

    res.render('doctor-detail', {
      title: `${doctor.title ? doctor.title + ' ' : ''}${doctor.name}`,
      doc: doctor,
      otherDoctors,
      allPackages
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { title: 'Lỗi máy chủ' });
  }
};
