import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Briefcase, 
  Users, 
  MessageSquare, 
  Search, 
  Shield, 
  Zap,
  Building2,
  ChevronRight,
  Star,
  CheckCircle2
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-corporate flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">JobConnect</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Preços</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Depoimentos</a>
          </nav>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild className="gradient-corporate border-0">
              <Link to="/auth?mode=signup">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Plataforma #1 de Recrutamento
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
            Conecte talentos às melhores{' '}
            <span className="text-primary">oportunidades</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            A plataforma moderna de recrutamento que aproxima empresas e candidatos 
            com inteligência, agilidade e comunicação em tempo real.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="gradient-corporate border-0 text-lg px-8 h-14">
              <Link to="/auth?mode=signup">
                Criar Conta Grátis
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 h-14">
              <Link to="/auth?mode=signup&type=company">
                <Building2 className="w-5 h-5 mr-2" />
                Sou Empresa
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Gratuito para candidatos
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              +10.000 vagas ativas
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              +500 empresas
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tudo que você precisa para recrutar ou ser contratado
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa com recursos modernos para otimizar todo o processo de recrutamento.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="bg-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg group"
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="w-6 h-6 text-accent-foreground group-hover:text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Planos para todos os tamanhos
          </h2>
          <p className="text-lg text-muted-foreground">
            Candidatos usam grátis. Empresas escolhem o plano ideal.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="bg-card border-border/50">
            <CardContent className="p-8">
              <h3 className="font-display text-xl font-semibold mb-2">Candidato</h3>
              <p className="text-muted-foreground mb-6">Para quem busca emprego</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">Grátis</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Perfil completo', 'Candidaturas ilimitadas', 'Chat com recrutadores', 'Alertas de vagas'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/auth?mode=signup">Criar Conta</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Business Plan */}
          <Card className="bg-card border-primary shadow-glow relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-corporate text-primary-foreground text-sm font-medium">
              Popular
            </div>
            <CardContent className="p-8">
              <h3 className="font-display text-xl font-semibold mb-2">Empresa</h3>
              <p className="text-muted-foreground mb-6">Para pequenas e médias empresas</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">R$ 199</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['5 vagas ativas', 'Até 3 recrutadores', 'Chat ilimitado', 'Gestão de candidatos', 'Relatórios básicos'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full gradient-corporate border-0" asChild>
                <Link to="/auth?mode=signup&type=company">Começar Agora</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="bg-card border-border/50">
            <CardContent className="p-8">
              <h3 className="font-display text-xl font-semibold mb-2">Premium</h3>
              <p className="text-muted-foreground mb-6">Para grandes empresas</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">R$ 499</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Vagas ilimitadas', 'Recrutadores ilimitados', 'Vagas em destaque', 'Dashboard avançado', 'Suporte prioritário', 'API de integração'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/auth?mode=signup&type=company&plan=premium">Falar com Vendas</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            O que dizem nossos usuários
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-4">{testimonial.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-medium">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="gradient-corporate border-0 overflow-hidden">
          <CardContent className="p-12 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Pronto para transformar seu recrutamento?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de empresas e candidatos que já estão conectando talentos às melhores oportunidades.
            </p>
            <Button size="lg" variant="secondary" className="text-lg px-8 h-14" asChild>
              <Link to="/auth?mode=signup">
                Começar Gratuitamente
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-corporate flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display text-lg font-bold">JobConnect</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                A plataforma moderna de recrutamento que conecta talentos às melhores oportunidades.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Para Empresas</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Para Candidatos</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} JobConnect. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Search,
    title: 'Busca Inteligente',
    description: 'Encontre vagas por localização, tags, nome ou use filtros avançados para encontrar a oportunidade perfeita.',
  },
  {
    icon: MessageSquare,
    title: 'Chat em Tempo Real',
    description: 'Comunique-se diretamente com recrutadores ou candidatos através do nosso sistema de mensagens instantâneas.',
  },
  {
    icon: Users,
    title: 'Gestão de Candidatos',
    description: 'Organize candidaturas, acompanhe status e gerencie todo o processo seletivo em um só lugar.',
  },
  {
    icon: Building2,
    title: 'Perfil de Empresa',
    description: 'Crie a página da sua empresa, adicione sua marca e atraia os melhores talentos do mercado.',
  },
  {
    icon: Shield,
    title: 'Dados Seguros',
    description: 'Suas informações protegidas com criptografia de ponta a ponta e políticas rigorosas de privacidade.',
  },
  {
    icon: Zap,
    title: 'Dashboard Premium',
    description: 'Métricas avançadas, relatórios detalhados e insights para otimizar seu processo de recrutamento.',
  },
];

const testimonials = [
  {
    text: 'O JobConnect revolucionou nossa forma de contratar. Reduzimos o tempo de contratação em 60% e a qualidade dos candidatos é excelente.',
    name: 'Maria Santos',
    role: 'RH Manager, TechCorp',
  },
  {
    text: 'Encontrei meu emprego dos sonhos em menos de duas semanas. A plataforma é intuitiva e o chat direto com recrutadores faz toda diferença.',
    name: 'João Silva',
    role: 'Desenvolvedor Senior',
  },
  {
    text: 'O sistema de tags e busca por localização nos ajuda a encontrar candidatos qualificados na região certa. Altamente recomendado!',
    name: 'Ana Oliveira',
    role: 'Head de Talent, Startup XYZ',
  },
];
