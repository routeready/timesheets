import { useState, useMemo } from 'react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { useToast } from '../../components/Toast'
import { useLocalStorage } from '../../lib/hooks'
import { STORAGE_KEYS, UNITS, DEFAULT_COMPANY_SETTINGS } from '../../lib/constants'
import { generateId, formatDateISO } from '../../lib/dates'
import { generateInvoicePDF } from '../../lib/pdf'

export default function InvoicesPage() {
  const toast = useToast()
  const [invoices, setInvoices] = useLocalStorage(STORAGE_KEYS.INVOICES, [])
  const [contracts] = useLocalStorage(STORAGE_KEYS.CONTRACTS, [])
  const [companySettings] = useLocalStorage(STORAGE_KEYS.COMPANY_SETTINGS, DEFAULT_COMPANY_SETTINGS)
  const [showCreate, setShowCreate] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [previewInvoice, setPreviewInvoice] = useState(null)

  const handleSave = (invoice) => {
    if (invoice.id) {
      setInvoices(prev => prev.map(inv => inv.id === invoice.id ? invoice : inv))
      toast.success('Invoice updated')
    } else {
      const nextNum = companySettings.nextInvoiceNumber || 1001
      const newInv = {
        ...invoice,
        id: generateId(),
        invoiceNo: `${companySettings.invoicePrefix || 'INV-'}${nextNum}`,
        status: 'draft',
      }
      setInvoices(prev => [...prev, newInv])
      toast.success(`Invoice ${newInv.invoiceNo} created`)
    }
    setShowCreate(false)
    setEditingInvoice(null)
  }

  const handleDelete = (inv) => {
    setInvoices(prev => prev.filter(i => i.id !== inv.id))
    toast.success('Invoice deleted')
    setEditingInvoice(null)
  }

  const handleStatusChange = (inv, newStatus) => {
    setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: newStatus } : i))
    toast.success(`Invoice marked as ${newStatus}`)
  }

  const handleExportPDF = (invoice) => {
    const contract = contracts.find(c => c.contractNo === invoice.contractNo)
    const doc = generateInvoicePDF(invoice, companySettings, contract)
    doc.save(`${invoice.invoiceNo || 'Invoice'}.pdf`)
    toast.success('PDF downloaded')
  }

  const columns = [
    { header: 'Invoice #', accessor: 'invoiceNo', cell: v => <span className="font-medium text-brand-400">{v}</span> },
    { header: 'Date', accessor: 'date' },
    { header: 'Contract', accessor: 'contractNo' },
    { header: 'Client', accessor: 'clientName' },
    { header: 'Period', accessor: row => `${row.periodStart || ''} - ${row.periodEnd || ''}`, id: 'period' },
    {
      header: 'Amount',
      accessor: row => (row.lineItems || []).reduce((s, li) => s + (li.thisQty || 0) * (li.unitRate || 0), 0),
      id: 'amount',
      cell: v => `$${(v * 1.05).toFixed(2)}`,
      className: 'text-right font-medium',
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (v, row) => (
        <select
          value={v || 'draft'}
          onChange={(e) => { e.stopPropagation(); handleStatusChange(row, e.target.value) }}
          onClick={e => e.stopPropagation()}
          className={`text-xs px-2 py-0.5 rounded-full border-0 cursor-pointer ${
            v === 'paid' ? 'bg-emerald-600/20 text-emerald-400' :
            v === 'sent' ? 'bg-blue-600/20 text-blue-400' :
            'bg-amber-600/20 text-amber-400'
          }`}
        >
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
        </select>
      ),
    },
    {
      header: '',
      accessor: 'id',
      id: 'actions',
      cell: (v, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleExportPDF(row) }}
          className="text-xs text-brand-400 hover:text-brand-300"
          title="Download PDF"
        >
          PDF
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Generate Invoice" subtitle="Create and manage pro forma invoices">
        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">+ New Invoice</button>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <DataTable
          columns={columns}
          data={invoices}
          onRowClick={(inv) => setEditingInvoice(inv)}
          emptyMessage="No invoices yet. Create your first pro forma invoice."
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={showCreate || editingInvoice != null}
        onClose={() => { setShowCreate(false); setEditingInvoice(null) }}
        title={editingInvoice ? `Edit ${editingInvoice.invoiceNo}` : 'New Invoice'}
        wide
      >
        <InvoiceForm
          invoice={editingInvoice || {}}
          contracts={contracts}
          invoices={invoices}
          onSave={handleSave}
          onDelete={editingInvoice ? () => handleDelete(editingInvoice) : null}
          onCancel={() => { setShowCreate(false); setEditingInvoice(null) }}
          onPreviewPDF={(inv) => handleExportPDF(inv)}
        />
      </Modal>
    </div>
  )
}

function InvoiceForm({ invoice, contracts, invoices, onSave, onDelete, onCancel, onPreviewPDF }) {
  const [form, setForm] = useState({
    ...invoice,
    contractNo: invoice.contractNo || '',
    clientName: invoice.clientName || '',
    date: invoice.date || formatDateISO(new Date()),
    periodStart: invoice.periodStart || '',
    periodEnd: invoice.periodEnd || '',
    lineItems: invoice.lineItems || [],
  })

  const contract = contracts.find(c => c.contractNo === form.contractNo)

  const handleContractChange = (contractNo) => {
    const c = contracts.find(cc => cc.contractNo === contractNo)
    setForm(f => ({
      ...f,
      contractNo,
      clientName: c?.clientName || f.clientName,
    }))
  }

  const populateFromContract = () => {
    if (!contract) return

    // Calculate previous quantities from existing invoices for this contract
    const prevQtys = {}
    invoices
      .filter(inv => inv.contractNo === form.contractNo && inv.id !== form.id)
      .forEach(inv => {
        (inv.lineItems || []).forEach(li => {
          prevQtys[li.costCode] = (prevQtys[li.costCode] || 0) + (li.thisQty || 0)
        })
      })

    const items = (contract.costCodes || []).map(cc => ({
      costCode: cc.code,
      description: cc.description,
      unit: cc.unit,
      unitRate: cc.rate,
      previousQty: prevQtys[cc.code] || 0,
      thisQty: 0,
      budgetQty: cc.budgetQty || 0,
    }))
    setForm(f => ({ ...f, lineItems: items }))
  }

  const addLineItem = () => {
    setForm(f => ({
      ...f,
      lineItems: [...f.lineItems, { costCode: '', description: '', unit: 'hours', unitRate: 0, previousQty: 0, thisQty: 0 }],
    }))
  }

  const updateLineItem = (idx, field, value) => {
    setForm(f => ({
      ...f,
      lineItems: f.lineItems.map((li, i) =>
        i === idx ? { ...li, [field]: ['unitRate', 'previousQty', 'thisQty', 'budgetQty'].includes(field) ? parseFloat(value) || 0 : value } : li
      ),
    }))
  }

  const removeLineItem = (idx) => {
    setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== idx) }))
  }

  const subtotal = form.lineItems.reduce((sum, li) => sum + (li.thisQty || 0) * (li.unitRate || 0), 0)
  const gst = subtotal * 0.05
  const total = subtotal + gst

  return (
    <div className="space-y-5">
      {/* Header fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-surface-400 mb-1">Contract</label>
          <select value={form.contractNo} onChange={e => handleContractChange(e.target.value)} className="input-field">
            <option value="">-- Select Contract --</option>
            {contracts.map(c => <option key={c.contractNo} value={c.contractNo}>{c.contractNo} - {c.clientName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-400 mb-1">Client Name</label>
          <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-400 mb-1">Invoice Date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1">Period Start</label>
            <input type="date" value={form.periodStart} onChange={e => setForm(f => ({ ...f, periodStart: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1">Period End</label>
            <input type="date" value={form.periodEnd} onChange={e => setForm(f => ({ ...f, periodEnd: e.target.value }))} className="input-field" />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-surface-400">Line Items</label>
          <div className="flex gap-2">
            {contract && (
              <button onClick={populateFromContract} className="text-xs text-brand-400 hover:text-brand-300">
                Populate from Contract
              </button>
            )}
            <button onClick={addLineItem} className="text-xs text-brand-400 hover:text-brand-300">+ Add Item</button>
          </div>
        </div>

        {form.lineItems.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-surface-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-800 text-surface-400">
                  <th className="px-2 py-1.5 text-left">Cost Code</th>
                  <th className="px-2 py-1.5 text-left">Description</th>
                  <th className="px-2 py-1.5 text-left">Unit</th>
                  <th className="px-2 py-1.5 text-right">Prev Qty</th>
                  <th className="px-2 py-1.5 text-right">This Period</th>
                  <th className="px-2 py-1.5 text-right">To-Date</th>
                  <th className="px-2 py-1.5 text-right">Rate</th>
                  <th className="px-2 py-1.5 text-right">Amount</th>
                  <th className="px-2 py-1.5 text-right">% Complete</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {form.lineItems.map((li, idx) => {
                  const toDate = (li.previousQty || 0) + (li.thisQty || 0)
                  const amount = (li.thisQty || 0) * (li.unitRate || 0)
                  const pct = li.budgetQty > 0 ? (toDate / li.budgetQty * 100) : 0
                  return (
                    <tr key={idx} className="border-t border-surface-800">
                      <td className="px-1 py-1"><input value={li.costCode} onChange={e => updateLineItem(idx, 'costCode', e.target.value)} className="input-field text-xs" /></td>
                      <td className="px-1 py-1"><input value={li.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} className="input-field text-xs" /></td>
                      <td className="px-1 py-1">
                        <select value={li.unit} onChange={e => updateLineItem(idx, 'unit', e.target.value)} className="input-field text-xs">
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-1 py-1"><input type="number" value={li.previousQty || 0} onChange={e => updateLineItem(idx, 'previousQty', e.target.value)} className="input-field text-xs w-16 text-right" /></td>
                      <td className="px-1 py-1"><input type="number" value={li.thisQty || 0} onChange={e => updateLineItem(idx, 'thisQty', e.target.value)} className="input-field text-xs w-16 text-right font-semibold" /></td>
                      <td className="px-2 py-1 text-right text-surface-300">{toDate.toFixed(2)}</td>
                      <td className="px-1 py-1"><input type="number" value={li.unitRate || 0} onChange={e => updateLineItem(idx, 'unitRate', e.target.value)} className="input-field text-xs w-20 text-right" /></td>
                      <td className="px-2 py-1 text-right font-medium text-surface-200">${amount.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right">
                        {li.budgetQty > 0 ? (
                          <div className="flex items-center gap-1">
                            <div className="w-12 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className={`text-[10px] ${pct > 100 ? 'text-red-400' : 'text-surface-400'}`}>{pct.toFixed(0)}%</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-1 py-1">
                        <button onClick={() => removeLineItem(idx)} className="text-surface-600 hover:text-red-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-60 space-y-1.5 text-sm">
          <div className="flex justify-between text-surface-400">
            <span>Subtotal</span>
            <span className="text-surface-200">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-surface-400">
            <span>GST (5%)</span>
            <span className="text-surface-200">${gst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-surface-100 border-t border-surface-700 pt-1.5">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <div className="flex gap-2">
          {onDelete && <button onClick={onDelete} className="text-sm text-red-400 hover:text-red-300">Delete</button>}
          {form.id && (
            <button onClick={() => onPreviewPDF(form)} className="text-sm text-brand-400 hover:text-brand-300">
              Download PDF
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
          <button onClick={() => onSave(form)} className="btn-primary text-sm">
            {form.id ? 'Update' : 'Create'} Invoice
          </button>
        </div>
      </div>
    </div>
  )
}
