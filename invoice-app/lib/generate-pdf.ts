import jsPDF from 'jspdf';
import { formatDate, formatCurrencyForPDF } from './eu-format';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface CompanyData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxRate: number;
}

/**
 * Generates a PDF document for an invoice (optimized version)
 * @param invoice - The invoice data
 * @param company - The company data
 * @returns jsPDF document instance
 */
export function generateInvoicePDF(invoice: InvoiceData, company: CompanyData): jsPDF {
  const doc = new jsPDF();

  // Pre-calculate formatted dates to avoid repeated operations
  const formattedDate = formatDate(invoice.date);
  const formattedDueDate = formatDate(invoice.dueDate);

  // Company Info
  doc.setFontSize(20);
  doc.text(company.name, 20, 20);
  doc.setFontSize(10);
  doc.text(company.email, 20, 30);

  let yOffset = 35;
  if (company.phone) {
    doc.text(company.phone, 20, yOffset);
    yOffset += 5;
  }

  if (company.address) {
    const addressLines = company.address.split('\n');
    for (let i = 0; i < addressLines.length; i++) {
      doc.text(addressLines[i], 20, yOffset);
      yOffset += 5;
    }
  }

  // Invoice Title
  doc.setFontSize(24);
  doc.text('INVOICE', 150, 20);
  doc.setFontSize(10);
  doc.text(`#${invoice.invoiceNumber}`, 150, 30);

  // Customer Info
  doc.setFontSize(12);
  doc.text('Bill To:', 20, 70);
  doc.setFontSize(10);

  let customerY = 80;
  doc.text(invoice.customer.name, 20, customerY);
  customerY += 5;
  doc.text(invoice.customer.email, 20, customerY);
  customerY += 5;

  if (invoice.customer.phone) {
    doc.text(invoice.customer.phone, 20, customerY);
    customerY += 5;
  }

  if (invoice.customer.address) {
    const addressLines = invoice.customer.address.split('\n');
    for (let i = 0; i < addressLines.length; i++) {
      doc.text(addressLines[i], 20, customerY);
      customerY += 5;
    }
  }

  // Dates (use pre-calculated values)
  doc.text(`Invoice Date: ${formattedDate}`, 150, 70);
  doc.text(`Due Date: ${formattedDueDate}`, 150, 75);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 150, 80);

  // Line Items Table
  let yPos = 120;
  doc.setFontSize(10);
  doc.text('Description', 20, yPos);
  doc.text('Qty', 120, yPos);
  doc.text('Price', 145, yPos);
  doc.text('Total', 170, yPos);

  yPos += 5;
  doc.line(20, yPos, 190, yPos);

  yPos += 10;
  // Optimized item rendering
  const itemsLength = invoice.items.length;
  for (let i = 0; i < itemsLength; i++) {
    const item = invoice.items[i];
    doc.text(item.description.substring(0, 40), 20, yPos);
    doc.text(item.quantity.toString(), 120, yPos);
    doc.text(`€${formatCurrencyForPDF(item.unitPrice)}`, 145, yPos);
    doc.text(`€${formatCurrencyForPDF(item.total)}`, 170, yPos);
    yPos += 10;
  }

  // Totals
  yPos += 10;
  doc.line(20, yPos, 190, yPos);
  yPos += 10;
  doc.text('Subtotal:', 145, yPos);
  doc.text(`€${formatCurrencyForPDF(invoice.subtotal)}`, 170, yPos);
  yPos += 7;
  doc.text(`Tax (${company.taxRate}%):`, 145, yPos);
  doc.text(`€${formatCurrencyForPDF(invoice.tax)}`, 170, yPos);
  yPos += 7;
  doc.setFontSize(12);
  doc.text('Total:', 145, yPos);
  doc.text(`€${formatCurrencyForPDF(invoice.total)}`, 170, yPos);

  // Notes
  if (invoice.notes) {
    yPos += 20;
    doc.setFontSize(10);
    doc.text('Notes:', 20, yPos);
    yPos += 7;
    const notes = doc.splitTextToSize(invoice.notes, 170);
    doc.text(notes, 20, yPos);
  }

  return doc;
}

/**
 * Downloads an invoice PDF
 * @param invoice - The invoice data
 * @param company - The company data
 */
export function downloadInvoicePDF(invoice: InvoiceData, company: CompanyData): void {
  const doc = generateInvoicePDF(invoice, company);
  doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
}
