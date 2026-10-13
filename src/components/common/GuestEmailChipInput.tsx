import { useCallback, useState, type KeyboardEvent } from 'react';
import { Autocomplete, Chip, TextField, type SxProps, type Theme } from '@mui/material';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export interface GuestEmailChipInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  label?: string;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

export const GuestEmailChipInput = ({
  value,
  onChange,
  label = 'Additional guest emails (optional)',
  helperText,
  placeholder = 'Type email and press Enter',
  disabled,
  sx,
}: GuestEmailChipInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const emails = value ?? [];

  const addEmails = useCallback(
    (inputStr: string) => {
      const tokens = inputStr
        .split(/[\s,;\n]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (!tokens.length) return;

      for (const email of tokens) {
        if (!isValidEmail(email)) {
          setError(`Invalid email: ${email}`);
          return;
        }
      }

      const merged = Array.from(new Set([...emails, ...tokens]));
      onChange(merged);
      setInputValue('');
      setError('');
    },
    [emails, onChange],
  );

  return (
    <Autocomplete
      multiple
      freeSolo
      disabled={disabled}
      options={[]}
      open={false}
      value={emails}
      inputValue={inputValue}
      onInputChange={(_, newInputValue, reason) => {
        if (reason === 'reset') return;
        setInputValue(newInputValue);
        if (error) setError('');
      }}
      onChange={(_, newValue, reason, details) => {
        if (reason === 'removeOption' || reason === 'clear') {
          onChange(newValue as string[]);
          return;
        }
        if (reason === 'createOption' || reason === 'selectOption') {
          const added = details?.option;
          if (typeof added === 'string') {
            addEmails(added);
          }
        }
      }}
      onBlur={() => {
        if (inputValue.trim()) addEmails(inputValue);
      }}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((email, index) => {
          const { key, ...tagProps } = getTagProps({ index });
          return (
            <Chip
              key={key}
              label={email}
              size="small"
              {...tagProps}
              sx={{ borderRadius: '8px', fontWeight: 600 }}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={emails.length === 0 ? placeholder : ''}
          error={Boolean(error)}
          helperText={error || helperText}
          sx={{
            '& .MuiOutlinedInput-root': { borderRadius: '16px' },
            ...sx,
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData('text');
            if (pasted) addEmails(pasted);
          }}
          inputProps={{
            ...params.inputProps,
            autoComplete: 'off',
            onKeyDown: (e) => {
              if ((e.key === 'Enter' || e.key === ',' || e.key === 'Tab') && inputValue.trim()) {
                e.preventDefault();
                e.stopPropagation();
                addEmails(inputValue);
                return;
              }
              params.inputProps.onKeyDown?.(e as KeyboardEvent<HTMLInputElement>);
            },
          }}
        />
      )}
    />
  );
};
