-- Prevent two live bookings from overlapping on the same site.
--
-- The application checks for overlaps before inserting, but two concurrent requests can both
-- pass that check. This constraint makes the database the final authority.
--
-- Check-out day is exclusive ('[)'), so a stay ending on the 5th can be followed by one
-- starting on the 5th. CANCELLED, CHECKED_OUT and NO_SHOW bookings do not hold the site.
--
-- NOTE: this fails if existing rows already overlap. Find them with:
--   SELECT a.id, b.id FROM bookings a JOIN bookings b
--     ON a."siteId" = b."siteId" AND a.id < b.id
--    AND a.status IN ('PENDING','CONFIRMED','CHECKED_IN')
--    AND b.status IN ('PENDING','CONFIRMED','CHECKED_IN')
--    AND tsrange(a."checkInDate", a."checkOutDate") && tsrange(b."checkInDate", b."checkOutDate");

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "siteId" WITH =,
    tsrange("checkInDate", "checkOutDate", '[)') WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED', 'CHECKED_IN'));
