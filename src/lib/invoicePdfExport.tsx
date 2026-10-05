import { createRoot } from 'react-dom/client';
import html2pdf from 'html2pdf.js';
import api from '@/lib/axios';
import { InvoiceTemplatePreview, type InvoicePreviewData } from '@/components/invoices/InvoiceTemplatePreview';
import type { InvoiceRecord, InvoiceBankAccount } from '@/types/invoice';

/** A4 at 96dpi — matches Puppeteer viewport / on-screen preview width. */
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

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

/**
 * Print CSS for A4. Important: do NOT flex-grow every child — that stretches the
 * wave footer and leaves a blank gap under it. Templates pin the footer with mt:auto.
 */
const INVOICE_PRINT_CSS = `
@page { size: A4; margin: 0; }
html, body {
  margin: 0;
  padding: 0;
  background: #fff;
  width: 210mm;
}
body {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.invoice-print-frame {
  width: 210mm;
  min-height: 297mm;
  margin: 0;
  padding: 0;
  background: #fff;
  box-sizing: border-box;
}
.invoice-print-frame > .invoice-print-sheet {
  width: 210mm !important;
  max-width: none !important;
  min-height: 297mm !important;
  height: auto !important;
  display: flex !important;
  flex-direction: column !important;
  position: relative !important;
  box-sizing: border-box !important;
  box-shadow: none !important;
  border: none !important;
  border-radius: 0 !important;
  background: #fff !important;
}
/* Keep natural height so wave/footer with margin-top:auto pins to page bottom
   without stretching and leaving a blank gap under the artwork. */
.invoice-print-frame > .invoice-print-sheet > * {
  flex: 0 0 auto !important;
  width: 100% !important;
  box-sizing: border-box;
}
`;

const prepareClone = async (element: HTMLElement): Promise<HTMLElement> => {
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
  clone.classList.add('invoice-print-sheet');
  clone.style.width = '100%';
  clone.style.maxWidth = '100%';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.borderRadius = '0';
  clone.style.minHeight = `${A4_HEIGHT_PX}px`;
  clone.style.display = 'flex';
  clone.style.flexDirection = 'column';
  clone.style.boxSizing = 'border-box';
  clone.style.background = '#FFFFFF';
  return clone;
};

const invoiceElementToHtml = async (element: HTMLElement): Promise<string> => {
  const clone = await prepareClone(element);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"><style>
${collectCss()}
${INVOICE_PRINT_CSS}
</style></head><body><div class="invoice-print-frame">${clone.outerHTML}</div></body></html>`;
};

const pdfOptions = {
  margin: 0 as const,
  image: { type: 'jpeg' as const, quality: 0.98 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: A4_WIDTH_PX,
    windowWidth: A4_WIDTH_PX,
  },
  jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
  pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as const },
};

/** Build an off-screen A4 frame so the wave footer pins to the bottom, then rasterize. */
const elementToPdfBlobInBrowser = async (element: HTMLElement): Promise<Blob> => {
  const clone = await prepareClone(element);
  const frame = document.createElement('div');
  frame.className = 'invoice-print-frame';
  frame.style.cssText = [
    'position:fixed',
    'top:0',
    'left:-10000px',
    `width:${A4_WIDTH_PX}px`,
    `min-height:${A4_HEIGHT_PX}px`,
    'margin:0',
    'padding:0',
    'background:#ffffff',
    'box-sizing:border-box',
    'overflow:hidden',
  ].join(';');

  // Inline the critical layout styles (html2canvas does not always see stylesheet rules).
  const style = document.createElement('style');
  style.textContent = INVOICE_PRINT_CSS;
  frame.appendChild(style);
  frame.appendChild(clone);
  document.body.appendChild(frame);

  try {
    // Let layout settle so margin-top:auto / flex pin the footer.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => setTimeout(resolve, 50));

    const blob = await html2pdf().set(pdfOptions).from(frame).outputPdf('blob');
    if (!(blob instanceof Blob) || blob.size < 100) {
      throw new Error('Could not render the invoice template to PDF.');
    }
    return blob;
  } finally {
    frame.remove();
  }
};

const isPdfBlob = (blob: Blob) =>
  blob.size > 100 && (blob.type === 'application/pdf' || blob.type === 'application/octet-stream' || !blob.type);

/** Prefer sharp server PDF when Chrome is available; otherwise match template in-browser. */
const htmlToPdfBlob = async (html: string, sourceElement: HTMLElement): Promise<Blob> => {
  try {
    const response = await api.post('/invoices/preview-pdf', { html }, {
      responseType: 'blob',
      timeout: 90000,
      validateStatus: (status) => status >= 200 && status < 300,
    });
    const blob = response.data as Blob;
    // API errors often arrive as JSON with content-type application/json.
    const contentType = String(response.headers?.['content-type'] || blob.type || '');
    if (contentType.includes('application/json')) {
      throw new Error('Server PDF render failed');
    }
    if (isPdfBlob(blob)) return blob;
  } catch {
    // Heroku without Chrome buildpack, or local server offline — use browser export.
  }
  return elementToPdfBlobInBrowser(sourceElement);
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
  // Prefer the first real template root inside wrappers.
  const root = (element.querySelector(':scope > *') as HTMLElement | null) || element;
  const html = await invoiceElementToHtml(root);
  return htmlToPdfBlob(html, root);
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
  container.style.width = `${A4_WIDTH_PX}px`;
  container.style.background = '#FFFFFF';
  document.body.appendChild(container);
  const root = createRoot(container);
  await new Promise<void>((resolve) => {
    root.render(
      <div style={{ width: `${A4_WIDTH_PX}px`, background: '#FFFFFF' }}>
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
  saveBlob(blob, filename || `invoice-${invoice.invoiceNumber || 'INV'}.pdf`);
};
