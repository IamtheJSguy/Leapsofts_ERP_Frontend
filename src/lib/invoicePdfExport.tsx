import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import html2pdf from 'html2pdf.js';
import api from '@/lib/axios';
import { InvoiceTemplatePreview, type InvoicePreviewData } from '@/components/invoices/InvoiceTemplatePreview';
import type { InvoiceRecord, InvoiceBankAccount } from '@/types/invoice';
import { lightTheme } from '@/styles/theme';

/** A4 at 96dpi — matches the on-screen preview width. */
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = Math.floor(A4_WIDTH_PX * 297 / 210);

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

/**
 * Print CSS for A4. Important: do NOT flex-grow every child — that stretches the
 * wave footer and leaves a blank gap under it. Templates pin the footer with mt:auto.
 */
const INVOICE_PRINT_CSS = `
.invoice-print-frame {
  width: 100%;
  min-height: ${A4_HEIGHT_PX}px;
  margin: 0;
  padding: 0;
  background: #fff;
  box-sizing: border-box;
}
.invoice-print-frame > .invoice-print-sheet {
  width: 100% !important;
  max-width: none !important;
  min-height: ${A4_HEIGHT_PX}px !important;
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
  clone.style.fontFamily = getComputedStyle(element).fontFamily;
  return clone;
};

// Fractional A4 rounding or bottom padding can produce an entirely blank last
// page. Remove only complete blank trailing pages, retaining all invoice content.
const trimBlankTrailingPages = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext('2d');
  if (!context) return;
  const pageHeight = Math.floor(canvas.width * 297 / 210);
  let height = canvas.height;
  while (height > pageHeight) {
    const start = Math.floor((height - 1) / pageHeight) * pageHeight;
    const pixels = context.getImageData(0, start, canvas.width, height - start).data;
    let blank = true;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] && (pixels[i] < 250 || pixels[i + 1] < 250 || pixels[i + 2] < 250)) {
        blank = false;
        break;
      }
    }
    if (!blank) break;
    height = start;
  }
  if (height !== canvas.height) {
    const content = context.getImageData(0, 0, canvas.width, height);
    canvas.height = height;
    context.putImageData(content, 0, 0);
  }
};

const pdfOptions = {
  margin: 0 as const,
  image: { type: 'jpeg' as const, quality: 0.98 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    width: A4_WIDTH_PX,
    windowWidth: A4_WIDTH_PX,
    onrendered: trimBlankTrailingPages,
  },
  jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
  pagebreak: { mode: ['css'] as const, avoid: ['[data-invoice-row]', '[data-invoice-block]'] },
};

/** Build an off-screen A4 frame so the wave footer pins to the bottom, then rasterize. */
const elementToPdfBlobInBrowser = async (element: HTMLElement): Promise<Blob> => {
  const clone = await prepareClone(element);
  const frame = document.createElement('div');
  frame.className = 'invoice-print-frame';
  frame.style.cssText = [
    'position:relative',
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
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;top:0;left:-10000px;width:${A4_WIDTH_PX}px`;
  host.appendChild(frame);
  document.body.appendChild(host);

  try {
    await waitForImages(clone);
    // Let layout settle so margin-top:auto / flex pin the footer.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => setTimeout(resolve, 50));

    const blob = await html2pdf().set(pdfOptions).from(frame).outputPdf('blob');
    if (!(blob instanceof Blob) || blob.size < 100) {
      throw new Error('Could not render the invoice template to PDF.');
    }
    if (blob.size > 12 * 1024 * 1024) {
      throw new Error('Invoice PDF exceeds 12 MB. Use a smaller logo or fewer line items.');
    }
    return blob;
  } finally {
    host.remove();
  }
};

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const invoiceElementToPdfBlob = async (element: HTMLElement): Promise<Blob> => {
  // Prefer the first real template root inside wrappers.
  const root = (element.querySelector(':scope > :not(style)') as HTMLElement | null) || element;
  return elementToPdfBlobInBrowser(root);
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
  flushSync(() => {
    root.render(
      <ThemeProvider theme={lightTheme}>
        <div style={{ width: `${A4_WIDTH_PX}px`, background: '#FFFFFF', fontFamily: lightTheme.typography.fontFamily }}>
          <InvoiceTemplatePreview data={data} />
        </div>
      </ThemeProvider>,
    );
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
    banks: (invoice.bankAccounts ?? selectedBanks).map((bank) => ({
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
  if (invoice.status !== 'draft' && await downloadStoredInvoicePdf(invoice._id, filename || `invoice-${invoice.invoiceNumber || 'INV'}.pdf`)) return;
  const blob = await renderInvoicePreviewToBlob(previewDataFromInvoice(invoice, availableBanks));
  saveBlob(blob, filename || `invoice-${invoice.invoiceNumber || 'INV'}.pdf`);
};

/** Old invoices have no saved file; only that specific response permits a fresh render. */
export const downloadStoredInvoicePdf = async (id: string, filename: string): Promise<boolean> => {
  const response = await api.get(`/invoices/${id}/pdf`, {
    responseType: 'blob',
    validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
  });
  if (response.status === 404) {
    const error = JSON.parse(await (response.data as Blob).text());
    if (error.error?.code === 'INVOICE_PDF_NOT_FOUND') return false;
    throw new Error(error.error?.message || 'Invoice not found.');
  }
  saveBlob(response.data as Blob, filename);
  return true;
};
