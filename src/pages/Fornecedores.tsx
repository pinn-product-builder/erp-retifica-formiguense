import SuppliersManager from '@/components/purchasing/SuppliersManager';

export default function Fornecedores() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Fornecedores</h1>
        <p className="text-sm text-muted-foreground">
          Cadastro e gestão de fornecedores de peças e serviços
        </p>
      </div>

      <SuppliersManager />
    </div>
  );
}
