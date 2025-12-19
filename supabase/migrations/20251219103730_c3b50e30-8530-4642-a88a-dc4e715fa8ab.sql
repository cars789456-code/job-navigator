-- Fix profiles RLS to be more secure
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Company members can view profiles of job applicants
CREATE POLICY "Company members can view applicant profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON j.id = a.job_id
    WHERE a.user_id = profiles.user_id
    AND is_company_member(auth.uid(), j.company_id)
  )
);

-- Users can view profiles of people in their conversations
CREATE POLICY "Users can view profiles in conversations"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = auth.uid()
    AND cp2.user_id = profiles.user_id
  )
);