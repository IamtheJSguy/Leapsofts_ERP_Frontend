import { useState } from 'react';
import { Typography, Box } from '@mui/material';
import { ReportBuilder } from '@/components/reports/ReportBuilder';
import { ReportTable } from '@/components/reports/ReportTable';
import { ReportExportButton } from '@/components/reports/ReportExportButton';
import { ReportChartView } from '@/components/reports/ReportChartView';
import type { Report } from '@/types';

const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>
      <ReportBuilder onGenerated={(id) => setSelectedReport({ _id: id } as Report)} />
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Generated Reports
        </Typography>
        <ReportTable onSelect={setSelectedReport} />
      </Box>
      {selectedReport && (
        <Box sx={{ mt: 3 }}>
          <ReportExportButton reportId={selectedReport._id} />
          <ReportChartView
            data={[
              { name: 'Sent', value: 45 },
              { name: 'Accepted', value: 20 },
              { name: 'Replied', value: 15 },
            ]}
            title="Report Summary"
          />
        </Box>
      )}
    </>
  );
};

export default ReportsPage;
