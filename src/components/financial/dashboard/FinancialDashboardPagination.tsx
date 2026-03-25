import { Button } from '@/components/ui/button';

type FinancialDashboardPaginationProps = {
  page: number;
  totalPages: number;
  count: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
};

export function FinancialDashboardPagination({
  page,
  totalPages,
  count,
  pageSize,
  onPageChange,
}: FinancialDashboardPaginationProps) {
  const safeTotal = Math.max(1, totalPages);
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);

  return (
    <div className="flex flex-col items-center gap-2 pt-3">
      <p className="text-muted-foreground text-xs sm:text-sm text-center">
        Mostrando {from} a {to} de {count} itens — página {page} / {safeTotal}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 sm:h-9"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Anterior
        </Button>
        <span className="text-muted-foreground text-xs sm:text-sm">
          {page} / {safeTotal}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 sm:h-9"
          disabled={page >= safeTotal}
          onClick={() => onPageChange(Math.min(safeTotal, page + 1))}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
