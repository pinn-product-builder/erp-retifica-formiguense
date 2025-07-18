import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient } from "react-query";

import { Layout } from "@/components/Layout";
import { Index } from "@/pages/Index";
import { CheckIn } from "@/pages/CheckIn";
import { Coleta } from "@/pages/Coleta";
import { NotFound } from "@/pages/NotFound";
import Workflow from "@/pages/Workflow";

function App() {
  return (
    <BrowserRouter>
      <QueryClient>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/coleta" element={<Coleta />} />
            <Route path="/workflow" element={<Workflow />} />
            <Route path="/orcamentos" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </QueryClient>
    </BrowserRouter>
  );
}

export default App;
