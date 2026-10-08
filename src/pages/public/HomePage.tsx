import { Box } from '@mui/material';
import { PublicLayout } from '@/layouts/PublicLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { MetricCounterBar } from '@/components/home/MetricCounterBar';
import { BentoGridShowcase } from '@/components/home/BentoGridShowcase';
import { OperationalLifecycleSection } from '@/components/home/OperationalLifecycleSection';
import { SecurityComplianceSection } from '@/components/home/SecurityComplianceSection';
import { CtaSection } from '@/components/home/CtaSection';

export const HomePage = () => {
  return (
    <PublicLayout>
      <Box sx={{ position: 'relative' }}>
        {/* 1. Hero Section with Authentic ERP Window */}
        <HeroSection />

        {/* 2. Platform Velocity & Metric Bar */}
        <MetricCounterBar />

        {/* 3. Core Architecture Bento Grid */}
        <Box className="section-gpu-accelerated">
          <BentoGridShowcase />
        </Box>

        {/* 4. Unified Operational Lifecycle & ROI Comparison Matrix */}
        <Box className="section-gpu-accelerated">
          <OperationalLifecycleSection />
        </Box>

        {/* 5. Enterprise Security, Privacy & Telemetry Compliance */}
        <Box className="section-gpu-accelerated">
          <SecurityComplianceSection />
        </Box>

        {/* 6. Closing Call to Action */}
        <Box className="section-gpu-accelerated">
          <CtaSection />
        </Box>
      </Box>
    </PublicLayout>
  );
};

export default HomePage;
