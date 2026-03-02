import React, { useState, useEffect, useRef } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography, Chip } from '@mui/material';
import { cn, formatCurrency } from '@/lib/utils';
import { useOrganization } from '@/hooks/useOrganization';
import { ConditionalOrderService } from '@/services/ConditionalOrderService';

interface PartResult {
  id:        string;
  part_name: string;
  part_code: string | null;
  quantity:  number;
  unit_cost: number;
}

interface PartSearchInputProps {
  value:         string;
  onChange:      (value: string) => void;
  onSelectPart:  (part: { name: string; code: string; unit_cost: number }) => void;
  placeholder?:  string;
  className?:    string;
}

export function PartSearchInput({
  value,
  onChange,
  onSelectPart,
  placeholder = 'Buscar peça...',
  className,
}: PartSearchInputProps) {
  const { currentOrganization } = useOrganization();
  const [inputText, setInputText] = useState(value);
  const [options, setOptions]     = useState<PartResult[]>([]);
  const [loading, setLoading]     = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [selectedPart, setSelectedPart] = useState<PartResult | null>(null);
  useEffect(() => {
    setInputText(value);
  }, [value]);

  const stockColor = (qty: number): 'error' | 'warning' | 'success' =>
    qty <= 0 ? 'error' : qty <= 3 ? 'warning' : 'success';

  const handleInputChange = (_: unknown, inputVal: string, reason: string) => {
    if (reason === 'reset') return;
    setInputText(inputVal);
    onChange(inputVal);
    clearTimeout(timerRef.current);

    if (!inputVal || inputVal.length < 2 || !currentOrganization?.id) {
      setOptions([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await ConditionalOrderService.searchParts(currentOrganization.id, inputVal);
        setOptions(data);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleChange = (_: unknown, selected: PartResult | null) => {
    if (!selected) return;
    setInputText(selected.part_name);
    setSelectedPart(selected);
    onSelectPart({ name: selected.part_name, code: selected.part_code ?? '', unit_cost: selected.unit_cost });
    setOptions([]);
  };

  return (
    <Autocomplete
      options={options}
      loading={loading}
      inputValue={inputText}
      value={selectedPart}
      filterOptions={(x) => x}
      getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.part_name)}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
      onInputChange={handleInputChange}
      onChange={handleChange}
      noOptionsText={
        inputText.length < 2
          ? 'Digite ao menos 2 caracteres'
          : 'Nenhuma peça encontrada'
      }
      loadingText="Buscando peças..."
      className={cn(className)}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props as typeof props & { key: React.Key };
        return (
          <Box component="li" key={key} {...optionProps} sx={{ flexDirection: 'column', alignItems: 'flex-start !important', py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" fontWeight={500}>
                {option.part_name}
              </Typography>
              {option.part_code && (
                <Typography
                  variant="caption"
                  sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 0.75, py: 0.25, borderRadius: 0.5 }}
                >
                  {option.part_code}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                label={`Estoque: ${option.quantity}`}
                color={stockColor(option.quantity)}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: '0.65rem' }}
              />
              {option.unit_cost > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {formatCurrency(option.unit_cost)}/un
                </Typography>
              )}
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={value || placeholder}
          size="small"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress color="inherit" size={14} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.75rem',
              minHeight: '32px',
            },
            '& .MuiInputBase-input': {
              padding: '4px 8px !important',
              fontSize: '0.75rem',
            },
          }}
        />
      )}
    />
  );
}
