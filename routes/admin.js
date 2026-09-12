const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireGuest, checkPermission } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

// Multer: disk storage to /uploads/tmp/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads/tmp'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024, fieldSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg|ico|x-icon/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = /image\/(jpeg|jpg|png|webp|gif|svg\+xml|x-icon|vnd\.microsoft\.icon)|application\/octet-stream/.test(file.mimetype) || ext;
    if (ext || mime) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp, gif, svg, ico)'));
  }
});

const uploadFile = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /xlsx|xls|csv/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc .csv'));
  }
});

// Auth
router.get('/login', requireGuest, adminController.loginPage);
router.post('/login', requireGuest, adminController.login);
router.get('/logout', adminController.logout);
router.post('/logout', adminController.logout);

// Profile & Personal Account Settings
router.get('/profile', requireAuth, adminController.profileView);
router.post('/profile', requireAuth, upload.single('avatar'), adminController.profileUpdate);
router.post('/profile/password', requireAuth, adminController.profileChangePassword);

// Dashboard
router.get('/', requireAuth, checkPermission('dashboard.view'), adminController.dashboard);
router.get('/dashboard', requireAuth, checkPermission('dashboard.view'), adminController.dashboard);

// Banners
router.get('/banners', requireAuth, checkPermission('banners.view'), adminController.bannersList);
router.get('/banners/create', requireAuth, checkPermission('banners.create'), adminController.bannersCreate);
router.post('/banners/create', requireAuth, checkPermission('banners.create'), upload.single('image'), adminController.bannersStore);
router.get('/banners/:id/edit', requireAuth, checkPermission('banners.edit'), adminController.bannersEdit);
router.post('/banners/:id/edit', requireAuth, checkPermission('banners.edit'), upload.single('image'), adminController.bannersUpdate);
router.post('/banners/:id/delete', requireAuth, checkPermission('banners.delete'), adminController.bannersDelete);
router.post('/banners/:id/toggle', requireAuth, checkPermission('banners.edit'), adminController.bannersToggle);

// About Us (Giới thiệu)
router.get('/about', requireAuth, checkPermission('about.view'), adminController.aboutPage);
router.post('/about', requireAuth, checkPermission('about.edit'), upload.single('image'), adminController.aboutUpdate);

// Services (Bảng giá dịch vụ)
router.get('/services', requireAuth, checkPermission('services.view'), adminController.servicesList);
router.get('/services/create', requireAuth, checkPermission('services.create'), adminController.servicesCreate);
router.post('/services/create', requireAuth, checkPermission('services.create'), adminController.servicesStore);
router.get('/services/template', requireAuth, checkPermission('services.import_export'), adminController.servicesExportTemplate);
router.post('/services/import', requireAuth, checkPermission('services.import_export'), uploadFile.single('file'), adminController.servicesImport);
router.get('/services/export', requireAuth, checkPermission('services.import_export'), adminController.servicesExport);
router.get('/services/:id/edit', requireAuth, checkPermission('services.edit'), adminController.servicesEdit);
router.post('/services/:id/edit', requireAuth, checkPermission('services.edit'), adminController.servicesUpdate);
router.post('/services/:id/delete', requireAuth, checkPermission('services.delete'), adminController.servicesDelete);
router.post('/services/toggle-all', requireAuth, checkPermission('services.edit'), adminController.servicesToggleAll);
router.post('/services/:id/toggle', requireAuth, checkPermission('services.edit'), adminController.servicesToggle);

// Packages
router.get('/packages', requireAuth, checkPermission('packages.view'), adminController.packagesList);
router.get('/packages/create', requireAuth, checkPermission('packages.create'), adminController.packagesCreate);
router.post('/packages/create', requireAuth, checkPermission('packages.create'), upload.any(), adminController.packagesStore);
router.get('/packages/:id/edit', requireAuth, checkPermission('packages.edit'), adminController.packagesEdit);
router.post('/packages/:id/edit', requireAuth, checkPermission('packages.edit'), upload.any(), adminController.packagesUpdate);
router.post('/packages/:id/delete', requireAuth, checkPermission('packages.delete'), adminController.packagesDelete);
router.post('/packages/:id/toggle-featured', requireAuth, checkPermission('packages.edit'), adminController.packagesToggleFeatured);

// Specialties
router.get('/specialties', requireAuth, checkPermission('specialties.view'), adminController.specialtiesList);
router.get('/specialties/create', requireAuth, checkPermission('specialties.create'), adminController.specialtiesCreate);
router.post('/specialties/create', requireAuth, checkPermission('specialties.create'), upload.single('image'), adminController.specialtiesStore);
router.get('/specialties/:id/edit', requireAuth, checkPermission('specialties.edit'), adminController.specialtiesEdit);
router.post('/specialties/:id/edit', requireAuth, checkPermission('specialties.edit'), upload.single('image'), adminController.specialtiesUpdate);
router.post('/specialties/:id/delete', requireAuth, checkPermission('specialties.delete'), adminController.specialtiesDelete);
router.post('/specialties/:id/toggle', requireAuth, checkPermission('specialties.edit'), adminController.specialtiesToggle);

// Doctors
router.get('/doctors', requireAuth, checkPermission('doctors.view'), adminController.doctorsList);
router.get('/doctors/create', requireAuth, checkPermission('doctors.create'), adminController.doctorsCreate);
router.post('/doctors/create', requireAuth, checkPermission('doctors.create'), upload.single('image'), adminController.doctorsStore);
router.get('/doctors/:id/edit', requireAuth, checkPermission('doctors.edit'), adminController.doctorsEdit);
router.post('/doctors/:id/edit', requireAuth, checkPermission('doctors.edit'), upload.single('image'), adminController.doctorsUpdate);
router.post('/doctors/:id/delete', requireAuth, checkPermission('doctors.delete'), adminController.doctorsDelete);
router.post('/doctors/:id/toggle-featured', requireAuth, checkPermission('doctors.edit'), adminController.doctorsToggleFeatured);

// News
router.get('/news', requireAuth, checkPermission('news.view'), adminController.newsList);
router.get('/news/create', requireAuth, checkPermission('news.create'), adminController.newsCreate);
router.post('/news/create', requireAuth, checkPermission('news.create'), upload.single('image'), adminController.newsStore);
router.get('/news/:id/edit', requireAuth, checkPermission('news.edit'), adminController.newsEdit);
router.post('/news/:id/edit', requireAuth, checkPermission('news.edit'), upload.single('image'), adminController.newsUpdate);
router.post('/news/:id/delete', requireAuth, checkPermission('news.delete'), adminController.newsDelete);
router.post('/news/:id/toggle', requireAuth, checkPermission('news.edit'), adminController.newsToggle);

// Appointments
router.get('/appointments', requireAuth, checkPermission('appointments.view'), adminController.appointmentsList);
router.get('/appointments/:id', requireAuth, checkPermission('appointments.view'), adminController.appointmentDetail);
router.post('/appointments/:id/status', requireAuth, checkPermission('appointments.edit'), adminController.appointmentsUpdateStatus);
router.post('/appointments/:id/notes', requireAuth, checkPermission('appointments.notes'), adminController.appointmentUpdateNotes);
router.post('/appointments/:id/delete', requireAuth, checkPermission('appointments.delete'), adminController.appointmentDelete);

// Contacts
router.get('/contacts', requireAuth, checkPermission('contacts.view'), adminController.contactsList);
router.get('/contacts/:id', requireAuth, checkPermission('contacts.view'), adminController.contactDetail);
router.post('/contacts/:id/status', requireAuth, checkPermission('contacts.edit'), adminController.contactUpdateStatus);
router.post('/contacts/:id/notes', requireAuth, checkPermission('contacts.notes'), adminController.contactUpdateNotes);
router.post('/contacts/:id/delete', requireAuth, checkPermission('contacts.delete'), adminController.contactDelete);

// Users Management
router.get('/users', requireAuth, checkPermission('users.view'), adminController.usersList);
router.get('/users/create', requireAuth, checkPermission('users.create'), adminController.usersCreate);
router.post('/users/create', requireAuth, checkPermission('users.create'), upload.single('avatar'), adminController.usersStore);
router.get('/users/:id/edit', requireAuth, checkPermission('users.edit'), adminController.usersEdit);
router.post('/users/:id/edit', requireAuth, checkPermission('users.edit'), upload.single('avatar'), adminController.usersUpdate);
router.post('/users/:id/delete', requireAuth, checkPermission('users.delete'), adminController.usersDelete);
router.post('/users/:id/toggle', requireAuth, checkPermission('users.edit'), adminController.usersToggle);
router.post('/users/:id/reset-password', requireAuth, checkPermission('users.edit'), adminController.usersResetPassword);

// Roles Management & Permission Matrix
router.get('/roles', requireAuth, checkPermission('roles.view'), adminController.rolesList);
router.get('/roles/create', requireAuth, checkPermission('roles.create'), adminController.rolesCreate);
router.post('/roles/create', requireAuth, checkPermission('roles.create'), adminController.rolesStore);
router.get('/roles/:id/edit', requireAuth, checkPermission('roles.edit'), adminController.rolesEdit);
router.post('/roles/:id/edit', requireAuth, checkPermission('roles.edit'), adminController.rolesUpdate);
router.post('/roles/:id/delete', requireAuth, checkPermission('roles.delete'), adminController.rolesDelete);

// Activity Logs (Audit Trail)
router.get('/logs', requireAuth, checkPermission('logs.view'), adminController.logsList);
router.post('/logs/clear', requireAuth, checkPermission('logs.delete'), adminController.logsClear);

// Settings & Brand Identity
router.get('/settings', requireAuth, checkPermission('settings.view'), adminController.settingsPage);
router.post('/settings', requireAuth, checkPermission('settings.edit'), upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 }
]), adminController.settingsUpdate);

module.exports = router;
