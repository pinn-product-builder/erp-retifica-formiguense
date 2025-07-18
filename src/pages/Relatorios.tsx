
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign } from "lucide-react";
import { StatCard } from "@/components/StatCard";

const Relatorios = () => {
  const [tipoRelatorio, setTipoRelatorio] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const relatoriosDisponiveis = [
    {
      id: 'vendas',
      nome: 'Relatório de Vendas',
      descricao: 'Vendas por período, consultor e cliente',
      icone: DollarSign
    },
    {
      id: 'produtividade',
      nome: 'Relatório de Produtividade',
      descricao: 'Horas trabalhadas e eficiência por funcionário',
      icone: TrendingUp
    },
    {
      id: 'clientes',
      nome: 'Relatório de Clientes',
      descricao: 'Histórico e frequência de clientes',
      icone: Users
    },
    {
      id: 'estoque',
      nome: 'Relatório de Estoque',
      descricao: 'Movimentação e níveis de estoque',
      icone: FileText
    }
  ];

  const estatisticasRapidas = [
    { titulo: 'Vendas do Mês', valor: 'R$ 45.250,00', icone: DollarSign },
    { titulo: 'Serviços Concluídos', valor: '87', icone: TrendingUp },
    { titulo: 'Clientes Atendidos', valor: '45', icone: Users },
    { titulo: 'Relatórios Gerados', valor: '12', icone: FileText }
  ];

  const gerarRelatorio = () => {
    if (!tipoRelatorio) {
      alert('Selecione um tipo de relatório');
      return;
    }
    // Aqui seria implementada a lógica de geração do relatório
    alert(`Gerando ${relatoriosDisponiveis.find(r => r.id === tipoRelatorio)?.nome}...`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Gere relatórios detalhados de vendas, produtividade e gestão</p>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {estatisticasRapidas.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.titulo}
            value={stat.valor}
            icon={stat.icone}
            description="Período atual"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gerador de relatórios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Gerar Relatório
            </CardTitle>
            <CardDescription>
              Configure e gere relatórios personalizados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Relatório</Label>
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de relatório" />
                </SelectTrigger>
                <SelectContent>
                  {relatoriosDisponiveis.map((relatorio) => (
                    <SelectItem key={relatorio.id} value={relatorio.id}>
                      {relatorio.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodo">Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mês</SelectItem>
                  <SelectItem value="trimestre">Este Trimestre</SelectItem>
                  <SelectItem value="ano">Este Ano</SelectItem>
                  <SelectItem value="personalizado">Período Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodo === 'personalizado' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data Início</Label>
                  <Input 
                    id="dataInicio"
                    type="date" 
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data Fim</Label>
                  <Input 
                    id="dataFim"
                    type="date" 
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              </div>
            )}

            <Button onClick={gerarRelatorio} className="w-full gap-2">
              <Download className="w-4 h-4" />
              Gerar e Baixar Relatório
            </Button>
          </CardContent>
        </Card>

        {/* Tipos de relatórios disponíveis */}
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Disponíveis</CardTitle>
            <CardDescription>
              Conheça os tipos de relatórios que você pode gerar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatoriosDisponiveis.map((relatorio) => (
                <div key={relatorio.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <relatorio.icone className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-medium">{relatorio.nome}</h4>
                    <p className="text-sm text-muted-foreground">{relatorio.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Recentes</CardTitle>
          <CardDescription>
            Últimos relatórios gerados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { nome: 'Vendas Janeiro 2024', data: '2024-01-20', tipo: 'Vendas', size: '2.3 MB' },
              { nome: 'Produtividade Equipe', data: '2024-01-18', tipo: 'Produtividade', size: '1.8 MB' },
              { nome: 'Clientes Frequentes', data: '2024-01-15', tipo: 'Clientes', size: '900 KB' },
            ].map((relatorio, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{relatorio.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {relatorio.tipo} • {relatorio.data} • {relatorio.size}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-3 h-3" />
                  Baixar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Relatorios;
