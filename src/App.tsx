import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/orcamentos" element={<div>Orçamentos em desenvolvimento</div>} />
          <Route path="/servicos" element={<div>Serviços em desenvolvimento</div>} />
          <Route path="/funcionarios" element={<div>Funcionários em desenvolvimento</div>} />
          <Route path="/produtividade" element={<div>Produtividade em desenvolvimento</div>} />
          <Route path="/apontamentos" element={<div>Apontamentos em desenvolvimento</div>} />
          <Route path="/pecas" element={<div>Peças em desenvolvimento</div>} />
          <Route path="/relatorios" element={<div>Relatórios em desenvolvimento</div>} />
          <Route path="/whatsapp" element={<div>WhatsApp em desenvolvimento</div>} />
          <Route path="/configuracoes" element={<div>Configurações em desenvolvimento</div>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
