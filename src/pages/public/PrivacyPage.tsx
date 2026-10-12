import { Box, Typography, Alert } from '@mui/material';
import { LegalDocumentLayout } from '@/components/public/LegalDocumentLayout';

const TOC = [
  { id: 'overview', title: '1. Overview & Scope' },
  { id: 'data-collection', title: '2. Data We Collect' },
  { id: 'google-api', title: '3. Google API & Drive Disclosures' },
  { id: 'workplace-telemetry', title: '4. Workplace Telemetry & Screenshots' },
  { id: 'financial-data', title: '5. Invoicing & Financial Records' },
  { id: 'security-measures', title: '6. Data Security & Storage' },
  { id: 'retention-rights', title: '7. Retention & Your Rights' },
  { id: 'contact', title: '8. Contact Information' },
];

export const PrivacyPage = () => {
  return (
    <LegalDocumentLayout
      title="Privacy Policy"
      subtitle="How Leapsofts ERP collects, processes, and protects organizational records, sales data, and workplace productivity telemetry."
      version="2.4"
      lastUpdated="October 2026"
      toc={TOC}
    >
      <Box id="overview">
        <h2>1. Overview & Scope</h2>
        <p>
          Leapsofts Technologies (&quot;Leapsofts&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides an enterprise-grade ERP and Sales Automation platform designed to unify customer acquisition, client invoicing, departmental project management, and workforce shift telemetry.
        </p>
        <p>
          This Privacy Policy explains how personal, commercial, and operational information is gathered, utilized, stored, and protected when accessing the Leapsofts web portal, desktop client telemetry agents, and associated services.
        </p>
      </Box>

      <Box id="data-collection">
        <h2>2. Data We Collect</h2>
        <p>Depending on your organization&apos;s active modules, we collect the following categories of information:</p>
        <ul>
          <li><strong>Account & Profile Information:</strong> Full name, corporate email address, encrypted authentication credentials, phone number, job title, departmental assignment, and profile avatar.</li>
          <li><strong>Customer Relationship Management (CRM) Data:</strong> Prospect contact details, LinkedIn profile URLs, company affiliations, lead qualification metrics, call logs, and sales notes.</li>
          <li><strong>Billing & Invoicing Records:</strong> Commercial client billing addresses, National Tax Numbers (NTN), line-item invoices, payment status, and bank account remittance coordinates.</li>
          <li><strong>Shift & Attendance Records:</strong> Shift check-in and check-out timestamps, break durations (idle, manual, sleep), scheduled working hours, and session lateness calculations.</li>
        </ul>
      </Box>

      <Box id="google-api">
        <h2>3. Google API & Google Drive Disclosures</h2>
        <Alert severity="info" sx={{ mb: 2, borderRadius: '14px' }}>
          <strong>Google OAuth Compliance:</strong> Leapsofts adheres strictly to the Google API Services User Data Policy, including the Limited Use requirements.
        </Alert>
        <p>
          When you connect your Google Account to access the <strong>Google Drive File Picker</strong> within Leapsofts Chat or Project Boards:
        </p>
        <ul>
          <li>We only access file metadata (file name, thumbnail, and web view link) for files explicitly selected by the user.</li>
          <li>We do <strong>not</strong> perform bulk background scanning of your Google Drive files or private folders.</li>
          <li>Google user data is never transferred to third parties, sold, or utilized for training artificial intelligence or advertising models.</li>
        </ul>
      </Box>

      <Box id="workplace-telemetry">
        <h2>4. Workplace Telemetry & Monitoring Disclosure</h2>
        <Alert severity="warning" sx={{ mb: 2, borderRadius: '14px' }}>
          <strong>Mandatory Employee Consent:</strong> Workplace monitoring features are governed by explicit corporate policy acknowledgments. Monitoring activates only during clocked-in shifts.
        </Alert>
        <p>
          Where enabled by your employer under an active enterprise contract, the Leapsofts desktop agent records the following during open shift sessions:
        </p>
        <ul>
          <li><strong>Periodic Screen Samples:</strong> Captures taken at approximately 10-minute intervals while clocked in. Employees are notified of monitoring status within their profile and shift dashboard.</li>
          <li><strong>Productivity Intensity Index:</strong> Aggregated percentage of keyboard and mouse activity during active time blocks. Raw keystrokes (keylogging) are strictly prohibited and never recorded.</li>
          <li><strong>Application & Domain Usage:</strong> Active foreground application titles and visited web domains are indexed to measure productivity attainment and categorize operational hours.</li>
        </ul>
      </Box>

      <Box id="financial-data">
        <h2>5. Invoicing & Financial Records</h2>
        <p>
          Financial records generated within the Invoicing Studio are treated as confidential organizational property. We maintain immutable transaction audit trails for dispute resolution, accounting reconciliation, and tax authority compliance.
        </p>
      </Box>

      <Box id="security-measures">
        <h2>6. Data Security & Storage</h2>
        <p>
          We employ robust administrative, technical, and physical safeguards:
        </p>
        <ul>
          <li><strong>Encryption:</strong> Data in transit is secured using TLS 1.3. Sensitive database records and credentials are encrypted at rest using AES-256 standards.</li>
          <li><strong>Multi-Factor Authentication (2FA):</strong> Time-based one-time password (TOTP) enforcement is available and recommended for all organizational seats.</li>
          <li><strong>Logical Tenant Isolation:</strong> Multi-tenant segregation ensures that your organization&apos;s pipeline, chat, and financial data are never commingled with other entities.</li>
        </ul>
      </Box>

      <Box id="retention-rights">
        <h2>7. Data Retention & Your Rights</h2>
        <p>
          Organizational records are retained for the duration of the active subscription agreement. Individual users may request access, rectification, or export of their profile data by contacting their organization administrator or our compliance department.
        </p>
      </Box>

      <Box id="contact">
        <h2>8. Contact Information</h2>
        <p>
          If you have questions regarding this Privacy Policy or your organization&apos;s data processing practices, please reach out directly to:
        </p>
        <p>
          <strong>Leapsofts Privacy & Compliance Team</strong><br />
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

export default PrivacyPage;
