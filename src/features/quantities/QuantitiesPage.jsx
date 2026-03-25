import { useState, useMemo } from 'react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { useToast } from '../../components/Toast'
import { useLocalStorage } from '../../lib/hooks'
import { STORAGE_KEYS, UNITS } from '../../lib/constants'
import { generateId, formatDateISO } from '../../lib/dates'
import { exportToExcel } from '../../lib/excel'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

export default function QuantitiesPage() {
  const toast = useToast()
  const [contracts] = useLocalStorage(STORAGE_KEYS.CONTRACTS, [])
  const [invoices] = useLocalStorage(STORAGE_KEYS.INVOICES, [])
  const [showEntry, setShowEntry] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [filterContract, setFilterContract] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Build billable quantities history from invoices
  const historyData = useMemo(() => {
    let filtered = invoices
    if (filterContract) filtered = filtered.filter(inv => inv.contractNo === filterContract)
    if (filterStatus) filtered = filtered.filter(inv => inv.status === filterStatus)

    // Flatten all line items with invoice context
    return filtered.flatMap(inv =>
      (inv.lineItems || []).map(li => ({
        invoiceNo: inv.invoiceNo,
        contractNo: inv.contractNo,
        date: inv.date,
        periodStart: inv.periodStart,
        periodEnd: inv.periodEnd,
        status: inv.status,
        costCode: li.costCode,
        description: li.description,
        unit: li.unit,
        previousQty: li.previousQty || 0,
        thisQty: li.thisQty || 0,
        toDateQty: (li.previousQty || 0) + (li.thisQty || 0),
        unitRate: li.unitRate || 0,
        thisAmount: (li.thisQty || 0) * (li.unitRate || 0),
        toDateAmount: ((li.previousQty || 0) + (li.thisQty || 0)) * (li.unitRate || 0),
      }))
    )
  }, [invoices, filterContract, filterStatus])

  // Summary by cost code for chart
  const chartData = useMemo(() => {
    const byCode = {}
    historyData.forEach(item => {
      if (!byCode[item.costCode]) {
        byCode[item.costCode] = { costCode: item.costCode, totalQty: 0, totalAmount: 0 }
      }
      byCode[item.costCode].totalQty += item.thisQty
      byCode[item.costCode].totalAmount += item.thisAmount
    })
    return Object.values(byCode).slice(0, 15)
  }, [historyData])

  // Running totals by contract + cost code
  const runningTotals = useMemo(() => {
    const totals = {}
    invoices
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .forEach(inv => {
        (inv.lineItems || []).forEach(li => {
          const key = `${inv.contractNo}||${li.costCode}`
          if (!totals[key]) {
            totals[key] = {
              contractNo: inv.contractNo,
              costCode: li.costCode,
              description: li.description,
              unit: li.unit,
              unitRate: li.unitRate || 0,
              toDateQty: 0,
              toDateAmount: 0,
            }
          }
          totals[key].toDateQty += li.thisQty || 0
          totals[key].toDateAmount += (li.thisQty || 0) * (li.unitRate || 0)
        })
      })
    if (filterContract) {
      return Object.values(totals).filter(t => t.contractNo === filterContract)
    }
    return Object.values(totals)
  }, [invoices, filterContract])

  const handleExport = () => {
    if (runningTotals.length === 0) {
      toast.error('No data to export')
      return
    }
    exportToExcel(runningTotals, 'Billable_Quantities_History.xlsx', 'Quantities')
    toast.success('Exported to Excel')
  }

  const columns = [
    { header: 'Contract', accessor: 'contractNo' },
    { header: 'Cost Code', accessor: 'costCode' },
    { header: 'Description', accessor: 'description' },
    { header: 'Unit', accessor: 'unit' },
    { header: 'To-Date Qty', accessor: 'toDateQty', cell: v => v.toFixed(2), className: 'text-right' },
    { header: 'Unit Rate', accessor: 'unitRate', cell: v => `$${v.toFixed(2)}`, className: 'text-right' },
    { header: 'To-Date Amount', accessor: 'toDateAmount', cell: v => <span className="font-semibold">${v.toFixed(2)}</span>, className: 'text-right' },
  ]

  const detailColumns = [
    { header: 'Invoice #', accessor: 'invoiceNo' },
    { header: 'Period', accessor: row => `${row.periodStart || ''} - ${row.periodEnd || ''}`, id: 'period' },
    { header: 'Contract', accessor: 'contractNo' },
    { header: 'Cost Code', accessor: 'costCode' },
    { header: 'Description', accessor: 'description' },
    { header: 'Prev Qty', accessor: 'previousQty', cell: v => v.toFixed(2), className: 'text-right' },
    { header: 'This Period', accessor: 'thisQty', cell: v => v.toFixed(2), className: 'text-right' },
    { header: 'To-Date', accessor: 'toDateQty', cell: v => v.toFixed(2), className: 'text-right' },
    { header: 'Rate', accessor: 'unitRate', cell: v => `$${v.toFixed(2)}`, className: 'text-right' },
    { header: 'This Amt', accessor: 'thisAmount', cell: v => `$${v.toFixed(2)}`, className: 'text-right' },
    {
      header: 'Status',
      accessor: 'status',
      cell: v => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          v === 'paid' ? 'bg-emerald-600/20 text-emerald-400' :
          v === 'sent' ? 'bg-blue-600/20 text-blue-400' :
          'bg-amber-600/20 text-amber-400'
        }`}>{v || 'draft'}</span>
      ),
    },
  ]

  const uniqueContracts = [...new Set(invoices.map(i => i.contractNo).filter(Boolean))]
  const grandTotal = runningTotals.reduce((sum, t) => sum + t.toDateAmount, 0)

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Invoice History" subtitle="Billable quantities tracking and history">
        <button onClick={handleExport} className="btn-secondary text-xs">Export Excel</button>
      </PageHeader>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-surface-800 flex items-center gap-4">
        <select value={filterContract} onChange={e => setFilterContract(e.target.value)} className="input-field text-sm w-48">
          <option value="">All Contracts</option>
          {uniqueContracts.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field text-sm w-36">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
        </select>
        <div className="ml-auto text-sm font-bold text-surface-200">
          Total: ${grandTotal.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-surface-400 mb-4">Quantities by Cost Code</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="costCode" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Bar dataKey="totalAmount" name="Amount ($)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Running Totals */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-800">
            <h3 className="text-sm font-medium text-surface-300">Running Totals by Cost Code</h3>
          </div>
          <DataTable columns={columns} data={runningTotals} compact emptyMessage="No invoice data. Create invoices to build billing history." />
        </div>

        {/* Detailed History */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-800">
            <h3 className="text-sm font-medium text-surface-300">Detailed Invoice Line Items</h3>
          </div>
          <DataTable columns={detailColumns} data={historyData} compact pageSize={20} emptyMessage="No line item data" />
        </div>
      </div>
    </div>
  )
}
