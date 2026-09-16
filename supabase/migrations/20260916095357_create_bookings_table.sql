/*
# Create bookings table for Bảnh Fuli Homestay

1. New Tables
- `bookings` — stores all room/tour booking requests from customers
  - `id` (uuid, primary key, auto-generated)
  - `room` (text, not null) — room or tour name
  - `fullname` (text, not null) — customer name
  - `phone` (text, not null) — customer phone number
  - `checkin` (text, not null) — check-in date
  - `checkout` (text, not null) — check-out date
  - `guests` (text) — number of guests
  - `notes` (text) — additional notes
  - `total_price` (integer, not null, default 0) — total booking amount in VND
  - `transfer_code` (text) — bank transfer reference code
  - `status` (text, not null, default 'Chờ duyệt tiền cọc') — booking status
  - `created_at` (timestamptz, default now()) — when the booking was created

2. Security
- Enable RLS on `bookings`.
- Allow anon + authenticated full CRUD because this is a single-tenant app (no sign-in screen for customers; admin gate is handled client-side via localStorage).
- All data is intentionally public/shared within the homestay operation.
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room text NOT NULL,
  fullname text NOT NULL,
  phone text NOT NULL,
  checkin text NOT NULL,
  checkout text NOT NULL,
  guests text,
  notes text,
  total_price integer NOT NULL DEFAULT 0,
  transfer_code text,
  status text NOT NULL DEFAULT 'Chờ duyệt tiền cọc',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
CREATE POLICY "anon_select_bookings" ON bookings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;
CREATE POLICY "anon_delete_bookings" ON bookings FOR DELETE
  TO anon, authenticated USING (true);
