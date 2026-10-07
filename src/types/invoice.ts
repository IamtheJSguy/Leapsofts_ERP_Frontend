export type InvoiceTemplateId = 'classic' | 'modern' | 'compact' | 'minimal' | 'bold';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'disputed';
export type MailboxProvider = 'gmail' | 'outlook' | 'yahoo' | 'zoho' | 'icloud';

export interface InvoiceParty {
  name: string;
  ntn: string;
  address: string;
  email: string;
}

export interface InvoiceBankAccount {
  id: string;
  paymentTitle: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  branch: string;
}

export interface InvoiceMailboxState {
  configured: boolean;
  provider?: string;
  email?: string;
}

export interface InvoiceSettings {
  issuerName: string;
  /** Person name used in invoice email From / sign-off. */
  senderName: string;
  /** Job title / position under sender name in email sign-off. */
  senderPosition: string;
  ntn: string;
  address: string;
  email: string;
  logoUrl: string;
  defaultTemplate: InvoiceTemplateId;
  defaultTaxRate: number;
  currency: string;
  bankAccounts: InvoiceBankAccount[];
  mailbox: InvoiceMailboxState;
}

export interface InvoiceClientProfile {
  contactName: string;
  jobTitle: string;
  phone: string;
  website: string;
  industry: string;
  companySize: string;
  location: string;
  companyDetails: string;
  painPoints: string;
  budget: string;
  decisionTimeline: string;
  notes: string;
}

export interface InvoiceClientForm extends InvoiceParty, InvoiceClientProfile {}

export interface InvoiceClient extends InvoiceClientForm {
  _id: string;
  isArchived: boolean;
}

export const emptyClientForm = (): InvoiceClientForm => ({
  name: '',
  ntn: '',
  address: '',
  email: '',
  contactName: '',
  jobTitle: '',
  phone: '',
  website: '',
  industry: '',
  companySize: '',
  location: '',
  companyDetails: '',
  painPoints: '',
  budget: '',
  decisionTimeline: '',
  notes: '',
});

export const clientToForm = (client: InvoiceClient): InvoiceClientForm => ({
  name: client.name,
  ntn: client.ntn,
  address: client.address,
  email: client.email,
  contactName: client.contactName || '',
  jobTitle: client.jobTitle || '',
  phone: client.phone || '',
  website: client.website || '',
  industry: client.industry || '',
  companySize: client.companySize || '',
  location: client.location || '',
  companyDetails: client.companyDetails || '',
  painPoints: client.painPoints || '',
  budget: client.budget || '',
  decisionTimeline: client.decisionTimeline || '',
  notes: client.notes || '',
});

export interface InvoiceLineInput {
  description: string;
  qty: number;
  unitPrice: number;
}

export interface InvoiceRecord {
  _id: string;
  invoiceNumber: string;
  clientId?: string;
  clientSnapshot: InvoiceParty;
  issuerSnapshot: InvoiceParty & { logoUrl?: string };
  templateId: InvoiceTemplateId;
  issueDate: string;
  dueDate: string;
  currency: string;
  lineItems: Array<InvoiceLineInput & { amount: number }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  bankAccountIds: string[];
  bankAccounts?: Array<Omit<InvoiceBankAccount, 'id'> & { sourceId?: string }>;
  status: InvoiceStatus;
  disputeReason?: string;
  disputedAt?: string;
  overdue: boolean;
  ccEmails?: string[];
  invoiceEmailMessageId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveInvoicePayload {
  invoiceNumber: string;
  clientId: string;
  client: InvoiceParty;
  issueDate: string;
  dueDate: string;
  templateId: InvoiceTemplateId;
  taxRate: number;
  lineItems: InvoiceLineInput[];
  bankAccountIds: string[];
  ccEmails?: string[];
}

export const INVOICE_TEMPLATE_OPTIONS: Array<{ id: InvoiceTemplateId; label: string }> = [
  { id: 'modern', label: 'Modern Studio' },
  { id: 'classic', label: 'Classic Corporate' },
  { id: 'compact', label: 'SaaS Minimalist' },
  { id: 'minimal', label: 'Aqua Geometric' },
  { id: 'bold', label: 'Monochrome Studio' },
];

export const INVOICE_CURRENCIES: Array<{ code: string; label: string }> = [
  { code: 'PKR', label: 'PKR — Pakistani Rupee' },
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'AED', label: 'AED — UAE Dirham' },
  { code: 'SAR', label: 'SAR — Saudi Riyal' },
  { code: 'QAR', label: 'QAR — Qatari Riyal' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'CNY', label: 'CNY — Chinese Yuan' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
];

export const MAILBOX_PROVIDER_OPTIONS: Array<{ id: MailboxProvider; label: string }> = [
  { id: 'gmail', label: 'Gmail' },
  { id: 'outlook', label: 'Outlook / Microsoft 365' },
  { id: 'yahoo', label: 'Yahoo' },
  { id: 'zoho', label: 'Zoho' },
  { id: 'icloud', label: 'iCloud' },
];

export const formatInvoiceMoney = (currency: string = 'PKR', amount: number = 0): string => {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : Number(amount) || 0;
  const safeCurrency = typeof currency === 'string' && currency.trim() ? currency.trim() : 'PKR';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: safeCurrency }).format(safeAmount);
  } catch {
    return `${safeCurrency} ${safeAmount.toFixed(2)}`;
  }
};

export const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;
