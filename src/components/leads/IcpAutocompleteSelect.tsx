import { useState, useEffect, useMemo } from 'react';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { tokens } from '@/styles/tokens';

const DEFAULT_FALLBACK_ICPS = [
  'Paint Wall',
  'Norway B2B Product',
  'Norway B2B Service',
  'IT Services',
  'SaaS',
  'AI',
  'Cyber Security',
  'Finland SAAS',
  'FinLand IT Services',
  'Denmark SaaS',
  'Denmark IT services',
  'Austria SaaS',
  'Austria IT Services',
  'Sweden SaaS',
  'Sweden IT Services',
  'switzerland SaaS',
  'Switzerland IT Services',
  'Ireland SaaS',
  'Ireland IT Services',
  'B2B SaaS',
  'Fintech',
  'Healthcare Tech',
  'Real Estate',
  'E-Commerce',
];

const NO_ICP_LABEL = 'No ICP';

type OptionItem = { _id?: string; name: string };

export type IcpAutocompleteSelectProps = {
  value: string | undefined | null;
  onChange: (value: string) => void;
  icpsList?: OptionItem[];
  isDarkMode: boolean;
  error?: boolean;
  placeholder?: string;
  disabled?: boolean;
};

export const IcpAutocompleteSelect = ({
  value,
  onChange,
  icpsList = [],
  isDarkMode,
  error = false,
  placeholder = 'No ICP',
  disabled = false,
}: IcpAutocompleteSelectProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const validIcpNames = useMemo(() => {
    const listNames = (icpsList || [])
      .map((item) => (typeof item === 'string' ? item : item.name?.trim()))
      .filter((n): n is string => Boolean(n));
    const baseList = listNames.length > 0 ? listNames : DEFAULT_FALLBACK_ICPS;
    return new Set(baseList.map((n) => n.toLowerCase()));
  }, [icpsList]);

  const currentText = (inputValue ?? value ?? '').trim().toLowerCase();

  // Full exact valid ICP match (required for final selection / blur)
  const isExactValid = useMemo(() => {
    if (!currentText || currentText === NO_ICP_LABEL.toLowerCase()) return true;
    return validIcpNames.has(currentText);
  }, [currentText, validIcpNames]);

  // Partial match: checks if at least one option matches what the user is currently typing
  const hasPartialMatch = useMemo(() => {
    if (!currentText || currentText === NO_ICP_LABEL.toLowerCase()) return true;
    for (const name of validIcpNames) {
      if (name.includes(currentText)) return true;
    }
    return false;
  }, [currentText, validIcpNames]);

  // While typing (focused): only show red error if zero options match what is typed.
  // When finished (blurred): show red error if it's not a complete valid option.
  const isInvalid = isFocused ? !hasPartialMatch : !isExactValid;
  const hasError = error || isInvalid;

  const options = useMemo(() => {
    const listNames = (icpsList || [])
      .map((item) => (typeof item === 'string' ? item : item.name?.trim()))
      .filter((n): n is string => Boolean(n));

    const baseList = listNames.length > 0 ? listNames : DEFAULT_FALLBACK_ICPS;
    const set = new Set<string>();

    // No ICP option at the top for clearing
    set.add(NO_ICP_LABEL);

    for (const item of baseList) {
      set.add(item);
    }
    return Array.from(set);
  }, [icpsList]);

  return (
    <Box sx={{ width: '100%' }}>
      <Autocomplete
        freeSolo
        openOnFocus
        autoHighlight
        disableClearable
        popupIcon={null}
        disabled={disabled}
        options={options}
        value={value || ''}
        inputValue={inputValue}
        noOptionsText="No matching ICP found"
        onInputChange={(_, newInputValue, reason) => {
          setInputValue(newInputValue);
          if (reason === 'input' || reason === 'clear') {
            onChange(newInputValue === NO_ICP_LABEL ? '' : newInputValue);
          }
        }}
        onChange={(_, newValue) => {
          const raw = typeof newValue === 'string' ? newValue : (newValue || '');
          const finalVal = raw === NO_ICP_LABEL ? '' : raw;
          const matched = Array.from(options).find(
            (opt) => opt.toLowerCase().trim() === finalVal.toLowerCase().trim(),
          );
          const resolved = matched && matched !== NO_ICP_LABEL ? matched : finalVal;
          setInputValue(resolved);
          onChange(resolved);
        }}
        filterOptions={(opts, state) => {
          const q = state.inputValue.toLowerCase().trim();
          if (!q) return opts;
          return opts.filter((opt) => opt.toLowerCase().includes(q));
        }}
        slotProps={{
          popper: {
            sx: {
              minWidth: 240,
              width: 'max-content',
              maxWidth: 340,
              zIndex: 1400,
            },
          },
          paper: {
            sx: {
              borderRadius: '12px',
              boxShadow: isDarkMode
                ? '0 12px 36px rgba(0,0,0,0.65)'
                : '0 10px 30px rgba(0,0,0,0.15)',
              bgcolor: isDarkMode ? '#1e1b24' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              mt: 0.5,
              '& .MuiAutocomplete-listbox': {
                p: 1,
                maxHeight: 280,
                '& .MuiAutocomplete-option': {
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  py: 0.85,
                  px: 1.5,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  },
                  '&[aria-selected="true"]': {
                    bgcolor: `${tokens.brand.primary}20`,
                    color: tokens.brand.primary,
                  },
                },
              },
            },
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder={placeholder}
            error={hasError}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            sx={{
              width: '100%',
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fff',
                fontSize: '0.8rem',
                p: '2px 8px',
                minHeight: '34px',
                fontFamily: 'inherit',
                color: isDarkMode ? '#fff' : '#111',
                '& fieldset': {
                  borderColor: hasError
                    ? '#c62828'
                    : isDarkMode
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.12)',
                  borderWidth: hasError ? 2 : 1,
                },
                '&:hover fieldset': {
                  borderColor: hasError ? '#c62828' : tokens.brand.primaryMuted,
                },
                '&.Mui-focused fieldset': {
                  borderColor: hasError ? '#c62828' : tokens.brand.primary,
                  borderWidth: hasError ? 2 : 1.5,
                },
                '& input': {
                  color: hasError ? '#c62828' : isDarkMode ? '#fff' : '#111',
                  fontSize: '0.8rem',
                  p: '4px 6px',
                  fontFamily: 'inherit',
                  fontWeight: value ? 600 : 400,
                  '&::placeholder': {
                    color: isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                    opacity: 1,
                  },
                },
              },
            }}
          />
        )}
      />
      {hasError && (
        <Typography
          variant="caption"
          sx={{
            color: '#c62828',
            fontSize: '0.7rem',
            fontWeight: 700,
            mt: 0.35,
            display: 'block',
            lineHeight: 1.2,
          }}
        >
          {isInvalid ? 'Invalid ICP' : 'ICP is required'}
        </Typography>
      )}
    </Box>
  );
};
