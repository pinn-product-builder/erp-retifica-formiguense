import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSEO } from "@/hooks/useSEO";
import { Loader2, ArrowLeft, Shield, TrendingUp, Users, CheckCircle } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { signIn, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useSEO({
    title: 'Login - Retífica Formiguense ERP',
    description: 'Acesse o sistema ERP da Retífica Formiguense. Faça login para gerenciar clientes, estoque, financeiro e workflow.',
    keywords: 'login retífica, acesso sistema, ERP login'
  });

  // Capture UTM parameters for growth tracking - MOVED BEFORE EARLY RETURNS
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

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate("/dashboard");
    }
    
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await resetPassword(resetEmail);
    
    if (!error) {
      setResetEmailSent(true);
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
              <CardTitle className="text-xl">
                {resetEmailSent ? 'Email Enviado!' : 'Recuperar Senha'}
              </CardTitle>
              <CardDescription>
                {resetEmailSent 
                  ? `Enviamos as instruções de recuperação para ${resetEmail}. Verifique sua caixa de entrada e spam.`
                  : 'Digite seu e-mail para receber as instruções de recuperação'
                }
              </CardDescription>
            </CardHeader>
{resetEmailSent ? (
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Não recebeu o email? Verifique sua pasta de spam ou tente novamente em alguns minutos.
                  </p>
                </div>
              </CardContent>
            ) : (
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
            )}
            
            <CardFooter className="pt-0">
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetEmailSent(false);
                    setResetEmail("");
                  }}
                  className="flex-1"
                >
                  {resetEmailSent ? 'Fechar' : 'Voltar ao Login'}
                </Button>
                {resetEmailSent && (
                  <Button
                    variant="ghost"
                    onClick={() => setResetEmailSent(false)}
                    className="flex-1"
                  >
                    Enviar Novamente
                  </Button>
                )}
              </div>
            </CardFooter>
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