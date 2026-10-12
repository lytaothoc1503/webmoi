/*
  Báo chủ nhà khi có đơn mới / khách báo đã chuyển khoản.

  Trigger gọi Edge Function notify-booking (qua pg_net, bất đồng bộ).
  Lỗi khi báo KHÔNG bao giờ làm hỏng việc đặt phòng của khách (đã bọc EXCEPTION).
  Cần: triển khai function notify-booking (verify_jwt = false) và đặt secret NOTIFY_WEBHOOK_URL.
*/

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notified_new_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notified_paid_at timestamptz;

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION notify_booking_event() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE ev text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    ev := 'new';
  ELSIF NEW.status = 'Đã thanh toán - chờ xác nhận' AND OLD.status IS DISTINCT FROM NEW.status THEN
    ev := 'paid';
  ELSE
    RETURN NEW;
  END IF;
  BEGIN
    PERFORM net.http_post(
      url := 'https://hkfprewiprdztmdcoxzz.supabase.co/functions/v1/notify-booking',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('id', NEW.id, 'event', ev)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_booking_event: %', SQLERRM;
  END;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION notify_booking_event() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_booking_insert ON bookings;
CREATE TRIGGER trg_notify_booking_insert AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION notify_booking_event();

DROP TRIGGER IF EXISTS trg_notify_booking_paid ON bookings;
CREATE TRIGGER trg_notify_booking_paid AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION notify_booking_event();
