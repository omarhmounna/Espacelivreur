-- Add approval system to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_approved BOOLEAN DEFAULT false,
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approved_by UUID;

-- Create index for better performance
CREATE INDEX idx_profiles_is_approved ON public.profiles(is_approved);

-- Update RLS policies to check approval status
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Allow users to insert their own profile (but not approved by default)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own profile (but cannot change approval status)
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  is_approved = OLD.is_approved AND 
  approved_at = OLD.approved_at AND 
  approved_by = OLD.approved_by
);

-- Create admin role for managing approvals
CREATE POLICY "Admins can update approval status" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_approved = true
  )
);

-- Update existing users to be approved (for backward compatibility)
UPDATE public.profiles SET is_approved = true WHERE is_approved = false;