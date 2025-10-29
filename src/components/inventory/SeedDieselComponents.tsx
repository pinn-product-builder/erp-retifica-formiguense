import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePartsInventory } from '@/hooks/usePartsInventory';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PackagePlus } from 'lucide-react';

const dieselComponents = [
  // GRUPO 1: Estrutura do Motor
  { part_name: 'Bloco do Motor', part_code: 'BLOCO-CAM-001', unit_cost: 8500.00, component: 'bloco' as const },
  { part_name: 'Cabeçote', part_code: 'CABEC-CAM-001', unit_cost: 4200.00, component: 'cabecote' as const },
  { part_name: 'Junta do Cabeçote', part_code: 'JUNTA-CAM-001', unit_cost: 280.00, component: null },
  { part_name: 'Cárter', part_code: 'CARTER-CAM-001', unit_cost: 650.00, component: null },
  { part_name: 'Tampa de Válvulas', part_code: 'TAMPA-CAM-001', unit_cost: 420.00, component: null },
  
  // GRUPO 2: Sistema de Combustão
  { part_name: 'Pistão com Anéis', part_code: 'PIST-CAM-001', unit_cost: 350.00, component: 'pistao' as const },
  { part_name: 'Biela', part_code: 'BIELA-CAM-001', unit_cost: 580.00, component: 'biela' as const },
  { part_name: 'Virabrequim', part_code: 'VIRA-CAM-001', unit_cost: 5800.00, component: 'virabrequim' as const },
  { part_name: 'Bronzina de Biela', part_code: 'BRON-BIE-001', unit_cost: 95.00, component: 'biela' as const },
  { part_name: 'Bronzina de Mancal', part_code: 'BRON-MAN-001', unit_cost: 110.00, component: null },
  
  // GRUPO 3: Sistema de Distribuição
  { part_name: 'Comando de Válvulas', part_code: 'COMAN-CAM-001', unit_cost: 1850.00, component: 'comando' as const },
  { part_name: 'Válvula de Admissão', part_code: 'VALV-ADM-001', unit_cost: 145.00, component: null },
  { part_name: 'Válvula de Escape', part_code: 'VALV-ESC-001', unit_cost: 165.00, component: null },
  { part_name: 'Tuchos/Balancins', part_code: 'TUCHO-CAM-001', unit_cost: 230.00, component: null },
  { part_name: 'Correia Dentada', part_code: 'CORR-CAM-001', unit_cost: 380.00, component: null },
  
  // GRUPO 4: Sistema de Alimentação Diesel
  { part_name: 'Bomba Injetora', part_code: 'BOMB-INJ-001', unit_cost: 3200.00, component: null },
  { part_name: 'Bico Injetor', part_code: 'BICO-INJ-001', unit_cost: 850.00, component: null },
  { part_name: 'Filtro de Combustível', part_code: 'FILT-COMB-001', unit_cost: 95.00, component: null },
  { part_name: 'Bomba de Alimentação', part_code: 'BOMB-ALIM-001', unit_cost: 420.00, component: null },
  { part_name: 'Turbocompressor', part_code: 'TURBO-CAM-001', unit_cost: 2800.00, component: null },
  
  // GRUPO 5: Sistema de Lubrificação
  { part_name: 'Bomba de Óleo', part_code: 'BOMB-OLEO-001', unit_cost: 520.00, component: null },
  { part_name: 'Filtro de Óleo', part_code: 'FILT-OLEO-001', unit_cost: 48.00, component: null },
  { part_name: 'Radiador de Óleo', part_code: 'RAD-OLEO-001', unit_cost: 680.00, component: null },
  { part_name: 'Retentor de Válvula', part_code: 'RET-VALV-001', unit_cost: 12.00, component: null },
  
  // GRUPO 6: Sistema de Arrefecimento
  { part_name: 'Bomba D\'água', part_code: 'BOMB-AGUA-001', unit_cost: 380.00, component: null },
  { part_name: 'Radiador', part_code: 'RAD-CAM-001', unit_cost: 1450.00, component: null },
  { part_name: 'Válvula Termostática', part_code: 'VALV-TERM-001', unit_cost: 125.00, component: null },
  
  // GRUPO 7: Sistema Auxiliar
  { part_name: 'Volante do Motor', part_code: 'VOLAN-CAM-001', unit_cost: 1850.00, component: null },
  { part_name: 'Alternador', part_code: 'ALTER-CAM-001', unit_cost: 950.00, component: null },
  { part_name: 'Motor de Arranque', part_code: 'MOTOR-ARR-001', unit_cost: 720.00, component: null },
];

export function SeedDieselComponents() {
  const [loading, setLoading] = useState(false);
  const { createPart } = usePartsInventory();
  const { toast } = useToast();

  const handleSeed = async () => {
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const component of dieselComponents) {
        const success = await createPart({
          part_name: component.part_name,
          part_code: component.part_code,
          quantity: 10,
          unit_cost: component.unit_cost,
          supplier: 'Fornecedor Padrão Diesel',
          component: component.component || undefined,
          status: 'disponivel',
          notes: 'Motor de caminhão diesel - Cadastro inicial estoque',
        });

        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      toast({
        title: 'Cadastro Concluído',
        description: `${successCount} componentes cadastrados com sucesso. ${errorCount > 0 ? `${errorCount} erros.` : ''}`,
        variant: successCount > 0 ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Error seeding components:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao cadastrar componentes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSeed}
      disabled={loading}
      size="sm"
      variant="outline"
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <PackagePlus className="w-4 h-4" />
      )}
      Cadastrar 30 Componentes Diesel
    </Button>
  );
}
