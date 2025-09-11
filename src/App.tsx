import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';

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

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <OrganizationProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<div>Carregando...</div>}>
                        <Routes>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/clientes" element={<Clientes />} />
                          <Route path="/consultores" element={<Consultores />} />
                          <Route path="/coleta" element={<Coleta />} />
                          <Route path="/workflow" element={<Workflow />} />
                          <Route path="/checkin" element={<CheckIn />} />
                          <Route path="/estoque" element={<Estoque />} />
                          <Route path="/pcp" element={<PCP />} />
                          <Route path="/ordens-servico" element={<OrdensServico />} />
                          <Route path="/compras" element={<Compras />} />
                          <Route path="/gestao-funcionarios" element={<GestaoFuncionarios />} />
                          <Route path="/funcionarios" element={<Funcionarios />} />
                          <Route path="/orcamentos" element={<Orcamentos />} />
                          <Route path="/relatorios" element={<Relatorios />} />
                          <Route path="/configuracoes" element={<Configuracoes />} />
                          <Route path="/financeiro" element={<Financeiro />} />
                          <Route path="/contas-receber" element={<ContasReceber />} />
                          <Route path="/contas-pagar" element={<ContasPagar />} />
                          <Route path="/fluxo-caixa" element={<FluxoCaixa />} />
                          <Route path="/dre" element={<DRE />} />
                          <Route path="/modulo-fiscal" element={<ModuloFiscal />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
            </Router>
          </OrganizationProvider>
        </AuthProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;