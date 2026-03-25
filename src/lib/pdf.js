import jsPDF from 'jspdf'
import 'jspdf-autotable'

/**
 * Generate a professional pro forma invoice PDF
 */
export function generateInvoicePDF(invoice, companySettings, contract) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15

  // ---- Header ----
  doc.setFillColor(30, 64, 175) // brand-800
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(companySettings.companyName || 'Contractor Suite', margin, 18)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const addrLine = [companySettings.address, companySettings.city, companySettings.province, companySettings.postalCode].filter(Boolean).join(', ')
  if (addrLine) doc.text(addrLine, margin, 26)

  const contactLine = [companySettings.phone, companySettings.email].filter(Boolean).join(' | ')
  if (contactLine) doc.text(contactLine, margin, 32)

  // Invoice title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('PRO FORMA INVOICE', pageWidth - margin, 18, { align: 'right' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice #: ${invoice.invoiceNo}`, pageWidth - margin, 26, { align: 'right' })
  doc.text(`Date: ${invoice.date}`, pageWidth - margin, 32, { align: 'right' })

  // ---- Bill To / Contract Info ----
  let y = 50

  doc.setTextColor(30, 64, 175)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO:', margin, y)
  doc.text('CONTRACT:', pageWidth / 2 + 10, y)

  doc.setTextColor(50, 50, 50)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  y += 7
  doc.text(contract?.clientName || invoice.clientName || '', margin, y)
  doc.text(`Contract No: ${invoice.contractNo || contract?.contractNo || ''}`, pageWidth / 2 + 10, y)
  y += 5
  if (contract?.clientAddress) doc.text(contract.clientAddress, margin, y)
  doc.text(`Period: ${invoice.periodStart} to ${invoice.periodEnd}`, pageWidth / 2 + 10, y)

  if (companySettings.gstNumber) {
    y += 5
    doc.text(`GST #: ${companySettings.gstNumber}`, pageWidth / 2 + 10, y)
  }

  // ---- Progress Report Section ----
  y += 15
  doc.setTextColor(30, 64, 175)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('PROGRESS REPORT', margin, y)
  y += 3

  // Line items table
  const tableHeaders = [
    'Cost Code',
    'Description',
    'Unit',
    'Prev Qty',
    'This Period',
    'To-Date Qty',
    'Unit Rate',
    'This Period Amt',
  ]

  const tableData = (invoice.lineItems || []).map(item => [
    item.costCode || '',
    item.description || '',
    item.unit || '',
    (item.previousQty || 0).toFixed(2),
    (item.thisQty || 0).toFixed(2),
    ((item.previousQty || 0) + (item.thisQty || 0)).toFixed(2),
    `$${(item.unitRate || 0).toFixed(2)}`,
    `$${((item.thisQty || 0) * (item.unitRate || 0)).toFixed(2)}`,
  ])

  doc.autoTable({
    startY: y,
    head: [tableHeaders],
    body: tableData,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
    },
  })

  // ---- Totals ----
  y = doc.lastAutoTable.finalY + 10
  const subtotal = (invoice.lineItems || []).reduce(
    (sum, item) => sum + (item.thisQty || 0) * (item.unitRate || 0),
    0
  )
  const gst = subtotal * 0.05
  const total = subtotal + gst

  const totalsX = pageWidth - margin - 60

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(50, 50, 50)

  doc.text('Subtotal:', totalsX, y)
  doc.text(`$${subtotal.toFixed(2)}`, pageWidth - margin, y, { align: 'right' })
  y += 6

  doc.text('GST (5%):', totalsX, y)
  doc.text(`$${gst.toFixed(2)}`, pageWidth - margin, y, { align: 'right' })
  y += 2
  doc.setDrawColor(30, 64, 175)
  doc.setLineWidth(0.5)
  doc.line(totalsX, y, pageWidth - margin, y)
  y += 6

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text('TOTAL:', totalsX, y)
  doc.text(`$${total.toFixed(2)}`, pageWidth - margin, y, { align: 'right' })

  // ---- Payment Terms ----
  y += 15
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Payment Terms: ${companySettings.paymentTerms || 'Net 30'}`, margin, y)
  y += 5
  doc.text('Thank you for your business.', margin, y)

  return doc
}
