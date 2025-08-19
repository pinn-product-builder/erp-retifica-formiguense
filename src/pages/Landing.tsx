import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSEO } from '@/hooks/useSEO';
import { useAuth } from '@/hooks/useAuth';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  BarChart3, 
  CheckCircle, 
  Star,
  ArrowRight,
  Building2,
  Cog,
  FileText,
  DollarSign
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useSEO({
    title: 'Retífica Formiguense - Sistema ERP Completo para Retíficas',
    description: 'Sistema ERP especializado para retíficas com gestão de clientes, estoque, financeiro, workflow e muito mais. Aumente sua produtividade em até 40%.',
    keywords: 'ERP retífica, sistema gestão retífica, software retífica, gestão estoque motor, workflow retífica'
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Gestão de Clientes',
      description: 'Controle completo de clientes, histórico de serviços e relacionamento.'
    },
    {
      icon: Cog,
      title: 'Workflow Inteligente',
      description: 'Acompanhe cada etapa do processo de retífica com status em tempo real.'
    },
    {
      icon: BarChart3,
      title: 'Relatórios Avançados',
      description: 'Analytics detalhados para tomada de decisões estratégicas.'
    },
    {
      icon: Building2,
      title: 'Gestão de Estoque',
      description: 'Controle de peças, componentes e materiais automatizado.'
    },
    {
      icon: DollarSign,
      title: 'Financeiro Completo',
      description: 'Contas a pagar, receber, fluxo de caixa e DRE integrados.'
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Dados protegidos com criptografia e backup automático.'
    }
  ];

  const benefits = [
    'Aumento de 40% na produtividade',
    'Redução de 60% no tempo de gestão',
    'Controle total do financeiro',
    'Integração completa de processos',
    'Relatórios em tempo real',
    'Suporte especializado'
  ];

  const testimonials = [
    {
      name: 'João Silva',
      company: 'Retífica São Paulo',
      text: 'O sistema revolucionou nossa gestão. Conseguimos organizar melhor nossos processos e aumentar a produtividade.',
      rating: 5
    },
    {
      name: 'Maria Santos',
      company: 'Motor Center',
      text: 'Excelente ferramenta! O controle de estoque e financeiro ficou muito mais eficiente.',
      rating: 5
    },
    {
      name: 'Carlos Ferreira',
      company: 'Retífica Premium',
      text: 'Recomendo para qualquer retífica que quer crescer de forma organizada e profissional.',
      rating: 5
    }
  ];

  const stats = [
    { value: '500+', label: 'Empresas Atendidas' },
    { value: '98%', label: 'Satisfação' },
    { value: '40%', label: 'Aumento Produtividade' },
    { value: '24/7', label: 'Suporte' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">RF</span>
            </div>
            <span className="font-bold text-xl">Retífica Formiguense</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors">
              Benefícios
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Depoimentos
            </a>
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Entrar
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            🚀 Sistema #1 para Retíficas
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Gerencie sua Retífica
            <br />
            de Forma Profissional
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sistema ERP completo e especializado para retíficas. Controle clientes, estoque, 
            financeiro e workflow em uma única plataforma moderna e intuitiva.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/auth?utm_source=landing&utm_medium=hero&utm_campaign=cta_primary">
              <Button size="lg" className="text-lg px-8 py-6">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth?utm_source=landing&utm_medium=hero&utm_campaign=demo">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Ver Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que sua Retífica Precisa
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Funcionalidades desenvolvidas especificamente para o setor de retífica,
              com foco na produtividade e organização.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Por que Escolher Nosso Sistema?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Mais que um software, é uma solução completa para modernizar 
                e otimizar todos os processos da sua retífica.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-base">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/auth?utm_source=landing&utm_medium=benefits&utm_campaign=cta_secondary">
                  <Button size="lg">
                    Experimentar Agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <Card className="p-8 shadow-lg">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dashboard Principal</span>
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-primary/20 rounded-full">
                      <div className="h-4 bg-primary rounded-full w-3/4"></div>
                    </div>
                    <div className="h-4 bg-success/20 rounded-full">
                      <div className="h-4 bg-success rounded-full w-5/6"></div>
                    </div>
                    <div className="h-4 bg-warning/20 rounded-full">
                      <div className="h-4 bg-warning rounded-full w-2/3"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">847</div>
                      <div className="text-xs text-muted-foreground">Ordens Ativas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">R$ 45k</div>
                      <div className="text-xs text-muted-foreground">Faturamento</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que Nossos Clientes Dizem
            </h2>
            <p className="text-xl text-muted-foreground">
              Depoimentos reais de retíficas que transformaram seus negócios
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <div className="flex justify-center mb-4">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-warning fill-current" />
                ))}
              </div>
              <blockquote className="text-lg mb-6">
                "{testimonials[currentTestimonial].text}"
              </blockquote>
              <div>
                <div className="font-semibold">{testimonials[currentTestimonial].name}</div>
                <div className="text-muted-foreground">{testimonials[currentTestimonial].company}</div>
              </div>
            </Card>
            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-primary' : 'bg-muted'
                  }`}
                  onClick={() => setCurrentTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Pronto para Revolucionar sua Retífica?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de retíficas que já transformaram seus negócios. 
            Comece gratuitamente hoje mesmo!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?utm_source=landing&utm_medium=cta&utm_campaign=final_cta">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">RF</span>
                </div>
                <span className="font-bold">Retífica Formiguense</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Sistema ERP especializado para retíficas, desenvolvido por profissionais do setor.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Recursos</a></li>
                <li><a href="#benefits" className="hover:text-foreground transition-colors">Benefícios</a></li>
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Clientes</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Tutoriais</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Retífica Formiguense. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}