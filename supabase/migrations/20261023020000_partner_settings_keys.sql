-- Nới giới hạn độ dài cột site_settings.value để dùng thêm cho các khóa partner_* (giao diện Fuli8386):
-- partner_title/partner_tagline/partner_login_sub/partner_home_welcome/partner_telegram là chữ ngắn như cũ,
-- nhưng partner_logo_img/partner_bg_img lưu ảnh dạng data URL (base64) nên cần dài hơn nhiều so với 300 ký tự cũ.
-- Không đổi RLS (vẫn public_read_site_settings + admin_write_site_settings như migration 20261020000000).
-- Chủ dự án chạy file này một lần trong Supabase > SQL Editor > New query > Run (sau khi đã chạy migration
-- 20261020000000_site_settings.sql).
ALTER TABLE public.site_settings DROP CONSTRAINT IF EXISTS site_settings_value_check;
ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_value_check
  CHECK (value IS NULL OR char_length(value) <= 4000000);
