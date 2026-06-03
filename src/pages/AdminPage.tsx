import { Typography, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { SystemSettingsPanel } from '@/components/admin/SystemSettingsPanel';

const AdminPage = () => {
  const [tab, setTab] = useState(0);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Users" />
        <Tab label="System Settings" />
      </Tabs>
      {tab === 0 ? <UserManagementTable /> : <SystemSettingsPanel />}
    </>
  );
};

export default AdminPage;
