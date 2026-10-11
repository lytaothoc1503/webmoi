/* Rà soát 11/10 (đợt 2). Chạy 1 lần trong SQL Editor; chạy lại vẫn an toàn.
   Chạy SAU khi web mới (admin.html và app.js chọn cột rõ ràng cho bảng reviews) đã lên GitHub Pages 1-3 phút.

   1) Đánh giá: cột booking_code là "chìa khóa" để xem đơn (track_booking) nên KHÔNG được lộ ra công khai
      khi đánh giá được duyệt. Chỉ cho đọc các cột hiển thị.
   2) Chống tạo đơn rác: một tài khoản chỉ có tối đa 5 đơn "Chờ thanh toán" cùng lúc (đề xuất, sửa số 5 nếu cần). */

-- 1) Đánh giá: bỏ quyền đọc toàn bảng, chỉ cấp các cột công khai
REVOKE SELECT ON public.reviews FROM anon, authenticated;
GRANT SELECT (id, author_name, author_avatar, rating, content, is_published, sort_order, created_at)
  ON public.reviews TO anon, authenticated;

-- 2) Giới hạn số đơn chờ thanh toán mỗi tài khoản
CREATE OR REPLACE FUNCTION public.bookings_limit_pending() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE n int;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT count(*) INTO n FROM bookings WHERE user_id = NEW.user_id AND status = 'Chờ thanh toán';
    IF n >= 5 THEN
      RAISE EXCEPTION 'Bạn đang có % đơn chờ thanh toán. Hãy thanh toán hoặc nhắn nhà hủy bớt đơn cũ trước khi đặt thêm.', n;
    END IF;
  END IF;
  RETURN NEW;
END $fn$;
REVOKE EXECUTE ON FUNCTION public.bookings_limit_pending() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_bookings_limit_pending ON public.bookings;
CREATE TRIGGER trg_bookings_limit_pending BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.bookings_limit_pending();
