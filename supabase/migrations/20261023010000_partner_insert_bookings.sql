-- Cho phép đối tác (bảng partners, xem 20261023000000_partners.sql) TỰ TẠO đơn mới qua Biểu Mẫu ở
-- fuli8386.html (nút "Xác nhận tạo đơn"), KHÔNG được sửa/xóa đơn có sẵn (không có policy UPDATE/DELETE nào
-- cho is_partner()). Đơn đối tác tạo LUÔN ở trạng thái "Chờ thanh toán" và tự gắn đúng partner_email của
-- người tạo — Nhà của An xem và tự xác nhận (Đã thanh toán/Đặt phòng thành công) ở admin như đơn khách tự đặt.
-- Chủ dự án chạy file này một lần trong Supabase > SQL Editor > New query > Run.

DROP POLICY IF EXISTS partner_insert_own_bookings ON public.bookings;
CREATE POLICY partner_insert_own_bookings ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (
    public.is_partner()
    AND partner_email IS NOT NULL
    AND lower(partner_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
    AND status = 'Chờ thanh toán'
    AND booking_code IS NOT NULL
    AND user_id IS NULL
    AND paid_at IS NULL AND confirmed_at IS NULL AND admin_note IS NULL AND received_amount IS NULL
    AND slip_room_no IS NULL AND slip_promo IS NULL AND slip_note IS NULL
    AND slip_bank_name IS NULL AND slip_bank_account IS NULL AND slip_bank_holder IS NULL
  );
