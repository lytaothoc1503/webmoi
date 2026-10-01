/*
# Luồng đặt phòng, tra cứu đơn, đánh giá + siết bảo mật (Nhà của An Homestay Tà Xùa)

Chạy file này SAU 2 file migration cũ (trong Supabase > SQL Editor > New query > Run).

1. Trạng thái đơn mới (cột bookings.status):
   'Chờ thanh toán' -> 'Đã thanh toán - chờ xác nhận' -> 'Đặt phòng thành công' -> 'Hoàn thành'   (hoặc 'Hủy đơn')
2. Khách KHÔNG còn đọc/sửa/xóa trực tiếp bảng bookings. Khách chỉ:
   - tạo đơn (insert),
   - tra cứu đơn của mình bằng Mã đơn + Số điện thoại (hàm track_booking),
   - báo "đã chuyển khoản" (hàm mark_booking_paid),
   - gửi đánh giá sau khi đặt phòng thành công (hàm submit_review) - đánh giá chờ admin duyệt mới hiện lên web.
3. Chỉ tài khoản đăng nhập (admin, Supabase Auth) mới xem/sửa/xóa toàn bộ dữ liệu.
   => Nhớ TẮT "Allow new users to sign up" trong Authentication > Sign In / Providers.
*/

-- ===== BOOKINGS: cột mới =====
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_code text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_note text;
ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'Chờ thanh toán';

UPDATE bookings SET status = 'Chờ thanh toán' WHERE status = 'Chờ duyệt tiền cọc';
UPDATE bookings SET status = 'Đặt phòng thành công' WHERE status = 'Đã duyệt phòng';

CREATE UNIQUE INDEX IF NOT EXISTS bookings_booking_code_key ON bookings (booking_code) WHERE booking_code IS NOT NULL;

-- ===== REVIEWS: gắn với đơn đặt phòng =====
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_code text;
CREATE UNIQUE INDEX IF NOT EXISTS reviews_booking_code_key ON reviews (booking_code) WHERE booking_code IS NOT NULL;

-- ===== BỎ CÁC QUYỀN MỞ HOÀN TOÀN CŨ =====
DO $$
DECLARE t text; p record;
BEGIN
  FOREACH t IN ARRAY ARRAY['bookings','rooms','tours','reviews','gallery','faq'] LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p.policyname, t);
    END LOOP;
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ===== ADMIN (đã đăng nhập): toàn quyền =====
CREATE POLICY "admin_all_bookings" ON bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_rooms"    ON rooms    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_tours"    ON tours    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_reviews"  ON reviews  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_gallery"  ON gallery  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_faq"      ON faq      FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===== KHÁCH (chưa đăng nhập): chỉ đọc nội dung công khai =====
CREATE POLICY "public_read_rooms"   ON rooms   FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "public_read_tours"   ON tours   FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "public_read_gallery" ON gallery FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "public_read_faq"     ON faq     FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "public_read_reviews" ON reviews FOR SELECT TO anon USING (is_published = true);

-- ===== KHÁCH: tạo đơn mới (bắt buộc trạng thái ban đầu, không tự đặt trạng thái khác) =====
CREATE POLICY "public_insert_bookings" ON bookings FOR INSERT TO anon
  WITH CHECK (status = 'Chờ thanh toán' AND booking_code IS NOT NULL AND paid_at IS NULL AND confirmed_at IS NULL AND admin_note IS NULL);

-- ===== HÀM TRA CỨU (khách cần đúng Mã đơn + SĐT) =====
CREATE OR REPLACE FUNCTION track_booking(p_code text, p_phone text)
RETURNS TABLE (
  booking_code text, room text, fullname text, checkin text, checkout text, guests text,
  total_price integer, transfer_code text, status text, created_at timestamptz,
  paid_at timestamptz, confirmed_at timestamptz, admin_note text,
  review_status text
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT b.booking_code, b.room, b.fullname, b.checkin, b.checkout, b.guests,
         b.total_price, b.transfer_code, b.status, b.created_at,
         b.paid_at, b.confirmed_at, b.admin_note,
         CASE WHEN r.id IS NULL THEN 'none' WHEN r.is_published THEN 'published' ELSE 'pending' END
  FROM bookings b
  LEFT JOIN reviews r ON r.booking_code = b.booking_code
  WHERE b.booking_code = upper(trim(p_code))
    AND regexp_replace(b.phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
    AND length(regexp_replace(p_phone, '\D', '', 'g')) >= 8
  LIMIT 1;
$$;

-- ===== HÀM: khách báo đã chuyển khoản =====
CREATE OR REPLACE FUNCTION mark_booking_paid(p_code text, p_phone text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  UPDATE bookings
     SET status = 'Đã thanh toán - chờ xác nhận', paid_at = now()
   WHERE booking_code = upper(trim(p_code))
     AND regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
     AND status = 'Chờ thanh toán';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END $$;

-- ===== HÀM: khách gửi đánh giá (chỉ khi đơn đã thành công/hoàn thành; chờ admin duyệt) =====
CREATE OR REPLACE FUNCTION submit_review(p_code text, p_phone text, p_rating integer, p_content text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b bookings%ROWTYPE;
BEGIN
  SELECT * INTO b FROM bookings
   WHERE booking_code = upper(trim(p_code))
     AND regexp_replace(phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g');
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF b.status NOT IN ('Đặt phòng thành công', 'Hoàn thành') THEN RETURN 'not_allowed'; END IF;
  IF length(trim(coalesce(p_content, ''))) < 5 OR length(p_content) > 1000 THEN RETURN 'invalid'; END IF;
  IF EXISTS (SELECT 1 FROM reviews WHERE booking_code = b.booking_code) THEN RETURN 'exists'; END IF;
  INSERT INTO reviews (author_name, rating, content, is_published, sort_order, booking_code)
  VALUES (b.fullname, least(5, greatest(1, coalesce(p_rating, 5))), trim(p_content), false, 0, b.booking_code);
  RETURN 'ok';
END $$;

REVOKE ALL ON FUNCTION track_booking(text, text), mark_booking_paid(text, text), submit_review(text, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION track_booking(text, text), mark_booking_paid(text, text), submit_review(text, text, integer, text) TO anon, authenticated;
