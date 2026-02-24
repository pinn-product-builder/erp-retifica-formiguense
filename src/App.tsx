import { lazy, Suspense, startTransition } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { ConfirmDialogProvider } from '@/hooks/useConfirmDialog';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/auth/ProtectedRoute';
import { ProfileProtectedRoute } from '@/components/auth/ProfileProtectedRoute';
import { Layout } from '@/components/Layout';
import { ForcePasswordChange } from '@/components/auth/ForcePasswordChange';
import { usePasswordChange } from '@/hooks/usePasswordChange';
import { useMuiTheme } from '@/config/muiTheme';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Landing = lazy(() => import('@/pages/Landing'));
const Auth = lazy(() => import('@/pages/Auth'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Clientes = lazy(() => import('@/pages/Clientes'));
const Consultores = lazy(() => import('@/pages/Consultores'));
const Coleta = lazy(() => import('@/pages/Coleta'));
const Workflow = lazy(() => import('@/pages/Workflow'));
const CheckIn = lazy(() => import('@/pages/CheckIn'));
const Estoque = lazy(() => import('@/pages/Estoque'));
const Funcionarios = lazy(() => import('@/pages/Funcionarios'));
const Orcamentos = lazy(() => import('@/pages/Orcamentos'));
const Diagnosticos = lazy(() => import('@/pages/Diagnosticos'));
const Relatorios = lazy(() => import('@/pages/Relatorios'));
const Configuracoes = lazy(() => import('@/pages/Configuracoes'));
const ConfiguracoesOperacoes = lazy(() => import('@/pages/ConfiguracoesOperacoes'));
const Motores = lazy(() => import('@/pages/Motores'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Financeiro = lazy(() => import('@/pages/Financeiro'));
const ContasReceber = lazy(() => import('@/pages/ContasReceber'));
const ContasPagar = lazy(() => import('@/pages/ContasPagar'));
const FluxoCaixa = lazy(() => import('@/pages/FluxoCaixa'));
const DRE = lazy(() => import('@/pages/DRE'));
const ModuloFiscal = lazy(() => import('@/pages/ModuloFiscal'));
const PCP = lazy(() => import('@/pages/PCP'));
const Compras = lazy(() => import('@/pages/Compras'));
const Fornecedores = lazy(() => import('@/pages/Fornecedores'));
const Cotacoes       = lazy(() => import('@/pages/Cotacoes'));
const PedidosCompra  = lazy(() => import('@/pages/PedidosCompra'));
const OrdensServico = lazy(() => import('@/pages/OrdensServico'));
const GestaoFuncionarios = lazy(() => import('@/pages/GestaoFuncionarios'));
const GestaoUsuarios = lazy(() => import('@/pages/GestaoUsuarios'));
const GestaoPerfiUsuarios = lazy(() => import('@/pages/GestaoPerfisusuarios'));
const SuperAdmin = lazy(() => import('@/pages/SuperAdmin'));

const queryClient = new QueryClient();

function AppContent() {
  const { needsPasswordChange, loading } = usePasswordChange();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <>
      <Router>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected Routes with Profile Permissions */}
            <Route path="/dashboard" element={<ProfileProtectedRoute><Layout><Dashboard /></Layout></ProfileProtectedRoute>} />
            <Route path="/clientes" element={<ProfileProtectedRoute><Layout><Clientes /></Layout></ProfileProtectedRoute>} />
            <Route path="/consultores" element={<ProfileProtectedRoute><Layout><Consultores /></Layout></ProfileProtectedRoute>} />
            <Route path="/coleta" element={<ProfileProtectedRoute><Layout><Coleta /></Layout></ProfileProtectedRoute>} />
            <Route path="/workflow" element={<ProfileProtectedRoute><Layout><Workflow /></Layout></ProfileProtectedRoute>} />
            <Route path="/checkin" element={<ProfileProtectedRoute><Layout><CheckIn /></Layout></ProfileProtectedRoute>} />
            <Route path="/estoque" element={<ProfileProtectedRoute><Layout><Estoque /></Layout></ProfileProtectedRoute>} />
            <Route path="/pcp" element={<ProfileProtectedRoute><Layout><PCP /></Layout></ProfileProtectedRoute>} />
            <Route path="/ordens-servico" element={<ProfileProtectedRoute><Layout><OrdensServico /></Layout></ProfileProtectedRoute>} />
            <Route path="/compras" element={<ProfileProtectedRoute><Layout><Compras /></Layout></ProfileProtectedRoute>} />
            <Route path="/fornecedores" element={<ProfileProtectedRoute><Layout><Fornecedores /></Layout></ProfileProtectedRoute>} />
            <Route path="/cotacoes"         element={<ProfileProtectedRoute><Layout><Cotacoes /></Layout></ProfileProtectedRoute>} />
            <Route path="/pedidos-compra"   element={<ProfileProtectedRoute><Layout><PedidosCompra /></Layout></ProfileProtectedRoute>} />
            <Route path="/gestao-funcionarios" element={<ProfileProtectedRoute><Layout><GestaoFuncionarios /></Layout></ProfileProtectedRoute>} />
            <Route path="/funcionarios" element={<ProfileProtectedRoute><Layout><Funcionarios /></Layout></ProfileProtectedRoute>} />
            <Route path="/diagnosticos" element={<ProfileProtectedRoute><Layout><Diagnosticos /></Layout></ProfileProtectedRoute>} />
            <Route path="/motores" element={<ProfileProtectedRoute><Layout><Motores /></Layout></ProfileProtectedRoute>} />
            <Route path="/gestao-usuarios" element={<AdminRoute><Layout><GestaoUsuarios /></Layout></AdminRoute>} />
            <Route path="/gestao-usuarios/perfis" element={<AdminRoute><Layout><GestaoPerfiUsuarios /></Layout></AdminRoute>} />
            <Route path="/super-admin" element={<ProtectedRoute><Layout><SuperAdmin /></Layout></ProtectedRoute>} />
            <Route path="/orcamentos" element={<ProfileProtectedRoute><Layout><Orcamentos /></Layout></ProfileProtectedRoute>} />
            <Route path="/relatorios" element={<ProfileProtectedRoute><Layout><Relatorios /></Layout></ProfileProtectedRoute>} />
            <Route path="/configuracoes" element={<ProfileProtectedRoute><Layout><Configuracoes /></Layout></ProfileProtectedRoute>} />
            <Route path="/configuracoes/operacoes" element={<ProfileProtectedRoute><Layout><ConfiguracoesOperacoes /></Layout></ProfileProtectedRoute>} />
            <Route path="/financeiro" element={<ProfileProtectedRoute><Layout><Financeiro /></Layout></ProfileProtectedRoute>} />
            <Route path="/contas-receber" element={<ProfileProtectedRoute><Layout><ContasReceber /></Layout></ProfileProtectedRoute>} />
            <Route path="/contas-pagar" element={<ProfileProtectedRoute><Layout><ContasPagar /></Layout></ProfileProtectedRoute>} />
            <Route path="/fluxo-caixa" element={<ProfileProtectedRoute><Layout><FluxoCaixa /></Layout></ProfileProtectedRoute>} />
            <Route path="/dre" element={<ProfileProtectedRoute><Layout><DRE /></Layout></ProfileProtectedRoute>} />
            <Route path="/modulo-fiscal" element={<ProfileProtectedRoute><Layout><ModuloFiscal /></Layout></ProfileProtectedRoute>} />
            <Route path="*" element={<ProtectedRoute><Layout><NotFound /></Layout></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </Router>
      
      {/* Modal para forçar mudança de senha */}
      <ForcePasswordChange open={needsPasswordChange} />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <MuiThemeWrapper>
          <AuthProvider>
            <OrganizationProvider>
              <ConfirmDialogProvider>
                <AppContent />
              </ConfirmDialogProvider>
            </OrganizationProvider>
          </AuthProvider>
          <Toaster />
          <SonnerToaster />
        </MuiThemeWrapper>
      </NextThemeProvider>
    </QueryClientProvider>
  );
}

// Wrapper para aplicar tema MUI sincronizado com next-themes
function MuiThemeWrapper({ children }: { children: React.ReactNode }) {
  const muiTheme = useMuiTheme();
  
  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

export default App;