-- Siết bảo mật: bỏ quyền thừa của khách chưa đăng nhập, thêm giới hạn dữ liệu cho đơn đặt.
-- (RLS vẫn là lớp chặn chính; đây là lớp bảo vệ thêm.)

-- 1) Khách chưa đăng nhập không cần chạm trực tiếp vào bảng đơn và bảng quản trị (đã có hàm tra cứu riêng)
REVOKE ALL ON public.bookings FROM anon;
REVOKE ALL ON public.admins FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.bookings FROM authenticated;

-- 2) Khách chưa đăng nhập chỉ được ĐỌC danh mục công khai, không ghi/xóa
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.rooms, public.tours, public.gallery, public.faq, public.reviews FROM anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.rooms, public.tours, public.gallery, public.faq, public.reviews FROM authenticated;

-- 3) Giới hạn giá trị và độ dài của đơn đặt
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_limits;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_limits CHECK (
  total_price BETWEEN 0 AND 100000000
  AND char_length(room) BETWEEN 1 AND 120
  AND char_length(fullname) BETWEEN 1 AND 80
  AND char_length(phone) BETWEEN 9 AND 20
  AND coalesce(char_length(guests), 0) <= 100
  AND coalesce(char_length(notes), 0) <= 500
  AND coalesce(char_length(admin_note), 0) <= 500
  AND checkin ~ '^\d{4}-\d{2}-\d{2}$'
  AND checkout ~ '^\d{4}-\d{2}-\d{2}$'
);
