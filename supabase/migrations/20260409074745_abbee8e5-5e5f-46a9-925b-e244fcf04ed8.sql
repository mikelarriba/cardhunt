ALTER TABLE public.buy_options
  ADD COLUMN is_numbered boolean NOT NULL DEFAULT false,
  ADD COLUMN serial_num integer,
  ADD COLUMN serial_total integer;