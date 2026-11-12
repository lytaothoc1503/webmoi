/* Thanh toán thẻ / ví / QR qua cổng 9Pay (redirect). Khách không nhập số thẻ trên web này.

   Chủ dự án chạy file này MỘT LẦN trong Supabase > SQL Editor > New query > Run.
   Chạy lại vẫn an toàn. Chưa chạy thì nút thanh toán thẻ báo chưa sẵn sàng, chuyển khoản VietQR vẫn dùng được.

   Không lưu số thẻ, tên in trên thẻ, token hay ảnh QR của thẻ. Chỉ lưu mã hóa đơn, số tiền, trạng thái và mã giao dịch 9Pay. */

BEGIN;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS pay_provider text,
  ADD COLUMN IF NOT EXISTS pay_invoice text,
  ADD COLUMN IF NOT EXISTS pay_amount integer,
  ADD COLUMN IF NOT EXISTS pay_state text,
  ADD COLUMN IF NOT EXISTS pay_method text,
  ADD COLUMN IF NOT EXISTS pay_ref text;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_pay_fields;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_pay_fields CHECK (
  (pay_provider IS NULL OR pay_provider = 'ninepay')
  AND (pay_state IS NULL OR pay_state IN ('partial', 'paid'))
  AND (pay_amount IS NULL OR pay_amount BETWEEN 0 AND 100000000)
  AND (pay_invoice IS NULL OR pay_invoice ~ '^[A-Z0-9-]{6,30}$')
  AND (pay_method IS NULL OR pay_method ~ '^[A-Z0-9_]{1,40}$')
  AND (pay_ref IS NULL OR pay_ref ~ '^[0-9]{1,24}$')
);

CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text NOT NULL,
  invoice_no text NOT NULL UNIQUE,
  amount integer NOT NULL,
  kind text NOT NULL,
  state text NOT NULL DEFAULT 'created',
  provider_ref text,
  provider_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_attempts_amount CHECK (amount BETWEEN 10000 AND 100000000),
  CONSTRAINT payment_attempts_kind CHECK (kind IN ('full', 'deposit')),
  CONSTRAINT payment_attempts_state CHECK (state IN ('created', 'processing', 'paid', 'failed', 'cancelled', 'expired')),
  CONSTRAINT payment_attempts_invoice CHECK (invoice_no ~ '^[A-Z0-9-]{6,30}$'),
  CONSTRAINT payment_attempts_method CHECK (provider_method IS NULL OR provider_method ~ '^[A-Z0-9_]{1,40}$'),
  CONSTRAINT payment_attempts_ref CHECK (provider_ref IS NULL OR provider_ref ~ '^[0-9]{1,24}$')
);

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_attempts FROM PUBLIC, anon, authenticated;

-- Khách tạo đơn không được tự khai đã thanh toán thẻ.
DROP POLICY IF EXISTS public_insert_bookings ON public.bookings;
CREATE POLICY public_insert_bookings ON public.bookings FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'Chờ thanh toán' AND booking_code IS NOT NULL AND paid_at IS NULL AND confirmed_at IS NULL
    AND admin_note IS NULL AND received_amount IS NULL AND user_id = (SELECT auth.uid())
    AND slip_room_no IS NULL AND slip_promo IS NULL AND slip_note IS NULL
    AND slip_bank_name IS NULL AND slip_bank_account IS NULL AND slip_bank_holder IS NULL
    AND pay_provider IS NULL AND pay_invoice IS NULL AND pay_amount IS NULL
    AND pay_state IS NULL AND pay_method IS NULL AND pay_ref IS NULL
  );

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'is_partner') THEN
    EXECUTE 'DROP POLICY IF EXISTS partner_insert_own_bookings ON public.bookings';
    EXECUTE $pol$
      CREATE POLICY partner_insert_own_bookings ON public.bookings FOR INSERT TO authenticated
      WITH CHECK (
        public.is_partner()
        AND partner_email IS NOT NULL
        AND lower(partner_email) = lower((SELECT email FROM auth.users WHERE id = (SELECT auth.uid())))
        AND status = 'Chờ thanh toán'
        AND booking_code IS NOT NULL
        AND user_id IS NULL
        AND paid_at IS NULL AND confirmed_at IS NULL AND admin_note IS NULL AND received_amount IS NULL
        AND slip_room_no IS NULL AND slip_promo IS NULL AND slip_note IS NULL
        AND slip_bank_name IS NULL AND slip_bank_account IS NULL AND slip_bank_holder IS NULL
        AND pay_provider IS NULL AND pay_invoice IS NULL AND pay_amount IS NULL
        AND pay_state IS NULL AND pay_method IS NULL AND pay_ref IS NULL
      )
    $pol$;
  END IF;
END $$;

-- Tạo hóa đơn 9Pay. Số tiền tính từ đơn trong CSDL, không tin số tiền trình duyệt gửi lên.
CREATE OR REPLACE FUNCTION public.create_ninepay_invoice(p_code text, p_kind text, p_deposit_percent integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b public.bookings%ROWTYPE;
  v_code text := upper(trim(coalesce(p_code, '')));
  v_paid integer;
  v_balance integer;
  v_amount integer;
  v_invoice text;
  v_kind text;
BEGIN
  IF v_code !~ '^[A-Z0-9]{6,20}$' THEN RETURN jsonb_build_object('ok', false, 'code', 'bad_request'); END IF;
  IF p_kind NOT IN ('full', 'deposit') THEN RETURN jsonb_build_object('ok', false, 'code', 'bad_request'); END IF;

  SELECT * INTO b FROM public.bookings WHERE booking_code = v_code FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'not_found'); END IF;
  IF b.status IS DISTINCT FROM 'Chờ thanh toán' OR coalesce(b.pay_state, '') = 'paid' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'closed');
  END IF;
  IF b.total_price IS NULL OR b.total_price <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'amount');
  END IF;

  v_paid := coalesce(b.pay_amount, 0);
  v_balance := b.total_price - v_paid;
  IF v_balance < 10000 OR v_balance > 100000000 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'amount');
  END IF;

  IF p_kind = 'deposit' THEN
    IF p_deposit_percent IS NULL OR p_deposit_percent < 1 OR p_deposit_percent > 99 THEN
      RETURN jsonb_build_object('ok', false, 'code', 'deposit');
    END IF;
    v_amount := floor(b.total_price * p_deposit_percent / 100.0)::integer;
    IF v_amount < 10000 THEN RETURN jsonb_build_object('ok', false, 'code', 'amount'); END IF;
    IF v_amount >= v_balance THEN v_amount := v_balance; END IF;
    v_kind := CASE WHEN v_amount >= v_balance THEN 'full' ELSE 'deposit' END;
  ELSE
    v_amount := v_balance;
    v_kind := 'full';
  END IF;

  SELECT invoice_no INTO v_invoice
    FROM public.payment_attempts
   WHERE booking_code = v_code AND state = 'created' AND amount = v_amount
     AND created_at > now() - interval '20 minutes'
   ORDER BY created_at DESC
   LIMIT 1;

  IF v_invoice IS NULL THEN
    UPDATE public.payment_attempts SET state = 'expired', updated_at = now()
     WHERE booking_code = v_code AND state = 'created';
    v_invoice := v_code || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    INSERT INTO public.payment_attempts (booking_code, invoice_no, amount, kind, state)
    VALUES (v_code, v_invoice, v_amount, v_kind, 'created');
  END IF;

  RETURN jsonb_build_object('ok', true, 'invoice_no', v_invoice, 'amount', v_amount, 'booking_code', v_code);
END $$;

-- Ghi kết quả đã kiểm chữ ký hoặc đã hỏi lại 9Pay. Không nhận số thẻ.
CREATE OR REPLACE FUNCTION public.apply_ninepay_result(p_invoice text, p_amount integer, p_status integer, p_ref text, p_method text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a public.payment_attempts%ROWTYPE;
  b public.bookings%ROWTYPE;
  v_invoice text := upper(trim(coalesce(p_invoice, '')));
  v_method text := upper(substring(coalesce(p_method, '') from '^[A-Z0-9_]{1,40}'));
  v_ref text := substring(coalesce(p_ref, '') from '^[0-9]{1,24}');
  v_paid integer;
  v_state text;
  v_status text;
  v_paid_at timestamptz;
BEGIN
  IF v_invoice !~ '^[A-Z0-9-]{6,30}$' THEN RETURN jsonb_build_object('ok', false, 'code', 'bad_request'); END IF;

  SELECT * INTO a FROM public.payment_attempts WHERE invoice_no = v_invoice FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'unknown'); END IF;

  SELECT * INTO b FROM public.bookings WHERE booking_code = a.booking_code FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'not_found'); END IF;

  IF p_status = 5 THEN
    IF p_amount IS DISTINCT FROM a.amount THEN
      RETURN jsonb_build_object('ok', false, 'code', 'amount', 'booking_code', b.booking_code);
    END IF;
    IF a.state = 'paid' THEN
      RETURN jsonb_build_object('ok', true, 'duplicate', true, 'booking_code', b.booking_code, 'pay_state', b.pay_state);
    END IF;

    UPDATE public.payment_attempts
       SET state = 'paid', provider_ref = nullif(v_ref, ''), provider_method = nullif(v_method, ''), updated_at = now()
     WHERE id = a.id;

    v_paid := coalesce(b.pay_amount, 0) + a.amount;
    IF v_paid >= b.total_price THEN
      v_state := 'paid';
      v_status := CASE WHEN b.status = 'Chờ thanh toán' THEN 'Đã thanh toán - chờ xác nhận' ELSE b.status END;
      v_paid_at := coalesce(b.paid_at, now());
    ELSE
      v_state := 'partial';
      v_status := b.status;
      v_paid_at := b.paid_at;
    END IF;

    UPDATE public.bookings
       SET pay_provider = 'ninepay',
           pay_invoice = v_invoice,
           pay_amount = v_paid,
           pay_state = v_state,
           pay_method = coalesce(nullif(v_method, ''), pay_method),
           pay_ref = coalesce(nullif(v_ref, ''), pay_ref),
           status = v_status,
           paid_at = v_paid_at,
           received_amount = GREATEST(coalesce(received_amount, 0), v_paid)
     WHERE id = b.id;

    RETURN jsonb_build_object('ok', true, 'booking_code', b.booking_code, 'pay_state', v_state);
  END IF;

  IF a.state = 'paid' THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true, 'booking_code', b.booking_code, 'pay_state', b.pay_state);
  END IF;

  UPDATE public.payment_attempts
     SET state = CASE
           WHEN p_status = 6 THEN 'failed'
           WHEN p_status = 8 THEN 'cancelled'
           WHEN p_status = 15 THEN 'expired'
           WHEN p_status IN (2, 4) THEN 'processing'
           ELSE state
         END,
         updated_at = now()
   WHERE id = a.id AND p_status IN (2, 4, 6, 8, 15);

  RETURN jsonb_build_object('ok', true, 'booking_code', b.booking_code, 'pay_state', b.pay_state);
END $$;

REVOKE ALL ON FUNCTION public.create_ninepay_invoice(text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_ninepay_result(text, integer, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_ninepay_invoice(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_ninepay_result(text, integer, integer, text, text) TO service_role;

-- Tra cứu đơn: thêm trạng thái thanh toán thẻ. Không trả số thẻ.
DROP FUNCTION IF EXISTS public.track_booking(text, text);
CREATE FUNCTION public.track_booking(p_code text, p_phone text DEFAULT NULL::text)
 RETURNS TABLE(booking_code text, room text, fullname text, checkin text, checkout text, guests text, total_price integer, transfer_code text, status text, created_at timestamp with time zone, paid_at timestamp with time zone, confirmed_at timestamp with time zone, admin_note text, review_status text, slip_room_no text, slip_promo text, slip_note text, slip_bank_name text, slip_bank_account text, slip_bank_holder text, pay_state text, pay_amount integer, pay_method text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT b.booking_code, b.room, b.fullname, b.checkin, b.checkout, b.guests,
         b.total_price, b.transfer_code, b.status, b.created_at,
         b.paid_at, b.confirmed_at, b.admin_note,
         CASE WHEN r.id IS NULL THEN 'none' WHEN r.is_published THEN 'published' ELSE 'pending' END,
         b.slip_room_no, b.slip_promo, b.slip_note, b.slip_bank_name, b.slip_bank_account, b.slip_bank_holder,
         b.pay_state, b.pay_amount, b.pay_method
  FROM bookings b
  LEFT JOIN reviews r ON r.booking_code = b.booking_code
  WHERE length(trim(coalesce(p_code, ''))) >= 6
    AND b.booking_code = upper(trim(p_code))
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.track_booking(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_booking(text, text) TO anon, authenticated, service_role;

COMMIT;
