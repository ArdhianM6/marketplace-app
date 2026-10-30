-- Store the map coordinates captured on the add-address form.
alter table public.addresses
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
