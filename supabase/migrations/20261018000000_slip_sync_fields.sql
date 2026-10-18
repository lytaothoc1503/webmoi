/* Đồng bộ các trường chỉ hiện trên Phiếu xác nhận đặt phòng (ưu đãi, số phòng, ghi chú, ngân hàng/STK/chủ TK ghi đè
   riêng cho từng đơn) giữa mọi thiết bị admin, và để link phiếu khách (phieu.html?ma=) hiện đúng như admin đã lập
   trong Biểu Mẫu, không bị bớt thông tin.

   KHÔNG thêm cột CCCD: CCCD khách tiếp tục KHÔNG lưu CSDL theo đúng quy định đã có (chỉ ghi tay/in tại chỗ).
   KHÔNG lưu ảnh QR tự tải lên (ảnh base64 nặng, không hợp để lưu trong bảng đơn) — khi đã ghi ngân hàng/STK ghi đè
   mà chưa tải QR ảnh riêng, phiếu chỉ hiện thông tin chuyển khoản dạng chữ (không tự tạo QR), giống hệt khi dùng
   ngay trên máy đã tạo phiếu — không phải lỗi mới.

   Chủ dự án chạy file này một lần trong Supabase > SQL Editor > New query > Run. */

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS slip_room_no text,
  ADD COLUMN IF NOT EXISTS slip_promo text,
  ADD COLUMN IF NOT EXISTS slip_note text,
  ADD COLUMN IF NOT EXISTS slip_bank_name text,
  ADD COLUMN IF NOT EXISTS slip_bank_account text,
  ADD COLUMN IF NOT EXISTS slip_bank_holder text;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_slip_fields_len;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_slip_fields_len CHECK (
  (slip_room_no IS NULL OR length(slip_room_no) <= 20) AND
  (slip_promo IS NULL OR length(slip_promo) <= 200) AND
  (slip_note IS NULL OR length(slip_note) <= 500) AND
  (slip_bank_name IS NULL OR length(slip_bank_name) <= 80) AND
  (slip_bank_account IS NULL OR length(slip_bank_account) <= 30) AND
  (slip_bank_holder IS NULL OR length(slip_bank_holder) <= 80)
);

-- Khách tự đặt phòng (insert) không được tự gán các trường này — chỉ admin (đã đăng nhập) mới điền được qua Biểu Mẫu,
-- tránh khách tự ghi đè thông tin ngân hàng hiện ra cho chính đơn của mình.
DROP POLICY IF EXISTS public_insert_bookings ON public.bookings;
CREATE POLICY public_insert_bookings ON public.bookings FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'Chờ thanh toán' AND booking_code IS NOT NULL AND paid_at IS NULL AND confirmed_at IS NULL
    AND admin_note IS NULL AND received_amount IS NULL AND user_id = auth.uid()
    AND slip_room_no IS NULL AND slip_promo IS NULL AND slip_note IS NULL
    AND slip_bank_name IS NULL AND slip_bank_account IS NULL AND slip_bank_holder IS NULL
  );

-- track_booking(): trả thêm các trường trên để phiếu khách xem/tra cứu hiện đúng như admin đã lập, không bị bớt.
CREATE OR REPLACE FUNCTION public.track_booking(p_code text, p_phone text DEFAULT NULL::text)
 RETURNS TABLE(booking_code text, room text, fullname text, checkin text, checkout text, guests text, total_price integer, transfer_code text, status text, created_at timestamp with time zone, paid_at timestamp with time zone, confirmed_at timestamp with time zone, admin_note text, review_status text, slip_room_no text, slip_promo text, slip_note text, slip_bank_name text, slip_bank_account text, slip_bank_holder text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT b.booking_code, b.room, b.fullname, b.checkin, b.checkout, b.guests,
         b.total_price, b.transfer_code, b.status, b.created_at,
         b.paid_at, b.confirmed_at, b.admin_note,
         CASE WHEN r.id IS NULL THEN 'none' WHEN r.is_published THEN 'published' ELSE 'pending' END,
         b.slip_room_no, b.slip_promo, b.slip_note, b.slip_bank_name, b.slip_bank_account, b.slip_bank_holder
  FROM bookings b
  LEFT JOIN reviews r ON r.booking_code = b.booking_code
  WHERE length(trim(coalesce(p_code, ''))) >= 6
    AND b.booking_code = upper(trim(p_code))
  LIMIT 1;
$function$;
