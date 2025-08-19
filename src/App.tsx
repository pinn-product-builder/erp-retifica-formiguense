
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';

import Dashboard from '@/pages/Dashboard';
import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import Clientes from '@/pages/Clientes';
import Consultores from '@/pages/Consultores';
import Coleta from '@/pages/Coleta';
import Workflow from '@/pages/Workflow';
import CheckIn from '@/pages/CheckIn';
import Estoque from '@/pages/Estoque';
import Funcionarios from '@/pages/Funcionarios';
import Orcamentos from '@/pages/Orcamentos';
import Relatorios from '@/pages/Relatorios';
import Configuracoes from '@/pages/Configuracoes';
import NotFound from '@/pages/NotFound';
import Financeiro from '@/pages/Financeiro';
import ContasReceber from '@/pages/ContasReceber';
import ContasPagar from '@/pages/ContasPagar';
import FluxoCaixa from '@/pages/FluxoCaixa';
import DRE from '@/pages/DRE';
import ModuloFiscal from '@/pages/ModuloFiscal';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/clientes" element={<Clientes />} />
                      <Route path="/consultores" element={<Consultores />} />
                      <Route path="/coleta" element={<Coleta />} />
                      <Route path="/workflow" element={<Workflow />} />
                      <Route path="/checkin" element={<CheckIn />} />
                      <Route path="/estoque" element={<Estoque />} />
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
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AuthProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
