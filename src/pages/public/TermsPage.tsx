import { Box, Typography, Alert } from '@mui/material';
import { LegalDocumentLayout } from '@/components/public/LegalDocumentLayout';

const TOC = [
  { id: 'acceptance', title: '1. Acceptance & Scope' },
  { id: 'accounts', title: '2. User Accounts & Multi-Tenancy' },
  { id: 'crm-rules', title: '3. CRM & Outbound Communications' },
  { id: 'invoicing-terms', title: '4. Invoicing, Currencies & Taxes' },
  { id: 'monitoring-agreement', title: '5. Shift Telemetry & Monitoring' },
  { id: 'intellectual-property', title: '6. Intellectual Property & Assets' },
  { id: 'sla-liability', title: '7. System Uptime & Liability' },
  { id: 'termination', title: '8. Termination & Revocation' },
];

export const TermsPage = () => {
  return (
    <LegalDocumentLayout
      title="Terms of Service"
      subtitle="The contractual terms and usage policies governing access to the Leapsofts ERP and Sales Automation platform."
      version="2.4"
      lastUpdated="October 2026"
      toc={TOC}
    >
      <Box id="acceptance">
        <h2>1. Acceptance & Scope</h2>
        <p>
          By accessing or utilizing the Leapsofts platform (&quot;Service&quot;), including any associated web portals, APIs, and client telemetry agents, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you are agreeing on behalf of a company or organization, you represent that you possess the authority to bind that entity.
        </p>
      </Box>

      <Box id="accounts">
        <h2>2. User Accounts & Multi-Tenancy</h2>
        <p>
          Access requires an authenticated account. Organizations maintain administrative jurisdiction over assigned seats and departmental permission roles (Admin, Manager, User).
        </p>
        <ul>
          <li><strong>Credential Confidentiality:</strong> Users are responsible for safeguarding login credentials and TOTP two-factor authentication devices.</li>
          <li><strong>Organization Switching:</strong> Members belonging to multiple corporate entities must respect the proprietary data boundaries of each individual workspace.</li>
          <li><strong>Session Integrity:</strong> Organization administrators reserve the authority to terminate active sessions or revoke user access at any time.</li>
        </ul>
      </Box>

      <Box id="crm-rules">
        <h2>3. CRM & Outbound Communications</h2>
        <p>
          The platform provides tools for managing LinkedIn outreach, cold calling campaigns, and lead data ingestion. Users agree to:
        </p>
        <ul>
          <li>Comply with applicable telemarketing, anti-spam (CAN-SPAM), and data privacy regulations when conducting outbound prospect outreach.</li>
          <li>Refrain from uploading unlawful, infringing, or fraudulently scraped personal datasets into the bulk leads pipeline.</li>
          <li>Accurately classify lead status and follow-up reminders to maintain pipeline data integrity.</li>
        </ul>
      </Box>

      <Box id="invoicing-terms">
        <h2>4. Invoicing, Currencies & Taxes</h2>
        <p>
          Leapsofts provides dynamic document generation tools across multiple international currencies (including PKR, USD, EUR, GBP, AED, SAR).
        </p>
        <ul>
          <li><strong>Tax & Compliance Responsibility:</strong> The issuing organization is solely responsible for verifying the accuracy of tax rates, National Tax Numbers (NTN), and legal entity disclosures rendered on generated invoices.</li>
          <li><strong>Payment Processing:</strong> Leapsofts acts as a software generator and record-keeper; actual settlement occurs via the bank accounts or payment rails designated by the issuer.</li>
          <li><strong>Dispute Resolution:</strong> The platform records formal dispute logs and communication histories between issuers and clients.</li>
        </ul>
      </Box>

      <Box id="monitoring-agreement">
        <h2>5. Shift Telemetry & Monitoring Acknowledgement</h2>
        <Alert severity="info" sx={{ mb: 2, borderRadius: '14px' }}>
          <strong>Operational Policy:</strong> Employees using the attendance and telemetry module acknowledge that shift hours are measured through active session tracking, periodic screen samples, and application usage telemetry.
        </Alert>
        <p>
          Workplace tracking is subject to mutual employment contracts and internal enterprise policies. All activity tracking terminates automatically upon manual checkout or system inactivity timeouts.
        </p>
      </Box>

      <Box id="intellectual-property">
        <h2>6. Intellectual Property & Assets</h2>
        <p>
          Leapsofts and its licensors retain all rights, title, and interest in the core platform software, UI components, custom invoice templates, and branding. Customers retain full ownership of customer-generated CRM data, uploaded documents, and financial ledgers.
        </p>
      </Box>

      <Box id="sla-liability">
        <h2>7. System Uptime & Limitation of Liability</h2>
        <p>
          While we strive for 99.9% availability across all application clusters, the service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Leapsofts shall not be liable for indirect, incidental, special, consequential, or punitive damages resulting from loss of sales data, system downtime, or third-party service interruptions.
        </p>
      </Box>

      <Box id="termination">
        <h2>8. Termination & Revocation</h2>
        <p>
          Either party may terminate subscription agreements according to commercial contract terms. Upon termination, organization data may be exported within thirty (30) days, after which it will be permanently expunged in accordance with our data retention schedule.
        </p>
      </Box>
    </LegalDocumentLayout>
  );
};

export default TermsPage;
