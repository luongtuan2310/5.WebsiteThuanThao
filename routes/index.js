const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const packageController = require('../controllers/packageController');
const specialtyController = require('../controllers/specialtyController');
const doctorController = require('../controllers/doctorController');
const newsController = require('../controllers/newsController');
const appointmentController = require('../controllers/appointmentController');
const serviceController = require('../controllers/serviceController');

// Home
router.get('/', homeController.index);

// About Us (Về chúng tôi)
router.get('/ve-chung-toi', homeController.about);
router.get('/gioi-thieu', (req, res) => res.redirect('/ve-chung-toi'));

// Services (Giá dịch vụ)
router.get('/dich-vu', serviceController.index);
router.get('/gia-dich-vu', (req, res) => res.redirect('/dich-vu'));
router.get('/bang-gia', (req, res) => res.redirect('/dich-vu'));
router.get('/api/services-all', serviceController.apiAll);

// Packages
router.get('/goi-kham', packageController.index);
router.get('/goi-kham/:id', packageController.detail);

// Specialties
router.get('/chuyen-khoa', specialtyController.index);
router.get('/chuyen-khoa/:id', specialtyController.detail);

// Doctors
router.get('/bac-si', doctorController.index);
router.get('/bac-si/:id', doctorController.detail);

// News
router.get('/tin-tuc', newsController.index);
router.get('/tin-tuc/:slug', newsController.detail);

// Appointment
router.get('/dat-lich', appointmentController.index);
router.post('/dat-lich', appointmentController.store);

// Contact
router.get('/lien-he', (req, res) => res.render('contact', { title: 'Liên hệ' }));
router.post('/lien-he', appointmentController.storeContact);

// Privacy Policy (Chính sách bảo mật)
router.get('/chinh-sach-bao-mat', (req, res) => res.render('privacy-policy', { title: 'Chính Sách Bảo Mật' }));

module.exports = router;
