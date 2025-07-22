
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Layout } from "@/components/Layout";
import Index from "@/pages/Index";
import CheckIn from "@/pages/CheckIn";
import Coleta from "@/pages/Coleta";
import NotFound from "@/pages/NotFound";
import Workflow from "@/pages/Workflow";
import Orcamentos from "@/pages/Orcamentos";
import Funcionarios from "@/pages/Funcionarios";
import Estoque from "@/pages/Estoque";
import Consultores from "@/pages/Consultores";
import Clientes from "@/pages/Clientes";
import Relatorios from "@/pages/Relatorios";
import Configuracoes from "@/pages/Configuracoes";
import Financeiro from "@/pages/Financeiro";
import ContasReceber from "@/pages/ContasReceber";
import ContasPagar from "@/pages/ContasPagar";
import FluxoCaixa from "@/pages/FluxoCaixa";
import DRE from "@/pages/DRE";

function App() {
  const queryClient = new QueryClient();
  
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/funcionarios" element={<Funcionarios />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/coleta" element={<Coleta />} />
            <Route path="/workflow" element={<Workflow />} />
            <Route path="/orcamentos" element={<Orcamentos />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/consultores" element={<Consultores />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/contas-receber" element={<ContasReceber />} />
            <Route path="/contas-pagar" element={<ContasPagar />} />
            <Route path="/fluxo-caixa" element={<FluxoCaixa />} />
            <Route path="/dre" element={<DRE />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
