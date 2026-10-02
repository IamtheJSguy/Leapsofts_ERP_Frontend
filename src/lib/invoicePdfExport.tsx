import { createRoot } from 'react-dom/client';
import api from '@/lib/axios';
import { InvoiceTemplatePreview, type InvoicePreviewData } from '@/components/invoices/InvoiceTemplatePreview';
import type { InvoiceRecord, InvoiceBankAccount } from '@/types/invoice';

const waitForImages = async (element: HTMLElement) => {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }),
  );
};

const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

const collectCss = () => {
  let css = '';
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) css += `${rule.cssText}\n`;
    } catch {
      // Cross-origin sheets cannot be read. The print document loads its own font file.
    }
  }
  return css;
};

const invoiceElementToHtml = async (element: HTMLElement): Promise<string> => {
  if (document.fonts) await document.fonts.ready;
  await waitForImages(element);

  const clone = element.cloneNode(true) as HTMLElement;
  const clones = Array.from(clone.querySelectorAll('img'));
  const sources = Array.from(element.querySelectorAll('img'));
  await Promise.all(clones.map(async (img, index) => {
    const src = sources[index]?.currentSrc || sources[index]?.src || '';
    if (!src || src.startsWith('data:')) return;
    try {
      const response = await fetch(src);
      if (!response.ok) return;
      img.setAttribute('src', await blobToDataUrl(await response.blob()));
    } catch {
      // Keep the original address when the logo cannot be inlined.
    }
  }));
  clone.style.width = '100%';
  clone.style.maxWidth = '100%';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.borderRadius = '0';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"><style>
${collectCss()}
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; width: 210mm; }
body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body > div { width: 210mm; }
body > div > * {
  width: 210mm !important;
  max-width: none !important;
  min-height: 297mm !important;
  display: flex !important;
  flex-direction: column !important;
  position: relative !important;
  box-sizing: border-box;
}
body > div > * > * {
  flex: 1 0 auto;
  width: 100% !important;
  box-sizing: border-box;
}
</style></head><body><div>${clone.outerHTML}</div></body></html>`;
};

const htmlToPdfBlob = async (html: string): Promise<Blob> => {
  const response = await api.post('/invoices/preview-pdf', { html }, { responseType: 'blob' });
  return response.data as Blob;
};

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const invoiceElementToPdfBlob = async (element: HTMLElement): Promise<Blob> => {
  return htmlToPdfBlob(await invoiceElementToHtml(element));
};

export const exportInvoiceElementToPdf = async (
  element: HTMLElement,
  filename = 'invoice.pdf',
): Promise<void> => {
  saveBlob(await invoiceElementToPdfBlob(element), filename);
};

const mountPreview = async (data: InvoicePreviewData): Promise<{ container: HTMLDivElement; root: ReturnType<typeof createRoot> }> => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-10000px';
  container.style.width = '794px';
  container.style.background = '#FFFFFF';
  document.body.appendChild(container);
  const root = createRoot(container);
  await new Promise<void>((resolve) => {
    root.render(
      <div style={{ width: '794px', background: '#FFFFFF' }}>
        <InvoiceTemplatePreview data={data} />
      </div>,
    );
    setTimeout(resolve, 400);
  });
  return { container, root };
};

export const renderInvoicePreviewToBlob = async (data: InvoicePreviewData): Promise<Blob> => {
  const { container, root } = await mountPreview(data);
  try {
    const target = (container.firstElementChild || container) as HTMLElement;
    return await invoiceElementToPdfBlob(target);
  } finally {
    root.unmount();
    container.remove();
  }
};

export const previewDataFromInvoice = (
  invoice: InvoiceRecord,
  availableBanks: InvoiceBankAccount[] = [],
  paid = invoice.status === 'paid',
): InvoicePreviewData => {
  const selectedBanks = invoice.bankAccountIds && invoice.bankAccountIds.length > 0
    ? availableBanks.filter((bank) => invoice.bankAccountIds.includes(bank.id))
    : availableBanks;

  return {
    template: invoice.templateId || 'compact',
    invoiceNumber: invoice.invoiceNumber || '',
    issueDate: (invoice.issueDate || '').slice(0, 10),
    dueDate: (invoice.dueDate || '').slice(0, 10),
    currency: invoice.currency || 'USD',
    paid,
    logoUrl: invoice.issuerSnapshot?.logoUrl,
    issuer: invoice.issuerSnapshot || { name: '', ntn: '', address: '', email: '' },
    client: invoice.clientSnapshot || { name: '', ntn: '', address: '', email: '' },
    lines: (invoice.lineItems || []).map((line) => ({
      description: line.description || '',
      qty: Number(line.qty) || 1,
      unitPrice: Number(line.unitPrice) || 0,
    })),
    taxRate: invoice.taxRate || 0,
    banks: selectedBanks.map((bank) => ({
      paymentTitle: bank.paymentTitle,
      bankName: bank.bankName,
      accountTitle: bank.accountTitle,
      accountNumber: bank.accountNumber,
      iban: bank.iban,
      branch: bank.branch,
    })),
  };
};

export const exportInvoiceRecordToPdf = async (
  invoice: InvoiceRecord,
  availableBanks: InvoiceBankAccount[] = [],
  filename?: string,
): Promise<void> => {
  const blob = await renderInvoicePreviewToBlob(previewDataFromInvoice(invoice, availableBanks));
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `invoice-${invoice.invoiceNumber || 'INV'}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};
