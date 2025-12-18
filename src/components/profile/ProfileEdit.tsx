import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProfile, useUpdateProfile, Profile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, X, Plus, Save } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip_code: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
];

export function ProfileEdit() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      bio: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: '',
      experience: '',
      education: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        street: profile.street || '',
        number: profile.number || '',
        neighborhood: profile.neighborhood || '',
        city: profile.city || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        experience: profile.experience || '',
        education: profile.education || '',
      });
      setSkills(profile.skills || []);
    }
  }, [profile, reset]);

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

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({
        ...data,
        skills,
      });
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile?.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input id="full_name" {...register('full_name')} />
              {errors.full_name && <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" {...register('phone')} placeholder="(00) 00000-0000" />
          </div>

          <div>
            <Label htmlFor="bio">Sobre Mim</Label>
            <Textarea id="bio" {...register('bio')} rows={4} placeholder="Conte um pouco sobre você..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Habilidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar habilidade..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
            />
            <Button type="button" variant="outline" onClick={handleAddSkill}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                  <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Experiência e Formação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="experience">Experiência Profissional</Label>
            <Textarea id="experience" {...register('experience')} rows={4} placeholder="Descreva sua experiência profissional..." />
          </div>

          <div>
            <Label htmlFor="education">Formação Acadêmica</Label>
            <Textarea id="education" {...register('education')} rows={4} placeholder="Descreva sua formação acadêmica..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" {...register('city')} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select 
                value={watch('state') || undefined} 
                onValueChange={(v) => setValue('state', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {brazilianStates.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}
