import { IconButton, Tooltip } from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useNavigate } from 'react-router-dom';
import { tokens } from '@/styles/tokens';

export const InvoiceSettingsButton = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const navigate = useNavigate();

  return (
    <Tooltip title="Invoice settings" arrow>
      <IconButton
        aria-label="Invoice settings"
        onClick={() => navigate('/invoices/settings')}
        sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          bgcolor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#fff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          color: 'text.secondary',
          '&:hover': {
            color: tokens.brand.primary,
            borderColor: tokens.brand.primary,
          },
        }}
      >
        <SettingsOutlinedIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Tooltip>
  );
};
