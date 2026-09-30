export const LEAD_EXPORT_FIELDS = [
  { key: 'firstName', label: 'First Name', defaultSelected: true },
  { key: 'lastName', label: 'Last Name', defaultSelected: true },
  { key: 'email', label: 'Email', defaultSelected: true },
  { key: 'profileUrl', label: 'Profile URL', defaultSelected: true },
  { key: 'icp', label: 'ICP', defaultSelected: true },
  { key: 'profile', label: 'Profile', defaultSelected: true },
  { key: 'connectionStatus', label: 'Connection Status', defaultSelected: true },
  { key: 'messageStatus', label: 'Message Status', defaultSelected: true },
  { key: 'assignedTo', label: 'Assigned Agent', defaultSelected: true },
  { key: 'date', label: 'Date', defaultSelected: true },
  { key: 'prospectName', label: 'Prospect Name', defaultSelected: false },
  { key: 'company', label: 'Company', defaultSelected: false },
  { key: 'phone', label: 'Phone', defaultSelected: false },
  { key: 'website', label: 'Website URL', defaultSelected: false },
  { key: 'jobTitle', label: 'Job Title', defaultSelected: false },
  { key: 'industry', label: 'Industry', defaultSelected: false },
  { key: 'location', label: 'Location', defaultSelected: false },
  { key: 'companySize', label: 'Company Size', defaultSelected: false },
  { key: 'leadStatus', label: 'Lead Status', defaultSelected: false },
  { key: 'linkedinMsg', label: 'LinkedIn Message', defaultSelected: false },
  { key: 'notes', label: 'Notes', defaultSelected: false },
  { key: 'commentsAfterCall', label: 'Comments After Call', defaultSelected: false },
  { key: 'futureLeadDate', label: 'Future Lead Date', defaultSelected: false },
  { key: 'followUpCount', label: 'Follow-up Count', defaultSelected: false },
  { key: 'followUps', label: 'Follow-ups', defaultSelected: false },
  { key: 'isQualified', label: 'Qualified', defaultSelected: false },
  { key: 'leadComment', label: 'Lead Comment', defaultSelected: false },
  { key: 'leadCommentLevel', label: 'Lead Comment Level', defaultSelected: false },
  { key: 'salesNavigatorUrl', label: 'Sales Navigator URL', defaultSelected: false },
  { key: 'createdAt', label: 'Created At', defaultSelected: false },
  { key: 'updatedAt', label: 'Updated At', defaultSelected: false },
] as const;

export type LeadExportFieldKey = (typeof LEAD_EXPORT_FIELDS)[number]['key'];

export const DEFAULT_LEAD_EXPORT_FIELDS: LeadExportFieldKey[] = LEAD_EXPORT_FIELDS.filter(
  (field) => field.defaultSelected,
).map((field) => field.key);
