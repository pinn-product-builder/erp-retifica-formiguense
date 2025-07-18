
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Coleta from "./pages/Coleta";
import CheckIn from "./pages/CheckIn";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          <Route path="/coleta" element={
            <Layout>
              <Coleta />
            </Layout>
          } />
          <Route path="/checkin" element={
            <Layout>
              <CheckIn />
            </Layout>
          } />
          <Route path="/orcamentos" element={
            <Layout>
              <div className="p-6"><h1 className="text-2xl font-bold mb-4">Orçamentos</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>
            </Layout>
          } />
          <Route path="/servicos" element={
            <Layout>
              <div className="p-6"><h1 className="text-2xl font-bold mb-4">Serviços</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>
            </Layout>
          } />
          <Route path="/funcionarios" element={
            <Layout>
              <div className="p-6"><h1 className="text-2xl font-bold mb-4">Funcionários</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>
            </Layout>
          } />
          <Route path="/produtividade" element={
            <Layout>
              <div className="p-6"><h1 className="text-2xl font-bold mb-4">Produtividade</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>
            </Layout>
          } />
          <Route path="/apontamentos" element={
            <Layout>
              <div className="p-6"><h1 className="text-2xl font-bold mb-4">Apontamentos</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>
            </Layout>
          } />
          <Route path="/pecas" element={
            <Layout>
              <div className="p-6"><h1 className="text-2xl font-bold mb-4">Peças</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>
            </Layout>
          } />
          <Route path="/relatorios" element={
            <Layout>
              <div className="p-6"><h1 className="text-2xl font-bold mb-4">Relatórios</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>
            </Layout>
          } />
          <Route path="/whatsapp" element={
            <Layout>
              <div className="p-6"><h1 className="text-2xl font-bold mb-4">WhatsApp</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>
            </Layout>
          } />
          <Route path="/configuracoes" element={
            <Layout>
              <div className="p-6"><h1 className="text-2xl font-bold mb-4">Configurações</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>
            </Layout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
