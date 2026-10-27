import type { ReactNode } from 'react';
import { Box, Skeleton, useTheme } from '@mui/material';
import { useLocation } from 'react-router-dom';

const useSurface = () => {
  const isDark = useTheme().palette.mode === 'dark';
  return {
    bone: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    card: isDark ? 'rgba(30, 27, 36, 0.45)' : '#fff',
    line: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  };
};

const Bone = ({ width, height, radius = '10px' }: { width: number | string; height: number; radius?: string }) => {
  const { bone } = useSurface();
  return <Skeleton variant="rounded" width={width} height={height} sx={{ borderRadius: radius, bgcolor: bone }} />;
};

const PageTitle = () => (
  <Box sx={{ mb: 3.5 }}>
    <Bone width={280} height={36} radius="8px" />
    <Box sx={{ mt: 1 }}>
      <Bone width={420} height={16} radius="6px" />
    </Box>
  </Box>
);

const CardShell = ({ children, radius = '24px', padding = 3 }: { children: ReactNode; radius?: string; padding?: number }) => {
  const { card, line } = useSurface();
  return (
    <Box sx={{ bgcolor: card, border: `1px solid ${line}`, borderRadius: radius, p: padding }}>
      {children}
    </Box>
  );
};

export const ProjectsGridSkeleton = () => (
  <Box
    sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(320px, 1fr))' }, gap: 3 }}
    aria-busy="true"
    aria-label="Loading projects"
  >
    {Array.from({ length: 6 }, (_, index) => (
      <CardShell key={index}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Bone width="62%" height={24} />
          <Bone width={72} height={20} radius="999px" />
        </Box>
        <Bone width={72} height={12} />
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Bone width="100%" height={12} />
          <Bone width="80%" height={12} />
        </Box>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex' }}>
            <Bone width={28} height={28} radius="50%" />
            <Bone width={28} height={28} radius="50%" />
          </Box>
          <Bone width={88} height={14} />
        </Box>
      </CardShell>
    ))}
  </Box>
);

export const ProjectsPageSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading projects">
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      <PageTitle />
      <Bone width={140} height={42} radius="24px" />
    </Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      <Bone width={260} height={44} radius="24px" />
      <Box sx={{ display: 'flex', gap: 1 }}>
        {Array.from({ length: 4 }, (_, index) => (
          <Bone key={index} width={88} height={32} radius="20px" />
        ))}
      </Box>
    </Box>
    <ProjectsGridSkeleton />
  </Box>
);

export const ProjectDetailsSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading project">
    <Bone width={120} height={18} />
    <Box sx={{ mt: 2, mb: 3, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Bone width={260} height={40} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Bone width={110} height={40} radius="24px" />
        <Bone width={110} height={40} radius="24px" />
      </Box>
    </Box>
    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
      <Bone width={90} height={36} radius="12px" />
      <Bone width={90} height={36} radius="12px" />
      <Bone width={90} height={36} radius="12px" />
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
      {Array.from({ length: 3 }, (_, index) => (
        <CardShell key={index}>
          <Bone width="70%" height={22} />
          <Box sx={{ mt: 2 }}><Bone width="40%" height={14} /></Box>
          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Bone width={64} height={22} radius="999px" />
            <Bone width={64} height={22} radius="999px" />
          </Box>
        </CardShell>
      ))}
    </Box>
  </Box>
);

export const PipelineRowSkeleton = () => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))', lg: 'repeat(7, minmax(0, 1fr))' },
      gap: 1,
      mb: 1.5,
    }}
    aria-busy="true"
    aria-label="Loading pipeline"
  >
    {Array.from({ length: 7 }, (_, index) => (
      <CardShell key={index} radius="16px" padding={1.5}>
        <Bone width="70%" height={10} />
        <Box sx={{ mt: 1 }}><Bone width="45%" height={22} /></Box>
      </CardShell>
    ))}
  </Box>
);

export const SalesTableSkeleton = () => (
  <CardShell radius="24px" padding={0}>
    <Box sx={{ display: 'grid', gridTemplateColumns: '48px 1.6fr 1fr 1fr 1fr 72px', gap: 2, px: 2, py: 1.5 }} aria-busy="true" aria-label="Loading leads">
      {Array.from({ length: 6 }, (_, index) => (
        <Bone key={index} width="70%" height={12} />
      ))}
    </Box>
    {Array.from({ length: 8 }, (_, row) => (
      <Box key={row} sx={{ display: 'grid', gridTemplateColumns: '48px 1.6fr 1fr 1fr 1fr 72px', gap: 2, px: 2, py: 1.75, alignItems: 'center' }}>
        <Bone width={18} height={14} />
        <Box>
          <Bone width="68%" height={14} />
          <Box sx={{ mt: 0.5 }}><Bone width="42%" height={10} /></Box>
        </Box>
        <Bone width="60%" height={22} radius="999px" />
        <Bone width="70%" height={22} radius="999px" />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Bone width={28} height={28} radius="50%" />
          <Bone width={80} height={12} />
        </Box>
        <Bone width={28} height={28} radius="50%" />
      </Box>
    ))}
  </CardShell>
);

export const SalesPageSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading sales">
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      <Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Bone width={320} height={36} />
          <Bone width={150} height={30} radius="999px" />
        </Box>
        <Box sx={{ mt: 1 }}><Bone width={360} height={16} /></Box>
      </Box>
      <Bone width={280} height={40} radius="12px" />
    </Box>
    <PipelineRowSkeleton />
    <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 2, gap: 2 }}>
      <Bone width={240} height={40} radius="24px" />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Bone width={110} height={42} radius="24px" />
        <Bone width={110} height={42} radius="24px" />
      </Box>
    </Box>
    <SalesTableSkeleton />
  </Box>
);

export const KanbanPageSkeleton = () => (
  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} aria-busy="true" aria-label="Loading board">
    <Bone width={160} height={16} />
    <Box sx={{ mt: 1.5, mb: 3, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
      <Bone width={240} height={36} />
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Bone width={32} height={32} radius="50%" />
        <Bone width={32} height={32} radius="50%" />
        <Bone width={200} height={40} radius="24px" />
      </Box>
    </Box>
    <Box sx={{ display: 'flex', gap: 2, overflow: 'hidden', flex: 1 }}>
      {Array.from({ length: 4 }, (_, column) => (
        <Box key={column} sx={{ minWidth: 280, flex: '0 0 280px' }}>
          <Bone width={120} height={18} />
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <CardShell radius="16px" padding={2}><Bone width="80%" height={16} /><Box sx={{ mt: 1 }}><Bone width="50%" height={12} /></Box></CardShell>
            <CardShell radius="16px" padding={2}><Bone width="70%" height={16} /><Box sx={{ mt: 1 }}><Bone width="40%" height={12} /></Box></CardShell>
            <CardShell radius="16px" padding={2}><Bone width="75%" height={16} /></CardShell>
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
);

export const MeetingCardsSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading meetings">
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {Array.from({ length: 4 }, (_, index) => (
          <Bone key={index} width={84} height={36} radius="16px" />
        ))}
      </Box>
      <Bone width={84} height={36} radius="12px" />
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
      {Array.from({ length: 6 }, (_, index) => (
        <CardShell key={index}>
          <Bone width="75%" height={20} />
          <Box sx={{ mt: 1.5 }}><Bone width="50%" height={14} /></Box>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Bone width={90} height={22} radius="999px" />
            <Bone width={70} height={22} radius="999px" />
          </Box>
          <Box sx={{ mt: 3, display: 'flex' }}>
            <Bone width={28} height={28} radius="50%" />
            <Bone width={28} height={28} radius="50%" />
          </Box>
        </CardShell>
      ))}
    </Box>
  </Box>
);

export const MeetingsPageSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading meetings">
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2 }}>
      <PageTitle />
      <Bone width={170} height={44} radius="24px" />
    </Box>
    <Bone width={280} height={36} radius="16px" />
    <Box sx={{ mt: 3 }}>
      <MeetingCardsSkeleton />
    </Box>
  </Box>
);

export const LeadDetailSkeleton = () => (
  <Box sx={{ maxWidth: 1200, mx: 'auto' }} aria-busy="true" aria-label="Loading lead">
    <Bone width={180} height={18} />
    <CardShell>
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <Bone width={80} height={80} radius="50%" />
        <Box sx={{ flex: 1 }}>
          <Bone width={260} height={36} />
          <Box sx={{ mt: 1 }}><Bone width={200} height={16} /></Box>
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
            <Bone width={84} height={24} radius="999px" />
            <Bone width={120} height={24} radius="999px" />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Bone width={150} height={40} radius="24px" />
          <Bone width={120} height={40} radius="24px" />
        </Box>
      </Box>
    </CardShell>
    <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <CardShell>
          <Bone width={180} height={22} />
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Bone width="45%" height={48} />
            <Bone width="45%" height={48} />
          </Box>
        </CardShell>
        <CardShell>
          <Bone width={140} height={22} />
          <Box sx={{ mt: 2 }}><Bone width="100%" height={72} /></Box>
        </CardShell>
      </Box>
      <CardShell>
        <Bone width={120} height={22} />
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Bone width="100%" height={16} />
          <Bone width="80%" height={16} />
          <Bone width="90%" height={16} />
        </Box>
      </CardShell>
    </Box>
  </Box>
);

export const ChatPageSkeleton = () => (
  <Box sx={{ height: 'calc(100vh - 120px)', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '340px minmax(0, 1fr)' }, borderRadius: '24px', overflow: 'hidden' }} aria-busy="true" aria-label="Loading chat">
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Bone width="100%" height={40} radius="12px" />
      {Array.from({ length: 7 }, (_, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Bone width={40} height={40} radius="50%" />
          <Box sx={{ flex: 1 }}>
            <Bone width="60%" height={14} />
            <Box sx={{ mt: 0.5 }}><Bone width="80%" height={12} /></Box>
          </Box>
        </Box>
      ))}
    </Box>
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Bone width={180} height={24} />
      <Box sx={{ flex: 1 }} />
      <Bone width="55%" height={36} radius="16px" />
      <Bone width="40%" height={36} radius="16px" />
      <Bone width="100%" height={52} radius="16px" />
    </Box>
  </Box>
);

export const InvoicesPageSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading invoices">
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <PageTitle />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Bone width={120} height={42} radius="12px" />
        <Bone width={140} height={42} radius="12px" />
      </Box>
    </Box>
    <Bone width={280} height={42} radius="12px" />
    <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
      {Array.from({ length: 6 }, (_, index) => (
        <CardShell key={index} radius="18px" padding={2}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Bone width={40} height={40} radius="50%" />
            <Box sx={{ flex: 1 }}>
              <Bone width="70%" height={16} />
              <Box sx={{ mt: 0.5 }}><Bone width="50%" height={12} /></Box>
            </Box>
          </Box>
          <Box sx={{ mt: 2 }}><Bone width="40%" height={12} /></Box>
        </CardShell>
      ))}
    </Box>
  </Box>
);

export const InvoiceDocumentSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading invoice">
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Bone width={200} height={32} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Bone width={100} height={40} radius="12px" />
        <Bone width={120} height={40} radius="12px" />
      </Box>
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '280px minmax(0, 1fr)' }, gap: 3 }}>
      <CardShell>
        {Array.from({ length: 6 }, (_, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Bone width="40%" height={12} />
            <Box sx={{ mt: 0.75 }}><Bone width="100%" height={36} radius="10px" /></Box>
          </Box>
        ))}
      </CardShell>
      <CardShell>
        <Bone width={140} height={20} />
        <Box sx={{ mt: 3 }}><Bone width="100%" height={420} radius="8px" /></Box>
      </CardShell>
    </Box>
  </Box>
);

export const TasksPageSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading tasks">
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
      <PageTitle />
      <Bone width={180} height={44} radius="24px" />
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
      <CardShell>
        <Bone width={160} height={22} />
        {Array.from({ length: 5 }, (_, index) => (
          <Box key={index} sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Bone width="55%" height={18} />
            <Bone width={90} height={22} radius="999px" />
          </Box>
        ))}
      </CardShell>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Array.from({ length: 3 }, (_, index) => (
          <CardShell key={index} radius="20px" padding={2}>
            <Bone width="50%" height={12} />
            <Box sx={{ mt: 1 }}><Bone width="30%" height={28} /></Box>
          </CardShell>
        ))}
      </Box>
    </Box>
  </Box>
);

export const ReportsPageSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading reports">
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Bone width={260} height={36} />
      <Bone width={220} height={40} radius="16px" />
    </Box>
    <ReportResultSkeleton />
  </Box>
);

export const ReportResultSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading report">
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
      {Array.from({ length: 4 }, (_, index) => (
        <CardShell key={index} radius="20px" padding={2.5}>
          <Bone width="40%" height={28} />
          <Box sx={{ mt: 1 }}><Bone width="70%" height={12} /></Box>
        </CardShell>
      ))}
    </Box>
    <CardShell>
      <Bone width={180} height={20} />
      <Box sx={{ mt: 2 }}><Bone width="100%" height={260} radius="16px" /></Box>
    </CardShell>
  </Box>
);

export const DashboardPageSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading dashboard">
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, gap: 2 }}>
      <Box>
        <Bone width={320} height={36} />
        <Box sx={{ mt: 1 }}><Bone width={260} height={16} /></Box>
      </Box>
      <Bone width={180} height={52} radius="20px" />
    </Box>
    <CardShell>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Bone width={48} height={48} radius="50%" />
          <Box>
            <Bone width={180} height={18} />
            <Box sx={{ mt: 0.75 }}><Bone width={120} height={14} /></Box>
          </Box>
        </Box>
        <Bone width={140} height={40} radius="24px" />
      </Box>
    </CardShell>
    <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
      {Array.from({ length: 4 }, (_, index) => (
        <CardShell key={index} radius="20px">
          <Bone width="50%" height={12} />
          <Box sx={{ mt: 2 }}><Bone width="40%" height={32} /></Box>
        </CardShell>
      ))}
    </Box>
    <Box sx={{ mt: 3 }}><CardShell><Bone width="100%" height={220} radius="16px" /></CardShell></Box>
  </Box>
);

export const TeamPageSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading team">
    <PageTitle />
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
      {Array.from({ length: 4 }, (_, index) => (
        <CardShell key={index} radius="16px" padding={2}>
          <Bone width="60%" height={12} />
          <Box sx={{ mt: 1.5 }}><Bone width="35%" height={28} /></Box>
        </CardShell>
      ))}
    </Box>
    <CardShell padding={0}>
      {Array.from({ length: 6 }, (_, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center', px: 2, py: 1.75 }}>
          <Bone width={36} height={36} radius="50%" />
          <Bone width={160} height={14} />
          <Box sx={{ flex: 1 }} />
          <Bone width={80} height={22} radius="999px" />
        </Box>
      ))}
    </CardShell>
  </Box>
);

export const AttendancePageSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading attendance">
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <PageTitle />
      <Bone width={160} height={40} radius="12px" />
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
      {Array.from({ length: 3 }, (_, index) => (
        <CardShell key={index} radius="20px">
          <Bone width="45%" height={12} />
          <Box sx={{ mt: 1.5 }}><Bone width="30%" height={32} /></Box>
        </CardShell>
      ))}
    </Box>
    <CardShell><Bone width="100%" height={280} radius="16px" /></CardShell>
  </Box>
);

export const AdminPageSkeleton = () => (
  <Box aria-busy="true" aria-label="Loading admin">
    <PageTitle />
    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
      <Bone width={100} height={36} radius="12px" />
      <Bone width={120} height={36} radius="12px" />
      <Bone width={110} height={36} radius="12px" />
    </Box>
    <CardShell padding={0}>
      {Array.from({ length: 6 }, (_, index) => (
        <Box key={index} sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 80px', gap: 2, px: 2, py: 1.75 }}>
          <Bone width="70%" height={14} />
          <Bone width="50%" height={14} />
          <Bone width={72} height={22} radius="999px" />
          <Bone width={28} height={28} radius="50%" />
        </Box>
      ))}
    </CardShell>
  </Box>
);

export const ProfilePageSkeleton = () => (
  <Box sx={{ maxWidth: 840 }} aria-busy="true" aria-label="Loading profile">
    <PageTitle />
    <CardShell>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
        <Bone width={72} height={72} radius="50%" />
        <Box>
          <Bone width={180} height={22} />
          <Box sx={{ mt: 1 }}><Bone width={140} height={14} /></Box>
        </Box>
      </Box>
      {Array.from({ length: 4 }, (_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Bone width={100} height={12} />
          <Box sx={{ mt: 0.75 }}><Bone width="100%" height={40} radius="12px" /></Box>
        </Box>
      ))}
    </CardShell>
  </Box>
);

export const FormPageSkeleton = () => (
  <Box sx={{ maxWidth: 720 }} aria-busy="true" aria-label="Loading page">
    <PageTitle />
    <CardShell>
      {Array.from({ length: 5 }, (_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Bone width={120} height={12} />
          <Box sx={{ mt: 0.75 }}><Bone width="100%" height={40} radius="12px" /></Box>
        </Box>
      ))}
      <Bone width={140} height={42} radius="24px" />
    </CardShell>
  </Box>
);

export const RoutePageSkeleton = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/sales/leads/')) return <LeadDetailSkeleton />;
  if (pathname.startsWith('/sales/settings') || pathname.startsWith('/sales/add-leads')) return <FormPageSkeleton />;
  if (pathname.startsWith('/sales')) return <SalesPageSkeleton />;
  if (pathname.includes('/boards/')) return <KanbanPageSkeleton />;
  if (/^\/projects\/[^/]+/.test(pathname)) return <ProjectDetailsSkeleton />;
  if (pathname.startsWith('/projects')) return <ProjectsPageSkeleton />;
  if (pathname.startsWith('/meetings')) return <MeetingsPageSkeleton />;
  if (pathname.startsWith('/chat') || pathname.startsWith('/ai')) return <ChatPageSkeleton />;
  if (pathname.startsWith('/invoices/clients/')) return <InvoiceDocumentSkeleton />;
  if (pathname.startsWith('/invoices/new') || pathname.startsWith('/invoices/settings') || /^\/invoices\/[^/]+/.test(pathname)) {
    return <InvoiceDocumentSkeleton />;
  }
  if (pathname.startsWith('/invoices')) return <InvoicesPageSkeleton />;
  if (pathname.startsWith('/reports')) return <ReportsPageSkeleton />;
  if (pathname.startsWith('/tasks')) return <TasksPageSkeleton />;
  if (pathname.startsWith('/team')) return <TeamPageSkeleton />;
  if (pathname.startsWith('/attendance')) return <AttendancePageSkeleton />;
  if (pathname.startsWith('/admin')) return <AdminPageSkeleton />;
  if (pathname.startsWith('/profile')) return <ProfilePageSkeleton />;
  return <DashboardPageSkeleton />;
};
