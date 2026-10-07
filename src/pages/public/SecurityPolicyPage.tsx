import { Box, Typography, Alert } from '@mui/material';
import { LegalDocumentLayout } from '@/components/public/LegalDocumentLayout';

const TOC = [
  { id: 'purpose', title: '1. Purpose & Standards' },
  { id: 'screenshot-policy', title: '2. Periodic Screen Sampling' },
  { id: 'app-telemetry', title: '3. Application & Domain Tracking' },
  { id: 'privacy-safeguards', title: '4. Privacy & Consent Safeguards' },
  { id: 'access-control', title: '5. Access Control & Audit Trails' },
  { id: 'retention-security', title: '6. Storage & Encryption Standards' },
];

export const SecurityPolicyPage = () => {
  return (
    <LegalDocumentLayout
      title="Workplace Telemetry & Monitoring Policy"
      subtitle="Comprehensive disclosure regarding employee productivity metrics, screen sampling intervals, and data privacy safeguards."
      version="2.4"
      lastUpdated="October 2026"
      toc={TOC}
    >
      <Box id="purpose">
        <h2>1. Purpose & Standards</h2>
        <p>
          This document establishes the technical, operational, and ethical guidelines governing the workplace shift telemetry features in Leapsofts ERP. Our telemetry architecture is engineered to provide fair, transparent productivity accounting while strictly protecting personal employee privacy.
        </p>
      </Box>

      <Box id="screenshot-policy">
        <h2>2. Periodic Screen Sampling</h2>
        <p>
          When enabled by an enterprise customer, the desktop client agent captures low-resolution screen samples at approximately 10-minute intervals:
        </p>
        <ul>
          <li><strong>Shift-Only Activation:</strong> Screen sampling only occurs while an employee is actively checked into an open work session. No sampling occurs during scheduled breaks, idle periods, or after clocking out.</li>
          <li><strong>Notification Badging:</strong> The application interface displays an active monitoring badge whenever the telemetry agent is recording.</li>
          <li><strong>Exclusion of Sensitive Windows:</strong> Administrative settings allow blurring or exclusion of designated private windows (such as password managers or personal system dialogs).</li>
        </ul>
      </Box>

      <Box id="app-telemetry">
        <h2>3. Application & Domain Tracking</h2>
        <p>
          The agent monitors the title of active foreground applications (e.g., &quot;Google Chrome&quot;, &quot;VS Code&quot;, &quot;Zoom&quot;) and the root web domain to compute operational focus percentages:
        </p>
        <ul>
          <li>Data is aggregated into productive vs. neutral categories based on departmental KPIs.</li>
          <li>Raw keyboard inputs (keystrokes) are <strong>never</strong> logged. The agent only measures the volume of input events to determine whether an employee is actively working.</li>
        </ul>
      </Box>

      <Box id="privacy-safeguards">
        <h2>4. Privacy & Consent Safeguards</h2>
        <Alert severity="success" sx={{ mb: 2, borderRadius: '14px' }}>
          <strong>Explicit Consent Requirement:</strong> Every employee must digitally acknowledge this policy before monitoring begins. Acknowledgments are permanently timestamped on user profile records.
        </Alert>
        <p>
          Employees retain the right to review their own attendance logs, recorded work intervals, and sample histories directly within the Attendance Activity dashboard.
        </p>
      </Box>

      <Box id="access-control">
        <h2>5. Access Control & Audit Trails</h2>
        <p>
          Telemetry samples are accessible solely to authorized departmental Managers and Tenant Administrators. Access is protected by role-based access control (RBAC), and all supervisor inspection events are logged in the administrative audit log.
        </p>
      </Box>

      <Box id="retention-security">
        <h2>6. Storage & Encryption Standards</h2>
        <p>
          All activity samples and usage logs are transmitted via TLS 1.3 encrypted connections and stored in secure, encrypted cloud object storage. Inactive shift telemetry data is automatically purged according to your organization&apos;s data retention policy (default: 90 days).
        </p>
      </Box>
    </LegalDocumentLayout>
  );
};

export default SecurityPolicyPage;
