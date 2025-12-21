import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Loader2 } from 'lucide-react';
import { useTags, useCreateTag } from '@/hooks/useTags';
import { Job } from '@/hooks/useJobs';

const jobSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  responsibilities: z.string().optional(),
  requirements: z.string().optional(),
  education_required: z.string().optional(),
  experience_required: z.string().optional(),
  benefits: z.string().optional(),
  salary_min: z.number().optional().nullable(),
  salary_max: z.number().optional().nullable(),
  job_type: z.enum(['clt', 'pj', 'temporary', 'internship', 'remote', 'hybrid']),
  work_schedule: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zip_code: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  location_name: z.string().optional(),
  is_remote: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobFormProps {
  job?: Job | null;
  companyId?: string | null;
  onSubmit: (data: JobFormData & { skills_required: string[]; company_id?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const jobTypeLabels: Record<string, string> = {
  clt: 'CLT',
  pj: 'PJ',
  temporary: 'Temporário',
  internship: 'Estágio',
  remote: 'Remoto',
  hybrid: 'Híbrido',
};

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
];

export function JobForm({ job, companyId, onSubmit, onCancel, isLoading }: JobFormProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(job?.skills_required || []);
  const [newTag, setNewTag] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(job?.company_id || companyId || '');
  const { data: tags } = useTags();
  const createTag = useCreateTag();

  // Fetch companies for selection (if user doesn't have a company)
  const { data: companies } = useQuery({
    queryKey: ['available-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !companyId,
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job?.title || '',
      description: job?.description || '',
      responsibilities: job?.responsibilities || '',
      requirements: job?.requirements || '',
      education_required: job?.education_required || '',
      experience_required: job?.experience_required || '',
      benefits: job?.benefits || '',
      salary_min: job?.salary_min || null,
      salary_max: job?.salary_max || null,
      job_type: job?.job_type || 'clt',
      work_schedule: job?.work_schedule || '',
      street: job?.street || '',
      number: job?.number || '',
      neighborhood: job?.neighborhood || '',
      city: job?.city || '',
      state: job?.state || '',
      zip_code: job?.zip_code || '',
      is_remote: job?.is_remote || false,
      is_featured: job?.is_featured || false,
      is_active: job?.is_active ?? true,
    },
  });

  const watchZipCode = watch('zip_code');

  // CEP autofill
  useEffect(() => {
    const fetchAddress = async () => {
      const cep = watchZipCode?.replace(/\D/g, '');
      if (cep?.length === 8) {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const data = await response.json();
          if (!data.erro) {
            setValue('street', data.logradouro);
            setValue('neighborhood', data.bairro);
            setValue('city', data.localidade);
            setValue('state', data.uf);
          }
        } catch (error) {
          console.error('Error fetching CEP:', error);
        }
      }
    };
    fetchAddress();
  }, [watchZipCode, setValue]);

  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      // Create tag if it doesn't exist
      if (!tags?.find(t => t.name.toLowerCase() === newTag.toLowerCase())) {
        createTag.mutate({ name: newTag.trim(), type: 'local' });
      }
      setNewTag('');
    }
  };

  const handleSelectTag = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleRemoveTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagName));
  };

  const onFormSubmit = (data: JobFormData) => {
    onSubmit({ ...data, skills_required: selectedTags, company_id: selectedCompanyId || companyId });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seletor de empresa se usuário não está vinculado a uma */}
          {!companyId && companies && companies.length > 0 && (
            <div>
              <Label>Empresa *</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="title">Título da Vaga *</Label>
            <Input id="title" {...register('title')} placeholder="Ex: Desenvolvedor Full-Stack" />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Textarea id="description" {...register('description')} rows={4} placeholder="Descreva a vaga..." />
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <Label htmlFor="responsibilities">Responsabilidades</Label>
            <Textarea id="responsibilities" {...register('responsibilities')} rows={3} />
          </div>

          <div>
            <Label htmlFor="requirements">Requisitos</Label>
            <Textarea id="requirements" {...register('requirements')} rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="education_required">Formação Acadêmica</Label>
              <Input id="education_required" {...register('education_required')} />
            </div>
            <div>
              <Label htmlFor="experience_required">Experiência Requerida</Label>
              <Input id="experience_required" {...register('experience_required')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags / Habilidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {tags && tags.length > 0 && (
            <div>
              <Label className="text-sm text-muted-foreground">Tags disponíveis:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.filter(t => !selectedTags.includes(t.name)).slice(0, 10).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSelectTag(tag.name)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {selectedTags.length > 0 && (
            <div>
              <Label className="text-sm">Tags selecionadas:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipo e Remuneração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Contrato *</Label>
              <Select defaultValue={job?.job_type || 'clt'} onValueChange={(v) => setValue('job_type', v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(jobTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="work_schedule">Horário de Trabalho</Label>
              <Input id="work_schedule" {...register('work_schedule')} placeholder="Ex: 08:00 - 18:00" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary_min">Salário Mínimo (R$)</Label>
              <Input 
                id="salary_min" 
                type="number" 
                {...register('salary_min', { valueAsNumber: true })} 
              />
            </div>
            <div>
              <Label htmlFor="salary_max">Salário Máximo (R$)</Label>
              <Input 
                id="salary_max" 
                type="number" 
                {...register('salary_max', { valueAsNumber: true })} 
              />
            </div>
          </div>

          <div>
            <Label htmlFor="benefits">Benefícios</Label>
            <Textarea id="benefits" {...register('benefits')} placeholder="Vale alimentação, vale refeição..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Localização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="zip_code">CEP</Label>
              <Input id="zip_code" {...register('zip_code')} placeholder="00000-000" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="street">Rua</Label>
              <Input id="street" {...register('street')} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="number">Número</Label>
              <Input id="number" {...register('number')} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input id="neighborhood" {...register('neighborhood')} />
            </div>
            <div>
              <Label htmlFor="location_name">Nome do Local</Label>
              <Input id="location_name" {...register('location_name')} placeholder="Escritório" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Cidade *</Label>
              <Input id="city" {...register('city')} />
              {errors.city && <p className="text-sm text-destructive mt-1">{errors.city.message}</p>}
            </div>
            <div>
              <Label>Estado *</Label>
              <Select defaultValue={job?.state} onValueChange={(v) => setValue('state', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {brazilianStates.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && <p className="text-sm text-destructive mt-1">{errors.state.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opções</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Vaga Remota</Label>
              <p className="text-sm text-muted-foreground">A vaga aceita trabalho remoto</p>
            </div>
            <Switch 
              checked={watch('is_remote')} 
              onCheckedChange={(v) => setValue('is_remote', v)} 
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Vaga Ativa</Label>
              <p className="text-sm text-muted-foreground">A vaga está visível para candidatos</p>
            </div>
            <Switch 
              checked={watch('is_active')} 
              onCheckedChange={(v) => setValue('is_active', v)} 
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Vaga em Destaque</Label>
              <p className="text-sm text-muted-foreground">A vaga aparece no topo dos resultados</p>
            </div>
            <Switch 
              checked={watch('is_featured')} 
              onCheckedChange={(v) => setValue('is_featured', v)} 
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {job ? 'Atualizar Vaga' : 'Criar Vaga'}
        </Button>
      </div>
    </form>
  );
}
