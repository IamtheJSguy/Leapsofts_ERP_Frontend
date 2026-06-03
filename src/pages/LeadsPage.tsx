import { Typography } from '@mui/material';
import { LeadList } from '@/components/leads/LeadList';

const LeadsPage = () => (
  <>
    <Typography variant="h4" gutterBottom>
      Leads
    </Typography>
    <LeadList />
  </>
);

export default LeadsPage;
