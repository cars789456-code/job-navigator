-- Create role enum
CREATE TYPE public.app_role AS ENUM ('candidate', 'recruiter', 'company_admin', 'root');

-- Create subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'premium');

-- Create job type enum
CREATE TYPE public.job_type AS ENUM ('clt', 'pj', 'temporary', 'internship', 'remote', 'hybrid');

-- Create application status enum
CREATE TYPE public.application_status AS ENUM ('pending', 'reviewed', 'interview', 'rejected', 'hired');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  street TEXT,
  number TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  skills TEXT[] DEFAULT '{}',
  experience TEXT,
  education TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'candidate',
  UNIQUE (user_id, role)
);

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  size TEXT,
  subscription_tier subscription_tier DEFAULT 'free' NOT NULL,
  street TEXT,
  number TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create company_members table
CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (company_id, user_id)
);

-- Create tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  responsibilities TEXT,
  requirements TEXT,
  education_required TEXT,
  experience_required TEXT,
  skills_required TEXT[] DEFAULT '{}',
  benefits TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  job_type job_type DEFAULT 'clt' NOT NULL,
  work_schedule TEXT,
  street TEXT,
  number TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  is_remote BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create job_tags junction table
CREATE TABLE public.job_tags (
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (job_id, tag_id)
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status application_status DEFAULT 'pending' NOT NULL,
  cover_letter TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (job_id, user_id)
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create conversation_participants table
CREATE TABLE public.conversation_participants (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's company
CREATE OR REPLACE FUNCTION public.get_user_company(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.company_members
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create function to check if user is company member
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
  )
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', 'User'),
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'candidate');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Root can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'root'));

-- RLS Policies for companies
CREATE POLICY "Companies are viewable by everyone" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Company admins can update" ON public.companies FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.company_members WHERE company_id = id AND user_id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Authenticated users can create companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for company_members
CREATE POLICY "Company members are viewable by company members" ON public.company_members FOR SELECT USING (
  public.is_company_member(auth.uid(), company_id) OR auth.uid() = user_id
);
CREATE POLICY "Company admins can manage members" ON public.company_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.company_members cm WHERE cm.company_id = company_id AND cm.user_id = auth.uid() AND cm.is_admin = true)
);
CREATE POLICY "Users can join companies" ON public.company_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for tags
CREATE POLICY "Tags are viewable by everyone" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tags" ON public.tags FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for jobs
CREATE POLICY "Active jobs are viewable by everyone" ON public.jobs FOR SELECT USING (is_active = true);
CREATE POLICY "Company members can view all company jobs" ON public.jobs FOR SELECT USING (
  public.is_company_member(auth.uid(), company_id)
);
CREATE POLICY "Company members can create jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (
  public.is_company_member(auth.uid(), company_id)
);
CREATE POLICY "Company members can update jobs" ON public.jobs FOR UPDATE USING (
  public.is_company_member(auth.uid(), company_id)
);
CREATE POLICY "Company members can delete jobs" ON public.jobs FOR DELETE USING (
  public.is_company_member(auth.uid(), company_id)
);

-- RLS Policies for job_tags
CREATE POLICY "Job tags are viewable by everyone" ON public.job_tags FOR SELECT USING (true);
CREATE POLICY "Company members can manage job tags" ON public.job_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND public.is_company_member(auth.uid(), j.company_id))
);

-- RLS Policies for applications
CREATE POLICY "Users can view own applications" ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Company members can view job applications" ON public.applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND public.is_company_member(auth.uid(), j.company_id))
);
CREATE POLICY "Authenticated users can apply" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Company members can update application status" ON public.applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND public.is_company_member(auth.uid(), j.company_id))
);

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = id AND user_id = auth.uid())
);
CREATE POLICY "Authenticated users can create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for conversation_participants
CREATE POLICY "Users can view conversation participants" ON public.conversation_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Users can add participants" ON public.conversation_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own participation" ON public.conversation_participants FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can send messages to their conversations" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;