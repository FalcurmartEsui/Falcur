-- Create app_settings table for admin configuration
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read settings"
  ON public.app_settings
  FOR SELECT
  USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can update settings"
  ON public.app_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert settings"
  ON public.app_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default store_enabled setting
INSERT INTO public.app_settings (key, value)
VALUES ('store_enabled', '{"enabled": true}'::jsonb);