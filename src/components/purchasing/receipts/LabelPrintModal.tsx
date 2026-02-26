import { useState, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Package } from 'lucide-react';
import { format } from 'date-fns';

export interface LabelItem {
  receipt_item_id:    string;
  item_name:          string;
  part_code:          string;
  received_quantity:  number;
  lot_number?:        string;
  receipt_date:       string;
  supplier_name?:     string;
  po_number?:         string;
  warehouse_location?: string;
}

type LabelSize = 'small' | 'medium' | 'large';

const SIZE_LABELS: Record<LabelSize, string> = {
  small:  'Pequena (30×20mm)',
  medium: 'Média (50×25mm)',
  large:  'Grande (100×50mm)',
};

const SIZE_STYLES: Record<LabelSize, React.CSSProperties> = {
  small:  { width: '113px', minHeight: '75px',  fontSize: '7px',  padding: '4px' },
  medium: { width: '189px', minHeight: '94px',  fontSize: '8px',  padding: '5px' },
  large:  { width: '378px', minHeight: '189px', fontSize: '10px', padding: '8px' },
};

interface LabelCounts {
  [receiptItemId: string]: number;
}

interface LabelPrintModalProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  items:        LabelItem[];
}

function generateBarcodeStripes(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  const pattern = [];
  for (let i = 0; i < 40; i++) {
    const bit = (hash >> (i % 32)) & 1;
    pattern.push(bit ? '3px' : '1.5px');
  }
  return pattern;
}

function Barcode({ text, size }: { text: string; size: LabelSize }) {
  const stripes = generateBarcodeStripes(text);
  const barcodeHeight = size === 'small' ? 16 : size === 'medium' ? 20 : 30;
  return (
    <div className="flex flex-col items-center" style={{ marginTop: '4px' }}>
      <div style={{ display: 'flex', height: `${barcodeHeight}px`, gap: '1px', alignItems: 'stretch' }}>
        {stripes.map((w, i) => (
          <div
            key={i}
            style={{
              width: w,
              background: i % 2 === 0 ? '#000' : 'transparent',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '6px', letterSpacing: '1px', marginTop: '2px' }}>{text}</span>
    </div>
  );
}

function LabelCard({ item, size }: { item: LabelItem; size: LabelSize }) {
  const style = SIZE_STYLES[size];
  const date = item.receipt_date
    ? format(new Date(item.receipt_date), 'dd/MM/yyyy')
    : '';
  const code = item.part_code || item.item_name.slice(0, 12).toUpperCase().replace(/\s+/g, '-');

  return (
    <div
      style={{
        ...style,
        border: '1px solid #333',
        borderRadius: '2px',
        display: 'inline-flex',
        flexDirection: 'column',
        fontFamily: 'monospace',
        lineHeight: 1.3,
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
        boxSizing: 'border-box',
        background: '#fff',
        color: '#000',
        margin: '2px',
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: `calc(${style.fontSize} + 1px)`, borderBottom: '1px solid #bbb', paddingBottom: '2px', marginBottom: '2px' }}>
        {code}
      </div>
      <div style={{ flexGrow: 1, overflow: 'hidden' }}>
        <div style={{ fontWeight: '600' }}>{item.item_name}</div>
        {item.lot_number  && <div>Lote: {item.lot_number}</div>}
        <div>Data: {date}</div>
        {item.supplier_name && <div>Fornec: {item.supplier_name.slice(0, 20)}</div>}
        {item.po_number     && <div>PC: {item.po_number}</div>}
        {item.warehouse_location && <div>Local: {item.warehouse_location}</div>}
      </div>
      <Barcode text={code} size={size} />
    </div>
  );
}

export function LabelPrintModal({ open, onOpenChange, items }: LabelPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const [labelSize, setLabelSize] = useState<LabelSize>('medium');
  const [counts, setCounts]       = useState<LabelCounts>(() =>
    Object.fromEntries(items.map(i => [i.receipt_item_id, 1])),
  );

  const updateCount = (id: string, value: number) =>
    setCounts(prev => ({ ...prev, [id]: Math.max(1, value) }));

  const totalLabels = Object.values(counts).reduce((s, v) => s + v, 0);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow || !printRef.current) return;

    const labelHtml = printRef.current.innerHTML;
    const sizeStyle = SIZE_STYLES[labelSize];

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Etiquetas de Recebimento</title>
  <style>
    @page { margin: 8mm; }
    body { margin: 0; font-family: monospace; background: #fff; }
    .labels-grid { display: flex; flex-wrap: wrap; gap: 3px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="labels-grid" style="font-size: ${sizeStyle.fontSize}">
    ${labelHtml}
  </div>
  <script>window.onload = () => { window.print(); window.close(); }<\/script>
</body>
</html>`);
    printWindow.document.close();
  };

  const expandedItems = items.flatMap(item =>
    Array.from({ length: counts[item.receipt_item_id] ?? 1 }, () => item),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Imprimir Etiquetas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Configurações */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="text-xs sm:text-sm">Tamanho da Etiqueta</Label>
              <Select value={labelSize} onValueChange={v => setLabelSize(v as LabelSize)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SIZE_LABELS) as LabelSize[]).map(k => (
                    <SelectItem key={k} value={k} className="text-xs sm:text-sm">{SIZE_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <span className="text-xs text-muted-foreground pb-2">Total: <strong>{totalLabels}</strong> etiquetas</span>
            </div>
          </div>

          {/* Itens */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-semibold">Quantidade por item</Label>
            {items.map(item => (
              <div key={item.receipt_item_id}
                className="flex items-center gap-3 p-2 border rounded-lg">
                <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">{item.item_name}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Recebido: {item.received_quantity} un
                    {item.lot_number ? ` · Lote: ${item.lot_number}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button type="button" variant="outline" size="icon" className="h-7 w-7 text-xs"
                    onClick={() => updateCount(item.receipt_item_id, (counts[item.receipt_item_id] ?? 1) - 1)}>−</Button>
                  <Input
                    type="number" min={1}
                    value={counts[item.receipt_item_id] ?? 1}
                    onChange={e => updateCount(item.receipt_item_id, Number(e.target.value))}
                    className="h-7 w-14 text-center text-xs"
                  />
                  <Button type="button" variant="outline" size="icon" className="h-7 w-7 text-xs"
                    onClick={() => updateCount(item.receipt_item_id, (counts[item.receipt_item_id] ?? 1) + 1)}>+</Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pré-visualização */}
          <div>
            <Label className="text-xs sm:text-sm font-semibold">Pré-visualização</Label>
            <div className="mt-2 border rounded-lg bg-white p-3 overflow-x-auto">
              <div ref={printRef} className="flex flex-wrap gap-1">
                {expandedItems.slice(0, 12).map((item, idx) => (
                  <LabelCard key={idx} item={item} size={labelSize} />
                ))}
                {expandedItems.length > 12 && (
                  <div className="flex items-center justify-center w-24 h-16 border-2 border-dashed rounded text-xs text-muted-foreground">
                    +{expandedItems.length - 12} mais
                  </div>
                )}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              A pré-visualização mostra até 12 etiquetas. Todas serão impressas.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-3.5 h-3.5" />Imprimir {totalLabels} Etiqueta{totalLabels !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
