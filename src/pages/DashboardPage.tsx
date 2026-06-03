import { Box, Typography } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { getDisplayName } from '@/utils/formatters';

const DashboardPage = () => {
  const { isAdmin, user } = useAuth();

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 0.5 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {getDisplayName(user)} — here&apos;s your pipeline overview
        </Typography>
      </Box>
      {isAdmin ? <AdminDashboard /> : <UserDashboard />}
    </Box>
  );
};

export default DashboardPage;
