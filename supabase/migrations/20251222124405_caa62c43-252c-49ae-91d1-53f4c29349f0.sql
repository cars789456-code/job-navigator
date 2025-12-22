-- Fix infinite recursion in RLS policies for company_members by using SECURITY DEFINER helpers

-- 1) Helper: check if a user is admin of a company (SECURITY DEFINER avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND is_admin = true
  );
$$;

-- 2) Replace policies on public.company_members
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company admins can manage members" ON public.company_members;
DROP POLICY IF EXISTS "Company members are viewable by company members" ON public.company_members;
DROP POLICY IF EXISTS "Users can join companies" ON public.company_members;

-- Members can see their own membership rows, and members of the same company can see each other
CREATE POLICY "Members can view company members"
ON public.company_members
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_company_member(auth.uid(), company_id)
);

-- User can insert their own membership row (self-join / linking)
CREATE POLICY "Users can join companies"
ON public.company_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Company admins can add anyone to their company
CREATE POLICY "Company admins can add members"
ON public.company_members
FOR INSERT
WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- Company admins can update membership rows
CREATE POLICY "Company admins can update members"
ON public.company_members
FOR UPDATE
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- Company admins can delete membership rows
CREATE POLICY "Company admins can delete members"
ON public.company_members
FOR DELETE
USING (public.is_company_admin(auth.uid(), company_id));
