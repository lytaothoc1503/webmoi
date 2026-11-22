-- Giá phòng chủ nhà chốt 22/11/2026: thứ 2–thứ 5 là 600.000 đ, thứ 6 và Chủ nhật là 700.000 đ,
-- cho 2 khách; khách thứ 3 vẫn 200.000 đ/đêm.
-- Đêm thứ Bảy chủ nhà chưa gửi giá phòng riêng, nên KHÔNG đổi cột sat.
-- Trigger bookings_set_total_price cần sat khác NULL mới tính được giá theo đêm;
-- nếu xóa sat thì mọi đơn bị từ chối. Web không tự nhận đơn khi kỳ ở có đêm thứ Bảy,
-- để khách không bị tính mức thứ Bảy cũ.
-- Chạy một lần trong Supabase > SQL Editor, sau khi đã chạy 20261116000000_booking_server_price.sql.
-- Nếu bảng booking_rate_rules chưa có thì file này không làm gì.

DO $$
BEGIN
  IF to_regclass('public.booking_rate_rules') IS NULL THEN
    RAISE NOTICE 'Chưa có bảng booking_rate_rules, bỏ qua.';
    RETURN;
  END IF;
  UPDATE public.booking_rate_rules
     SET price = 600000,
         weekday = 600000,
         fri_sun = 700000,
         extra_guest_fee = 200000
   WHERE kind = 'room' AND name = 'Phòng Gỗ Ngắm Biển Mây';
END $$;
