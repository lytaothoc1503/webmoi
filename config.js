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
  heroPoster: 'images/hero-san-may.webp',
  introVideo: '',
  introPoster: 'images/video-poster.webp',
  contacts: {
    facebook: 'https://www.facebook.com/share/1dCcJYWvU1/',
    messenger: 'https://m.me/104705621935809', // m.me + mã Trang Facebook của nhà
    phone: '0358314934',
    email: '', // ví dụ: 'ten@gmail.com'
  },
  hideEmptyContacts: true, // true = ẩn hẳn nút chưa có thông tin (hiện chưa dùng Zalo, Gmail)

  // Thanh toán QR: để trống bankId hoặc accountNo thì web chỉ nhận yêu cầu đặt phòng, không hiện mã QR.
  // bankId là mã BIN VietQR (NCB = '970419'). Chỉ hiện cho đơn đang chờ chuyển khoản.
  // transferBase là nội dung chuyển khoản gốc. Không gắn nội dung này vào ảnh QR lúc mở trang.
  // Khách bấm "Tạo mã QR đặt phòng" thì mới tạo nội dung: giữ nguyên transferBase và thêm 3 chữ số ngẫu nhiên ở cuối.
  bank: { bankName: 'NCB - Ngân hàng TMCP Quốc Dân', bankId: '970419', accountNo: '107864245284', accountName: 'VO THI NGOC HAN', transferBase: 'AL0IO721' },

  // Cơ sở dữ liệu Supabase (Project Settings > API). Chỉ dán 'Project URL' và khóa 'anon public'.
  // KHÔNG BAO GIỜ dán khóa 'service_role' vào đây. Để trống thì web dùng dữ liệu trong data.js, và đơn chỉ gửi qua Facebook.
  turnstileSiteKey: '0x4AAAAAAFXz_8XBZ_1wZyjM', // Cloudflare Turnstile Site Key (công khai). Để trống = chưa bật chống bot.
  analyticsToken: '1ebe0021e8fa42b68026458c88562ffc', // Cloudflare Web Analytics token (công khai, không cookie). Để trống = chưa đo.
  // Đăng nhập mạng xã hội: chỉ bật (true) SAU KHI đã cấu hình nhà cung cấp trong Supabase → Authentication → Providers. Chưa bật thì nút bị ẩn.
  socialLogin: { facebook: false, google: false },
  supabase: { url: 'https://hkfprewiprdztmdcoxzz.supabase.co', anonKey: 'sb_publishable_PZKK2CZBNQl8vez05Db4Gg_N8Fe9qm3' },
};
