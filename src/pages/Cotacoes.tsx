import { QuotationsManager } from '@/components/purchasing/quotations/QuotationsManager';

export default function Cotacoes() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Cotações</h1>
        <p className="text-sm text-muted-foreground">
          Criar e acompanhar cotações de compra com múltiplos fornecedores
        </p>
      </div>
      <QuotationsManager />
    </div>
  );
}
