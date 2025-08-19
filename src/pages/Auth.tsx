import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/useSEO";
import { Loader2, ArrowLeft, Shield, TrendingUp, Users, CheckCircle } from "lucide-react";
import { SetupDemoUsers } from "@/components/SetupDemoUsers";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { signIn, signUp, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useSEO({
    title: 'Login - Retífica Formiguense ERP',
    description: 'Acesse sua conta do sistema ERP da Retífica Formiguense. Gerencie clientes, estoque, financeiro e workflow.',
    keywords: 'login retífica, acesso sistema, ERP login'
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    navigate("/dashboard");
    return null;
  }

  // Capture UTM parameters for growth tracking
  useEffect(() => {
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');
    
    if (utmSource || utmMedium || utmCampaign) {
      sessionStorage.setItem('utm_data', JSON.stringify({
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign
      }));
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate("/dashboard");
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Get UTM data for growth tracking
    const utmData = sessionStorage.getItem('utm_data');
    const utmMetadata = utmData ? JSON.parse(utmData) : {};
    
    const { error } = await signUp(email, password, name, utmMetadata);
    
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await resetPassword(resetEmail);
    
    if (!error) {
      setShowResetPassword(false);
      setResetEmail("");
    }
    
    setIsLoading(false);
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowResetPassword(false)}
                  className="absolute left-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-foreground">RF</span>
                </div>
              </div>
              <CardTitle className="text-xl">Recuperar Senha</CardTitle>
              <CardDescription>
                Digite seu e-mail para receber as instruções de recuperação
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">E-mail</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Instruções"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header with back button */}
      <div className="p-4">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Home
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-5rem)]">
        {/* Left Panel - Marketing Content */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-primary/5">
          <div className="max-w-lg space-y-8">
            <div>
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-primary-foreground">RF</span>
              </div>
              <h1 className="text-4xl font-bold mb-4">
                Transforme sua Retífica com
                <span className="text-primary"> Tecnologia</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Sistema ERP completo desenvolvido especificamente para retíficas. 
                Gerencie tudo em um só lugar com eficiência e profissionalismo.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <span className="text-base">Gestão completa de clientes e histórico</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <span className="text-base">Workflow inteligente e automação</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-success" />
                </div>
                <span className="text-base">Controle financeiro e relatórios avançados</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-success" />
                </div>
                <span className="text-base">Gestão de estoque e funcionários</span>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">500+</div>
                <div className="text-sm text-muted-foreground">Retíficas já confiam em nosso sistema</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Authentication Forms */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6">
            <div className="lg:hidden text-center">
              <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <span className="text-lg font-bold text-primary-foreground">RF</span>
              </div>
              <h1 className="text-2xl font-bold">Retífica Formiguense</h1>
              <p className="text-muted-foreground mt-2">
                Sistema ERP para Gestão Completa
              </p>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="text-sm">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm">Criar Conta</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <Card className="shadow-lg border-0">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl">Bem-vindo de volta!</CardTitle>
                    <CardDescription>
                      Digite suas credenciais para acessar o sistema
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSignIn}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">E-mail</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Senha</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-3 pt-2">
                      <Button type="submit" className="w-full h-11" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          "Acessar Sistema"
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="link" 
                        size="sm"
                        className="text-sm text-muted-foreground hover:text-primary"
                        onClick={() => setShowResetPassword(true)}
                      >
                        Esqueci minha senha
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <Card className="shadow-lg border-0">
                  <CardHeader className="text-center pb-4">
                    <Badge variant="secondary" className="mb-2">
                      🎉 Cadastro Grátis
                    </Badge>
                    <CardTitle className="text-xl">Criar nova conta</CardTitle>
                    <CardDescription>
                      Cadastre-se e comece a transformar sua retífica hoje mesmo
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSignUp}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Nome completo</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Seu nome completo"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">E-mail profissional</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="seu@empresa.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Senha</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Mínimo 8 caracteres"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
                          className="h-11"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ao criar uma conta, você concorda com nossos{" "}
                        <a href="#" className="text-primary hover:underline">Termos de Uso</a>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button type="submit" className="w-full h-11" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando conta...
                          </>
                        ) : (
                          "Criar Conta Grátis"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Demo Users Section */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Ou experimente com uma conta demo:
                </p>
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="p-4 space-y-3">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Admin:</span>
                        <code className="text-xs bg-background px-2 py-1 rounded">
                          admin@retificas.com / admin123
                        </code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Operador:</span>
                        <code className="text-xs bg-background px-2 py-1 rounded">
                          operador@retificas.com / operador123
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <SetupDemoUsers />
            </div>

            {/* Social Proof */}
            <div className="text-center pt-6 border-t">
              <p className="text-xs text-muted-foreground">
                Já somos mais de <strong className="text-primary">500+ retíficas</strong> 
                {" "}usando o sistema para crescer seus negócios
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}