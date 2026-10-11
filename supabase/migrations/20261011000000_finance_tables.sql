-- Tài chính trong trang quản trị: khoản thu/chi và yêu cầu hoàn trả. Chỉ admin (is_admin) đọc/ghi được.
CREATE TABLE IF NOT EXISTS public.finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT current_date,
  kind text NOT NULL CHECK (kind IN ('thu','chi')),
  category text NOT NULL CHECK (char_length(category) BETWEEN 1 AND 60),
  amount bigint NOT NULL CHECK (amount > 0 AND amount <= 10000000000),
  note text CHECK (note IS NULL OR char_length(note) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text NOT NULL CHECK (char_length(booking_code) BETWEEN 1 AND 40),
  amount bigint NOT NULL CHECK (amount > 0 AND amount <= 100000000),
  reason text CHECK (reason IS NULL OR char_length(reason) <= 300),
  status text NOT NULL DEFAULT 'Chờ xử lý' CHECK (status IN ('Chờ xử lý','Đã hoàn','Từ chối')),
  created_at timestamptz NOT NULL DEFAULT now(),
  done_at timestamptz
);
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_all_finance_entries ON public.finance_entries;
DROP POLICY IF EXISTS admin_all_refunds ON public.refunds;
CREATE POLICY admin_all_finance_entries ON public.finance_entries FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_all_refunds ON public.refunds FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
REVOKE ALL ON public.finance_entries, public.refunds FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_entries, public.refunds TO authenticated;
