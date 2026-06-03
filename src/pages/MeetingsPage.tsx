import { Typography, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import { MeetingScheduler } from '@/components/meetings/MeetingScheduler';
import { MeetingList } from '@/components/meetings/MeetingList';

const MeetingsPage = () => {
  const [tab, setTab] = useState(0);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Meetings
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Calendar" />
        <Tab label="List" />
      </Tabs>
      {tab === 0 ? <MeetingScheduler /> : <MeetingList />}
    </>
  );
};

export default MeetingsPage;
