-- Tài khoản đối tác/Sale: trang riêng doi-tac.html chỉ xem đúng đơn được admin giao, dùng Biểu Mẫu
-- để làm phiếu/giấy tờ, KHÔNG thấy được đơn của khách khác và KHÔNG có quyền admin đầy đủ.
-- Chỉ admin (is_admin) thêm/xóa được quyền đối tác (bảng partners); đối tác tự đăng nhập email+mật khẩu
-- do admin tạo sẵn (qua Edge Function partner-invite, dùng service_role, không lộ secret ra client).
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  label text CHECK (label IS NULL OR char_length(label) <= 60),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- true khi người đang đăng nhập (auth.uid()) có email nằm trong bảng partners (admin tự thêm, có duyệt).
CREATE OR REPLACE FUNCTION public.is_partner() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partners p JOIN auth.users u ON u.id = auth.uid()
    WHERE lower(p.email) = lower(u.email)
  );
$$;
REVOKE ALL ON FUNCTION public.is_partner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_partner() TO authenticated;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS partner_email text CHECK (partner_email IS NULL OR partner_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_all_partners ON public.partners;
CREATE POLICY admin_all_partners ON public.partners FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
REVOKE ALL ON public.partners FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;

-- Đối tác chỉ đọc (SELECT) được đơn admin đã giao đúng email của mình — không thêm quyền sửa/xóa,
-- không ảnh hưởng các policy sẵn có của bookings (admin, khách tự xem đơn, đăng ký đơn công khai).
DROP POLICY IF EXISTS partner_read_assigned_bookings ON public.bookings;
CREATE POLICY partner_read_assigned_bookings ON public.bookings FOR SELECT TO authenticated
  USING (public.is_partner() AND partner_email IS NOT NULL AND lower(partner_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())));
