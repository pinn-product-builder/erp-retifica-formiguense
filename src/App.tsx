import { lazy, Suspense, startTransition } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { ForcePasswordChange } from '@/components/auth/ForcePasswordChange';
import { usePasswordChange } from '@/hooks/usePasswordChange';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Landing = lazy(() => import('@/pages/Landing'));
const Auth = lazy(() => import('@/pages/Auth'));
const Clientes = lazy(() => import('@/pages/Clientes'));
const Consultores = lazy(() => import('@/pages/Consultores'));
const Coleta = lazy(() => import('@/pages/Coleta'));
const Workflow = lazy(() => import('@/pages/Workflow'));
const CheckIn = lazy(() => import('@/pages/CheckIn'));
const Estoque = lazy(() => import('@/pages/Estoque'));
const Funcionarios = lazy(() => import('@/pages/Funcionarios'));
const Orcamentos = lazy(() => import('@/pages/Orcamentos'));
const Relatorios = lazy(() => import('@/pages/Relatorios'));
const Configuracoes = lazy(() => import('@/pages/Configuracoes'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Financeiro = lazy(() => import('@/pages/Financeiro'));
const ContasReceber = lazy(() => import('@/pages/ContasReceber'));
const ContasPagar = lazy(() => import('@/pages/ContasPagar'));
const FluxoCaixa = lazy(() => import('@/pages/FluxoCaixa'));
const DRE = lazy(() => import('@/pages/DRE'));
const ModuloFiscal = lazy(() => import('@/pages/ModuloFiscal'));
const PCP = lazy(() => import('@/pages/PCP'));
const Compras = lazy(() => import('@/pages/Compras'));
const OrdensServico = lazy(() => import('@/pages/OrdensServico'));
const GestaoFuncionarios = lazy(() => import('@/pages/GestaoFuncionarios'));
const GestaoUsuarios = lazy(() => import('@/pages/GestaoUsuarios'));

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
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
            <Route path="/consultores" element={<ProtectedRoute><Layout><Consultores /></Layout></ProtectedRoute>} />
            <Route path="/coleta" element={<ProtectedRoute><Layout><Coleta /></Layout></ProtectedRoute>} />
            <Route path="/workflow" element={<ProtectedRoute><Layout><Workflow /></Layout></ProtectedRoute>} />
            <Route path="/checkin" element={<ProtectedRoute><Layout><CheckIn /></Layout></ProtectedRoute>} />
            <Route path="/estoque" element={<ProtectedRoute><Layout><Estoque /></Layout></ProtectedRoute>} />
            <Route path="/pcp" element={<ProtectedRoute><Layout><PCP /></Layout></ProtectedRoute>} />
            <Route path="/ordens-servico" element={<ProtectedRoute><Layout><OrdensServico /></Layout></ProtectedRoute>} />
            <Route path="/compras" element={<ProtectedRoute><Layout><Compras /></Layout></ProtectedRoute>} />
            <Route path="/gestao-funcionarios" element={<ProtectedRoute><Layout><GestaoFuncionarios /></Layout></ProtectedRoute>} />
            <Route path="/funcionarios" element={<ProtectedRoute><Layout><Funcionarios /></Layout></ProtectedRoute>} />
            <Route path="/gestao-usuarios" element={<AdminRoute><Layout><GestaoUsuarios /></Layout></AdminRoute>} />
            <Route path="/orcamentos" element={<ProtectedRoute><Layout><Orcamentos /></Layout></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Layout><Relatorios /></Layout></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Layout><Configuracoes /></Layout></ProtectedRoute>} />
            <Route path="/financeiro" element={<ProtectedRoute><Layout><Financeiro /></Layout></ProtectedRoute>} />
            <Route path="/contas-receber" element={<ProtectedRoute><Layout><ContasReceber /></Layout></ProtectedRoute>} />
            <Route path="/contas-pagar" element={<ProtectedRoute><Layout><ContasPagar /></Layout></ProtectedRoute>} />
            <Route path="/fluxo-caixa" element={<ProtectedRoute><Layout><FluxoCaixa /></Layout></ProtectedRoute>} />
            <Route path="/dre" element={<ProtectedRoute><Layout><DRE /></Layout></ProtectedRoute>} />
            <Route path="/modulo-fiscal" element={<ProtectedRoute><Layout><ModuloFiscal /></Layout></ProtectedRoute>} />
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
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <OrganizationProvider>
            <AppContent />
          </OrganizationProvider>
        </AuthProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;