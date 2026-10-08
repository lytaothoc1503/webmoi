/* ====== CẤU HÌNH WEB — CHỈ CẦN SỬA FILE NÀY ĐỂ ĐỔI THÔNG TIN LIÊN HỆ ====== */
window.SITE = {
  name: 'Nhà của An Homestay Tà Xùa',
  short: 'Nhà của An',
  slogan: 'Thức dậy giữa biển mây Tà Xùa',
  address: 'Tà Xùa, Bắc Yên, Sơn La, Việt Nam',
  mapQuery: 'Tà Xùa, Bắc Yên, Sơn La, Việt Nam',
  checkin: '14:00', // giờ mẫu — sửa theo thực tế
  checkout: '12:00',

  // Để trống '' = chưa có (nút hiện "Đang cập nhật"). Điền vào là web tự cập nhật.
  // Video giới thiệu (tùy chọn): bỏ file vào images/ rồi ghi 'images/video-gioi-thieu.mp4' (hoặc link .mp4). Để trống = hiện ảnh.
  // Video banner (tùy chọn): file .mp4 ~8 giây, dưới 3MB, không tiếng, đặt trong images/. Để trống = dùng ảnh.
  heroVideo: '',
  heroPoster: 'images/hero-san-may.jpg',
  introVideo: '',
  introPoster: 'images/video-poster.jpg',
  contacts: {
    facebook: 'https://www.facebook.com/share/1dCcJYWvU1/',
    phone: '0352554863',
    email: '', // ví dụ: 'ten@gmail.com'
  },
  hideEmptyContacts: true, // true = ẩn hẳn nút chưa có thông tin (hiện chưa dùng Zalo, Gmail)

  // Thanh toán QR: để trống thì web chỉ nhận yêu cầu đặt phòng, không hiện mã QR.
  // bankId là mã ngân hàng theo VietQR (ví dụ MB = '970422').
  bank: { bankName: 'MB Bank (Quân Đội)', bankId: '970422', accountNo: '8386', accountName: 'NGO BA KHA' }, // TÀI KHOẢN THỬ NGHIỆM, thay bằng tài khoản thật của nhà

  // Cơ sở dữ liệu Supabase (Project Settings > API). Chỉ dán 'Project URL' và khóa 'anon public'.
  // KHÔNG BAO GIỜ dán khóa 'service_role' vào đây. Để trống thì web dùng dữ liệu trong data.js, và đơn chỉ gửi qua Facebook.
  turnstileSiteKey: '', // Cloudflare Turnstile Site Key (công khai). Để trống = chưa bật chống bot.
  // Đăng nhập mạng xã hội: chỉ bật (true) SAU KHI đã cấu hình nhà cung cấp trong Supabase → Authentication → Providers. Chưa bật thì nút bị ẩn.
  socialLogin: { facebook: false, google: false },
  supabase: { url: 'https://hkfprewiprdztmdcoxzz.supabase.co', anonKey: 'sb_publishable_PZKK2CZBNQl8vez05Db4Gg_N8Fe9qm3' },
};
