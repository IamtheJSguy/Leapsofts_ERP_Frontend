import { Box, Typography, Alert } from '@mui/material';
import { LegalDocumentLayout } from '@/components/public/LegalDocumentLayout';

const TOC = [
  { id: 'purpose', title: '1. Purpose & Guiding Principles' },
  { id: 'monitoring-scope', title: '2. Monitoring Capabilities & Limits' },
  { id: 'data-collected', title: '3. Data Collected During Shifts' },
  { id: 'privacy-safeguards', title: '4. Privacy & Consent Safeguards' },
  { id: 'access-control', title: '5. Access Control & Audit Trails' },
  { id: 'retention-security', title: '6. Storage & Encryption Standards' },
  { id: 'contact', title: '7. Contact & Security Inquiries' },
];

export const SecurityPolicyPage = () => {
  return (
    <LegalDocumentLayout
      title="Workforce Monitoring Policy"
      subtitle="Operational boundaries, employee privacy safeguards, and automated telemetry rules for active shift monitoring."
      version="2.1"
      lastUpdated="October 2026"
      toc={TOC}
    >
      <Box id="purpose">
        <h2>1. Purpose & Guiding Principles</h2>
        <p>
          Leapsofts ERP incorporates transparent shift tracking tools to assist distributed organizations in verifying operational availability, tracking task progress, and maintaining fair attendance records.
        </p>
        <p>
          Our platform operates on the principle of <strong>proportionality</strong>: monitoring is limited strictly to active, clocked-in shift windows and is designed to assess operational output rather than conduct invasive personal surveillance.
        </p>
      </Box>

      <Box id="monitoring-scope">
        <h2>2. Monitoring Capabilities & Operational Limits</h2>
        <Alert severity="warning" sx={{ mb: 2, borderRadius: '14px' }}>
          <strong>No Inactive Tracking:</strong> Telemetry collection is strictly dormant whenever a user is clocked out or during scheduled break sessions.
        </Alert>
        <ul>
          <li><strong>Shift State Gating:</strong> Monitoring features activate exclusively when an employee affirmatively clicks &quot;Check In&quot; and deactivate immediately upon &quot;Check Out&quot;.</li>
          <li><strong>No Continuous Video Feed:</strong> The system captures discrete, periodic screen snapshots (typically every 10 minutes) rather than continuous video streams.</li>
          <li><strong>No Keystroke Logging:</strong> We record the volume of input events to calculate activity percentages. Specific keystrokes, passwords, and private chats are never recorded or logged.</li>
        </ul>
      </Box>

      <Box id="data-collected">
        <h2>3. Data Collected During Active Shifts</h2>
        <p>When an employee is actively clocked in with telemetry enabled by tenant policy:</p>
        <ul>
          <li><strong>Session Screenshots:</strong> Randomized desktop screen samples compressed and encrypted for managerial inspection.</li>
          <li><strong>Productivity Metrics:</strong> Aggregate input intensity percentages computed per 10-minute work block.</li>
          <li><strong>Foreground Applications:</strong> The name of the active window and process identifier to categorize work versus non-work hours.</li>
          <li><strong>Web Domains:</strong> Active browser tab domains (URL hostnames only; query parameters containing personal tokens are omitted).</li>
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

      <Box id="contact">
        <h2>7. Contact & Security Inquiries</h2>
        <p>
          For compliance questions, telemetry audit requests, or data protection inquiries, reach our team directly at:
        </p>
        <p>
          <strong>Leapsofts Security & Governance Team</strong><br />
          Official Contact Email:{' '}
          <a
            href="mailto:contact@leapsofts.com"
            style={{ color: '#A855F7', fontWeight: 700, textDecoration: 'none' }}
          >
            contact@leapsofts.com
          </a>
        </p>
      </Box>
    </LegalDocumentLayout>
  );
};

export default SecurityPolicyPage;
