import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  ArrowLeft, 
  Shield, 
  Building2, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Crown,
  Zap
} from "lucide-react";

interface SuperUserSignupData {
  email: string;
  name: string;
  company_name: string;
  phone: string;
  message: string;
  requested_type: 'platform_admin' | 'organization_creator';
}

export default function SuperUserSignup() {
  const [formData, setFormData] = useState<SuperUserSignupData>({
    email: '',
    name: '',
    company_name: '',
    phone: '',
    message: '',
    requested_type: 'organization_creator'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useSEO({
    title: 'Solicitação de Acesso - Super Usuário | Retífica Formiguense ERP',
    description: 'Solicite acesso como super usuário para criar e gerenciar organizações no sistema ERP da Retífica Formiguense.',
    keywords: 'super usuário, acesso administrativo, criar organização, ERP'
  });

  const handleInputChange = (field: keyof SuperUserSignupData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.email || !formData.name || !formData.company_name) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      // Submit request to Supabase
      const { error } = await supabase
        .from('super_user_signup_requests')
        .insert({
          email: formData.email.toLowerCase().trim(),
          name: formData.name.trim(),
          company_name: formData.company_name.trim(),
          phone: formData.phone.trim() || null,
          message: formData.message.trim() || null,
          requested_type: formData.requested_type,
        });

      if (error) {
        console.error('Error submitting request:', error);
        
        // Handle specific error cases
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Solicitação já existe",
            description: "Já existe uma solicitação pendente para este email.",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      setIsSubmitted(true);
      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação foi enviada com sucesso. Você receberá uma resposta em breve.",
      });

    } catch (error) {
      console.error('Error submitting super user request:', error);
      toast({
        title: "Erro ao enviar solicitação",
        description: "Ocorreu um erro ao enviar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-green-700">Solicitação Enviada!</CardTitle>
              <CardDescription className="text-center">
                Sua solicitação foi recebida com sucesso. Nossa equipe irá analisá-la e entrará em contato em breve.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Próximos passos:</strong>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>Nossa equipe analisará sua solicitação</li>
                    <li>Você receberá um email com a resposta</li>
                    <li>Se aprovado, receberá instruções de acesso</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/auth')}
                className="absolute left-4 top-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Solicitação de Acesso Super Usuário</CardTitle>
            <CardDescription className="text-center max-w-md mx-auto">
              Solicite acesso como super usuário para criar e gerenciar organizações no sistema ERP
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Alert explicativo */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Sobre o acesso de Super Usuário:</strong> Super usuários podem criar novas organizações e gerenciar aspectos administrativos da plataforma. Todas as solicitações são revisadas manualmente por nossa equipe.
                </AlertDescription>
              </Alert>

              {/* Tipo de acesso */}
              <div className="space-y-3">
                <Label htmlFor="requested_type">Tipo de Acesso Solicitado</Label>
                <Select 
                  value={formData.requested_type} 
                  onValueChange={(value: 'platform_admin' | 'organization_creator') => 
                    handleInputChange('requested_type', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de acesso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organization_creator">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium">Criador de Organizações</div>
                          <div className="text-xs text-muted-foreground">Pode criar e gerenciar organizações</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="platform_admin">
                      <div className="flex items-center space-x-2">
                        <Crown className="h-4 w-4 text-purple-600" />
                        <div>
                          <div className="font-medium">Administrador da Plataforma</div>
                          <div className="text-xs text-muted-foreground">Acesso total à plataforma</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Badges explicativos */}
                <div className="flex flex-wrap gap-2">
                  {formData.requested_type === 'organization_creator' && (
                    <Badge variant="secondary" className="text-blue-700 bg-blue-100">
                      <Building2 className="h-3 w-3 mr-1" />
                      Gerenciar Organizações
                    </Badge>
                  )}
                  {formData.requested_type === 'platform_admin' && (
                    <>
                      <Badge variant="secondary" className="text-purple-700 bg-purple-100">
                        <Crown className="h-3 w-3 mr-1" />
                        Acesso Total
                      </Badge>
                      <Badge variant="secondary" className="text-purple-700 bg-purple-100">
                        <Users className="h-3 w-3 mr-1" />
                        Gerenciar Super Usuários
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Dados pessoais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa *</Label>
                  <Input
                    id="company_name"
                    type="text"
                    placeholder="Nome da sua empresa"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>

              {/* Justificativa */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Justificativa da Solicitação
                  <span className="text-xs text-muted-foreground ml-2">(Opcional)</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Descreva o motivo da solicitação, como pretende usar o sistema, quantas organizações planeja criar, etc."
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Uma justificativa detalhada ajuda nossa equipe a processar sua solicitação mais rapidamente.
                </p>
              </div>

              {/* Informações importantes */}
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Após a aprovação, você receberá um email com instruções para criar sua conta e acessar o sistema. O processo de análise pode levar até 2 dias úteis.
                </AlertDescription>
              </Alert>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando Solicitação...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Enviar Solicitação
                  </>
                )}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                Já tem uma conta? {' '}
                <Link to="/auth" className="text-primary hover:underline">
                  Fazer login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
