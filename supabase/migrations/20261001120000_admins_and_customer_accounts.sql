/* Đã chạy trên project webmoi qua Claude (không cần chạy lại).
   1) Bảng admins + hàm is_admin(): chỉ user nằm trong bảng admins mới có quyền quản trị.
   2) bookings.user_id: khách đăng nhập xem được đơn của mình trên mọi thiết bị.
   Cấp quyền admin cho tài khoản (sau khi tạo user trong Authentication > Users):
   insert into public.admins(user_id) select id from auth.users where email = 'thoc1503@gmail.com'; */
CREATE TABLE IF NOT EXISTS public.admins (user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, created_at timestamptz DEFAULT now());
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()); $$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
ALTER POLICY "admin_all_bookings" ON bookings USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "admin_all_rooms" ON rooms USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "admin_all_tours" ON tours USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "admin_all_reviews" ON reviews USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "admin_all_gallery" ON gallery USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "admin_all_faq" ON faq USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings (user_id);
ALTER POLICY "public_insert_bookings" ON bookings TO anon, authenticated WITH CHECK (status = 'Chờ thanh toán' AND booking_code IS NOT NULL AND paid_at IS NULL AND confirmed_at IS NULL AND admin_note IS NULL AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "customer_read_own_bookings" ON bookings FOR SELECT TO authenticated USING (user_id = auth.uid());
