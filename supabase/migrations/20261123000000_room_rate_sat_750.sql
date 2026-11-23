-- Giá đêm thứ Bảy chủ nhà chốt 23/11/2026: 750.000 đ/đêm cho 2 khách.
-- Cùng lúc chốt lại thứ 2–thứ 5 là 600.000 đ, thứ 6 và Chủ nhật là 700.000 đ,
-- khách thứ 3 vẫn 200.000 đ/đêm, khớp data.js.
-- File 16/11 chèn sat = 1.100.000 và không ghi đè nếu dòng đã có.
-- File 22/11 đổi thứ 2–5 và thứ 6/CN nhưng cố ý không đụng cột sat.
-- Chạy file này MỘT LẦN trong Supabase > SQL Editor, SAU 20261116000000_booking_server_price.sql.
-- Chạy sau 20261122000000 cũng được. Nếu file 16/11 được chạy khi chưa có dòng giá,
-- hãy chạy lại file này: file 16/11 không sửa dòng đã có.
-- Nếu bảng booking_rate_rules chưa có thì file này không làm gì.

DO $$
BEGIN
  IF to_regclass('public.booking_rate_rules') IS NULL THEN
    RAISE NOTICE 'Chưa có bảng booking_rate_rules. Chạy 20261116000000_booking_server_price.sql trước, rồi chạy lại file này.';
    RETURN;
  END IF;

  UPDATE public.booking_rate_rules
     SET price = 600000,
         weekday = 600000,
         fri_sun = 700000,
         sat = 750000,
         extra_guest_fee = 200000
   WHERE kind = 'room' AND name = 'Phòng Gỗ Ngắm Biển Mây';

  IF NOT FOUND THEN
    INSERT INTO public.booking_rate_rules (kind, name, price, weekday, fri_sun, sat, extra_guest_fee, included_guests, max_guests)
    VALUES ('room', 'Phòng Gỗ Ngắm Biển Mây', 600000, 600000, 700000, 750000, 200000, 2, 3);
  END IF;
END $$;
