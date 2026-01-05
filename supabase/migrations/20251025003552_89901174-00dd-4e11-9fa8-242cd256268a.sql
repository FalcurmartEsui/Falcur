-- Update the products insert policy to allow users with seller role OR users who have a shop_name set
DROP POLICY IF EXISTS "Sellers can insert their own products" ON public.products;

CREATE POLICY "Sellers can insert their own products" 
ON public.products 
FOR INSERT 
WITH CHECK (
  auth.uid() = seller_id 
  AND (
    has_role(auth.uid(), 'seller'::app_role) 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND shop_name IS NOT NULL
    )
  )
);

-- Also update the profiles table to allow users to set their shop_name
-- which will make them a seller
ALTER TABLE public.profiles ALTER COLUMN shop_name DROP NOT NULL;