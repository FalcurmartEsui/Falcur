-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view product images
CREATE POLICY "Product images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated sellers to upload their own product images
CREATE POLICY "Sellers can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
);

-- Allow sellers to update their own product images
CREATE POLICY "Sellers can update their product images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
);

-- Allow sellers to delete their own product images
CREATE POLICY "Sellers can delete their product images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
);