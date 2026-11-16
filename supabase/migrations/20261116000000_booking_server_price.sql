-- Giá đơn khách tự đặt do MÁY CHỦ tính, bỏ số total_price trình duyệt gửi lên.
-- Bảng rooms/tours đang để trống (web dùng data.js). Không ghi vào hai bảng đó: hễ có dòng
-- is_active thì trang chủ bỏ data.js. Cột rooms.price cũng chỉ là một số, không đủ giá theo thứ.
-- Bảng booking_rate_rules là bản giá máy chủ, khớp data.js lúc 16/11/2026:
--   Phòng Gỗ Ngắm Biển Mây: T2–T5 700.000, T6+CN 900.000, T7 1.100.000 / đêm cho 2 khách;
--   khách thứ 3: 200.000/đêm, tối đa 3 khách;
--   Combo Săn Mây = Bữa sáng trên mây 70.000 + Trà chiều ngắm hoàng hôn 100.000, nhân số khách × số đêm.
-- Đổi giá trong data.js thì phải sửa bảng này (SQL Editor), không thì phiếu hiện giá máy chủ.
-- Admin (is_admin) và đối tác (is_partner) lập đơn trong Biểu Mẫu: giữ số tiền đã gõ.
-- Khách: hạng không có trong bảng giá và cũng không có trong rooms/tours (giá > 0) thì từ chối.
-- Chủ dự án chạy file này một lần trong Supabase > SQL Editor > New query > Run.
-- Chạy sau 20261001120000 (is_admin) và 20261023000000 (is_partner). Chạy lại không ghi đè giá đã sửa.

BEGIN;

CREATE TABLE IF NOT EXISTS public.booking_rate_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('room', 'tour', 'combo', 'combo_item')),
  name text NOT NULL,
  price integer NOT NULL DEFAULT 0 CHECK (price >= 0 AND price <= 100000000),
  weekday integer CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 100000000)),
  fri_sun integer CHECK (fri_sun IS NULL OR (fri_sun >= 0 AND fri_sun <= 100000000)),
  sat integer CHECK (sat IS NULL OR (sat >= 0 AND sat <= 100000000)),
  extra_guest_fee integer NOT NULL DEFAULT 0 CHECK (extra_guest_fee >= 0),
  included_guests integer NOT NULL DEFAULT 2 CHECK (included_guests >= 0),
  max_guests integer NOT NULL DEFAULT 99 CHECK (max_guests >= 1 AND max_guests <= 99),
  active boolean NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX IF NOT EXISTS booking_rate_rules_kind_name ON public.booking_rate_rules (kind, name);

ALTER TABLE public.booking_rate_rules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_rate_rules FROM PUBLIC, anon, authenticated;

INSERT INTO public.booking_rate_rules (kind, name, price, weekday, fri_sun, sat, extra_guest_fee, included_guests, max_guests)
VALUES
  ('room', 'Phòng Gỗ Ngắm Biển Mây', 700000, 700000, 900000, 1100000, 200000, 2, 3),
  ('combo', 'Combo Săn Mây', 0, NULL, NULL, NULL, 0, 2, 99),
  ('combo_item', 'Bữa sáng trên mây', 70000, NULL, NULL, NULL, 0, 2, 99),
  ('combo_item', 'Trà chiều ngắm hoàng hôn', 100000, NULL, NULL, NULL, 0, 2, 99)
ON CONFLICT (kind, name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.bookings_set_total_price() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_combo text;
  v_suffix text;
  v_base text;
  v_has_combo boolean := false;
  v_rule public.booking_rate_rules%ROWTYPE;
  v_nights integer;
  v_guests integer;
  v_dow integer;
  v_i integer;
  v_base_sum integer := 0;
  v_extra integer := 0;
  v_combo_sum integer := 0;
  v_combo_n integer := 0;
  v_combo_ok boolean := false;
  v_flat integer;
  v_found boolean := false;
BEGIN
  -- Đơn lập tay (admin, đối tác, service_role): giữ số tiền đã nhập.
  IF coalesce(auth.role(), '') = 'service_role' OR public.is_admin() OR public.is_partner() THEN
    RETURN NEW;
  END IF;

  IF NEW.checkin IS NULL OR NEW.checkout IS NULL THEN
    RETURN NEW;
  END IF;

  v_nights := NEW.checkout::date - NEW.checkin::date;
  IF v_nights < 1 OR v_nights > 366 THEN
    RAISE EXCEPTION 'Số đêm chưa hợp lệ, nhà chưa nhận đơn này.' USING ERRCODE = 'check_violation';
  END IF;

  SELECT name INTO v_combo FROM public.booking_rate_rules WHERE kind = 'combo' AND active ORDER BY name LIMIT 1;
  v_base := btrim(NEW.room);
  IF v_combo IS NOT NULL THEN
    v_suffix := ' + ' || v_combo;
    IF length(v_base) > length(v_suffix) AND right(v_base, length(v_suffix)) = v_suffix THEN
      v_has_combo := true;
      v_base := left(v_base, length(v_base) - length(v_suffix));
    END IF;
  END IF;

  v_guests := NULLIF(substring(coalesce(NEW.guests, '') from '([0-9]+)'), '')::integer;
  IF v_guests IS NULL THEN
    v_guests := 2;
  END IF;
  v_guests := least(99, greatest(1, v_guests));

  SELECT * INTO v_rule FROM public.booking_rate_rules
   WHERE kind = 'room' AND name = v_base AND active
   LIMIT 1;
  v_found := FOUND;

  IF v_found AND v_rule.weekday IS NOT NULL AND v_rule.fri_sun IS NOT NULL AND v_rule.sat IS NOT NULL THEN
    v_guests := least(v_guests, v_rule.max_guests);
    FOR v_i IN 0..(v_nights - 1) LOOP
      v_dow := EXTRACT(DOW FROM (NEW.checkin::date + v_i))::integer; -- 0 CN, 5 T6, 6 T7
      IF v_dow = 6 THEN
        v_base_sum := v_base_sum + v_rule.sat;
      ELSIF v_dow = 5 OR v_dow = 0 THEN
        v_base_sum := v_base_sum + v_rule.fri_sun;
      ELSE
        v_base_sum := v_base_sum + v_rule.weekday;
      END IF;
    END LOOP;
    v_extra := greatest(0, v_guests - v_rule.included_guests) * v_rule.extra_guest_fee * v_nights;
    IF v_has_combo THEN
      SELECT count(*)::integer, coalesce(sum(price), 0), coalesce(bool_and(price > 0), false)
        INTO v_combo_n, v_combo_sum, v_combo_ok
        FROM public.booking_rate_rules
       WHERE kind = 'combo_item' AND active;
      IF v_combo_n < 1 OR NOT v_combo_ok THEN
        RAISE EXCEPTION 'Chưa tính được giá combo trên máy chủ.' USING ERRCODE = 'check_violation';
      END IF;
      v_combo_sum := v_combo_sum * v_guests * v_nights;
    END IF;
    NEW.total_price := v_base_sum + v_extra + v_combo_sum;
    RETURN NEW;
  END IF;

  -- Hướng 2: bảng rooms/tours có dòng giá > 0 thì dùng giá đó (phòng: theo đêm; tour: theo khách, mặc định 1).
  SELECT price INTO v_flat FROM public.rooms
   WHERE is_active AND name = v_base AND price > 0
   ORDER BY sort_order LIMIT 1;
  IF FOUND THEN
    IF v_has_combo THEN
      RAISE EXCEPTION 'Phòng trong danh mục chưa có giá combo theo đêm.' USING ERRCODE = 'check_violation';
    END IF;
    NEW.total_price := v_flat * v_nights;
    RETURN NEW;
  END IF;

  IF NOT v_has_combo THEN
    SELECT price INTO v_flat FROM public.tours
     WHERE is_active AND name = btrim(NEW.room) AND price > 0
     ORDER BY sort_order LIMIT 1;
    IF FOUND THEN
      v_guests := NULLIF(substring(coalesce(NEW.guests, '') from '([0-9]+)'), '')::integer;
      IF v_guests IS NULL THEN v_guests := 1; END IF;
      v_guests := least(99, greatest(1, v_guests));
      NEW.total_price := v_flat * v_guests;
      RETURN NEW;
    END IF;
  END IF;

  RAISE EXCEPTION 'Nhà chưa có bảng giá cho hạng phòng này trên máy chủ, nên chưa nhận đơn. Bạn nhắn nhà giúp nhé.'
    USING ERRCODE = 'check_violation';
END
$fn$;

REVOKE ALL ON FUNCTION public.bookings_set_total_price() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_bookings_set_total_price ON public.bookings;
CREATE TRIGGER trg_bookings_set_total_price
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.bookings_set_total_price();

COMMIT;
