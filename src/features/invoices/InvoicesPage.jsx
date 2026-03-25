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
    { header: 'Period', accessor: row => `${row.periodStart || ''} — ${row.periodEnd || ''}`, id: 'period' },
    {
      header: 'Amount',
      accessor: row => (row.lineItems || []).reduce((s, li) => s + (li.thisQty || 0) * (li.unitRate || 0), 0),
      id: 'amount',
      cell: v => <span className="font-semibold text-surface-200 tabular-nums">${(v * 1.05).toFixed(2)}</span>,
      className: 'text-right',
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (v, row) => (
        <select
          value={v || 'draft'}
          onChange={(e) => { e.stopPropagation(); handleStatusChange(row, e.target.value) }}
          onClick={e => e.stopPropagation()}
          className={`text-[10px] px-2 py-0.5 rounded-[2px] border cursor-pointer font-semibold appearance-none ${
            v === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            v === 'sent' ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' :
            'bg-amber-500/10 text-amber-400 border-amber-500/20'
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
          className="text-[11px] text-brand-400 hover:text-brand-300 font-medium"
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
        <button onClick={() => setShowCreate(true)} className="btn-primary text-[12px]">+ New Invoice</button>
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <DataTable
          columns={columns}
          data={invoices}
          onRowClick={(inv) => setEditingInvoice(inv)}
          emptyMessage="No invoices yet. Create your first pro forma invoice."
        />
      </div>

      {/* Create/Edit — two-panel modal */}
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
          companySettings={companySettings}
          onSave={handleSave}
          onDelete={editingInvoice ? () => handleDelete(editingInvoice) : null}
          onCancel={() => { setShowCreate(false); setEditingInvoice(null) }}
          onPreviewPDF={(inv) => handleExportPDF(inv)}
        />
      </Modal>
    </div>
  )
}

function InvoiceForm({ invoice, contracts, invoices, companySettings, onSave, onDelete, onCancel, onPreviewPDF }) {
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
          <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Contract</label>
          <select value={form.contractNo} onChange={e => handleContractChange(e.target.value)} className="input-field">
            <option value="">Select Contract</option>
            {contracts.map(c => <option key={c.contractNo} value={c.contractNo}>{c.contractNo} — {c.clientName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Client</label>
          <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className="input-field" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Invoice Date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Period Start</label>
            <input type="date" value={form.periodStart} onChange={e => setForm(f => ({ ...f, periodStart: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Period End</label>
            <input type="date" value={form.periodEnd} onChange={e => setForm(f => ({ ...f, periodEnd: e.target.value }))} className="input-field" />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Line Items</label>
          <div className="flex gap-3">
            {contract && (
              <button onClick={populateFromContract} className="text-[11px] text-brand-400 hover:text-brand-300 font-medium">
                Populate from Contract
              </button>
            )}
            <button onClick={addLineItem} className="text-[11px] text-brand-400 hover:text-brand-300 font-medium">+ Add Item</button>
          </div>
        </div>

        {form.lineItems.length > 0 && (
          <div className="overflow-x-auto rounded-[3px] border border-surface-800">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-surface-850 text-surface-500 text-[10px] uppercase tracking-wider">
                  <th className="px-2 py-2 text-left font-semibold">Cost Code</th>
                  <th className="px-2 py-2 text-left font-semibold">Description</th>
                  <th className="px-2 py-2 text-left font-semibold">Unit</th>
                  <th className="px-2 py-2 text-right font-semibold">Prev Qty</th>
                  <th className="px-2 py-2 text-right font-semibold">This Period</th>
                  <th className="px-2 py-2 text-right font-semibold">To-Date</th>
                  <th className="px-2 py-2 text-right font-semibold">Rate</th>
                  <th className="px-2 py-2 text-right font-semibold">Amount</th>
                  <th className="px-2 py-2 text-right font-semibold">Progress</th>
                  <th className="w-7" />
                </tr>
              </thead>
              <tbody>
                {form.lineItems.map((li, idx) => {
                  const toDate = (li.previousQty || 0) + (li.thisQty || 0)
                  const amount = (li.thisQty || 0) * (li.unitRate || 0)
                  const pct = li.budgetQty > 0 ? (toDate / li.budgetQty * 100) : 0
                  return (
                    <tr key={idx} className="border-t border-surface-800/50">
                      <td className="px-1 py-1"><input value={li.costCode} onChange={e => updateLineItem(idx, 'costCode', e.target.value)} className="input-field text-[12px]" /></td>
                      <td className="px-1 py-1"><input value={li.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} className="input-field text-[12px]" /></td>
                      <td className="px-1 py-1">
                        <select value={li.unit} onChange={e => updateLineItem(idx, 'unit', e.target.value)} className="input-field text-[12px]">
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-1 py-1"><input type="number" value={li.previousQty || 0} onChange={e => updateLineItem(idx, 'previousQty', e.target.value)} className="input-field text-[12px] w-16 text-right" /></td>
                      <td className="px-1 py-1"><input type="number" value={li.thisQty || 0} onChange={e => updateLineItem(idx, 'thisQty', e.target.value)} className="input-field text-[12px] w-16 text-right font-semibold" /></td>
                      <td className="px-2 py-1 text-right text-surface-400 tabular-nums">{toDate.toFixed(2)}</td>
                      <td className="px-1 py-1"><input type="number" value={li.unitRate || 0} onChange={e => updateLineItem(idx, 'unitRate', e.target.value)} className="input-field text-[12px] w-20 text-right" /></td>
                      <td className="px-2 py-1 text-right font-medium text-surface-200 tabular-nums">${amount.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right">
                        {li.budgetQty > 0 ? (
                          <div className="flex items-center gap-1 justify-end">
                            <div className="w-10 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className={`text-[9px] tabular-nums ${pct > 100 ? 'text-red-400' : 'text-surface-500'}`}>{pct.toFixed(0)}%</span>
                          </div>
                        ) : <span className="text-surface-700">-</span>}
                      </td>
                      <td className="px-1 py-1">
                        <button onClick={() => removeLineItem(idx)} className="text-surface-700 hover:text-red-400">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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

      {/* Totals + Invoice Preview */}
      <div className="flex gap-4">
        {/* Left: Totals */}
        <div className="flex-1">
          <div className="flex justify-end">
            <div className="w-56 space-y-1.5 text-[13px]">
              <div className="flex justify-between text-surface-500">
                <span>Subtotal</span>
                <span className="text-surface-300 tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-surface-500">
                <span>GST (5%)</span>
                <span className="text-surface-300 tabular-nums">${gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-surface-100 border-t border-surface-800 pt-1.5">
                <span>Total</span>
                <span className="tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Mini invoice preview */}
        {form.lineItems.length > 0 && (
          <div className="w-56 bg-white rounded-[3px] p-3 text-black shadow-lg shrink-0">
            <div className="text-[8px] font-bold text-gray-800 mb-1">{companySettings.companyName || 'Your Company'}</div>
            <div className="text-[6px] text-gray-500 mb-2">{form.contractNo} &middot; {form.date}</div>
            <div className="border-t border-gray-200 pt-1 space-y-0.5">
              {form.lineItems.slice(0, 5).map((li, i) => (
                <div key={i} className="flex justify-between text-[6px] text-gray-600">
                  <span>{li.costCode || '-'}</span>
                  <span className="font-medium">${((li.thisQty || 0) * (li.unitRate || 0)).toFixed(2)}</span>
                </div>
              ))}
              {form.lineItems.length > 5 && <div className="text-[5px] text-gray-400">+{form.lineItems.length - 5} more</div>}
            </div>
            <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between text-[7px] font-bold text-gray-800">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-2 border-t border-surface-800">
        <div className="flex gap-3">
          {onDelete && <button onClick={onDelete} className="text-[13px] text-red-400 hover:text-red-300 font-medium">Delete</button>}
          {form.id && (
            <button onClick={() => onPreviewPDF(form)} className="text-[13px] text-brand-400 hover:text-brand-300 font-medium">
              Download PDF
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave(form)} className="btn-primary">
            {form.id ? 'Update' : 'Create'} Invoice
          </button>
        </div>
      </div>
    </div>
  )
}
