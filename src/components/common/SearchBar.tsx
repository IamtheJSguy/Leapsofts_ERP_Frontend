import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search...',
}: SearchBarProps) => (
  <TextField
    size="small"
    fullWidth
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon aria-hidden="true" />
        </InputAdornment>
      ),
    }}
    aria-label={placeholder}
  />
);
