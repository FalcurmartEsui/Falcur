-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  delivery_info JSONB NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_admin_approval',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies for orders
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all orders"
  ON public.orders FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Sellers can view orders for their products
CREATE POLICY "Sellers can view orders containing their products"
  ON public.orders FOR SELECT
  USING (
    has_role(auth.uid(), 'seller'::app_role) AND
    EXISTS (
      SELECT 1 FROM jsonb_array_elements(items) AS item
      WHERE (item->>'seller_id')::uuid = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create order_notifications table
CREATE TABLE public.order_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for order_notifications
CREATE POLICY "Sellers can view their own notifications"
  ON public.order_notifications FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own notifications"
  ON public.order_notifications FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "System can create notifications"
  ON public.order_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all notifications"
  ON public.order_notifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));