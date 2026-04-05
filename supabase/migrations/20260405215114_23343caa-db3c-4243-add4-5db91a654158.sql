ALTER TABLE public.sellers ADD COLUMN combined_shipping boolean NOT NULL DEFAULT false;
ALTER TABLE public.sellers ADD COLUMN shipping_cost numeric DEFAULT NULL;