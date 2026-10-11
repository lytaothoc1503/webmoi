/* Số tiền THỰC NHẬN của đơn (admin nhập khi xác nhận nhận tiền). Chạy 1 lần trong SQL Editor; chạy lại vẫn an toàn.
   Trước đây hoàn trả bị giới hạn theo total_price do khách gửi lên; giờ giới hạn theo số thực nhận.
   - Đơn cũ chưa có received_amount: dùng total_price (không đổi hành vi).
   - Khách không được tự đặt received_amount khi tạo đơn.
   - Đơn đã có yêu cầu hoàn thì không được đổi received_amount (như mã đơn và giá). */

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS received_amount integer;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_received_range;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_received_range CHECK (received_amount IS NULL OR received_amount BETWEEN 0 AND 100000000);

-- Khách tạo đơn: không được kèm số thực nhận
ALTER POLICY "public_insert_bookings" ON public.bookings
  WITH CHECK (status = 'Chờ thanh toán' AND booking_code IS NOT NULL AND paid_at IS NULL AND confirmed_at IS NULL
              AND admin_note IS NULL AND received_amount IS NULL AND user_id = auth.uid());

-- Hoàn trả: giới hạn theo số đã thu thật
CREATE OR REPLACE FUNCTION public.refunds_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
DECLARE b record; already bigint; paid bigint;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'Chờ xử lý' THEN RAISE EXCEPTION 'Không xóa yêu cầu hoàn trả đã đóng'; END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'INSERT' THEN
    SELECT total_price, received_amount, status, confirmed_at INTO b FROM bookings WHERE booking_code = NEW.booking_code FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy mã đơn %', NEW.booking_code; END IF;
    IF NOT (b.confirmed_at IS NOT NULL OR b.status IN ('Đặt phòng thành công','Hoàn thành','Đã duyệt phòng')) THEN
      RAISE EXCEPTION 'Đơn % chưa được xác nhận đã nhận tiền, chưa thể hoàn trả. Hãy bấm "Đã nhận tiền" ở mục Đối soát trước.', NEW.booking_code;
    END IF;
    paid := COALESCE(b.received_amount, b.total_price);
    SELECT COALESCE(SUM(amount),0) INTO already FROM refunds WHERE booking_code = NEW.booking_code AND status <> 'Từ chối';
    IF NEW.amount + already > paid THEN RAISE EXCEPTION 'Số tiền hoàn vượt số đã thu của đơn (đã thu %, đã hoàn/đang chờ %)', paid, already; END IF;
    NEW.status := 'Chờ xử lý'; NEW.done_at := NULL;
    NEW.step := 1; NEW.step_log := jsonb_build_array(jsonb_build_object('s', 1, 'at', now()));
    RETURN NEW;
  END IF;
  IF OLD.status <> 'Chờ xử lý' THEN RAISE EXCEPTION 'Yêu cầu đã đóng, không sửa được'; END IF;
  IF NEW.amount <> OLD.amount OR NEW.booking_code <> OLD.booking_code THEN RAISE EXCEPTION 'Không đổi số tiền hoặc mã đơn, hãy tạo yêu cầu mới'; END IF;
  NEW.step_log := OLD.step_log;   -- giờ từng bước chỉ do máy chủ ghi
  IF NEW.status <> OLD.status THEN
    NEW.done_at := now();
    IF NEW.account_no ~ '^[0-9]{6,20}$' THEN NEW.account_no := '****' || right(NEW.account_no, 4); END IF;
    IF NEW.status = 'Đã hoàn' THEN
      NEW.step := 5; NEW.step_log := OLD.step_log || jsonb_build_array(jsonb_build_object('s', 5, 'at', now()));
    ELSE
      NEW.step := OLD.step; NEW.step_log := OLD.step_log || jsonb_build_array(jsonb_build_object('s', 0, 'at', now()));   -- 0 = từ chối
    END IF;
  ELSIF NEW.step <> OLD.step THEN
    IF NEW.step <> OLD.step + 1 OR NEW.step > 4 THEN RAISE EXCEPTION 'Chỉ chuyển tiến độ từng bước một (tối đa bước 4); bước 5 tự đặt khi bấm Đã hoàn'; END IF;
    NEW.step_log := OLD.step_log || jsonb_build_array(jsonb_build_object('s', NEW.step, 'at', now()));
  END IF;
  RETURN NEW;
END $fn$;

-- Đơn đã có yêu cầu hoàn: khóa cả số thực nhận
CREATE OR REPLACE FUNCTION public.bookings_lock_if_refund() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
BEGIN
  IF EXISTS (SELECT 1 FROM refunds WHERE booking_code = OLD.booking_code) THEN
    IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Đơn % đã có yêu cầu hoàn trả, không được xóa', OLD.booking_code; END IF;
    IF NEW.booking_code IS DISTINCT FROM OLD.booking_code OR NEW.total_price IS DISTINCT FROM OLD.total_price
       OR NEW.received_amount IS DISTINCT FROM OLD.received_amount THEN
      RAISE EXCEPTION 'Đơn % đã có yêu cầu hoàn trả, không được đổi mã, giá hoặc số thực nhận', OLD.booking_code;
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $fn$;
REVOKE EXECUTE ON FUNCTION public.bookings_lock_if_refund() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_bookings_lock_if_refund ON public.bookings;
CREATE TRIGGER trg_bookings_lock_if_refund BEFORE DELETE OR UPDATE OF booking_code, total_price, received_amount ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.bookings_lock_if_refund();
