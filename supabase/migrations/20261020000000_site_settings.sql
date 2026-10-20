-- Cài đặt chung của web (giờ nhận/trả phòng, địa chỉ, liên hệ) lưu dạng key-value để admin sửa trong trang quản trị,
-- không cần đụng code. Khách và trang web đọc công khai (SELECT); chỉ admin (is_admin) sửa được.
-- Giai đoạn 1: KHÔNG gồm thông tin ngân hàng (STK/chủ TK) vì đang là việc P0 chờ chủ dự án xác nhận chữ chính xác
-- (xem mục "Việc còn lại" trong CLAUDE.md) — làm sau, tách riêng để không ảnh hưởng.
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY CHECK (char_length(key) BETWEEN 1 AND 40),
  value text CHECK (value IS NULL OR char_length(value) <= 300),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.site_settings_touch() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_site_settings_touch ON public.site_settings;
CREATE TRIGGER trg_site_settings_touch BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.site_settings_touch();

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_site_settings ON public.site_settings;
DROP POLICY IF EXISTS admin_write_site_settings ON public.site_settings;
CREATE POLICY public_read_site_settings ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY admin_write_site_settings ON public.site_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
REVOKE ALL ON public.site_settings FROM anon, public;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
