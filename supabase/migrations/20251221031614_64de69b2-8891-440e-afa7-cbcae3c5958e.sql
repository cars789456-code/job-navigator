-- Atualizar RLS para permitir usuários criarem vagas sem empresa (associando a uma empresa "pessoal")
-- Primeiro, permitir que usuários sem empresa criem vagas

-- Adicionar política para permitir que qualquer usuário autenticado crie vagas
DROP POLICY IF EXISTS "Company members can create jobs" ON public.jobs;
CREATE POLICY "Authenticated users can create jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Atualizar política de update para incluir o criador da vaga
DROP POLICY IF EXISTS "Company members can update jobs" ON public.jobs;
CREATE POLICY "Users can update own jobs" 
ON public.jobs 
FOR UPDATE 
USING (auth.uid() = created_by OR is_company_member(auth.uid(), company_id));

-- Atualizar política de delete para incluir o criador da vaga
DROP POLICY IF EXISTS "Company members can delete jobs" ON public.jobs;
CREATE POLICY "Users can delete own jobs" 
ON public.jobs 
FOR DELETE 
USING (auth.uid() = created_by OR is_company_member(auth.uid(), company_id));

-- Atualizar política de select para ver suas próprias vagas
DROP POLICY IF EXISTS "Company members can view all company jobs" ON public.jobs;
CREATE POLICY "Users can view own jobs" 
ON public.jobs 
FOR SELECT 
USING (auth.uid() = created_by OR is_company_member(auth.uid(), company_id));