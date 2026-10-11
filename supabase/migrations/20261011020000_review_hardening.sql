/* Rà soát 11/10 (đã áp dụng trên project webmoi qua Claude; chạy lại nhiều lần vẫn an toàn).
   Đồng thời ghi lại trạng thái THẬT của CSDL mà các file cũ không còn đúng:
   - bookings: chỉ khách ĐÃ ĐĂNG NHẬP mới tạo được đơn (user_id = auth.uid()); khách chưa đăng nhập không có quyền INSERT.
   - track_booking / mark_booking_paid / submit_review: dùng Mã đơn làm chìa khóa (SĐT là tham số tùy chọn, không còn kiểm).
   - track_by_phone: chỉ trả thông tin tối thiểu. */

-- 1) Ngày trả phải sau ngày nhận (so sánh chuỗi yyyy-mm-dd là đúng thứ tự thời gian; web đã bắt buộc >= 1 đêm)
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_dates_order;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_dates_order CHECK (checkout > checkin);

-- 2) Danh mục công khai: khách đã đăng nhập cũng đọc được (trước đây chỉ anon nên khách đăng nhập thấy rỗng)
DO $$
DECLARE x record;
BEGIN
  FOR x IN SELECT * FROM (VALUES ('rooms','public_read_rooms','is_active = true'),
                                 ('tours','public_read_tours','is_active = true'),
                                 ('gallery','public_read_gallery','is_active = true'),
                                 ('faq','public_read_faq','is_active = true'),
                                 ('reviews','public_read_reviews','is_published = true')) v(t, p, cond) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', x.p, x.t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (%s)', x.p, x.t, x.cond);
  END LOOP;
END $$;
GRANT SELECT ON public.rooms, public.tours, public.gallery, public.faq, public.reviews TO anon, authenticated;

-- 3) Hàm trigger không cần ai gọi trực tiếp qua API
REVOKE EXECUTE ON FUNCTION public.bookings_lock_if_refund() FROM PUBLIC, anon, authenticated;

-- 4) Tra theo SĐT: che hẳn mã đơn (trước đây lộ 4 ký tự đầu, trong đó 2 ký tự ngẫu nhiên)
CREATE OR REPLACE FUNCTION public.track_by_phone(p_phone text)
RETURNS TABLE(code_hint text, room text, status text, created_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT left(b.booking_code, 2) || '******', b.room, b.status, b.created_at
  FROM bookings b
  WHERE length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 9
    AND regexp_replace(b.phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
  ORDER BY b.created_at DESC
  LIMIT 10;
$$;
