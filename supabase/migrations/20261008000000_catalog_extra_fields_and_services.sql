-- Thêm cột chi tiết cho phòng/tour, bảng dịch vụ, và cho khách đã đăng nhập đọc danh mục.
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS guests text;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS bed text;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS view text;

ALTER TABLE tours ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS meet text;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS includes text[] DEFAULT '{}';
ALTER TABLE tours ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS details text;

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text,
  price integer NOT NULL DEFAULT 0,
  unit text,
  image_url text,
  time text,
  description text,
  includes text[] DEFAULT '{}',
  note text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_all_services ON services;
CREATE POLICY admin_all_services ON services FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS public_read_services ON services;
CREATE POLICY public_read_services ON services FOR SELECT TO anon, authenticated USING (is_active = true);

-- Khách đã đăng nhập (role authenticated) cũng phải đọc được danh mục công khai
DROP POLICY IF EXISTS auth_read_rooms ON rooms;
CREATE POLICY auth_read_rooms ON rooms FOR SELECT TO authenticated USING (is_active = true);
DROP POLICY IF EXISTS auth_read_tours ON tours;
CREATE POLICY auth_read_tours ON tours FOR SELECT TO authenticated USING (is_active = true);
DROP POLICY IF EXISTS auth_read_gallery ON gallery;
CREATE POLICY auth_read_gallery ON gallery FOR SELECT TO authenticated USING (is_active = true);
DROP POLICY IF EXISTS auth_read_faq ON faq;
CREATE POLICY auth_read_faq ON faq FOR SELECT TO authenticated USING (is_active = true);
DROP POLICY IF EXISTS auth_read_reviews ON reviews;
CREATE POLICY auth_read_reviews ON reviews FOR SELECT TO authenticated USING (is_published = true);
