import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createRoot } from 'react-dom/client';
import { InvoiceTemplatePreview, type InvoicePreviewData } from '@/components/invoices/InvoiceTemplatePreview';
import type { InvoiceRecord, InvoiceBankAccount } from '@/types/invoice';

/**
 * Capture a rendered invoice DOM node and export it as an A4 PDF.
 */
export const exportInvoiceElementToPdf = async (
  element: HTMLElement,
  filename: string = 'invoice.pdf'
): Promise<void> => {
  // Wait for web fonts to load
  if (document.fonts) {
    await document.fonts.ready;
  }

  // Wait for all images inside the element to be loaded
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );

  const canvas = await html2canvas(element, {
    scale: 2.5, // High resolution (300 DPI equivalent)
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#FFFFFF',
    logging: false,
    windowWidth: 800,
  });

  const imgData = canvas.toDataURL('image/png');
  const pageWidth = 210; // Standard width in mm
  const standardA4Height = 297; // Standard A4 height in mm
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  // Single-page invoice: size PDF page to exact content height so there is zero empty space at the bottom
  if (imgHeight <= standardA4Height * 1.35) {
    const targetHeight = Math.ceil(imgHeight);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidth, targetHeight],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
    return;
  }

  // Multi-page slicing for large invoices with many items
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= standardA4Height;

  while (heightLeft > 0) {
    position -= standardA4Height;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= standardA4Height;
  }

  pdf.save(filename);
};

/**
 * Render any InvoiceRecord with its template into a detached high-res canvas container
 * and download a pixel-perfect PDF identical to the web preview.
 */
export const exportInvoiceRecordToPdf = async (
  invoice: InvoiceRecord,
  availableBanks: InvoiceBankAccount[] = [],
  filename?: string
): Promise<void> => {
  const safeFilename = filename || `invoice-${invoice.invoiceNumber || 'INV'}.pdf`;

  // Map banks: use specific selected banks if specified, otherwise include all available bank accounts
  const selectedBanks =
    invoice.bankAccountIds && invoice.bankAccountIds.length > 0
      ? availableBanks.filter((b) => invoice.bankAccountIds.includes(b.id))
      : availableBanks;

  const previewData: InvoicePreviewData = {
    template: invoice.templateId || 'compact',
    invoiceNumber: invoice.invoiceNumber || '',
    issueDate: (invoice.issueDate || '').slice(0, 10),
    dueDate: (invoice.dueDate || '').slice(0, 10),
    currency: invoice.currency || 'USD',
    paid: invoice.status === 'paid',
    logoUrl: invoice.issuerSnapshot?.logoUrl,
    issuer: invoice.issuerSnapshot || { name: '', ntn: '', address: '', email: '' },
    client: invoice.clientSnapshot || { name: '', ntn: '', address: '', email: '' },
    lines: (invoice.lineItems || []).map((line) => ({
      description: line.description || '',
      qty: Number(line.qty) || 1,
      unitPrice: Number(line.unitPrice) || 0,
    })),
    taxRate: invoice.taxRate || 0,
    banks: selectedBanks.map((b) => ({
      paymentTitle: b.paymentTitle,
      bankName: b.bankName,
      accountTitle: b.accountTitle,
      accountNumber: b.accountNumber,
      iban: b.iban,
      branch: b.branch,
    })),
  };

  // Create temporary offscreen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = '700px';
  container.style.zIndex = '-9999';
  container.style.background = '#FFFFFF';
  document.body.appendChild(container);

  const root = createRoot(container);

  await new Promise<void>((resolve) => {
    root.render(
      <div style={{ width: '700px', background: '#FFFFFF' }}>
        <InvoiceTemplatePreview data={previewData} />
      </div>
    );
    // Give time for layout rendering and fonts
    setTimeout(resolve, 350);
  });

  try {
    const targetElement = (container.firstElementChild || container) as HTMLElement;
    await exportInvoiceElementToPdf(targetElement, safeFilename);
  } finally {
    root.unmount();
    container.remove();
  }
};
