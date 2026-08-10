import * as XLSX from 'xlsx';
import type { ConnectionStatus, MessageStatus } from '@/types';

export type CsvBulkLeadRow = {
  firstName: string;
  lastName: string;
  email: string;
  icp: string;
  profile: string;
  /** Empty when CSV value was missing or did not match a known status. */
  connectionStatus: ConnectionStatus | '';
  /** Empty when CSV value was missing or did not match a known status. */
  messageStatus: MessageStatus | '';
  linkedinMsg: string;
  futureLeadDate?: string;
};

export type CsvImportResult = {
  rows: CsvBulkLeadRow[];
  mismatched: {
    icp: number;
    profile: number;
    connectionStatus: number;
    messageStatus: number;
  };
};

const CONNECTION_STATUSES: ConnectionStatus[] = [
  'pending',
  'accepted',
  'declined',
  'no_response',
];

const MESSAGE_STATUSES: MessageStatus[] = [
  'not_sent',
  'sent',
  'replied',
  'follow_up',
  'negative',
  'positive',
  'future_lead',
];

const HEADER_ALIASES: Record<string, string[]> = {
  firstName: ['first name', 'firstname', 'first_name'],
  lastName: ['last name', 'lastname', 'last_name'],
  email: ['email', 'e-mail', 'email address'],
  icp: ['icp'],
  profile: ['profile'],
  connectionStatus: ['connection status', 'connectionstatus', 'connection_status', 'connection'],
  messageStatus: ['message status', 'messagestatus', 'message_status', 'message', 'linkedin msg'],
  futureLeadDate: ['date', 'future lead date', 'futureleaddate', 'future_lead_date', 'reactivate on'],
};

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ');

const cellToString = (value: unknown): string => {
  if (value == null) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel serial date → ISO date when it looks like a date serial
    if (value > 20000 && value < 80000) {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) {
        const mm = String(parsed.m).padStart(2, '0');
        const dd = String(parsed.d).padStart(2, '0');
        return `${parsed.y}-${mm}-${dd}`;
      }
    }
    return String(value);
  }
  return String(value).trim();
};

const stripStatusPrefix = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .replace(/^(conn|connection|msg|message)\s*:\s*/i, '')
    .replace(/[\s-]+/g, '_');

const matchName = (raw: string, names: string[]): string => {
  const needle = raw.trim().toLowerCase();
  if (!needle) return '';
  const found = names.find((name) => name.trim().toLowerCase() === needle);
  return found || '';
};

const matchConnectionStatus = (raw: string): ConnectionStatus | '' => {
  if (!raw.trim()) return '';
  const cleaned = stripStatusPrefix(raw);
  const compact = cleaned.replace(/_/g, '');

  for (const status of CONNECTION_STATUSES) {
    if (cleaned === status || compact === status.replace(/_/g, '')) return status;
  }
  if (cleaned === 'no response' || compact === 'noresponse') return 'no_response';
  return '';
};

const matchMessageStatus = (raw: string): MessageStatus | '' => {
  if (!raw.trim()) return '';
  const cleaned = stripStatusPrefix(raw);
  const compact = cleaned.replace(/_/g, '');
  const spaced = raw.trim().toLowerCase();

  for (const status of MESSAGE_STATUSES) {
    if (cleaned === status || compact === status.replace(/_/g, '')) return status;
  }
  if (spaced.includes('message not sent') || compact === 'notsent') return 'not_sent';
  if (spaced === 'message sent') return 'sent';
  if (spaced.includes('in conversation')) return 'replied';
  if (spaced.includes('follow up') || compact === 'followup') return 'follow_up';
  if (spaced.includes('future lead') || compact === 'futurelead') return 'future_lead';
  return '';
};

const normalizeDate = (raw: string): string | undefined => {
  const value = raw.trim();
  if (!value) return undefined;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  // DD/MM/YYYY or MM/DD/YYYY — prefer ISO if unambiguous year-first fails
  const slash = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const y = slash[3];
    // Prefer day-first when day > 12, otherwise treat as YYYY-MM-DD from Date parse
    if (a > 12) {
      return `${y}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
    }
    if (b > 12) {
      return `${y}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
    }
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return undefined;
};

const buildHeaderMap = (headers: string[]): Record<string, string> => {
  const map: Record<string, string> = {};
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(normalized) && !map[field]) {
        map[field] = header;
      }
    }
  }
  return map;
};

const rowHasContent = (row: Record<string, unknown>, headerMap: Record<string, string>) =>
  Object.values(headerMap).some((header) => cellToString(row[header]).length > 0);

export const SAMPLE_BULK_ADD_CSV =
  'First Name,Last Name,Email,ICP,Profile,Connection Status,Message Status,Date\n' +
  'Jane,Doe,jane@example.com,SaaS Founders,John Smith,pending,not_sent,\n' +
  'John,Smith,,SaaS Founders,John Smith,accepted,future_lead,2026-09-01\n';

export const parseBulkAddLeadsFile = async (
  file: File,
  options: { icpNames: string[]; profileNames: string[] },
): Promise<CsvImportResult> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('The file has no sheets to read.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });

  if (rawRows.length === 0) {
    throw new Error('The file has no data rows.');
  }

  const headerMap = buildHeaderMap(Object.keys(rawRows[0] || {}));
  if (!headerMap.firstName && !headerMap.lastName) {
    throw new Error(
      'Could not find First Name / Last Name columns. Use the sample CSV template.',
    );
  }

  const mismatched = {
    icp: 0,
    profile: 0,
    connectionStatus: 0,
    messageStatus: 0,
  };

  const rows: CsvBulkLeadRow[] = [];

  for (const raw of rawRows) {
    if (!rowHasContent(raw, headerMap)) continue;

    const firstName = cellToString(headerMap.firstName ? raw[headerMap.firstName] : '');
    const lastName = cellToString(headerMap.lastName ? raw[headerMap.lastName] : '');
    const email = cellToString(headerMap.email ? raw[headerMap.email] : '');

    const icpRaw = cellToString(headerMap.icp ? raw[headerMap.icp] : '');
    const profileRaw = cellToString(headerMap.profile ? raw[headerMap.profile] : '');
    const connectionRaw = cellToString(
      headerMap.connectionStatus ? raw[headerMap.connectionStatus] : '',
    );
    const messageRaw = cellToString(
      headerMap.messageStatus ? raw[headerMap.messageStatus] : '',
    );
    const dateRaw = cellToString(
      headerMap.futureLeadDate ? raw[headerMap.futureLeadDate] : '',
    );

    const icp = matchName(icpRaw, options.icpNames);
    if (icpRaw && !icp) mismatched.icp += 1;

    const profile = matchName(profileRaw, options.profileNames);
    if (profileRaw && !profile) mismatched.profile += 1;

    const matchedConnection = matchConnectionStatus(connectionRaw);
    if (connectionRaw && !matchedConnection) mismatched.connectionStatus += 1;

    const matchedMessage = matchMessageStatus(messageRaw);
    if (messageRaw && !matchedMessage) mismatched.messageStatus += 1;

    // Provided-but-unmatched statuses stay blank; omitted statuses use sheet defaults.
    const connectionStatus: ConnectionStatus | '' = connectionRaw
      ? matchedConnection
      : 'pending';
    const messageStatus: MessageStatus | '' = messageRaw ? matchedMessage : 'not_sent';
    const futureLeadDate =
      messageStatus === 'future_lead' ? normalizeDate(dateRaw) : undefined;

    rows.push({
      firstName,
      lastName,
      email,
      icp,
      profile,
      connectionStatus,
      messageStatus,
      linkedinMsg: messageStatus || '',
      futureLeadDate,
    });
  }

  if (rows.length === 0) {
    throw new Error('No lead rows found in the file.');
  }

  return { rows, mismatched };
};

export const downloadBulkAddSampleCsv = () => {
  const blob = new Blob([SAMPLE_BULK_ADD_CSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'bulk-add-leads-template.csv';
  anchor.click();
  URL.revokeObjectURL(url);
};
