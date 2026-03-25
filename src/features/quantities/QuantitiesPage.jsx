import { useState, useMemo } from 'react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { useToast } from '../../components/Toast'
import { useLocalStorage } from '../../lib/hooks'
import { STORAGE_KEYS } from '../../lib/constants'
import { exportToExcel } from '../../lib/excel'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function QuantitiesPage() {
  const toast = useToast()
  const [contracts] = useLocalStorage(STORAGE_KEYS.CONTRACTS, [])
  const [invoices] = useLocalStorage(STORAGE_KEYS.INVOICES, [])
  const [filterContract, setFilterContract] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const historyData = useMemo(() => {
    let filtered = invoices
    if (filterContract) filtered = filtered.filter(inv => inv.contractNo === filterContract)
    if (filterStatus) filtered = filtered.filter(inv => inv.status === filterStatus)

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
    { header: 'Contract', accessor: 'contractNo', cell: v => <span className="font-medium text-surface-200">{v}</span> },
    { header: 'Cost Code', accessor: 'costCode' },
    { header: 'Description', accessor: 'description' },
    { header: 'Unit', accessor: 'unit' },
    { header: 'To-Date Qty', accessor: 'toDateQty', cell: v => <span className="tabular-nums">{v.toFixed(2)}</span>, className: 'text-right' },
    { header: 'Rate', accessor: 'unitRate', cell: v => <span className="tabular-nums">${v.toFixed(2)}</span>, className: 'text-right' },
    { header: 'To-Date $', accessor: 'toDateAmount', cell: v => <span className="font-semibold text-brand-400 tabular-nums">${v.toFixed(2)}</span>, className: 'text-right' },
  ]

  const detailColumns = [
    { header: 'Invoice', accessor: 'invoiceNo', cell: v => <span className="font-medium text-surface-200">{v}</span> },
    { header: 'Period', accessor: row => `${row.periodStart || ''} — ${row.periodEnd || ''}`, id: 'period' },
    { header: 'Contract', accessor: 'contractNo' },
    { header: 'Cost Code', accessor: 'costCode' },
    { header: 'Description', accessor: 'description' },
    { header: 'Prev Qty', accessor: 'previousQty', cell: v => <span className="tabular-nums">{v.toFixed(2)}</span>, className: 'text-right' },
    { header: 'This Period', accessor: 'thisQty', cell: v => <span className="tabular-nums font-medium text-surface-200">{v.toFixed(2)}</span>, className: 'text-right' },
    { header: 'To-Date', accessor: 'toDateQty', cell: v => <span className="tabular-nums">{v.toFixed(2)}</span>, className: 'text-right' },
    { header: 'Rate', accessor: 'unitRate', cell: v => <span className="tabular-nums">${v.toFixed(2)}</span>, className: 'text-right' },
    { header: 'Amount', accessor: 'thisAmount', cell: v => <span className="tabular-nums">${v.toFixed(2)}</span>, className: 'text-right' },
    {
      header: 'Status',
      accessor: 'status',
      cell: v => (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-[2px] font-semibold border ${
          v === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
          v === 'sent' ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' :
          'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>{v || 'draft'}</span>
      ),
    },
  ]

  const uniqueContracts = [...new Set(invoices.map(i => i.contractNo).filter(Boolean))]
  const grandTotal = runningTotals.reduce((sum, t) => sum + t.toDateAmount, 0)

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Invoice History" subtitle="Billable quantities tracking">
        <button onClick={handleExport} className="btn-secondary text-[12px]">Export Excel</button>
      </PageHeader>

      {/* Filter bar */}
      <div className="px-5 py-2.5 border-b border-surface-800 flex items-center gap-3 bg-surface-950">
        <select value={filterContract} onChange={e => setFilterContract(e.target.value)} className="input-field w-44">
          <option value="">All Contracts</option>
          {uniqueContracts.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-32">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
        </select>
        <div className="ml-auto text-[13px]">
          <span className="text-surface-500">Total:</span>{' '}
          <span className="font-bold text-surface-100 tabular-nums">${grandTotal.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-4">
        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-surface-900 border border-surface-800 rounded-[4px]">
            <div className="px-4 py-3 border-b border-surface-800">
              <h3 className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Amount by Cost Code</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="costCode" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '3px', fontSize: '12px' }}
                    labelStyle={{ color: '#e4e4e7' }}
                    formatter={v => [`$${v.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="totalAmount" name="Amount ($)" fill="#2563eb" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Running Totals */}
        <div className="bg-surface-900 border border-surface-800 rounded-[4px] overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-800">
            <h3 className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Running Totals</h3>
          </div>
          <DataTable columns={columns} data={runningTotals} compact emptyMessage="No invoice data. Create invoices to build billing history." />
        </div>

        {/* Detailed History */}
        <div className="bg-surface-900 border border-surface-800 rounded-[4px] overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-800">
            <h3 className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Line Item Detail</h3>
          </div>
          <DataTable columns={detailColumns} data={historyData} compact pageSize={20} emptyMessage="No line item data" />
        </div>
      </div>
    </div>
  )
}
