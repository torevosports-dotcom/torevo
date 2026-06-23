-- Exact event location (lightweight maps): store coordinates so the app can show
-- a precise pin, "Get Directions", and distance. No Google API key needed.
alter table events add column if not exists lat double precision;
alter table events add column if not exists lng double precision;
