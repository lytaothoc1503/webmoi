-- track_booking(mã đơn) trước đây trả họ tên đầy đủ, admin_note và STK ghi trên phiếu
-- cho bất kỳ ai biết mã. Mã đơn vẫn mở được tình trạng, ngày, phòng, số tiền.
-- Muốn thấy đủ họ tên, lời nhắn của nhà và tài khoản ghi trên đơn: gửi thêm đúng 4 số cuối SĐT
-- (tham số p_phone có sẵn, trước đây không dùng). Không trả SĐT.
-- Chủ dự án chạy file này một lần trong Supabase > SQL Editor. Chạy lại vẫn an toàn.

BEGIN;

CREATE OR REPLACE FUNCTION public.mask_person_name(p_name text) RETURNS text
LANGUAGE sql
STABLE
AS $fn$
  SELECT CASE
    WHEN p_name IS NULL OR btrim(p_name) = '' THEN ''
    ELSE (
      SELECT string_agg(
        CASE
          WHEN ord = 1 THEN word
          WHEN char_length(word) = 0 THEN word
          ELSE left(word, 1) || repeat('*', greatest(char_length(word) - 1, 1))
        END,
        ' ' ORDER BY ord
      )
      FROM regexp_split_to_table(btrim(p_name), '\s+') WITH ORDINALITY AS s(word, ord)
    )
  END;
$fn$;

REVOKE ALL ON FUNCTION public.mask_person_name(text) FROM PUBLIC, anon, authenticated;

-- Cùng kiểu trả về nên CREATE OR REPLACE giữ quyền cũ. Vẫn cấp lại cho chắc.
CREATE OR REPLACE FUNCTION public.track_booking(p_code text, p_phone text DEFAULT NULL::text)
 RETURNS TABLE(booking_code text, room text, fullname text, checkin text, checkout text, guests text, total_price integer, transfer_code text, status text, created_at timestamp with time zone, paid_at timestamp with time zone, confirmed_at timestamp with time zone, admin_note text, review_status text, slip_room_no text, slip_promo text, slip_note text, slip_bank_name text, slip_bank_account text, slip_bank_holder text)
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
         CASE WHEN v.ok THEN b.slip_bank_holder ELSE NULL END
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
