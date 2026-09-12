const PERMISSION_MODULES = [
  {
    module: 'dashboard',
    name: 'Tổng quan (Dashboard)',
    icon: 'fas fa-tachometer-alt',
    actions: [
      { code: 'dashboard.view', name: 'Xem Dashboard & Thống kê' }
    ]
  },
  {
    module: 'banners',
    name: 'Banner Trang Chủ',
    icon: 'fas fa-images',
    actions: [
      { code: 'banners.view', name: 'Xem danh sách' },
      { code: 'banners.create', name: 'Thêm mới' },
      { code: 'banners.edit', name: 'Chỉnh sửa' },
      { code: 'banners.delete', name: 'Xóa' }
    ]
  },
  {
    module: 'about',
    name: 'Giới Thiệu (About Us)',
    icon: 'fas fa-info-circle',
    actions: [
      { code: 'about.view', name: 'Xem nội dung' },
      { code: 'about.edit', name: 'Cập nhật nội dung' }
    ]
  },
  {
    module: 'services',
    name: 'Bảng Giá Dịch Vụ',
    icon: 'fas fa-list-alt',
    actions: [
      { code: 'services.view', name: 'Xem danh sách' },
      { code: 'services.create', name: 'Thêm mới' },
      { code: 'services.edit', name: 'Chỉnh sửa / Bật tắt' },
      { code: 'services.delete', name: 'Xóa' },
      { code: 'services.import_export', name: 'Import / Export Excel' }
    ]
  },
  {
    module: 'packages',
    name: 'Gói Khám Sức Khỏe',
    icon: 'fas fa-box-open',
    actions: [
      { code: 'packages.view', name: 'Xem danh sách' },
      { code: 'packages.create', name: 'Thêm mới' },
      { code: 'packages.edit', name: 'Chỉnh sửa' },
      { code: 'packages.delete', name: 'Xóa' }
    ]
  },
  {
    module: 'specialties',
    name: 'Chuyên Khoa',
    icon: 'fas fa-stethoscope',
    actions: [
      { code: 'specialties.view', name: 'Xem danh sách' },
      { code: 'specialties.create', name: 'Thêm mới' },
      { code: 'specialties.edit', name: 'Chỉnh sửa' },
      { code: 'specialties.delete', name: 'Xóa' }
    ]
  },
  {
    module: 'doctors',
    name: 'Đội Ngũ Bác Sĩ',
    icon: 'fas fa-user-md',
    actions: [
      { code: 'doctors.view', name: 'Xem danh sách' },
      { code: 'doctors.create', name: 'Thêm mới' },
      { code: 'doctors.edit', name: 'Chỉnh sửa' },
      { code: 'doctors.delete', name: 'Xóa' }
    ]
  },
  {
    module: 'news',
    name: 'Tin Tức & Bài Viết',
    icon: 'fas fa-newspaper',
    actions: [
      { code: 'news.view', name: 'Xem danh sách' },
      { code: 'news.create', name: 'Thêm mới' },
      { code: 'news.edit', name: 'Chỉnh sửa' },
      { code: 'news.delete', name: 'Xóa' }
    ]
  },
  {
    module: 'appointments',
    name: 'Quản Lý Lịch Hẹn',
    icon: 'fas fa-calendar-check',
    actions: [
      { code: 'appointments.view', name: 'Xem danh sách & Chi tiết' },
      { code: 'appointments.edit', name: 'Đổi trạng thái lịch hẹn' },
      { code: 'appointments.notes', name: 'Lưu ghi chú nội bộ' },
      { code: 'appointments.delete', name: 'Xóa lịch hẹn' }
    ]
  },
  {
    module: 'contacts',
    name: 'Quản Lý Liên Hệ',
    icon: 'fas fa-envelope',
    actions: [
      { code: 'contacts.view', name: 'Xem danh sách & Chi tiết' },
      { code: 'contacts.edit', name: 'Đổi trạng thái liên hệ' },
      { code: 'contacts.notes', name: 'Lưu ghi chú xử lý' },
      { code: 'contacts.delete', name: 'Xóa liên hệ' }
    ]
  },
  {
    module: 'settings',
    name: 'Cài Đặt & Thương Hiệu',
    icon: 'fas fa-palette',
    actions: [
      { code: 'settings.view', name: 'Xem cài đặt' },
      { code: 'settings.edit', name: 'Thay đổi logo, màu sắc & thông tin' }
    ]
  },
  {
    module: 'users',
    name: 'Quản Lý Người Dùng',
    icon: 'fas fa-users-cog',
    actions: [
      { code: 'users.view', name: 'Xem danh sách tài khoản' },
      { code: 'users.create', name: 'Tạo tài khoản mới' },
      { code: 'users.edit', name: 'Sửa tài khoản / Khóa' },
      { code: 'users.delete', name: 'Xóa tài khoản' }
    ]
  },
  {
    module: 'roles',
    name: 'Nhóm Quyền & Phân Quyền',
    icon: 'fas fa-shield-alt',
    actions: [
      { code: 'roles.view', name: 'Xem danh sách nhóm quyền' },
      { code: 'roles.create', name: 'Tạo nhóm quyền mới' },
      { code: 'roles.edit', name: 'Cập nhật ma trận phân quyền' },
      { code: 'roles.delete', name: 'Xóa nhóm quyền' }
    ]
  },
  {
    module: 'logs',
    name: 'Nhật Ký Hoạt Động (Logs)',
    icon: 'fas fa-history',
    actions: [
      { code: 'logs.view', name: 'Xem lịch sử đăng nhập & thao tác' },
      { code: 'logs.delete', name: 'Xóa / Dọn dẹp nhật ký cũ' }
    ]
  }
];

module.exports = { PERMISSION_MODULES };
