-- Siết chặt tài chính (rà soát lỗ hổng 11/10). Chạy lại nhiều lần vẫn an toàn.
-- 1) Thu hẹp quyền: khách đăng nhập (authenticated) không được có quyền thừa trên bảng tài chính.
REVOKE ALL ON public.finance_entries, public.refunds, public.finance_audit FROM authenticated, anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refunds TO authenticated;
GRANT SELECT ON public.finance_audit TO authenticated;  -- nhật ký chỉ do trigger ghi, không ai sửa/xóa được

-- 2) Quy tắc hoàn trả chặt hơn:
--    - chỉ hoàn cho đơn ĐÃ được admin xác nhận nhận tiền (không hoàn đơn chưa thu hoặc chỉ "khách báo đã chuyển")
--    - khóa dòng đơn khi kiểm tra tổng hoàn (hai yêu cầu cùng lúc không vượt được số đã thu)
--    - khi đóng yêu cầu (Đã hoàn HOẶC Từ chối) đều che số tài khoản, chỉ giữ 4 số cuối
CREATE OR REPLACE FUNCTION public.refunds_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE b record; already bigint;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'Chờ xử lý' THEN RAISE EXCEPTION 'Không xóa yêu cầu hoàn trả đã đóng'; END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'INSERT' THEN
    SELECT total_price, status, confirmed_at INTO b FROM bookings WHERE booking_code = NEW.booking_code FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy mã đơn %', NEW.booking_code; END IF;
    IF NOT (b.confirmed_at IS NOT NULL OR b.status IN ('Đặt phòng thành công','Hoàn thành','Đã duyệt phòng')) THEN
      RAISE EXCEPTION 'Đơn % chưa được xác nhận đã nhận tiền, chưa thể hoàn trả. Hãy bấm "Đã nhận tiền" ở mục Đối soát trước.', NEW.booking_code;
    END IF;
    SELECT COALESCE(SUM(amount),0) INTO already FROM refunds WHERE booking_code = NEW.booking_code AND status <> 'Từ chối';
    IF NEW.amount + already > b.total_price THEN RAISE EXCEPTION 'Số tiền hoàn vượt số đã thu của đơn (đã thu %, đã hoàn/đang chờ %)', b.total_price, already; END IF;
    NEW.status := 'Chờ xử lý'; NEW.done_at := NULL;
    RETURN NEW;
  END IF;
  IF OLD.status <> 'Chờ xử lý' THEN RAISE EXCEPTION 'Yêu cầu đã đóng, không sửa được'; END IF;
  IF NEW.amount <> OLD.amount OR NEW.booking_code <> OLD.booking_code THEN RAISE EXCEPTION 'Không đổi số tiền hoặc mã đơn, hãy tạo yêu cầu mới'; END IF;
  IF NEW.status <> OLD.status THEN
    NEW.done_at := now();
    IF NEW.account_no ~ '^[0-9]{6,20}$' THEN NEW.account_no := '****' || right(NEW.account_no, 4); END IF;
  END IF;
  RETURN NEW;
END $fn$;

-- 3) Đơn đã có yêu cầu hoàn thì không được xóa, không được đổi mã hoặc số tiền (tránh lệch sổ).
CREATE OR REPLACE FUNCTION public.bookings_lock_if_refund() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
BEGIN
  IF EXISTS (SELECT 1 FROM refunds WHERE booking_code = OLD.booking_code) THEN
    IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Đơn % đã có yêu cầu hoàn trả, không được xóa', OLD.booking_code; END IF;
    IF NEW.booking_code IS DISTINCT FROM OLD.booking_code OR NEW.total_price IS DISTINCT FROM OLD.total_price THEN
      RAISE EXCEPTION 'Đơn % đã có yêu cầu hoàn trả, không được đổi mã hoặc số tiền', OLD.booking_code;
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $fn$;
DROP TRIGGER IF EXISTS trg_bookings_lock_if_refund ON public.bookings;
CREATE TRIGGER trg_bookings_lock_if_refund BEFORE DELETE OR UPDATE OF booking_code, total_price ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.bookings_lock_if_refund();
