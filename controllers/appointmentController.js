const db = require('../models/db');

exports.index = async (req, res) => {
  try {
    const [doctors, packages] = await Promise.all([
      db.query('SELECT id, name, title FROM doctors WHERE is_active=1 ORDER BY name ASC'),
      db.query('SELECT id, name, price FROM packages WHERE is_active=1 ORDER BY sort_order ASC')
    ]);
    const selectedDoctor = req.query.doctor || '';
    const selectedPackage = req.query.package || '';
    res.render('appointment', {
      title: 'Đặt Lịch Hẹn',
      doctors,
      packages,
      selectedDoctor,
      selectedPackage
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500', { title: 'Lỗi máy chủ' });
  }
};

exports.store = async (req, res) => {
  const referer = req.get('Referrer') || '/dat-lich';
  try {
    const { patient_name, phone, email, doctor_id, package_id, appointment_date, appointment_time, notes, birthday, gender, insurance } = req.body;
    if (!patient_name || !phone) {
      req.flash('error', 'Vui lòng điền đầy đủ họ tên và số điện thoại.');
      return res.redirect(referer);
    }
    let formattedBirthday = null;
    if (birthday && typeof birthday === 'string') {
      const parts = birthday.trim().split('/');
      if (parts.length === 3) {
        formattedBirthday = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      } else {
        formattedBirthday = birthday;
      }
    }

    await db.insert(
      'INSERT INTO appointments (patient_name, phone, email, doctor_id, package_id, appointment_date, appointment_time, notes, birthday, gender, insurance) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [patient_name, phone, email || null, doctor_id || null, package_id || null, appointment_date || null, appointment_time || null, notes || null, formattedBirthday || null, gender || null, insurance || 'Không']
    );
    req.flash('success', 'Đặt lịch hẹn thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');
    res.redirect(referer);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra. Vui lòng thử lại.');
    res.redirect(referer);
  }
};

exports.storeContact = async (req, res) => {
  try {
    const { full_name, phone, email, message } = req.body;
    if (!full_name) {
      req.flash('error', 'Vui lòng điền họ tên.');
      return res.redirect('/lien-he');
    }
    await db.insert(
      'INSERT INTO contacts (full_name, phone, email, message) VALUES (?,?,?,?)',
      [full_name, phone || null, email || null, message || null]
    );
    req.flash('success', 'Tin nhắn đã được gửi! Chúng tôi sẽ phản hồi sớm nhất.');
    res.redirect('/lien-he');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra. Vui lòng thử lại.');
    res.redirect('/lien-he');
  }
};
