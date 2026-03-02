import { useState, useCallback, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography } from '@mui/material';
import { usePartsInventory, type PartInventory } from '@/hooks/usePartsInventory';
import { cn } from '@/lib/utils';

interface ContractItemPartSelectProps {
  onSelect:          (part: { part_code: string; part_name: string; agreed_price: number }) => void;
  excludePartCodes?: string[];
  disabled?:         boolean;
  className?:        string;
}

export function ContractItemPartSelect({
  onSelect,
  excludePartCodes = [],
  disabled = false,
  className,
}: ContractItemPartSelectProps) {
  const [options, setOptions]       = useState<PartInventory[]>([]);
  const [loading, setLoading]       = useState(false);
  const [inputValue, setInputValue] = useState('');

  const { getPartsForSelection } = usePartsInventory();

  const fetchOptions = useCallback(async (search: string) => {
    setLoading(true);
    const data = await getPartsForSelection(search || undefined);
    setOptions(data);
    setLoading(false);
  }, [getPartsForSelection]);

  const filteredOptions = useMemo(() => {
    if (!excludePartCodes.length) return options;
    return options.filter((p) => !excludePartCodes.includes(p.part_code ?? ''));
  }, [options, excludePartCodes]);

  const handleInputChange = (_: unknown, newInput: string) => {
    setInputValue(newInput);
    fetchOptions(newInput);
  };

  const handleChange = (_: unknown, selected: PartInventory | null) => {
    if (!selected) return;
    onSelect({
      part_code:    selected.part_code ?? '',
      part_name:    selected.part_name,
      agreed_price: selected.unit_cost ?? 0,
    });
    setInputValue('');
    setOptions([]);
  };

  return (
    <Autocomplete
      options={filteredOptions}
      loading={loading}
      disabled={disabled}
      inputValue={inputValue}
      value={null}
      filterOptions={(x) => x}
      getOptionLabel={(opt) =>
        typeof opt === 'string'
          ? opt
          : `${opt.part_code ? opt.part_code + ' — ' : ''}${opt.part_name}`
      }
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
      onInputChange={handleInputChange}
      onChange={handleChange}
      noOptionsText={inputValue.length < 1 ? 'Digite para buscar...' : 'Nenhuma peça encontrada.'}
      loadingText="Buscando..."
      className={cn(className)}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id}>
          <Box>
            <Typography variant="body2" fontWeight={500} noWrap>
              {option.part_code ? `${option.part_code} — ` : ''}{option.part_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Custo: R$ {(option.unit_cost ?? 0).toFixed(2)}
            </Typography>
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Selecionar peça..."
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
              fontSize: '0.875rem',
              backgroundColor: 'transparent',
            },
          }}
        />
      )}
    />
  );
}
