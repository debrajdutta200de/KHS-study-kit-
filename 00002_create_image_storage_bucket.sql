-- Create storage bucket for textbook images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-8z3d3tngy9dt_textbook_images',
  'app-8z3d3tngy9dt_textbook_images',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
);

-- Create storage policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload textbook images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'app-8z3d3tngy9dt_textbook_images');

-- Create storage policy for public read access
CREATE POLICY "Public read access for textbook images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'app-8z3d3tngy9dt_textbook_images');

-- Create storage policy for users to delete their own images
CREATE POLICY "Users can delete their own textbook images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'app-8z3d3tngy9dt_textbook_images');