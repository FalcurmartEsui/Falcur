-- Create stores table for branded stores
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  store_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(owner_id)
);

-- Add store_id to products table to link products to stores
ALTER TABLE public.products ADD COLUMN store_id UUID REFERENCES public.stores(id);

-- Enable RLS on stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stores
CREATE POLICY "Stores are viewable by everyone"
ON public.stores
FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can view their own store even if inactive"
ON public.stores
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own store"
ON public.stores
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own store"
ON public.stores
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own store"
ON public.stores
FOR DELETE
USING (auth.uid() = owner_id);

-- Trigger for updated_at
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();