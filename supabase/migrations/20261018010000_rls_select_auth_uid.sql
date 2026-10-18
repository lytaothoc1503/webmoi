/* Tối ưu RLS bảng bookings theo gợi ý của Supabase (auth_rls_initplan): viết (SELECT auth.uid()) thay cho auth.uid()
   để Postgres tính 1 lần cho cả câu lệnh, không tính lại từng dòng. Quyền KHÔNG đổi, chỉ nhanh hơn.

   1) customer_read_own_bookings: chủ dự án ĐÃ chạy trên Supabase ngày 18/10 (bản nháp ghi nhầm cột customer_id,
      cột đúng là user_id). Ghi lại đây cho khớp CSDL; chạy lại vẫn an toàn.
   2) public_insert_bookings: CHƯA chạy. Giữ nguyên mọi điều kiện của file 20261018000000, chỉ đổi auth.uid().

   Chủ dự án chạy file này một lần trong Supabase > SQL Editor > New query > Run. */

BEGIN;

ALTER POLICY customer_read_own_bookings ON public.bookings
  USING (user_id = (SELECT auth.uid()));

ALTER POLICY public_insert_bookings ON public.bookings
  WITH CHECK (
    status = 'Chờ thanh toán' AND booking_code IS NOT NULL AND paid_at IS NULL AND confirmed_at IS NULL
    AND admin_note IS NULL AND received_amount IS NULL AND user_id = (SELECT auth.uid())
    AND slip_room_no IS NULL AND slip_promo IS NULL AND slip_note IS NULL
    AND slip_bank_name IS NULL AND slip_bank_account IS NULL AND slip_bank_holder IS NULL
  );

COMMIT;
