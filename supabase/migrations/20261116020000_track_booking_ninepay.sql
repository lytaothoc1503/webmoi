-- Thêm pay_state / pay_amount / pay_method vào track_booking, GIỮ lớp che PII
-- từ 20261116010000_track_booking_mask_pii.sql (mask tên, ẩn admin_note/STK khi thiếu 4 số cuối SĐT).
-- Phải chạy SAU file che PII. Chạy lại vẫn an toàn.
-- Đổi kiểu trả về nên cần DROP rồi CREATE (CREATE OR REPLACE không đổi cột OUT).

BEGIN;

DROP FUNCTION IF EXISTS public.track_booking(text, text);

CREATE FUNCTION public.track_booking(p_code text, p_phone text DEFAULT NULL::text)
 RETURNS TABLE(
   booking_code text, room text, fullname text, checkin text, checkout text, guests text,
   total_price integer, transfer_code text, status text,
   created_at timestamp with time zone, paid_at timestamp with time zone, confirmed_at timestamp with time zone,
   admin_note text, review_status text,
   slip_room_no text, slip_promo text, slip_note text,
   slip_bank_name text, slip_bank_account text, slip_bank_holder text,
   pay_state text, pay_amount integer, pay_method text
 )
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT b.booking_code, b.room,
         CASE WHEN v.ok THEN b.fullname ELSE public.mask_person_name(b.fullname) END,
         b.checkin, b.checkout, b.guests,
         b.total_price, b.transfer_code, b.status, b.created_at,
         b.paid_at, b.confirmed_at,
         CASE WHEN v.ok THEN b.admin_note ELSE NULL END,
         CASE WHEN r.id IS NULL THEN 'none' WHEN r.is_published THEN 'published' ELSE 'pending' END,
         b.slip_room_no, b.slip_promo, b.slip_note,
         CASE WHEN v.ok THEN b.slip_bank_name ELSE NULL END,
         CASE WHEN v.ok THEN b.slip_bank_account ELSE NULL END,
         CASE WHEN v.ok THEN b.slip_bank_holder ELSE NULL END,
         b.pay_state, b.pay_amount, b.pay_method
  FROM bookings b
  LEFT JOIN reviews r ON r.booking_code = b.booking_code
  CROSS JOIN LATERAL (
    SELECT (
      length(right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 4)) = 4
      AND right(regexp_replace(coalesce(b.phone, ''), '\D', '', 'g'), 4)
          = right(regexp_replace(p_phone, '\D', '', 'g'), 4)
    ) AS ok
  ) v
  WHERE length(trim(coalesce(p_code, ''))) >= 6
    AND b.booking_code = upper(trim(p_code))
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.track_booking(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_booking(text, text) TO anon, authenticated, service_role;

COMMIT;
