-- Create cart_notifications table for tracking when products are added to cart
CREATE TABLE IF NOT EXISTS public.cart_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  product_title text NOT NULL,
  customer_name text,
  quantity integer NOT NULL DEFAULT 1,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cart_notifications ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own notifications
CREATE POLICY "Sellers can view their own cart notifications"
  ON public.cart_notifications
  FOR SELECT
  USING (auth.uid() = seller_id);

-- Anyone can create cart notifications (for adding to cart)
CREATE POLICY "Anyone can create cart notifications"
  ON public.cart_notifications
  FOR INSERT
  WITH CHECK (true);

-- Sellers can update their own notifications (mark as read)
CREATE POLICY "Sellers can update their own cart notifications"
  ON public.cart_notifications
  FOR UPDATE
  USING (auth.uid() = seller_id);

-- Create index for better performance
CREATE INDEX idx_cart_notifications_seller_id ON public.cart_notifications(seller_id);
CREATE INDEX idx_cart_notifications_created_at ON public.cart_notifications(created_at DESC);

-- Update profiles table to capture more user information
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS postal_code text;

-- Enable realtime for cart notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_notifications;