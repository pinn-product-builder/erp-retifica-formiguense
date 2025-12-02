import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Autocomplete, TextField, Typography, Box, CircularProgress, Paper } from '@mui/material';
import { useMuiTheme } from '@/config/muiTheme';
import type { AutocompleteProps } from '@mui/material';

export interface InfiniteAutocompleteOption {
  id: string;
  label: string;
  [key: string]: unknown;
}

export interface InfiniteAutocompleteProps<T extends InfiniteAutocompleteOption> 
  extends Omit<AutocompleteProps<T, false, false, false>, 'options' | 'renderInput' | 'loading'> {
  options: T[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  label?: string;
  placeholder?: string;
  getOptionLabel: (option: T) => string;
  renderOption?: (props: React.HTMLAttributes<HTMLLIElement>, option: T) => React.ReactNode;
  filterOptions?: (options: T[], { inputValue }: { inputValue: string }) => T[];
  isOptionEqualToValue?: (option: T, value: T) => boolean;
  value: T | null;
  onChange: (event: React.SyntheticEvent, newValue: T | null) => void;
}

const ITEMS_PER_PAGE = 20;

export function InfiniteAutocomplete<T extends InfiniteAutocompleteOption>({
  options,
  loading = false,
  onLoadMore,
  hasMore = false,
  label,
  placeholder = 'Digite para buscar...',
  getOptionLabel,
  renderOption,
  filterOptions,
  isOptionEqualToValue,
  value,
  onChange,
  ...autocompleteProps
}: InfiniteAutocompleteProps<T>) {
  const theme = useMuiTheme();
  const [displayedOptions, setDisplayedOptions] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const listboxRef = useRef<HTMLUListElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<T[]>([]);

  useEffect(() => {
    if (!filterOptions) {
      const paginated = options.slice(0, page * ITEMS_PER_PAGE);
      setDisplayedOptions(paginated);
    } else {
      const filtered = filterOptions(options, { inputValue });
      setFilteredOptions(filtered);
      const paginated = filtered.slice(0, page * ITEMS_PER_PAGE);
      setDisplayedOptions(paginated);
    }
  }, [options, page, filterOptions, inputValue]);

  const handleListboxRef = useCallback((node: HTMLUListElement | null) => {
    listboxRef.current = node;
    
    if (node) {
      node.addEventListener('wheel', (e) => {
        e.stopPropagation();
      }, { passive: true });
    }
  }, []);

  const defaultRenderOption = (props: React.HTMLAttributes<HTMLLIElement>, option: T) => {
    return (
      <li {...props} key={option.id}>
        <Box sx={{ width: '100%' }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {getOptionLabel(option)}
          </Typography>
        </Box>
      </li>
    );
  };

  const handleScroll = useCallback((event: React.UIEvent<HTMLUListElement>) => {
    const target = event.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    
    const isNearBottom = scrollHeight - scrollTop <= clientHeight + 50;
    
    if (isNearBottom && !loading) {
      const totalItems = filterOptions ? filteredOptions.length : options.length;
      const displayedCount = page * ITEMS_PER_PAGE;
      
      if (displayedCount < totalItems) {
        console.log('Carregando mais itens:', {
          currentPage: page,
          displayedCount,
          totalItems,
          nextPage: page + 1
        });
        setPage((prev) => prev + 1);
      }
    }
  }, [filterOptions, filteredOptions.length, options.length, page, loading]);


  return (
    <Autocomplete
      {...autocompleteProps}
      options={displayedOptions}
      getOptionLabel={getOptionLabel}
      value={value}
      onChange={onChange}
      loading={loading}
      filterOptions={(x) => x}
      onInputChange={(_, newInputValue) => {
        if (newInputValue !== inputValue) {
          setInputValue(newInputValue);
          setPage(1);
        }
      }}
      disableListWrap={false}
      openOnFocus
      isOptionEqualToValue={isOptionEqualToValue || ((option, value) => option.id === value.id)}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          variant="outlined"
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'transparent',
              fontFamily: theme.typography.fontFamily,
              '& .MuiOutlinedInput-input': {
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.body1.fontSize,
              },
              '& .MuiInputLabel-root': {
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.body2.fontSize,
              },
            },
          }}
        />
      )}
      renderOption={(props, option) => {
        const rendered = renderOption ? renderOption(props, option) : defaultRenderOption(props, option);
        return rendered;
      }}
      ListboxProps={{
        ...autocompleteProps.ListboxProps,
        ref: handleListboxRef,
        onScroll: handleScroll,
        onWheel: (e: React.WheelEvent) => {
          e.stopPropagation();
        },
        style: {
          maxHeight: '400px',
          overflowY: 'auto',
          fontFamily: theme.typography.fontFamily,
          WebkitOverflowScrolling: 'touch',
        },
      }}
      slotProps={{
        paper: {
          sx: {
            maxHeight: '450px',
          }
        }
      }}
      PaperComponent={(paperProps) => (
        <Paper
          {...paperProps}
          sx={{
            fontFamily: theme.typography.fontFamily,
            maxHeight: '450px',
            overflow: 'hidden',
            '& .MuiAutocomplete-option': {
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.body1.fontSize,
              minHeight: '48px',
            },
            '& .MuiAutocomplete-listbox': {
              maxHeight: '400px',
              overflowY: 'auto !important',
              padding: 0,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#555',
              },
            },
          }}
        >
          {paperProps.children}
          {((hasMore || (filterOptions ? displayedOptions.length < filteredOptions.length : displayedOptions.length < options.length))) && (
            <Box
              ref={loadingRef}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 1,
                minHeight: '40px',
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              {loading && <CircularProgress size={20} />}
            </Box>
          )}
        </Paper>
      )}
      sx={{
        fontFamily: theme.typography.fontFamily,
        '& .MuiAutocomplete-input': {
          fontFamily: theme.typography.fontFamily,
        },
        ...autocompleteProps.sx,
      }}
    />
  );
}

