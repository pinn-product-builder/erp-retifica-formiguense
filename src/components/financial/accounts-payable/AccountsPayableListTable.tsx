import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ResponsiveTable, type ResponsiveTableColumn } from '@/components/ui/responsive-table';

type AccountsPayableListTableProps<T> = {
  loading: boolean;
  rows: T[];
  columns: ResponsiveTableColumn<T>[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
};

export function AccountsPayableListTable<T>({
  loading,
  rows,
  columns,
  keyExtractor,
  emptyMessage = 'Nenhuma conta a pagar encontrada',
}: AccountsPayableListTableProps<T>) {
  return (
    <Card className="border-0 shadow-none">
      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ResponsiveTable
          data={rows}
          columns={columns}
          keyExtractor={keyExtractor}
          emptyMessage={emptyMessage}
          className="min-w-0"
        />
      )}
    </Card>
  );
}
