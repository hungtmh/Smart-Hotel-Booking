-- Prevent two active bookings from reserving the same physical room
-- for overlapping date ranges.
--
-- Run this once in Supabase SQL Editor or psql for an existing database.
-- This also upgrades booking check-in/check-out from DATE to TIMESTAMP
-- so same-day future time slots are valid.
-- If the ALTER TABLE fails, run this query to find existing overlapping rows:
--
-- SELECT b1.id AS booking_id, b2.id AS conflicting_booking_id, b1.room_id
-- FROM bookings b1
-- JOIN bookings b2
--   ON b1.id < b2.id
--  AND b1.room_id = b2.room_id
--  AND b1.status <> 'CANCELLED'
--  AND b2.status <> 'CANCELLED'
--  AND tsrange(b1.check_in_date, b1.check_out_date, '[)')
--      && tsrange(b2.check_in_date, b2.check_out_date, '[)');

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
    DROP CONSTRAINT IF EXISTS booking_no_room_overlap;

ALTER TABLE bookings
    ALTER COLUMN check_in_date TYPE TIMESTAMP USING check_in_date::timestamp,
    ALTER COLUMN check_out_date TYPE TIMESTAMP USING check_out_date::timestamp;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'booking_no_room_overlap'
    ) THEN
        ALTER TABLE bookings
            ADD CONSTRAINT booking_no_room_overlap
            EXCLUDE USING gist (
                room_id WITH =,
                tsrange(check_in_date, check_out_date, '[)') WITH &&
            )
            WHERE (status <> 'CANCELLED');
    END IF;
END $$;
