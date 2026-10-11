/* Tiến độ hoàn trả (để chụp gửi khách): thêm cột step (1-5) và step_log (giờ từng bước) cho bảng refunds.
   Chạy 1 lần trong SQL Editor; chạy lại vẫn an toàn.
   Các bước: 1 Đã tiếp nhận, 2 Đang đối chiếu, 3 Đã duyệt - chuẩn bị chuyển, 4 Đã chuyển khoản, 5 Hoàn tất (tự đặt khi đóng "Đã hoàn").
   Trigger ép: chỉ tiến từng bước một (1->2->3->4), giờ từng bước do máy chủ ghi (không sửa tay), giữ nguyên mọi ràng buộc cũ. */

ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS step smallint NOT NULL DEFAULT 1;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS step_log jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.refunds DROP CONSTRAINT IF EXISTS refunds_step_check;
ALTER TABLE public.refunds ADD CONSTRAINT refunds_step_check CHECK (step BETWEEN 1 AND 5);

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
