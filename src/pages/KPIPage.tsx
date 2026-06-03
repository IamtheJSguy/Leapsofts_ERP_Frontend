import { useState } from 'react';
import { Typography, Tabs, Tab, Box } from '@mui/material';
import { MyKPIs } from '@/components/kpi/MyKPIs';
import { KPIManager } from '@/components/kpi/KPIManager';
import { KPIApprovalQueue } from '@/components/kpi/KPIApprovalQueue';
import { KPIRequestModal } from '@/components/kpi/KPIRequestModal';
import { usePermissions } from '@/hooks/usePermissions';
import { useMyKPIs } from '@/hooks/api/useKPIs';
import type { KPI } from '@/types';

const KPIPage = () => {
  const { canManageKPIs } = usePermissions();
  const [tab, setTab] = useState(0);
  const [requestKpi, setRequestKpi] = useState<KPI | null>(null);
  const { data: myKpis = [] } = useMyKPIs();

  return (
    <>
      <Typography variant="h4" gutterBottom>
        KPI Management
      </Typography>
      {canManageKPIs && (
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="My KPIs" />
          <Tab label="Manage KPIs" />
          <Tab label="Approval Queue" />
        </Tabs>
      )}
      {canManageKPIs ? (
        <>
          {tab === 0 && <MyKPIs />}
          {tab === 1 && <KPIManager />}
          {tab === 2 && <KPIApprovalQueue />}
        </>
      ) : (
        <Box>
          <MyKPIs />
          {myKpis.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Need a target change? Click a KPI to request.
              </Typography>
              {myKpis.map((kpi) => (
                <Box
                  key={kpi._id}
                  component="button"
                  onClick={() => setRequestKpi(kpi)}
                  sx={{
                    display: 'block',
                    textAlign: 'left',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1,
                    mb: 1,
                    width: '100%',
                    cursor: 'pointer',
                    bgcolor: 'background.paper',
                  }}
                >
                  Request change for: {kpi.name}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
      <KPIRequestModal kpi={requestKpi} open={!!requestKpi} onClose={() => setRequestKpi(null)} />
    </>
  );
};

export default KPIPage;
