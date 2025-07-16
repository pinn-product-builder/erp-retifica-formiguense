import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orcamentos" element={<div className="p-6"><h1 className="text-2xl font-bold mb-4">Orçamentos</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>} />
            <Route path="/servicos" element={<div className="p-6"><h1 className="text-2xl font-bold mb-4">Serviços</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>} />
            <Route path="/funcionarios" element={<div className="p-6"><h1 className="text-2xl font-bold mb-4">Funcionários</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>} />
            <Route path="/produtividade" element={<div className="p-6"><h1 className="text-2xl font-bold mb-4">Produtividade</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>} />
            <Route path="/apontamentos" element={<div className="p-6"><h1 className="text-2xl font-bold mb-4">Apontamentos</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>} />
            <Route path="/pecas" element={<div className="p-6"><h1 className="text-2xl font-bold mb-4">Peças</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>} />
            <Route path="/relatorios" element={<div className="p-6"><h1 className="text-2xl font-bold mb-4">Relatórios</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>} />
            <Route path="/whatsapp" element={<div className="p-6"><h1 className="text-2xl font-bold mb-4">WhatsApp</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>} />
            <Route path="/configuracoes" element={<div className="p-6"><h1 className="text-2xl font-bold mb-4">Configurações</h1><p className="text-muted-foreground">Funcionalidade em desenvolvimento</p></div>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
