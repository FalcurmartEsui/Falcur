ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account_number text;

CREATE INDEX IF NOT EXISTS idx_profiles_bank_account_number ON public.profiles (bank_account_number);