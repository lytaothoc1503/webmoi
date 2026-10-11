-- Tài chính trong trang quản trị: khoản thu/chi, hoàn trả (có STK nhận hoàn) và nhật ký thay đổi.
-- Chỉ admin (is_admin) đọc/ghi được. Quy tắc nghiệp vụ do CSDL ép, không phụ thuộc giao diện.

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
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 300),
  bank_name text NOT NULL CHECK (char_length(bank_name) BETWEEN 2 AND 60),
  account_no text NOT NULL CHECK (account_no ~ '^[0-9]{6,20}$' OR account_no ~ '^\*{4}[0-9]{4}$'),
  account_name text NOT NULL CHECK (char_length(account_name) BETWEEN 2 AND 80),
  status text NOT NULL DEFAULT 'Chờ xử lý' CHECK (status IN ('Chờ xử lý','Đã hoàn','Từ chối')),
  created_at timestamptz NOT NULL DEFAULT now(),
  done_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.finance_audit (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  actor uuid,
  table_name text NOT NULL,
  action text NOT NULL,
  row_id text,
  old_data jsonb,
  new_data jsonb
);

-- Quy tắc hoàn trả: số tiền không vượt số đã thu; đơn đã đóng thì không sửa; chỉ xóa được yêu cầu còn đang chờ;
-- khi đã hoàn thì che số tài khoản, chỉ giữ 4 số cuối (giảm dữ liệu cá nhân phải lưu).
CREATE OR REPLACE FUNCTION public.refunds_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE paid bigint; already bigint;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'Chờ xử lý' THEN RAISE EXCEPTION 'Không xóa yêu cầu hoàn trả đã đóng'; END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'INSERT' THEN
    SELECT total_price INTO paid FROM bookings WHERE booking_code = NEW.booking_code;
    IF paid IS NULL THEN RAISE EXCEPTION 'Không tìm thấy mã đơn %', NEW.booking_code; END IF;
    SELECT COALESCE(SUM(amount),0) INTO already FROM refunds WHERE booking_code = NEW.booking_code AND status <> 'Từ chối';
    IF NEW.amount + already > paid THEN RAISE EXCEPTION 'Số tiền hoàn vượt số đã thu của đơn (đã thu %, đã hoàn/đang chờ %)', paid, already; END IF;
    NEW.status := 'Chờ xử lý'; NEW.done_at := NULL;
    RETURN NEW;
  END IF;
  -- UPDATE
  IF OLD.status <> 'Chờ xử lý' THEN RAISE EXCEPTION 'Yêu cầu đã đóng, không sửa được'; END IF;
  IF NEW.amount <> OLD.amount OR NEW.booking_code <> OLD.booking_code THEN RAISE EXCEPTION 'Không đổi số tiền hoặc mã đơn, hãy tạo yêu cầu mới'; END IF;
  IF NEW.status <> OLD.status THEN
    NEW.done_at := now();
    IF NEW.status = 'Đã hoàn' AND NEW.account_no ~ '^[0-9]{6,20}$' THEN NEW.account_no := '****' || right(NEW.account_no, 4); END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.refunds_guard() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_refunds_guard ON public.refunds;
CREATE TRIGGER trg_refunds_guard BEFORE INSERT OR UPDATE OR DELETE ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.refunds_guard();

-- Nhật ký tự ghi (không lưu số tài khoản đầy đủ).
CREATE OR REPLACE FUNCTION public.finance_audit_log() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o jsonb := CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END; n jsonb := CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END;
BEGIN
  IF TG_TABLE_NAME = 'refunds' THEN o := o - 'account_no'; n := n - 'account_no'; END IF;
  INSERT INTO finance_audit(actor, table_name, action, row_id, old_data, new_data)
  VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, COALESCE(n->>'id', o->>'id'), o, n);
  RETURN COALESCE(NEW, OLD);
END $$;
REVOKE ALL ON FUNCTION public.finance_audit_log() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_audit_refunds ON public.refunds;
DROP TRIGGER IF EXISTS trg_audit_entries ON public.finance_entries;
CREATE TRIGGER trg_audit_refunds AFTER INSERT OR UPDATE OR DELETE ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.finance_audit_log();
CREATE TRIGGER trg_audit_entries AFTER INSERT OR UPDATE OR DELETE ON public.finance_entries FOR EACH ROW EXECUTE FUNCTION public.finance_audit_log();

ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_all_finance_entries ON public.finance_entries;
DROP POLICY IF EXISTS admin_all_refunds ON public.refunds;
DROP POLICY IF EXISTS admin_read_finance_audit ON public.finance_audit;
CREATE POLICY admin_all_finance_entries ON public.finance_entries FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_all_refunds ON public.refunds FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_read_finance_audit ON public.finance_audit FOR SELECT TO authenticated USING (public.is_admin());
REVOKE ALL ON public.finance_entries, public.refunds, public.finance_audit FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_entries, public.refunds TO authenticated;
GRANT SELECT ON public.finance_audit TO authenticated;
