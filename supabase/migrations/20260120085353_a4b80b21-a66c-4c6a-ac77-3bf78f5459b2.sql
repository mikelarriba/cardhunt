-- Add image_url column to cards table
ALTER TABLE public.cards ADD COLUMN image_url text;

-- Create storage bucket for card images
INSERT INTO storage.buckets (id, name, public) VALUES ('card-images', 'card-images', true);

-- Storage policies for card images
CREATE POLICY "Users can upload their own card images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'card-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own card images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'card-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own card images"
ON storage.objects FOR DELETE
USING (bucket_id = 'card-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Card images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'card-images');