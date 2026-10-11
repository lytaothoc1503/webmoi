/* Khóa đăng nhập quản trị: mã PIN do MÁY CHỦ kiểm + bắt buộc mã 2 bước (TOTP) nếu admin đã đăng ký.
   Chạy 1 lần trong SQL Editor. Chạy lại vẫn an toàn.
   - PIN lưu dạng băm (bcrypt), sai 5 lần khóa 15 phút (tăng dần), không bao giờ gửi PIN về trình duyệt.
   - is_admin() (dùng trong mọi chính sách RLS) chỉ đúng khi: có trong bảng admins
       + (nếu đã đặt PIN) phiên đăng nhập hiện tại đã nhập đúng PIN trong 12 giờ qua
       + (nếu đã đăng ký TOTP) phiên đã xác thực mã 2 bước (aal2).
   - Chưa đặt PIN/TOTP thì admin vẫn vào được để đặt (lần đầu), vào xong phải đặt ngay ở mục "Bảo mật". */

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.admin_pins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  failed int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.admin_pin_sessions (
  session_id text PRIMARY KEY,
  user_id uuid NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_pin_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_pins, public.admin_pin_sessions FROM PUBLIC, anon, authenticated;

-- Hàm nội bộ: phiên hiện tại đã qua PIN chưa
CREATE OR REPLACE FUNCTION public._pin_ok() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.admin_pins WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.admin_pin_sessions s
                 WHERE s.user_id = auth.uid() AND s.session_id = coalesce(auth.jwt() ->> 'session_id', '-')
                   AND s.verified_at > now() - interval '12 hours');
$$;
CREATE OR REPLACE FUNCTION public._mfa_ok() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM auth.mfa_factors f WHERE f.user_id = auth.uid() AND f.factor_type = 'totp' AND f.status = 'verified')
      OR coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;
REVOKE ALL ON FUNCTION public._pin_ok(), public._mfa_ok() FROM PUBLIC, anon, authenticated;

-- is_admin(): giữ tên cũ để mọi chính sách RLS hiện có tự áp dụng khóa mới
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) AND public._pin_ok() AND public._mfa_ok();
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Trạng thái bảo mật của người đang đăng nhập (không lộ gì cho người không phải admin)
CREATE OR REPLACE FUNCTION public.admin_status() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) THEN
    RETURN jsonb_build_object('admin', false);
  END IF;
  RETURN jsonb_build_object('admin', true,
    'pin_set', EXISTS (SELECT 1 FROM public.admin_pins WHERE user_id = auth.uid()),
    'pin_ok', public._pin_ok(),
    'mfa_ok', public._mfa_ok(),
    'locked_until', (SELECT locked_until FROM public.admin_pins WHERE user_id = auth.uid() AND locked_until > now()));
END $$;

-- Nhập PIN. Trả {ok, left, locked_until}. Sai không báo lỗi (để bộ đếm sai được lưu).
CREATE OR REPLACE FUNCTION public.admin_verify_pin(p_pin text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE r public.admin_pins; sid text := auth.jwt() ->> 'session_id'; n int; lock_min int;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) THEN
    RETURN jsonb_build_object('ok', false);
  END IF;
  IF sid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'no_session'); END IF;
  SELECT * INTO r FROM public.admin_pins WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', true, 'no_pin', true); END IF;
  IF r.locked_until IS NOT NULL AND r.locked_until > now() THEN
    RETURN jsonb_build_object('ok', false, 'locked_until', r.locked_until);
  END IF;
  IF p_pin IS NOT NULL AND r.pin_hash = extensions.crypt(p_pin, r.pin_hash) THEN
    UPDATE public.admin_pins SET failed = 0, locked_until = NULL WHERE user_id = auth.uid();
    DELETE FROM public.admin_pin_sessions WHERE verified_at < now() - interval '2 days';
    INSERT INTO public.admin_pin_sessions(session_id, user_id, verified_at) VALUES (sid, auth.uid(), now())
      ON CONFLICT (session_id) DO UPDATE SET verified_at = now(), user_id = auth.uid();
    RETURN jsonb_build_object('ok', true);
  END IF;
  n := r.failed + 1;
  IF n >= 5 THEN
    lock_min := LEAST(15 * (2 ^ ((n - 5) / 5))::int, 1440);   -- 15', 30', 60'... tối đa 24 giờ
    UPDATE public.admin_pins SET failed = n, locked_until = now() + make_interval(mins => lock_min) WHERE user_id = auth.uid();
    RETURN jsonb_build_object('ok', false, 'locked_until', now() + make_interval(mins => lock_min));
  END IF;
  UPDATE public.admin_pins SET failed = n WHERE user_id = auth.uid();
  RETURN jsonb_build_object('ok', false, 'left', 5 - n);
END $$;

-- Đặt / đổi PIN (6-8 chữ số). Đã có PIN thì phải đúng PIN cũ (và không đang bị khóa).
CREATE OR REPLACE FUNCTION public.admin_set_pin(p_old text, p_new text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE r public.admin_pins; sid text := auth.jwt() ->> 'session_id';
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_admin');
  END IF;
  IF sid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'no_session'); END IF;
  IF p_new IS NULL OR p_new !~ '^[0-9]{6,8}$' THEN RETURN jsonb_build_object('ok', false, 'error', 'format'); END IF;
  IF p_new ~ '^(.)\1+$' OR p_new IN ('123456','1234567','12345678','654321','012345','123123','112233') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'weak');
  END IF;
  SELECT * INTO r FROM public.admin_pins WHERE user_id = auth.uid() FOR UPDATE;
  IF FOUND THEN
    IF r.locked_until IS NOT NULL AND r.locked_until > now() THEN RETURN jsonb_build_object('ok', false, 'error', 'locked', 'locked_until', r.locked_until); END IF;
    IF p_old IS NULL OR r.pin_hash <> extensions.crypt(p_old, r.pin_hash) THEN
      UPDATE public.admin_pins SET failed = failed + 1,
        locked_until = CASE WHEN failed + 1 >= 5 THEN now() + interval '15 minutes' END WHERE user_id = auth.uid();
      RETURN jsonb_build_object('ok', false, 'error', 'wrong_old');
    END IF;
    UPDATE public.admin_pins SET pin_hash = extensions.crypt(p_new, extensions.gen_salt('bf', 10)), failed = 0, locked_until = NULL, updated_at = now() WHERE user_id = auth.uid();
    DELETE FROM public.admin_pin_sessions WHERE user_id = auth.uid() AND session_id <> sid;   -- đổi PIN thì các phiên khác phải nhập lại
  ELSE
    INSERT INTO public.admin_pins(user_id, pin_hash) VALUES (auth.uid(), extensions.crypt(p_new, extensions.gen_salt('bf', 10)));
  END IF;
  INSERT INTO public.admin_pin_sessions(session_id, user_id, verified_at) VALUES (sid, auth.uid(), now())
    ON CONFLICT (session_id) DO UPDATE SET verified_at = now(), user_id = auth.uid();
  RETURN jsonb_build_object('ok', true);
END $$;

-- Đăng xuất: xóa dấu "đã qua PIN" của phiên này
CREATE OR REPLACE FUNCTION public.admin_end_session() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.admin_pin_sessions WHERE user_id = auth.uid() AND session_id = coalesce(auth.jwt() ->> 'session_id', '-');
$$;

REVOKE ALL ON FUNCTION public.admin_status(), public.admin_verify_pin(text), public.admin_set_pin(text, text), public.admin_end_session() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_status(), public.admin_verify_pin(text), public.admin_set_pin(text, text), public.admin_end_session() TO authenticated;
